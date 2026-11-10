"""WCAG contrast ratios for colour pairs: python contrast.py "#2D9AD6" "#FFFFFF" ["#042154" "#F7F7F7" ...]

Pairs are foreground, background. AA needs 4.5:1 for body text and 3:1 for large text (about 40 design px
and up, or bold 32+) and for graphics; AAA needs 7:1. Use it on every text/ground pair in theme.ts.
"""
import sys


def lum(hex_colour):
    h = hex_colour.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        raise ValueError(f"not a hex colour: {hex_colour}")
    out = 0.0
    for w, i in zip((0.2126, 0.7152, 0.0722), (0, 2, 4)):
        c = int(h[i:i + 2], 16) / 255
        c = c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
        out += w * c
    return out


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)))
    return (lb + 0.05) / (la + 0.05)


def main():
    args = sys.argv[1:]
    if len(args) < 2 or len(args) % 2:
        sys.exit(__doc__)
    for fg, bg in zip(args[::2], args[1::2]):
        r = ratio(fg, bg)
        verdict = "AAA" if r >= 7 else "AA" if r >= 4.5 else "large text / graphics only" if r >= 3 else "FAIL"
        print(f"{fg} on {bg}: {r:.2f}:1  {verdict}")


if __name__ == "__main__":
    main()
