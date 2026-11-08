#!/usr/bin/env python3
"""Export a Markdown document as Word (.docx), PDF and Markdown files.

Usage: python3 export_formats.py doc.md OUT_DIR BASENAME
Writes OUT_DIR/BASENAME.docx, .pdf and .md and prints their paths.
Requires: pip install markdown pypandoc_binary; Chromium for the PDF (see md2view.py).
"""
import os
import shutil
import sys
import tempfile

import pypandoc

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md2view import convert, separate_lists  # noqa: E402


def export(md_path, out_dir, base):
    os.makedirs(out_dir, exist_ok=True)
    with open(md_path, encoding="utf-8") as f:
        text = separate_lists(f.read())
    md_out = os.path.join(out_dir, base + ".md")
    with open(md_out, "w", encoding="utf-8") as f:
        f.write(text)
    docx_out = os.path.join(out_dir, base + ".docx")
    pypandoc.convert_text(text, "docx", format="gfm", outputfile=docx_out)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_md = os.path.join(tmp, base + ".md")
        shutil.copy(md_out, tmp_md)
        _, pdf_tmp = convert(tmp_md)
        pdf_out = os.path.join(out_dir, base + ".pdf")
        shutil.copy(pdf_tmp, pdf_out)
    return docx_out, pdf_out, md_out


if __name__ == "__main__":
    for path in export(sys.argv[1], sys.argv[2], sys.argv[3]):
        print(path)
