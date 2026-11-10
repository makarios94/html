"""Start a motion-ad project from the skill's Remotion starter, add a film to one, or refresh its kit.

  python new_project.py DEST --name "Basket teaser" [--format music] [--brand coridr|ground-up]
                         [--aspects 9x16,16x9] [--no-install] [--force]
  python new_project.py DEST --add "Coridr cutdown 15" [--format music|copy:<film-id>] [--brand ...]
  python new_project.py DEST --sync      refresh src/kit, the examples and the SFX kit (your films are untouched)

The project is self-contained (zip it and anyone can re-render it):
  src/kit/              the motion kit (components, timing, layout, audio). Skill-owned: --sync replaces it.
  src/films/<id>/       YOUR film: config.ts, theme.ts, Logo.tsx, Film.tsx, script.txt, data/. Starts as a
                        copy of the matching example so you edit a working, polished film, not a blank page.
  src/films/example-motion   the reference film: a music-led motion ad (Basket). Voice-led: the launch-film skill.
  public/sfx/           the synthesized SFX kit (scripts/sound_kit.py kit).
  public/films/<id>/    your film's audio and images.
Then it installs dependencies and renders a smoke-test still to prove the toolchain works end to end.
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL / "assets" / "remotion-starter"
PACKS = SKILL / "assets" / "brand-packs"
SCRIPTS = SKILL / "scripts"
IGNORE = shutil.ignore_patterns("node_modules", "out", ".remotion", "*.native.wav", "*.timing.json")
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
]
EXAMPLES = {"music": "example-motion"}  # voice-led films are made with the launch-film skill


def say(msg):
    print(f"[new_project] {msg}", flush=True)


def slug(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if not s:
        sys.exit("--name must contain letters or digits")
    return s


def pascal(name):
    p = "".join(w[:1].upper() + w[1:] for w in re.split(r"[^A-Za-z0-9]+", name) if w)
    return p if p[:1].isalpha() else "Film" + p


def run(cmd, cwd=None, check=True, capture=False):
    r = subprocess.run(cmd, cwd=cwd, capture_output=capture, text=True)
    if check and r.returncode != 0:
        if capture:
            print(r.stdout[-3000:], r.stderr[-3000:])
        sys.exit(f"failed: {' '.join(str(c) for c in cmd[:5])} ...")
    return r


def make_sfx(dest):
    say("synthesizing the SFX kit into public/sfx ...")
    run([sys.executable, str(SCRIPTS / "sound_kit.py"), "kit", str(dest / "public" / "sfx")])


def make_beds(dest):
    m = dest / "public" / "films" / "example-motion"
    m.mkdir(parents=True, exist_ok=True)
    if not (m / "music.wav").exists():
        say("writing the temp music bed for example-motion (120 BPM, drive) ...")
        run([sys.executable, str(SCRIPTS / "sound_kit.py"), "bed", str(m / "music.wav"), "--bpm", "120", "--bars", "8", "--mood", "drive", "--key", "D", "--sections", "0:intro,1:main,6:lift,7:outro", "--tail", "2"])


def register(dest, film_id, name):
    idx = dest / "src" / "films" / "index.ts"
    txt = idx.read_text(encoding="utf-8")
    var = "film_" + re.sub(r"[^A-Za-z0-9]", "_", film_id)
    if f"'./{film_id}'" in txt:
        return
    imp = f"import {{film as {var}}} from './{film_id}';\n"
    marker = "// new_project.py adds project films above this line."
    txt = txt.replace(marker, imp + marker) if marker in txt else imp + txt
    txt = re.sub(r"export const films: FilmDef\[\] = \[", f"export const films: FilmDef[] = [{var}, ", txt, count=1)
    idx.write_text(txt, encoding="utf-8")


def add_film(dest, name, fmt, brand, aspects):
    film_id, film_name = slug(name), pascal(name)
    src_films = dest / "src" / "films"
    target = src_films / film_id
    if target.exists():
        sys.exit(f"a film called '{film_id}' already exists in {src_films}")
    base = fmt.split(":", 1)[1] if fmt.startswith("copy:") else EXAMPLES[fmt]
    if not (src_films / base).exists():
        sys.exit(f"no film '{base}' to start from")
    shutil.copytree(src_films / base, target, ignore=IGNORE)
    pub_src = dest / "public" / "films" / base
    if pub_src.exists():
        shutil.copytree(pub_src, dest / "public" / "films" / film_id, dirs_exist_ok=True, ignore=IGNORE)
    cfg = target / "config.ts"
    c = cfg.read_text(encoding="utf-8")
    c = re.sub(r"export const ID = '[^']*';", f"export const ID = '{film_id}';", c)
    c = re.sub(r"export const NAME = '[^']*';", f"export const NAME = '{film_name}';", c)
    if aspects:
        arr = ", ".join(f"'{a}'" for a in aspects)
        c = re.sub(r"export const ASPECTS = \[[^\]]*\] as const;", f"export const ASPECTS = [{arr}] as const;", c)
    cfg.write_text(c, encoding="utf-8")
    if brand:
        pack = PACKS / brand
        if not pack.is_dir():
            sys.exit(f"no brand pack '{brand}' in {PACKS} (available: {', '.join(p.name for p in PACKS.iterdir() if p.is_dir())})")
        for f in pack.iterdir():
            if f.suffix in (".ts", ".tsx"):
                shutil.copy2(f, target / f.name)
        say(f"brand pack '{brand}' applied: {', '.join(f.name for f in pack.iterdir() if f.suffix in ('.ts', '.tsx'))}")
    (target / "README.md").write_text(
        f"# {name}\n\nThis film started as a copy of `{base}`. It renders as-is, so you always have a working film.\n"
        "Replace, in this order: theme.ts (brand tokens and fonts), Logo.tsx (official mark), the music\n"
        "(public/films/<id>/music.wav) with data/beats.json, then the cards and scenes in Film.tsx (storyboard.md).\n"
        f"Compositions: {film_name}-<aspect> and {film_name}-Cover-<aspect>. Assets: public/films/{film_id}/.\n",
        encoding="utf-8",
    )
    register(dest, film_id, film_name)
    return film_id, film_name


def find_browser():
    return next((c for c in CHROME_CANDIDATES if os.path.isfile(c)), None)


def smoke(dest, comp, frame):
    npx = shutil.which("npx")
    if not npx:
        say("npx not found: skipping the smoke test")
        return False
    out = dest / "out" / f"smoke-{comp}.png"
    out.parent.mkdir(exist_ok=True)
    cmd = [npx, "remotion", "still", comp, str(out), f"--frame={frame}", "--scale=0.5", "--log=error"]
    say(f"smoke test: rendering {comp} frame {frame} ...")
    r = run(cmd, cwd=dest, check=False, capture=True)
    if r.returncode == 0 and out.exists():
        say(f"smoke test passed: {out}")
        return True
    err = (r.stderr or "") + (r.stdout or "")
    browser = find_browser()
    if browser and re.search(r"(?i)browser|chrom|download|headless|ENOTFOUND|getaddrinfo|remotion\.media", err):
        say(f"bundled browser unavailable, retrying with {browser}")
        r = run(cmd + [f"--browser-executable={browser}"], cwd=dest, check=False, capture=True)
        if r.returncode == 0 and out.exists():
            cfg = dest / "remotion.config.ts"
            cfg.write_text(cfg.read_text(encoding="utf-8") + f"\nConfig.setBrowserExecutable(String.raw`{browser}`);\n", encoding="utf-8")
            say("smoke test passed with the installed browser (saved to remotion.config.ts)")
            return True
        err = (r.stderr or "") + (r.stdout or "")
    print(err[-2500:])
    say("SMOKE TEST FAILED. Read the error above; references/resilience.md lists the fixes.")
    return False


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dest")
    ap.add_argument("--name", help="film name for a new project")
    ap.add_argument("--add", help="add a film with this name to an existing project")
    ap.add_argument("--sync", action="store_true", help="refresh the kit and examples in an existing project")
    ap.add_argument("--format", default="music", help="music | copy:<film-id>")
    ap.add_argument("--brand", help="brand pack to apply (folder in assets/brand-packs)")
    ap.add_argument("--aspects", help="comma list, e.g. 9x16,16x9,4x5,1x1")
    ap.add_argument("--no-install", action="store_true")
    ap.add_argument("--force", action="store_true", help="allow a non-empty destination for a new project")
    a = ap.parse_args()
    dest = Path(a.dest).resolve()
    aspects = [x.strip() for x in a.aspects.split(",")] if a.aspects else None
    if aspects:
        bad = [x for x in aspects if x not in ("9x16", "16x9", "1x1", "4x5")]
        if bad:
            sys.exit(f"unknown aspect(s): {', '.join(bad)}")
    if a.format not in EXAMPLES and not a.format.startswith("copy:"):
        sys.exit("--format must be music or copy:<film-id> (a voice-led film is made with the launch-film skill)")

    if a.sync:
        if not (dest / "package.json").exists():
            sys.exit(f"{dest} is not a motion project")
        for rel in ("src/kit", "src/films/example-motion"):
            if (dest / rel).exists():
                shutil.rmtree(dest / rel)
            shutil.copytree(TEMPLATE / rel, dest / rel, ignore=IGNORE)
        # the skill's tools are refreshed in place; scripts you added to tools/ stay
        shutil.copytree(TEMPLATE / "tools", dest / "tools", dirs_exist_ok=True, ignore=IGNORE)
        for rel in ("src/Root.tsx", "src/index.ts", "src/films/types.ts", "tsconfig.json"):
            shutil.copy2(TEMPLATE / rel, dest / rel)
        if (TEMPLATE / "public" / "films").exists():
            shutil.copytree(TEMPLATE / "public" / "films", dest / "public" / "films", dirs_exist_ok=True, ignore=IGNORE)
        make_sfx(dest)
        make_beds(dest)
        say("kit, examples and SFX refreshed. Run `npx tsc --noEmit` to check your films against the new kit.")
        return

    if a.add:
        if not (dest / "package.json").exists():
            sys.exit(f"{dest} is not a motion project (create it with --name first)")
        fid, fname = add_film(dest, a.add, a.format, a.brand, aspects)
        say(f"added film '{fid}' (compositions {fname}-*)")
        return

    if not a.name:
        sys.exit("pass --name for a new project (or --add / --sync for an existing one)")
    # planning files written before the project (brief, script, storyboard, style frames) may already be there
    planning = {".md", ".txt", ".png", ".jpg", ".jpeg", ".webp", ".pdf"}
    blocking = [p.name for p in dest.iterdir() if p.name not in ("node_modules", "docs") and (p.is_dir() or p.suffix.lower() not in planning)] if dest.exists() else []
    if blocking and not a.force:
        sys.exit(f"{dest} holds files that are not planning files ({', '.join(blocking[:5])}); pass --force to write into it")
    say(f"creating {dest}")
    shutil.copytree(TEMPLATE, dest, dirs_exist_ok=True, ignore=IGNORE)
    make_sfx(dest)
    make_beds(dest)
    fid, fname = add_film(dest, a.name, a.format, a.brand, aspects)
    if not a.no_install:
        npm = shutil.which("npm")
        if not npm:
            sys.exit("npm not found. Install Node.js 18+ (winget install OpenJS.NodeJS.LTS), then re-run with --sync.")
        say("installing dependencies (about a minute) ...")
        run([npm, "install", "--no-audit", "--no-fund", "--loglevel=error"], cwd=dest)
    ok = smoke(dest, f"{fname}-{(aspects or ['9x16'])[0]}", 20) if not a.no_install or (dest / "node_modules").exists() else False
    print()
    say(f"project: {dest}")
    say(f"your film: src/films/{fid}/  (compositions {fname}-<aspect>, assets public/films/{fid}/)")
    say("studio:   npx remotion studio      (from the project folder)")
    say(f"still:    npx remotion still {fname}-9x16 out/frame.png --frame=30")
    say(f"render:   npx remotion render {fname}-9x16 out/{fid}_9x16.mp4")
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
