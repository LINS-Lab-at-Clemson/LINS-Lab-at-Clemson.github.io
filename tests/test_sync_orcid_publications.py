import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "sync_orcid_publications.py"
SPEC = importlib.util.spec_from_file_location("sync_orcid_publications", SCRIPT)
sync = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(sync)


class PublicationSyncTests(unittest.TestCase):
    def test_normalize_doi(self):
        self.assertEqual(
            sync.normalize_doi("https://doi.org/10.1000/Example.1 "),
            "10.1000/example.1",
        )

    def test_clean_jats_abstract(self):
        self.assertEqual(
            sync.clean_text("<jats:p>An &amp; B <jats:italic>study</jats:italic>.</jats:p>"),
            "An & B study.",
        )

    def test_existing_doi_is_detected_case_insensitively(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "example.md"
            path.write_text(
                '+++\ntitle = "Example"\ndoi = "10.1000/ABC"\n+++\n',
                encoding="utf-8",
            )
            dois, _, titles = sync.scan_existing(Path(directory))
            self.assertIn("10.1000/abc", dois)
            self.assertIn("example", titles)

    def test_render_keeps_abstract(self):
        metadata = {
            "title": "Example",
            "year": 2026,
            "authors": "A. Author",
            "venue": "Journal, 1, 2",
            "doi": "10.1000/example",
            "abstract": "The complete abstract.",
            "orcid_put_code": "123",
        }
        output = sync.render_publication(metadata, 10)
        self.assertIn('abstract = "The complete abstract."', output)
        self.assertIn('orcid_put_code = "123"', output)

    def test_crossref_metadata_is_converted_to_front_matter_fields(self):
        work = {
            "title": "ORCID title",
            "year": "2025",
            "journal": "ORCID Journal",
            "doi": "10.1000/example",
            "put_code": "123",
        }
        crossref = {
            "title": ["Crossref title"],
            "published-online": {"date-parts": [[2026, 1, 2]]},
            "container-title": ["Water Journal"],
            "volume": "12",
            "issue": "3",
            "page": "40-51",
            "author": [
                {"given": "Ada", "family": "Lovelace"},
                {"given": "Grace", "family": "Hopper"},
            ],
            "abstract": "<jats:p>A useful abstract.</jats:p>",
        }
        metadata = sync.publication_metadata(work, {}, crossref)
        self.assertEqual(metadata["year"], 2026)
        self.assertEqual(metadata["authors"], "Ada Lovelace, and Grace Hopper")
        self.assertEqual(metadata["venue"], "Water Journal, 12(3), 40-51")
        self.assertEqual(metadata["abstract"], "A useful abstract.")


if __name__ == "__main__":
    unittest.main()
