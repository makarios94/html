# AssetLink project

## Delivering documents
Each AssetLink document lives on **its own private web page**. One index page links to all of them:

**AssetLink Strategy Docs (index):** https://claude.ai/artifact/EJH1tdnc5SbgwH8451FUhY

| Document | Private page |
|---|---|
| Positioning & Messaging (v5) | https://claude.ai/artifact/7pMywVDoduvvXEY74h58hR |
| Content Strategy (v3) | https://claude.ai/artifact/2KunR6geqo6gFrEoXFtAbs |
| Competitive Analysis | https://claude.ai/artifact/BR7T5EixdUJKEZjbaHdvYz |
| Positioning & Messaging (v2, outdated) | https://claude.ai/artifact/EtYAweS3DvAYNVNPjQsQu3 |

The user's app only downloads file cards (Markdown, HTML and PDF alike), so never deliver a document as a file card alone.

For every document deliverable, each time it's created or meaningfully updated, without being asked:
1. Keep the source as Markdown in the scratchpad (internal data never goes in this public repo).
2. Export it as Word, PDF and Markdown, then build its page with download buttons:
   `python3 .claude/skills/assetlink-strategy/scripts/export_formats.py doc.md DL_DIR BASENAME`
   `python3 .claude/skills/assetlink-strategy/scripts/build_docs_page.py OUT.html --downloads DL_DIR/BASENAME doc.md`
   (needs `pip install markdown pypandoc_binary` once per session). The Word file is embedded in the page.
3. Publish `OUT.html` with the Artifact tool, with `capabilities: {"downloads": true}` and
   `files` mapping `BASENAME.pdf` and `BASENAME.md` to the exported files (.docx can't be a page file):
   - **Updated document:** pass `url` set to its page above, so it updates in place. Read the page first (`action: "read"`) if this session didn't publish it.
   - **New document:** publish it as a new page. Then add it to the index page and to the table above.
4. Reply with the link and a short summary of what changed.

## Writing documents for leadership
Documents on these pages are read by the CEO and leadership, so:
- Use plain, everyday words and short sentences. No marketing or strategy jargon (for example "beachhead," "category," "canvas," "spine," "ICP," "gated").
- Keep only what's important to know: who we sell to, the problem, what makes us different, and what we say.
- No "Internal. Updated…" line under the title, and no "Decisions we need," "What we need" (people and time) or "How we'll know it's working" (metrics) sections. Raise those in the chat reply instead.
- Leave out working material: frameworks used, options weighed, scoring, readiness checklists and method notes. Those stay internal for the marketing team, in the skill references or a scratchpad working copy.

Never combine documents into one page.
