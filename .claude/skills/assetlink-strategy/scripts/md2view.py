#!/usr/bin/env python3
"""Convert Markdown deliverables into side-panel-viewable HTML and PDF.

Usage: python3 md2view.py doc1.md [doc2.md ...]
Writes doc.html and doc.pdf next to each input and prints their paths.
Requires: pip install markdown; Chromium (defaults to the Playwright copy).
"""
import html
import os
import re
import subprocess
import sys
import tempfile

import markdown

CHROME = os.environ.get("CHROME_BIN", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")

CSS = """
:root { --bg:#ffffff; --fg:#1d2330; --muted:#5b6475; --line:#dde2ea; --accent:#1f3a5f; --soft:#f4f6fa; --quote:#eef3fa; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg:#14171d; --fg:#e6e9ef; --muted:#a3abba; --line:#2c323d; --accent:#8fb4e3; --soft:#1b2029; --quote:#1a2330; }
}
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.6 -apple-system, "Segoe UI", Arial, sans-serif; }
main { max-width: 900px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 1.8em; line-height:1.25; margin:0 0 .4em; color:var(--accent); }
h2 { font-size: 1.35em; margin:1.8em 0 .5em; padding-bottom:.25em; border-bottom:1px solid var(--line); color:var(--accent); }
h3 { font-size: 1.1em; margin:1.4em 0 .4em; }
p, li { max-width: 75ch; }
a { color: var(--accent); }
hr { border:0; border-top:1px solid var(--line); margin:2em 0; }
blockquote { margin:1em 0; padding:.6em 1em; background:var(--quote); border-left:4px solid var(--accent); border-radius:4px; }
blockquote p { margin:.3em 0; }
code { background:var(--soft); padding:.1em .35em; border-radius:4px; font-size:.9em; }
.table-wrap { overflow-x:auto; margin:1em 0; }
table { border-collapse: collapse; width:100%; font-size:.9em; }
th, td { border:1px solid var(--line); padding:6px 9px; text-align:left; vertical-align:top; }
th { background:var(--soft); }
@media print {
  body { font-size: 11px; background:#fff; color:#000; }
  main { max-width:none; padding:0; }
  h2 { break-after: avoid; }
  tr, blockquote { break-inside: avoid; }
}
"""


LIST_ITEM = re.compile(r"^\s*([-*+]|\d+\.)\s")


def separate_lists(text):
    """Python-Markdown needs a blank line before a list that follows a paragraph."""
    out = []
    for line in text.splitlines():
        prev = out[-1] if out else ""
        if LIST_ITEM.match(line) and prev.strip() and not LIST_ITEM.match(prev) and not prev.startswith((" ", "\t", ">", "|")):
            out.append("")
        out.append(line)
    return "\n".join(out)


def convert(md_path):
    base = os.path.splitext(md_path)[0]
    with open(md_path, encoding="utf-8") as f:
        text = f.read()
    body = markdown.markdown(separate_lists(text), extensions=["tables", "sane_lists", "fenced_code"])
    body = body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
    title = next((l.lstrip("# ").strip() for l in text.splitlines() if l.startswith("# ")), os.path.basename(base))
    page = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f"<title>{html.escape(title)}</title><style>{CSS}</style></head>"
        f"<body><main>{body}</main></body></html>"
    )
    html_path = base + ".html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(page)
    pdf_path = base + ".pdf"
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run(
            [CHROME, "--headless", "--no-sandbox", "--disable-gpu", f"--user-data-dir={profile}",
             "--no-pdf-header-footer", f"--print-to-pdf={pdf_path}", "file://" + os.path.abspath(html_path)],
            check=True, capture_output=True, timeout=120,
        )
    return html_path, pdf_path


if __name__ == "__main__":
    for p in sys.argv[1:]:
        for out in convert(p):
            print(out)
