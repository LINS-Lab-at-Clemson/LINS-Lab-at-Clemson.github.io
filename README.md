# Update your LINS Lab profile

> [!IMPORTANT]
> **Do not edit, commit, or upload files directly to the `main` branch.**
> Create a separate `profile/first-last` branch in the LINS Lab repository,
> make all changes there, and submit that branch through a pull request. The
> lab administrator will review and merge the update into `main`.

The required workflow is:

1. Open the LINS Lab website repository.
2. Create a branch in the repository, such as `profile/philip-lin`.
3. Edit your Markdown profile and upload your picture and optional CV on that
   branch.
4. Open a pull request from your profile branch into `main`.
5. Wait for review; do not merge or push directly to `main`.

Complete browser-based instructions are provided under
[Submit your update through a pull request](#submit-your-update-through-a-pull-request).

This guide is for current and former LINS Lab members who want to add or update
their profile on the [LINS Lab website](https://lins-lab-at-clemson.github.io/).
You can complete the entire process in a web browser. You do not need to install
Git, Hugo, or any other software.

Your profile consists of up to three files:

| Item | Repository location | Example filename |
| --- | --- | --- |
| Profile information and biography | `content/team/` | `philip-lin.md` |
| Profile picture | `static/images/team/` | `philip-lin.jpg` |
| CV, if desired | `static/files/` | `philip-lin-cv.pdf` |

Use your name in lowercase with words separated by hyphens. Keep the same name
stem for all three files. Do not use spaces in filenames.

## Before you begin

You need a free [GitHub account](https://github.com/signup) with write access to
the LINS Lab website repository. If you cannot create a branch, ask the lab
administrator to add your GitHub account as a repository collaborator. Once you
have access, sign in and open the
[LINS Lab website repository](https://github.com/LINS-Lab-at-Clemson/LINS-Lab-at-Clemson.github.io).

If you are updating an existing profile, locate your Markdown file in
[`content/team/`](https://github.com/LINS-Lab-at-Clemson/LINS-Lab-at-Clemson.github.io/tree/main/content/team).
If you are adding a profile, use the complete template below.

Do not edit `content/team/_index.md`; it controls the team page itself rather
than an individual profile.

## Prepare your profile picture

Place your picture in `static/images/team/` and name it with your Markdown file
stem, for example `philip-lin.jpg`.

- Use `.jpg`, `.png`, or `.webp`.
- A square or nearly square portrait works best because the website uses both
  4:3 and square crops.
- Keep your face near the upper center of the image so it remains visible in
  both layouts.
- A resolution of at least 800 × 800 pixels is recommended.
- Keep the file reasonably small—preferably under 1 MB.
- Use the exact filename, capitalization, and extension in the profile's
  `image` field.

Example:

```toml
image = "/images/team/philip-lin.jpg"
```

Although the file is stored under `static/images/team/`, the website path begins
with `/images/team/`. Do not include `static` in the website path.

## Add a CV (optional)

Upload your CV as a PDF to `static/files/`. Name it with your profile stem plus
`-cv.pdf`, for example `philip-lin-cv.pdf`.

Add it to your `links` list like this:

```toml
{ label = "CV", url = "/files/philip-lin-cv.pdf", newTab = true }
```

Remove any private or sensitive information that you do not want publicly
available. Every file merged into this public repository can be downloaded by
anyone.

## Profile Markdown format

Copy this example into `content/team/philip-lin.md`, then replace Philip's
example name and information with your own. Keep both `+++` lines; they
separate the profile settings from the biography.

```markdown
+++
title = "Philip Lin"
draft = false
role = "Ph.D. Student"
group = "current"
weight = 100
image = "/images/team/philip-lin.jpg"
links = [
  { label = "Email", url = "mailto:philip.lin@example.com" },
  { label = "CV", url = "/files/philip-lin-cv.pdf", newTab = true },
  { label = "Google Scholar", url = "https://scholar.google.com/your-profile" },
  { label = "GitHub", url = "https://github.com/your-username" },
  { label = "Website", url = "https://your-website.example" },
  { label = "ORCID", url = "https://orcid.org/0000-0000-0000-0000" },
  { label = "LinkedIn", url = "https://www.linkedin.com/in/your-profile" }
]
+++

Philip is a Ph.D. student studying example research topics. Before joining
Clemson, he earned his degree from Example University.

His current research focuses on example questions and methods. Outside of
research, he enjoys example interests.
```

Delete any link lines that you do not use. Make sure the final link in the list
does not end with a comma. You may also use other labels and URLs, such as X,
ResearchGate, a project page, or another professional profile. Extra links are
automatically placed in the profile card's overflow menu when space is limited.

## What each profile field does

| Field | Required? | Purpose |
| --- | --- | --- |
| `title` | Yes | Your name as it should appear on the website. |
| `draft` | Recommended | Use `false` to publish. A profile with `true` is hidden. |
| `role` | Yes | Your current title, such as `Ph.D. Student`, `Undergraduate Researcher`, or `Postdoctoral Scholar`. |
| `group` | Yes | Use `current` for current members or `alumni` for former members. The lab administrator manages the special `pi` group. |
| `weight` | Yes | Controls display order within a group; smaller numbers appear first. Keep your existing value when updating a profile. New members may use `100`. |
| `image` | Yes | Public website path to your profile picture. |
| `links` | No | A list of professional links. The label can be customized. |
| `newTab` | No | Use `true` when a local file such as a CV should open in a new browser tab. External web links already open in a new tab. |

The text after the second `+++` is your biography. Standard Markdown is
supported, including:

- Multiple paragraphs
- *Italic text* using `*text*`
- **Bold text** using `**text**`
- Links using `[descriptive text](https://example.com)`

Write in the third person and aim for two short paragraphs. Suggested topics
include previous education or employment, research interests, current work, and
one optional personal interest. Longer biographies automatically receive a
**More/Less** control on the website.

## Submit your update through a pull request

The following workflow keeps your changes separate until the lab administrator
reviews them.

### 1. Create a profile branch

1. Open the [LINS Lab website repository](https://github.com/LINS-Lab-at-Clemson/LINS-Lab-at-Clemson.github.io).
2. Confirm that the branch menu is set to **main**, so your new branch starts
   from the latest published version of the website.
3. Open the branch menu currently labeled **main**.
4. Select **View all branches**, then click **New branch**. GitHub may instead
   let you type the new branch name directly in the branch menu.
5. Enter `profile/first-last`, replacing `first-last` with your name. For
   example, Philip Lin would use `profile/philip-lin`.
6. Set the source branch to `main`, then click **Create new branch**.
7. Confirm that the branch menu now shows your profile branch before editing or
   uploading any file.

If GitHub does not allow you to create the branch, you do not yet have write
access. Contact the lab administrator rather than making changes on `main`.

### 2. Edit or create your Markdown file

For an existing profile:

1. Open `content/team/your-name.md` while your profile branch is selected.
2. Click the pencil icon labeled **Edit this file**.
3. Update the profile settings or biography.
4. Click **Commit changes…**.
5. Enter a message such as `Update Philip Lin profile`.
6. Commit to your `profile/first-last` branch.

For a new profile:

1. Open the `content/team/` folder while your profile branch is selected.
2. Select **Add file → Create new file**.
3. Name the file `first-last.md`.
4. Paste and complete the profile template from this guide.
5. Click **Commit changes…** and commit to your profile branch.

### 3. Upload or replace your picture and CV

For the profile picture:

1. Open `static/images/team/` while your profile branch is selected.
2. Select **Add file → Upload files**.
3. Upload `first-last.jpg`, `first-last.png`, or `first-last.webp`.
4. Commit the upload to your profile branch.

For an optional CV, repeat the process in `static/files/` using
`first-last-cv.pdf`.

If you replace an existing picture or CV, use exactly the same filename unless
you also update its path in the Markdown file. Browser and deployment caches can
take a few minutes to show a replacement file.

### 4. Check all files in your branch

Before opening the pull request, verify that:

- Your Markdown file is under `content/team/`.
- Your picture is under `static/images/team/`.
- Your optional CV is under `static/files/`.
- The `image` and CV paths in the Markdown file match the uploaded filenames.
- The profile contains no private information or files.
- You did not edit another member's profile or unrelated website files.

### 5. Open the pull request

1. Return to the main page of the LINS Lab website repository.
2. Switch to your `profile/first-last` branch if it is not already selected.
3. Click **Contribute → Open pull request**. GitHub may instead display a
   **Compare & pull request** button near the top of the page.
4. Confirm the base repository is
   `LINS-Lab-at-Clemson/LINS-Lab-at-Clemson.github.io` and the base branch is
   `main`.
5. Confirm the head repository is also
   `LINS-Lab-at-Clemson/LINS-Lab-at-Clemson.github.io` and the compare branch is
   `profile/first-last`.
6. Use a title such as `[Profile] Update Philip Lin`.
7. In the description, summarize what you added or changed.
8. Click **Create pull request**.

The lab administrator will review the pull request. If changes are requested,
edit the same files on your profile branch and commit again; the pull request
updates automatically. After approval and merging, GitHub Actions rebuilds and
publishes the website.

For more help, see GitHub's guides to
[editing files](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files),
[uploading files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository),
and [creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request).

## For website developers

Website architecture, local preview, deployment, and ORCID synchronization are
documented in [`developer_Readme.md`](developer_Readme.md).
