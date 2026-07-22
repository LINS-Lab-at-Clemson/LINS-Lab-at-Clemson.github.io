# LINS Lab website

The website for the **Lin Lab for Intelligent Nexus Systems of Water and Society** at Clemson University. It is built with [Hugo](https://gohugo.io/) and automatically deployed with GitHub Pages.

## Edit the site

Most updates require only a Markdown file:

| Content | Folder | One file per… |
| --- | --- | --- |
| Research | `content/research/` | project |
| Team | `content/team/` | person |
| Publications | `content/publications/` | publication |
| Opportunities | `content/opportunities/_index.md` | page |
| Home page text | `content/_index.md` | page |

Images live in `static/images/`. Image paths in Markdown front matter begin with `/images/`.

### Add a research project

```bash
hugo new research/project-name.md
```

Edit the generated file, add an image to `static/images/research/`, and set `draft = false` when it is ready.

### Add a team member

```bash
hugo new team/person-name.md
```

Add the headshot to `static/images/team/` and update the generated Markdown file.

### Add a publication

```bash
hugo new publications/short-citation.md
```

Fill in the title, year, authors, venue, and links. Publication search and year filters update automatically.

## Preview locally

1. [Install Hugo](https://gohugo.io/installation/) (extended edition recommended).
2. From this repository, run:

   ```bash
   hugo server --disableFastRender
   ```

3. Open the local address Hugo prints, usually `http://localhost:1313/`.

## Publish

Push to `master` or `main`. The workflow in `.github/workflows/hugo-pages.yml` builds and publishes the site. In the repository's **Settings → Pages**, the source should be set to **GitHub Actions**.

## ORCID publication synchronization

The `Sync publications from ORCID` GitHub Actions workflow runs each Monday and
can also be started manually. It reads public works for ORCID iD
`0000-0002-9464-4696`, enriches DOI metadata through Crossref, and opens or
updates a review pull request when it finds new publications.

The workflow requires these GitHub Actions repository secrets:

- `ORCID_CLIENT_ID`
- `ORCID_CLIENT_SECRET`

The importer keeps an abstract whenever Crossref or the ORCID work record
provides one. Publications are matched by DOI, ORCID put-code, and normalized
title to reduce duplicates.

## Project structure

```text
.
├── archetypes/          # Templates for new Markdown entries
├── assets/              # CSS and JavaScript processed by Hugo
├── content/             # All editable site content
├── layouts/             # Page and section templates
├── static/images/       # Lab images and headshots
├── hugo.toml            # Site identity, navigation, and global settings
└── .github/workflows/   # Automatic GitHub Pages deployment
```
