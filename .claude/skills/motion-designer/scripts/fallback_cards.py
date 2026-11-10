"""Last-resort renderer: kinetic text cards with Pillow + ffmpeg, for machines where Remotion cannot run.

  python fallback_cards.py spec.json

spec.json:
  {"width": 1080, "height": 1920, "fps": 30, "duration": 12, "out": "out/fallback_9x16.mp4",
   "bg": "#0B0B10", "ink": "#F3F2F8", "accent": "#4B3BFF", "font": "C:/Windows/Fonts/segoeuib.ttf",
   "audio": "public/films/x/music.wav",
   "cards": [{"text": "You did the work\\nweeks ago.", "start": 0, "end": 2.2, "size": 104, "emphasis": "weeks ago."},
             {"text": "Meet Paidly.", "start": 9.5, "end": 12, "size": 140, "bg": "#4B3BFF", "ink": "#FFFFFF"}]}

Each card rises and fades in with a strong ease-out, holds, and leaves faster than it came; a line containing the
`emphasis` text is drawn in the accent colour; a card may set its own bg/ink. The first card should start at 0 so
frame 0 shows the hook. This is a fallback: say so in the delivery note and rebuild in Remotion when you can.
"""
import json
import os
import shutil
import subprocess
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover
    sys.exit("needs Pillow: python -m pip install --user pillow")

FONTS = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ease_out(x):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 4


def ease_in(x):
    x = min(1.0, max(0.0, x))
    return x ** 3


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    W, H, fps = spec.get("width", 1080), spec.get("height", 1920), spec.get("fps", 30)
    dur = spec.get("duration") or max(c["end"] for c in spec["cards"])
    out = spec.get("out", "out/fallback.mp4")
    font_path = spec.get("font") or next((f for f in FONTS if os.path.isfile(f)), None)
    bg, ink, accent = hex_rgb(spec.get("bg", "#0B0B10")), hex_rgb(spec.get("ink", "#F5F5F7")), hex_rgb(spec.get("accent", "#4B3BFF"))
    ff = shutil.which("ffmpeg") or sys.exit("ffmpeg not found")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    cmd = [ff, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-"]
    audio = spec.get("audio")
    if audio and os.path.isfile(audio):
        cmd += ["-i", audio, "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    fonts = {}

    def font(size):
        if size not in fonts:
            fonts[size] = ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()
        return fonts[size]

    total = int(round(dur * fps))
    for f in range(total):
        t = f / fps
        active = [c for c in spec["cards"] if c["start"] <= t < c["end"]] or [c for c in spec["cards"] if c["start"] <= t][-1:]
        frame_bg = hex_rgb(active[-1].get("bg")) if active and active[-1].get("bg") else bg
        img = Image.new("RGB", (W, H), frame_bg)
        for c in active:
            size = int(c.get("size", 96))
            enter = 0.5
            p = 1.0 if c["start"] == 0 and t < enter else ease_out((t - c["start"]) / enter)
            q = ease_in((t - (c["end"] - 0.25)) / 0.25) if c["end"] < dur else 0.0
            alpha = max(0.0, min(1.0, p * (1 - q)))
            dy = (1 - p) * 40 - q * 24
            layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(layer)
            lines = c["text"].split("\n")
            fnt = font(size)
            line_h = int(size * 1.08)
            y = H * c.get("y", 0.45) - line_h * len(lines) / 2 + dy
            col = hex_rgb(c["ink"]) if c.get("ink") else ink
            for line in lines:
                w = d.textlength(line, font=fnt)
                fill = accent if c.get("emphasis") and c["emphasis"] in line else col
                d.text(((W - w) / 2, y), line, font=fnt, fill=fill + (int(255 * alpha),))
                y += line_h
            img.paste(layer, (0, 0), layer)
        proc.stdin.write(img.tobytes())
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        sys.exit("ffmpeg failed")
    print(f"wrote {out} ({total} frames, {W}x{H} @ {fps}). FALLBACK RENDER: label it, rebuild in Remotion when possible.")


if __name__ == "__main__":
    main()
