"""Which characters a font file can draw: python glyph_check.py FONT [FONT ...] "₦ẹọṣ"

For brand fonts on disk (.ttf, .otf, .woff; .woff2 needs the brotli package). A subset's unicode range is not a
promise: the face must actually contain the glyph. For fonts loaded in a film, FontGuard's GLYPHS check does the
same test in the browser on every frame, with no extra packages.
"""
import sys

try:
    from fontTools.ttLib import TTFont
except ImportError:  # pragma: no cover
    sys.exit("glyph_check.py needs fontTools:  python -m pip install --user fonttools")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    *fonts, chars = sys.argv[1:]
    wanted = [c for c in dict.fromkeys(chars) if c.strip()]
    worst = 0
    for path in fonts:
        try:
            f = TTFont(path, lazy=True)
        except Exception as exc:  # noqa: BLE001
            msg = str(exc)
            if "brotli" in msg.lower() or path.lower().endswith(".woff2"):
                msg += "  (woff2 needs: python -m pip install --user brotli, or check it in the film with GLYPHS)"
            print(f"{path}: cannot read ({msg})")
            worst = 2
            continue
        cmap = f.getBestCmap() or {}
        name = f["name"].getDebugName(4) if "name" in f else path
        missing = [c for c in wanted if ord(c) not in cmap]
        if missing:
            worst = max(worst, 1)
            print(f"{name}: MISSING {' '.join(missing)}  (has {' '.join(c for c in wanted if c not in missing) or 'none'})")
        else:
            print(f"{name}: all {len(wanted)} present")
    sys.exit(worst)


if __name__ == "__main__":
    main()
