"""Finish a render: mix stems, master loudness, and package delivery files.

  python finish.py finals PROJECT NAME OUTDIR --aspects 9x16,4x5,16x9 [--clean 4x5,16x9] [--stems vo,music,sfx]
         [--lead vo|music] [--props extra.json] [--slug coridr_launch] [--version v01] [--no-covers]
      Every delivery file in one go: stems once, a muted picture per aspect (plus clean versions without burned
      captions), the measured mix and master for each, then the covers.

  python finish.py master IN.mp4 OUT.mp4 [--lufs -14] [--peak -1.5] [--tp -1.0]
      Measure the integrated loudness, apply ONE static gain to hit the target, then a 4x oversampled peak
      limiter. The true peak is measured on the encoded file and the ceiling lowered until it is under --tp.
      (No dynamic loudnorm: it re-lifts quiet passages and changes the mix you approved.)

  python finish.py mix VIDEO.mp4 OUT.mp4 --vo vo.wav [--music m.wav] [--sfx s.wav] [--lead vo|music]
         [--under 15] [--sfx-under 15] [--duck 0] [--lufs -14] [--peak -1.5] [--tp -1.0]
      Measure each stem, set gains from the numbers (music and SFX about 15 LU under a voice lead,
      SFX about 10 LU under a music lead), mix in float through a limiter, master, and mux with the picture
      (copied, not re-encoded). Each stem's level is set as a whole, so a volume changed inside the film moves
      sounds against each other in that stem, not the stem against the voice: use --under and --sfx-under for that.
      The film's Music duckUnder already ducks the music stem; --duck 8 adds a sidechain duck for music that has none.

  python finish.py loudness FILE
      Print integrated loudness, true peak and loudness range.

  python finish.py web IN.mp4 OUTDIR [--gif-width 480]
      Extra web formats: a VP9 .webm (silent loop for landing pages) and a small preview .gif.

  python finish.py stems PROJECT COMPOSITION OUTDIR [--no-picture] [--stems vo,music,sfx] [--props extra.json]
      Render the film's audio stems (vo.wav, music.wav, sfx.wav) and its muted picture (picture.mp4) from the
      project, writing the props files itself (no shell quoting to get wrong). Then run `mix` on them.
      A film with no voice: --stems music,sfx, then mix --lead music. --props merges your own props into every render.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile


# a busy machine (whisper or another render running) can starve a render past Remotion's 30 s delayRender limit
TIMEOUT = "--timeout=120000"


def ff(name="ffmpeg"):
    p = shutil.which(name)
    if not p:
        sys.exit(f"{name} not found on PATH")
    return p


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"command failed: {' '.join(cmd[:6])} ...\n{r.stderr[-1500:]}")
    return r


def measure(path):
    """Integrated LUFS, true peak dBTP, LRA. Returns None values for silence."""
    err = subprocess.run([ff(), "-hide_banner", "-nostats", "-i", path, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summary = err[err.rfind("Summary:"):] if "Summary:" in err else err
    def grab(pat):
        m = re.search(pat, summary)
        return float(m.group(1)) if m else None
    i = grab(r"I:\s+(-?[\d.]+|-inf) LUFS")
    tp = grab(r"Peak:\s+(-?[\d.]+|-inf) dBFS")
    lra = grab(r"LRA:\s+(-?[\d.]+) LU")
    if i is not None and i < -69:
        i = None
    return {"lufs": i, "true_peak": tp, "lra": lra}


def has_audio(path):
    out = subprocess.run([ff("ffprobe"), "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return bool(out.strip())


def duration(path):
    out = subprocess.run([ff("ffprobe"), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path], capture_output=True, text=True).stdout
    return float(out.strip())


def db_to_lin(db):
    return 10 ** (db / 20)


def master(src, out, lufs=-14.0, peak=-1.5, video=True, tp_max=-1.0):
    """One static gain, then a 4x oversampled limiter. The AAC encode adds its own overshoot, so the true peak is
    measured on the encoded file and the ceiling lowered until it is at or under tp_max."""
    m = measure(src)
    if m["lufs"] is None:
        sys.exit("the audio is silent; nothing to master")
    gain = lufs - m["lufs"]
    ceiling = peak
    for attempt in range(5):
        limit = min(1.0, max(0.0625, db_to_lin(ceiling)))
        af = (f"aresample=192000,volume={gain:.2f}dB,"
              f"alimiter=limit={limit:.4f}:attack=2:release=60:level=false:latency=true,aresample=48000")
        cmd = [ff(), "-y", "-v", "error", "-i", src]
        if video:
            cmd += ["-map", "0:v:0", "-map", "0:a:0", "-c:v", "copy"]
        cmd += ["-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
        run(cmd)
        after = measure(out)
        tp = after["true_peak"]
        if tp is None or tp <= tp_max:
            break
        step = (tp - tp_max) + 0.3
        print(f"true peak {tp:.1f} dBTP after the AAC encode is over {tp_max} dBTP: re-limiting at {ceiling - step:.1f} dBFS")
        ceiling -= step
    print(f"master: measured {m['lufs']:.1f} LUFS -> static gain {gain:+.1f} dB, limiter ceiling {ceiling:.1f} dBFS (4x oversampled)")
    print(f"result: {after['lufs']:.1f} LUFS integrated, true peak {after['true_peak']} dBTP, LRA {after['lra']} LU -> {out}")
    if after["true_peak"] is not None and after["true_peak"] > tp_max:
        print(f"WARNING: true peak still over {tp_max} dBTP. Lower the loudest stem (usually SFX hits) and remix.")
    if after["lufs"] is not None and abs(after["lufs"] - lufs) > 1.0:
        print("WARNING: more than 1 LU off target. The limiter is working hard: lower the loudest stem and remix.")
    return after


def mix(video, out, vo=None, music=None, sfx=None, lead="vo", under=15.0, sfx_under=None, duck=0.0, lufs=-14.0, peak=-1.5, tp_max=-1.0):
    stems = [("vo", vo), ("music", music), ("sfx", sfx)]
    stems = [(k, p) for k, p in stems if p]
    if not stems:
        sys.exit("pass at least one stem")
    for k, p in stems:
        if not os.path.isfile(p):
            sys.exit(f"{k} stem not found: {p}")
    meas = {k: measure(p) for k, p in stems}
    for k, _ in stems:
        print(f"stem {k:<6} {meas[k]['lufs'] if meas[k]['lufs'] is not None else 'silent':>8} LUFS")
    if lead not in meas or meas[lead]["lufs"] is None:
        sys.exit(f"lead stem '{lead}' missing or silent")
    sfx_under = sfx_under if sfx_under is not None else (under if lead == "vo" else 10.0)
    # place the lead at -20 LUFS (headroom for the limiter), the rest relative to it
    lead_target = -20.0
    targets = {lead: lead_target}
    for k, _ in stems:
        if k != lead:
            targets[k] = lead_target - (sfx_under if k == "sfx" else under)
    gains = {k: (targets[k] - meas[k]["lufs"]) if meas[k]["lufs"] is not None else 0.0 for k, _ in stems}

    inputs = []
    for _, p in stems:
        inputs += ["-i", p]
    vid_index = len(stems)
    inputs += ["-i", video]
    fc = []
    labels = {}
    for i, (k, _) in enumerate(stems):
        fc.append(f"[{i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={gains[k]:.2f}dB[{k}0]")
        labels[k] = f"{k}0"
    if "vo" in labels and "music" in labels and duck > 0:
        fc.append(f"[{labels['vo']}]asplit=2[vomix][vosc]")
        # threshold low enough that any speech triggers; ratio sized so the dip is about `duck` dB
        ratio = min(20.0, 1.0 + duck / 3.0)
        fc.append(f"[{labels['music']}][vosc]sidechaincompress=threshold=0.015:ratio={ratio:.2f}:attack=20:release=320:knee=4[musicd]")
        labels["vo"], labels["music"] = "vomix", "musicd"
    mix_in = "".join(f"[{labels[k]}]" for k, _ in stems)
    fc.append(f"{mix_in}amix=inputs={len(stems)}:normalize=0:duration=longest,alimiter=limit=0.89:attack=3:release=80:level=false:latency=true[mix]")
    tmpdir = tempfile.mkdtemp(prefix="finish_")
    premix = os.path.join(tmpdir, "premix.mov")
    vdur = duration(video)
    cmd = [ff(), "-y", "-v", "error"] + inputs + ["-filter_complex", ";".join(fc), "-map", f"{vid_index}:v:0", "-map", "[mix]", "-c:v", "copy", "-c:a", "pcm_f32le", "-t", f"{vdur:.3f}", premix]
    run(cmd)
    for k, _ in stems:
        print(f"gain {k:<6} {gains[k]:+.1f} dB (target {targets[k]:.0f} LUFS before master)")
    res = master(premix, out, lufs, peak, video=True, tp_max=tp_max)
    shutil.rmtree(tmpdir, ignore_errors=True)
    return res


def web(src, outdir, gif_width=480):
    os.makedirs(outdir, exist_ok=True)
    base = os.path.splitext(os.path.basename(src))[0]
    webm = os.path.join(outdir, base + ".webm")
    run([ff(), "-y", "-v", "error", "-i", src, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-row-mt", "1", "-deadline", "good", webm])
    gif = os.path.join(outdir, base + "_preview.gif")
    pal = os.path.join(outdir, "_palette.png")
    run([ff(), "-y", "-v", "error", "-i", src, "-vf", f"fps=15,scale={gif_width}:-1:flags=lanczos,palettegen=stats_mode=diff", pal])
    run([ff(), "-y", "-v", "error", "-i", src, "-i", pal, "-lavfi", f"fps=15,scale={gif_width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a", gif])
    os.remove(pal)
    print("wrote", webm, "and", gif)


def stems(project, comp, outdir, which=("vo", "music", "sfx"), picture=True, extra_props=None):
    npx = shutil.which("npx") or sys.exit("npx not found (install Node.js 18+)")
    outdir = os.path.abspath(outdir)
    os.makedirs(outdir, exist_ok=True)
    extra = {}
    if extra_props:
        with open(extra_props, encoding="utf-8") as fh:
            extra = json.load(fh)
        extra.pop("stem", None)
    for s in which:
        props = os.path.join(outdir, f"props_{s}.json")
        with open(props, "w", encoding="utf-8") as fh:
            json.dump({"captions": True, "safeZones": False, **extra, "stem": s}, fh)
        print(f"rendering stem {s} ...", flush=True)
        r = subprocess.run([npx, "remotion", "render", comp, os.path.join(outdir, f"{s}.wav"), "--codec=wav", f"--props={props}", "--log=error", TIMEOUT], cwd=project, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"stem {s} failed:\n{(r.stderr or r.stdout)[-1500:]}")
        m = measure(os.path.join(outdir, f"{s}.wav"))
        print(f"  {s}.wav  {m['lufs'] if m['lufs'] is not None else 'silent'} LUFS")
    if picture:
        print("rendering muted picture ...", flush=True)
        props = os.path.join(outdir, "props_picture.json")
        with open(props, "w", encoding="utf-8") as fh:
            json.dump({"captions": True, "safeZones": False, **extra, "stem": "none"}, fh)
        r = subprocess.run([npx, "remotion", "render", comp, os.path.join(outdir, "picture.mp4"), "--muted", f"--props={props}", "--log=error", TIMEOUT], cwd=project, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"picture failed:\n{(r.stderr or r.stdout)[-1500:]}")
    print("done:", outdir)


def finals(project, name, outdir, aspects, clean=(), which=("vo", "music", "sfx"), lead="vo", extra_props=None, slug=None, version="v01", covers=True):
    """Every delivery file in one go: stems once (the audio is the same in every aspect), one muted picture per aspect
    (captioned, plus clean ones for platforms that take a caption file), the measured mix and master for each, then
    the covers. Files land as <slug>_<aspect>[_clean]_<version>.mp4 and <slug>_cover_<aspect>.png."""
    npx = shutil.which("npx") or sys.exit("npx not found (install Node.js 18+)")
    project = os.path.abspath(project)
    outdir = os.path.abspath(outdir)
    os.makedirs(outdir, exist_ok=True)
    slug = slug or re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()
    work = os.path.join(project, "out", "finals")
    os.makedirs(work, exist_ok=True)
    stems(project, f"{name}-{aspects[0]}", work, which, picture=False, extra_props=extra_props)
    extra = {}
    if extra_props:
        with open(extra_props, encoding="utf-8") as fh:
            extra = json.load(fh)
    jobs = [(a, False) for a in aspects] + [(a, True) for a in clean]
    results = []
    for a, is_clean in jobs:
        props = os.path.join(work, f"props_picture_{a}_{'clean' if is_clean else 'captions'}.json")
        with open(props, "w", encoding="utf-8") as fh:
            json.dump({"safeZones": False, **extra, "captions": not is_clean, "stem": "none"}, fh)
        pic = os.path.join(work, f"picture_{a}{'_clean' if is_clean else ''}.mp4")
        print(f"rendering picture {a}{' (clean)' if is_clean else ''} ...", flush=True)
        r = subprocess.run([npx, "remotion", "render", f"{name}-{a}", pic, "--muted", f"--props={props}", "--log=error", TIMEOUT], cwd=project, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"picture {a} failed:\n{(r.stderr or r.stdout)[-1500:]}")
        out = os.path.join(outdir, f"{slug}_{a}{'_clean' if is_clean else ''}_{version}.mp4")
        paths = {s: os.path.join(work, f"{s}.wav") for s in which}
        res = mix(pic, out, paths.get("vo"), paths.get("music"), paths.get("sfx"), lead if lead in paths else which[0])
        results.append((os.path.basename(out), res))
    if covers:
        for a in aspects:
            png = os.path.join(outdir, f"{slug}_cover_{a}.png")
            r = subprocess.run([npx, "remotion", "still", f"{name}-Cover-{a}", png, "--log=error", TIMEOUT], cwd=project, capture_output=True, text=True)
            print(("wrote " + png) if r.returncode == 0 else f"cover {a} failed: {(r.stderr or r.stdout)[-400:]}")
    print("\nfinals:")
    for f, res in results:
        print(f"  {f}: {res['lufs']:.1f} LUFS, true peak {res['true_peak']} dBTP")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    fi = sub.add_parser("finals")
    fi.add_argument("project")
    fi.add_argument("name", help="the film's composition prefix, for example CoridrLaunch")
    fi.add_argument("outdir")
    fi.add_argument("--aspects", default="9x16", help="captioned versions, for example 9x16,4x5,16x9")
    fi.add_argument("--clean", default="", help="versions without burned captions, for example 4x5,16x9")
    fi.add_argument("--stems", default="vo,music,sfx", help="a music-only film: music,sfx")
    fi.add_argument("--lead", choices=["vo", "music", "sfx"], default="vo")
    fi.add_argument("--props", help="JSON file of extra film props merged into every render")
    fi.add_argument("--slug", help="file name stem (default from the name: coridr_launch)")
    fi.add_argument("--version", default="v01")
    fi.add_argument("--no-covers", action="store_true")
    st = sub.add_parser("stems")
    st.add_argument("project")
    st.add_argument("comp")
    st.add_argument("outdir")
    st.add_argument("--stems", default="vo,music,sfx", help="a music-only film: --stems music,sfx")
    st.add_argument("--no-picture", action="store_true")
    st.add_argument("--props", help="JSON file of extra film props (for example a phone number) merged into every render")
    m = sub.add_parser("master")
    m.add_argument("src")
    m.add_argument("out")
    m.add_argument("--lufs", type=float, default=-14.0)
    m.add_argument("--peak", type=float, default=-1.5, help="limiter ceiling in dBFS (lowered automatically for --tp)")
    m.add_argument("--tp", type=float, default=-1.0, help="true-peak maximum in dBTP, measured after the AAC encode")
    x = sub.add_parser("mix")
    x.add_argument("video")
    x.add_argument("out")
    x.add_argument("--vo")
    x.add_argument("--music")
    x.add_argument("--sfx")
    x.add_argument("--lead", choices=["vo", "music", "sfx"], default="vo")
    x.add_argument("--under", type=float, default=15.0, help="LU the music sits under the lead")
    x.add_argument("--sfx-under", type=float)
    x.add_argument("--duck", type=float, default=0.0, help="dB to dip the music under speech with a sidechain. Off by default: the film's Music duckUnder already ducks the music stem; use 8 for music that never went through the film")
    x.add_argument("--lufs", type=float, default=-14.0)
    x.add_argument("--peak", type=float, default=-1.5, help="limiter ceiling in dBFS (lowered automatically for --tp)")
    x.add_argument("--tp", type=float, default=-1.0, help="true-peak maximum in dBTP, measured after the AAC encode")
    l = sub.add_parser("loudness")
    l.add_argument("file")
    w = sub.add_parser("web")
    w.add_argument("src")
    w.add_argument("outdir")
    w.add_argument("--gif-width", type=int, default=480)
    a = ap.parse_args()
    if a.cmd == "finals":
        split = lambda s: tuple(x.strip() for x in s.split(",") if x.strip())
        finals(a.project, a.name, a.outdir, split(a.aspects), split(a.clean), split(a.stems), a.lead, a.props, a.slug, a.version, not a.no_covers)
        return
    if a.cmd == "stems":
        stems(a.project, a.comp, a.outdir, tuple(s.strip() for s in a.stems.split(",") if s.strip()), not a.no_picture, a.props)
        return
    if a.cmd == "master":
        if not has_audio(a.src):
            sys.exit("no audio stream in the input")
        master(a.src, a.out, a.lufs, a.peak, tp_max=a.tp)
    elif a.cmd == "mix":
        lead = a.lead if (a.lead != "vo" or a.vo) else ("music" if a.music else "sfx")
        mix(a.video, a.out, a.vo, a.music, a.sfx, lead, a.under, a.sfx_under, a.duck, a.lufs, a.peak, a.tp)
    elif a.cmd == "loudness":
        print(json.dumps(measure(a.file), indent=1))
    else:
        web(a.src, a.outdir, a.gif_width)


if __name__ == "__main__":
    main()
