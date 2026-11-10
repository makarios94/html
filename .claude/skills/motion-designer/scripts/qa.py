"""QA a render: specs, loudness, black/frozen/silent stretches, and images you can actually look at.

  python qa.py out/film_9x16.mp4 --out out/qa [--expect 1080x1920] [--fps 30] [--lufs -14]
         [--every 1.0] [--at 0.2,3.5,12] [--strip 2.0:3.0@10] [--safe auto] [--color 4.2,540,960,#042154]

Writes into --out:
  sheet.jpg        contact sheet (timestamps and frame numbers burned in, safe zone outlined)
  strip_*.jpg      motion strips: consecutive frames of one move, to judge easing and overlap by eye
  frame_*.png      full-resolution frames at --at times, to judge type, edges and legibility
  qa.md / qa.json  the numbers and PASS / WARN / FAIL lines

You cannot watch the video, so look at every image this writes before calling a render done.
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover
    sys.exit("qa.py needs Pillow:  python -m pip install --user pillow")

SAFE = {  # design px at 1080 short side; mirrors src/kit/layout.ts
    "vertical": (250, 440, 72, 150),
    "portrait": (72, 96, 72, 72),
    "square": (72, 88, 72, 72),
    "wide": (72, 84, 112, 112),
}


def ff(name="ffmpeg"):
    p = shutil.which(name)
    if not p:
        sys.exit(f"{name} not found on PATH")
    return p


def probe(path):
    out = subprocess.run([ff("ffprobe"), "-v", "error", "-show_streams", "-show_format", "-of", "json", path], capture_output=True, text=True).stdout
    return json.loads(out)


def shape_of(w, h):
    a = w / h
    if a < 0.7:
        return "vertical"
    if a < 0.95:
        return "portrait"
    if a <= 1.3:
        return "square"
    return "wide"


def font(size):
    for f in ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def grab(path, t, out_png, width=None):
    vf = ["-vf", f"scale={width}:-2:flags=lanczos"] if width else []
    subprocess.run([ff(), "-y", "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", path, "-frames:v", "1"] + vf + [out_png], check=True)
    return Image.open(out_png).convert("RGB")


def detect(path, vf=None, af=None):
    cmd = [ff(), "-hide_banner", "-nostats", "-i", path]
    cmd += (["-vf", vf, "-an"] if vf else ["-af", af, "-vn"]) + ["-f", "null", "-"]
    return subprocess.run(cmd, capture_output=True, text=True).stderr


def intervals(text, start_key, end_key):
    starts = [float(x) for x in re.findall(start_key + r"[:=]\s*(-?[\d.]+)", text)]
    ends = [float(x) for x in re.findall(end_key + r"[:=]\s*(-?[\d.]+)", text)]
    return list(zip(starts, ends + [None] * (len(starts) - len(ends))))


def loudness(path):
    err = subprocess.run([ff(), "-hide_banner", "-nostats", "-i", path, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    s = err[err.rfind("Summary:"):] if "Summary:" in err else ""
    def g(p):
        m = re.search(p, s)
        return float(m.group(1)) if m else None
    return {"lufs": g(r"I:\s+(-?[\d.]+) LUFS"), "true_peak": g(r"Peak:\s+(-?[\d.]+) dBFS"), "lra": g(r"LRA:\s+(-?[\d.]+) LU")}


def label(img, text, size=None):
    d = ImageDraw.Draw(img)
    fs = size or max(14, img.width // 18)
    f = font(fs)
    pad = fs // 3
    tw = d.textlength(text, font=f)
    d.rectangle([0, 0, tw + pad * 2, fs + pad * 2], fill=(0, 0, 0))
    d.text((pad, pad // 2), text, fill=(255, 255, 255), font=f)


def outline_safe(img, w, h, shape):
    top, bottom, left, right = SAFE[shape]
    u = min(w, h) / 1080
    sx = img.width / w
    d = ImageDraw.Draw(img)
    box = [left * u * sx, top * u * sx, img.width - right * u * sx, img.height - bottom * u * sx]
    d.rectangle(box, outline=(255, 0, 80), width=max(1, img.width // 240))


def tile(images, cols, gap=6, bg=(24, 24, 28)):
    if not images:
        return None
    w, h = images[0].size
    rows = math.ceil(len(images) / cols)
    sheet = Image.new("RGB", (cols * w + (cols + 1) * gap, rows * h + (rows + 1) * gap), bg)
    for i, im in enumerate(images):
        r, c = divmod(i, cols)
        sheet.paste(im, (gap + c * (w + gap), gap + r * (h + gap)))
    return sheet


def srgb_to_lab(rgb):
    def lin(c):
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(x) for x in rgb)
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return (116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z)))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--expect", help="WxH, e.g. 1080x1920")
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--min-dur", type=float)
    ap.add_argument("--max-dur", type=float)
    ap.add_argument("--every", type=float, help="contact-sheet spacing in seconds (default: about 20 frames)")
    ap.add_argument("--at", default="", help="comma-separated seconds for full-resolution frames")
    ap.add_argument("--strip", action="append", default=[], help="START:END@FPS, e.g. 2.0:3.0@10")
    ap.add_argument("--safe", default="auto", help="auto | vertical | portrait | square | wide | none")
    ap.add_argument("--color", action="append", default=[], help="T,X,Y,#RRGGBB pixel check")
    ap.add_argument("--silent-ok", action="store_true", help="the piece is meant to be silent")
    a = ap.parse_args()

    os.makedirs(a.out, exist_ok=True)
    tmp = os.path.join(a.out, "_tmp")
    os.makedirs(tmp, exist_ok=True)
    info = probe(a.video)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    au = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    if not v:
        sys.exit("no video stream")
    w, h = int(v["width"]), int(v["height"])
    num, den = (int(x) for x in v.get("r_frame_rate", "30/1").split("/"))
    fps = num / den if den else 0
    dur = float(info["format"].get("duration", v.get("duration", 0)))
    size_mb = int(info["format"].get("size", 0)) / 1e6
    shape = shape_of(w, h) if a.safe == "auto" else (None if a.safe == "none" else a.safe)
    lines, results = [], {"file": a.video, "width": w, "height": h, "fps": fps, "duration": dur, "size_mb": round(size_mb, 2)}

    def check(ok, text, warn=False):
        tag = "PASS" if ok else ("WARN" if warn else "FAIL")
        lines.append(f"- {tag}: {text}")
        return ok

    if a.expect:
        ew, eh = (int(x) for x in a.expect.lower().split("x"))
        check((w, h) == (ew, eh), f"resolution {w}x{h} (expected {ew}x{eh})")
    else:
        lines.append(f"- INFO: resolution {w}x{h} ({shape or 'no safe-zone shape'})")
    check(abs(fps - a.fps) < 0.01, f"frame rate {fps:.3f} (expected {a.fps})")
    if a.min_dur is not None or a.max_dur is not None:
        lo = a.min_dur if a.min_dur is not None else 0
        hi = a.max_dur if a.max_dur is not None else 1e9
        check(lo <= dur <= hi, f"duration {dur:.2f}s (expected {lo}-{hi}s)")
    else:
        lines.append(f"- INFO: duration {dur:.2f}s, {size_mb:.1f} MB")
    check(v.get("codec_name") == "h264", f"video codec {v.get('codec_name')} {v.get('profile', '')}", warn=True)
    check(v.get("pix_fmt") == "yuv420p", f"pixel format {v.get('pix_fmt')} (yuv420p plays everywhere)")
    cs = v.get("color_space") or "untagged"
    check(cs in ("bt709",), f"colour space {cs} (bt709 keeps brand colours consistent across players)", warn=True)
    results["video"] = {k: v.get(k) for k in ("codec_name", "profile", "pix_fmt", "color_space", "color_transfer", "color_primaries", "bit_rate")}

    if au:
        L = loudness(a.video)
        results["audio"] = {"codec": au.get("codec_name"), "sample_rate": au.get("sample_rate"), "channels": au.get("channels"), **L}
        if L["lufs"] is None:
            check(a.silent_ok, "audio track is silent", warn=a.silent_ok)
        else:
            check(abs(L["lufs"] - a.lufs) <= 1.0, f"loudness {L['lufs']:.1f} LUFS integrated (target {a.lufs})")
            check(L["true_peak"] is not None and L["true_peak"] <= -1.0, f"true peak {L['true_peak']} dBTP (<= -1.0)", warn=True)
        sil = intervals(detect(a.video, af="silencedetect=noise=-50dB:d=0.8"), "silence_start", "silence_end")
        if sil and not a.silent_ok:
            lines.append(f"- WARN: {len(sil)} silent stretch(es) over 0.8s: " + ", ".join(f"{s:.1f}-{(e if e else dur):.1f}s" for s, e in sil[:6]))
        results["silences"] = sil
    else:
        check(a.silent_ok, "no audio track", warn=a.silent_ok)

    # pic_th 0.999: only frames that are essentially empty black count, so dark worlds (navy, near-black) with sparse
    # type are not reported as black frames
    blacks = intervals(detect(a.video, vf="blackdetect=d=0.05:pix_th=0.06:pic_th=0.999"), "black_start", "black_end")
    results["black"] = blacks
    if blacks:
        first = blacks[0][0]
        check(first > 0.02, f"{len(blacks)} black stretch(es): " + ", ".join(f"{s:.2f}-{e if e else dur:.2f}s" for s, e in blacks[:6]) + ("  <- FRAME 0 IS BLACK" if first <= 0.02 else ""), warn=first > 0.02)
    else:
        lines.append("- PASS: no black frames")
    frz = intervals(detect(a.video, vf="freezedetect=n=0.0015:d=1.2"), "freeze_start", "freeze_end")
    results["frozen"] = frz
    if frz:
        lines.append("- WARN: held frames over 1.2s (fine for an end card; dead air anywhere else): " + ", ".join(f"{s:.1f}-{(e if e else dur):.1f}s" for s, e in frz[:6]))

    # contact sheet
    every = a.every or max(0.4, min(2.0, dur / 20))
    times = [round(t, 3) for t in frange(0.0, max(0.0, dur - 0.05), every)]
    thumb_w = 300 if shape == "vertical" else 420
    thumbs = []
    for t in times:
        im = grab(a.video, t, os.path.join(tmp, "t.png"), thumb_w)
        if shape:
            outline_safe(im, w, h, shape)
        label(im, f"{t:.1f}s  f{int(round(t * fps))}")
        thumbs.append(im)
    sheet = tile(thumbs, 6 if shape == "vertical" else 4)
    sheet_path = os.path.join(a.out, "sheet.jpg")
    sheet.save(sheet_path, quality=88)
    lines.append(f"- LOOK: {sheet_path} ({len(times)} frames, every {every:.2f}s)")

    for k, spec in enumerate(a.strip):
        m = re.match(r"([\d.]+):([\d.]+)@([\d.]+)", spec)
        if not m:
            continue
        s0, s1, sfps = float(m.group(1)), float(m.group(2)), float(m.group(3))
        frames = [grab(a.video, t, os.path.join(tmp, "s.png"), 260 if shape == "vertical" else 360) for t in frange(s0, s1, 1 / sfps)]
        for i, im in enumerate(frames):
            label(im, f"{s0 + i / sfps:.2f}")
        st = tile(frames, min(10, len(frames)))
        p = os.path.join(a.out, f"strip_{k + 1}_{s0:.1f}-{s1:.1f}s.jpg")
        st.save(p, quality=88)
        lines.append(f"- LOOK: {p} (motion strip, {len(frames)} frames)")

    for t in [float(x) for x in a.at.split(",") if x.strip()]:
        p = os.path.join(a.out, f"frame_{t:06.2f}s.png")
        grab(a.video, t, p)
        lines.append(f"- LOOK: {p} (full resolution)")

    for spec in a.color:
        t, x, y, hexv = spec.split(",")
        im = grab(a.video, float(t), os.path.join(tmp, "c.png"))
        x, y = int(x), int(y)
        box = [im.getpixel((min(im.width - 1, max(0, x + dx)), min(im.height - 1, max(0, y + dy)))) for dx in range(-2, 3) for dy in range(-2, 3)]
        avg = tuple(sum(p[i] for p in box) / len(box) for i in range(3))
        exp = tuple(int(hexv.strip().lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
        de = math.dist(srgb_to_lab(avg), srgb_to_lab(exp))
        got = "#%02X%02X%02X" % tuple(int(round(c)) for c in avg)
        check(de <= 3.0, f"colour at {t}s ({x},{y}) is {got}, expected {hexv.upper()} (dE {de:.1f}; under 3 is invisible)", warn=de <= 6)

    shutil.rmtree(tmp, ignore_errors=True)
    report = "# QA: " + os.path.basename(a.video) + "\n\n" + "\n".join(lines) + "\n\nLook at every LOOK image before calling this done: hook on frame 0, type inside the safe zone, nothing clipped, captions matching the voice, the end card held long enough to read.\n"
    with open(os.path.join(a.out, "qa.md"), "w", encoding="utf-8") as fh:
        fh.write(report)
    with open(os.path.join(a.out, "qa.json"), "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=1, default=str)
    print(report)


def frange(a, b, step):
    out = []
    t = a
    while t <= b + 1e-9:
        out.append(t)
        t += step
    return out


if __name__ == "__main__":
    main()
