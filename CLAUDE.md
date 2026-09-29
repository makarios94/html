# AssetLink project

## Delivering documents
The user reviews documents by clicking a file card to open it in the side panel. Markdown file cards only download in their app, so never send a `.md` alone.

For every Markdown deliverable, each time it's created or meaningfully updated, without being asked:
1. Run `python3 .claude/skills/assetlink-strategy/scripts/md2view.py <file>.md`. This writes `<file>.html` and `<file>.pdf` next to it (needs `pip install markdown` once per session).
2. Send the `.html` and the `.pdf` with `SendUserFile` using `display: "render"`. The HTML opens in the side panel; the PDF can be viewed there or downloaded.
3. Keep the chat reply short: what the document is and the key points. Don't paste the full text unless asked.

For a PDF deliverable, send it with `display: "render"`.

This repo is public. Save deliverables containing internal AssetLink data (pricing, customers, market sizing, roadmap) to the scratchpad, never the repo.
