# AssetLink project

## Delivering documents
The user reads documents on one private web page, **AssetLink Strategy Docs**: https://claude.ai/artifact/EJH1tdnc5SbgwH8451FUhY

Their app only downloads file cards (Markdown, HTML and PDF alike), so never deliver a document as a file card alone.

For every document deliverable, each time it's created or meaningfully updated, without being asked:
1. Keep the source as Markdown in the scratchpad (internal data never goes in this public repo).
2. Rebuild the page with every current document as a tab:
   `python3 .claude/skills/assetlink-strategy/scripts/build_docs_page.py OUT.html doc1.md doc2.md ...`
   (needs `pip install markdown` once per session).
3. Publish `OUT.html` with the Artifact tool, passing `url` set to the page above so it updates in place. Read the page first (`action: "read"`) to get the current document list if this session didn't publish it.
4. Reply with the link and a short summary of what changed.

A PDF copy is optional, made with `scripts/md2view.py`, and only if the user asks for one.
