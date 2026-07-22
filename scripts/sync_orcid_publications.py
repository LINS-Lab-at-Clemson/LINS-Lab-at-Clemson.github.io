#!/usr/bin/env python3
"""Create Hugo publication entries from the public works on an ORCID record."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ORCID_API = "https://pub.orcid.org/v3.0"
ORCID_TOKEN_URL = "https://orcid.org/oauth/token"
CROSSREF_API = "https://api.crossref.org/works"
USER_AGENT = "LINS-Lab-publication-sync/1.0 (mailto:chungyl@clemson.edu)"


class TextExtractor(HTMLParser):
    BLOCK_TAGS = {"p", "div", "br", "abstract", "sec"}

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.BLOCK_TAGS:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.BLOCK_TAGS:
            self.parts.append(" ")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def request_json(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    data: bytes | None = None,
) -> dict[str, Any]:
    request_headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if headers:
        request_headers.update(headers)
    request = urllib.request.Request(
        url, data=data, headers=request_headers, method=method
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Request failed ({error.code}) for {url}: {detail}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not reach {url}: {error.reason}") from error


def get_orcid_token() -> str:
    token = os.environ.get("ORCID_ACCESS_TOKEN", "").strip()
    if token:
        return token

    client_id = os.environ.get("ORCID_CLIENT_ID", "").strip()
    client_secret = os.environ.get("ORCID_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        raise RuntimeError(
            "Set ORCID_CLIENT_ID and ORCID_CLIENT_SECRET, or ORCID_ACCESS_TOKEN."
        )

    body = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials",
            "scope": "/read-public",
        }
    ).encode()
    payload = request_json(
        ORCID_TOKEN_URL,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data=body,
    )
    token = str(payload.get("access_token", "")).strip()
    if not token:
        raise RuntimeError("ORCID did not return an access token.")
    return token


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    parser = TextExtractor()
    parser.feed(html.unescape(str(value)))
    return re.sub(r"\s+", " ", "".join(parser.parts)).strip()


def normalize_doi(value: str) -> str:
    value = urllib.parse.unquote(value).strip().lower()
    value = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", value)
    value = re.sub(r"^doi:\s*", "", value)
    return value.rstrip(" .")


def normalized_title(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def nested_value(data: dict[str, Any], *keys: str) -> str:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return ""
        current = current.get(key)
    return clean_text(current)


def external_id_value(data: dict[str, Any], kind: str) -> str:
    ids = data.get("external-ids") or {}
    for item in ids.get("external-id") or []:
        if str(item.get("external-id-type", "")).lower() == kind.lower():
            return clean_text(item.get("external-id-value"))
    return ""


def select_work_summary(group: dict[str, Any]) -> dict[str, Any]:
    summaries = group.get("work-summary") or []
    if not summaries:
        return {}

    def display_index(item: dict[str, Any]) -> int:
        try:
            return int(item.get("display-index") or 0)
        except (TypeError, ValueError):
            return 0

    return max(summaries, key=display_index)


def fetch_orcid_works(orcid_id: str, token: str) -> list[dict[str, Any]]:
    url = f"{ORCID_API}/{urllib.parse.quote(orcid_id)}/works"
    payload = request_json(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.orcid+json",
        },
    )
    works: list[dict[str, Any]] = []
    for group in payload.get("group") or []:
        summary = select_work_summary(group)
        if not summary:
            continue
        doi = external_id_value(summary, "doi") or external_id_value(group, "doi")
        works.append(
            {
                "put_code": str(summary.get("put-code", "")),
                "doi": normalize_doi(doi) if doi else "",
                "title": nested_value(summary, "title", "title", "value"),
                "journal": nested_value(summary, "journal-title", "value"),
                "year": nested_value(summary, "publication-date", "year", "value"),
            }
        )
    return works


def fetch_orcid_work_detail(
    orcid_id: str, put_code: str, token: str
) -> dict[str, Any]:
    url = f"{ORCID_API}/{urllib.parse.quote(orcid_id)}/work/{put_code}"
    return request_json(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.orcid+json",
        },
    )


def fetch_crossref(doi: str) -> dict[str, Any]:
    url = f"{CROSSREF_API}/{urllib.parse.quote(doi, safe='')}?mailto=chungyl@clemson.edu"
    try:
        return request_json(url).get("message") or {}
    except RuntimeError as error:
        print(f"Warning: Crossref lookup failed for {doi}: {error}", file=sys.stderr)
        return {}


def format_authors(authors: list[dict[str, Any]]) -> str:
    names: list[str] = []
    for author in authors:
        given = clean_text(author.get("given"))
        family = clean_text(author.get("family"))
        name = " ".join(part for part in (given, family) if part)
        if name:
            names.append(name)
    if len(names) > 1:
        return f"{', '.join(names[:-1])}, and {names[-1]}"
    return names[0] if names else ""


def orcid_authors(detail: dict[str, Any]) -> str:
    names: list[str] = []
    contributors = (detail.get("contributors") or {}).get("contributor") or []
    for contributor in contributors:
        name = nested_value(contributor, "credit-name", "value")
        if name:
            names.append(name)
    if len(names) > 1:
        return f"{', '.join(names[:-1])}, and {names[-1]}"
    return names[0] if names else ""


def crossref_year(record: dict[str, Any]) -> str:
    for field in ("published-print", "published-online", "published", "issued"):
        parts = (record.get(field) or {}).get("date-parts") or []
        if parts and parts[0]:
            return str(parts[0][0])
    return ""


def format_venue(record: dict[str, Any], fallback: str) -> str:
    container = clean_text((record.get("container-title") or [""])[0])
    volume = clean_text(record.get("volume"))
    issue = clean_text(record.get("issue"))
    locator = clean_text(record.get("page") or record.get("article-number"))
    volume_issue = volume + (f"({issue})" if issue else "")
    return ", ".join(part for part in (container or fallback, volume_issue, locator) if part)


def publication_metadata(
    work: dict[str, Any], detail: dict[str, Any], crossref: dict[str, Any]
) -> dict[str, Any]:
    title = clean_text((crossref.get("title") or [""])[0]) or work["title"]
    year_text = crossref_year(crossref) or work["year"]
    try:
        year = int(year_text)
    except (TypeError, ValueError):
        raise RuntimeError(f"Work has no usable year: {title or work['put_code']}")

    abstract = clean_text(crossref.get("abstract"))
    if not abstract:
        abstract = clean_text(detail.get("short-description"))

    return {
        "title": title or "Untitled publication",
        "year": year,
        "authors": format_authors(crossref.get("author") or []) or orcid_authors(detail),
        "venue": format_venue(crossref, work["journal"]),
        "doi": work["doi"],
        "abstract": abstract,
        "orcid_put_code": work["put_code"],
    }


def scan_existing(publications_dir: Path) -> tuple[set[str], set[str], set[str]]:
    dois: set[str] = set()
    put_codes: set[str] = set()
    titles: set[str] = set()
    for path in publications_dir.glob("*.md"):
        if path.name == "_index.md":
            continue
        text = path.read_text(encoding="utf-8")
        doi_match = re.search(r'^doi\s*=\s*"([^"]+)"', text, re.MULTILINE)
        code_match = re.search(r'^orcid_put_code\s*=\s*"([^"]+)"', text, re.MULTILINE)
        title_match = re.search(r'^title\s*=\s*"((?:[^"\\]|\\.)*)"', text, re.MULTILINE)
        if doi_match:
            dois.add(normalize_doi(doi_match.group(1)))
        if code_match:
            put_codes.add(code_match.group(1))
        if title_match:
            try:
                title = json.loads(f'"{title_match.group(1)}"')
            except json.JSONDecodeError:
                title = title_match.group(1)
            titles.add(normalized_title(title))
    return dois, put_codes, titles


def next_weight(publications_dir: Path, year: int) -> int:
    weights: list[int] = []
    for path in publications_dir.glob("*.md"):
        text = path.read_text(encoding="utf-8")
        if re.search(rf"^year\s*=\s*{year}\s*$", text, re.MULTILINE):
            match = re.search(r"^weight\s*=\s*(\d+)\s*$", text, re.MULTILINE)
            if match:
                weights.append(int(match.group(1)))
    return (max(weights) if weights else 0) + 10


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return value[:72].rstrip("-") or "publication"


def output_path(publications_dir: Path, metadata: dict[str, Any]) -> Path:
    base = f"{metadata['year']}-{slugify(metadata['title'])}"
    candidate = publications_dir / f"{base}.md"
    if not candidate.exists():
        return candidate
    suffix_source = metadata["doi"] or metadata["orcid_put_code"]
    suffix = hashlib.sha1(suffix_source.encode()).hexdigest()[:8]
    return publications_dir / f"{base}-{suffix}.md"


def toml_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def render_publication(metadata: dict[str, Any], weight: int) -> str:
    lines = [
        "+++",
        f"title = {toml_string(metadata['title'])}",
        f"year = {metadata['year']}",
        f"weight = {weight}",
    ]
    for field in ("authors", "venue", "doi", "abstract", "orcid_put_code"):
        if metadata[field]:
            lines.append(f"{field} = {toml_string(metadata[field])}")
    lines.extend(["generated_by = \"orcid-sync\"", "+++", ""])
    return "\n".join(lines)


def sync(orcid_id: str, publications_dir: Path, dry_run: bool) -> int:
    token = get_orcid_token()
    works = fetch_orcid_works(orcid_id, token)
    existing_dois, existing_codes, existing_titles = scan_existing(publications_dir)
    created = 0

    for work in works:
        if work["doi"] and work["doi"] in existing_dois:
            continue
        if work["put_code"] and work["put_code"] in existing_codes:
            continue
        if work["title"] and normalized_title(work["title"]) in existing_titles:
            continue

        detail = fetch_orcid_work_detail(orcid_id, work["put_code"], token)
        crossref = fetch_crossref(work["doi"]) if work["doi"] else {}
        metadata = publication_metadata(work, detail, crossref)
        path = output_path(publications_dir, metadata)
        content = render_publication(
            metadata, next_weight(publications_dir, metadata["year"])
        )
        print(f"Create {path}: {metadata['title']}")
        if not dry_run:
            path.write_text(content, encoding="utf-8")
        created += 1
        existing_dois.add(metadata["doi"])
        existing_codes.add(metadata["orcid_put_code"])
        existing_titles.add(normalized_title(metadata["title"]))

    print(f"ORCID works checked: {len(works)}; entries created: {created}")
    return created


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--orcid",
        default=os.environ.get("ORCID_ID", "0000-0002-9464-4696"),
        help="ORCID iD to synchronize",
    )
    parser.add_argument(
        "--publications-dir",
        type=Path,
        default=Path("content/publications"),
    )
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        sync(args.orcid, args.publications_dir, args.dry_run)
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
