"""What this machine can do for motion work, and the best route for each job.

  python check_env.py [--json] [--net]

Run it at the start of a project. Every job has a route even when a tool is missing (see
references/resilience.md): this report tells you which route you are on, so you can say so.
"""
import argparse
import importlib.util
import json
import os
import platform
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BROWSERS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
]


def out_of(cmd, timeout=20):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return (r.stdout or r.stderr).strip()
    except Exception:  # noqa: BLE001
        return ""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--net", action="store_true", help="also check the npm registry is reachable")
    a = ap.parse_args()
    r = {"os": f"{platform.system()} {platform.release()}", "python": sys.version.split()[0]}

    node = shutil.which("node")
    r["node"] = out_of([node, "-v"]) if node else None
    m = re.match(r"v(\d+)", r["node"] or "")
    r["node_ok"] = bool(m and int(m.group(1)) >= 18)
    r["npm"] = bool(shutil.which("npm"))
    r["npx"] = bool(shutil.which("npx"))
    ff = shutil.which("ffmpeg")
    r["ffmpeg"] = out_of([ff, "-hide_banner", "-version"]).splitlines()[0] if ff else None
    r["ffprobe"] = bool(shutil.which("ffprobe"))
    r["py_libs"] = {k: bool(importlib.util.find_spec(k)) for k in ("numpy", "scipy", "PIL")}
    r["browser"] = next((b for b in BROWSERS if os.path.isfile(b)), None)
    du = shutil.disk_usage(os.getcwd())
    r["disk_free_gb"] = round(du.free / 1e9, 1)
    if a.net and r["npm"]:
        r["npm_registry"] = out_of([shutil.which("npm"), "view", "remotion", "version"], timeout=30) or None

    libs = r["py_libs"]
    lanes = {
        "render": "Remotion (node + npm)" if r["node_ok"] and r["npm"] else "NO NODE 18+: install it (winget install OpenJS.NodeJS.LTS), else the ffmpeg-only fallback in references/resilience.md",
        "beats": "beat_grid.py on a licensed track (tempo and downbeat), or the temp bed's own grid (sound_kit.py bed)",
        "music": "licensed track or the creative connector's music model; temp: sound_kit.py bed" + ("" if libs["numpy"] and libs["scipy"] else " (NEEDS numpy + scipy)"),
        "sfx": "sound_kit.py kit" + ("" if libs["numpy"] and libs["scipy"] else " (NEEDS numpy + scipy: python -m pip install --user numpy scipy)"),
        "qa": "qa.py" + ("" if libs["PIL"] and r["ffmpeg"] else " (NEEDS Pillow and ffmpeg)"),
        "browser_fallback": r["browser"] or "none found (Remotion downloads its own headless shell; needs internet once)",
    }
    r["lanes"] = lanes
    if a.json:
        print(json.dumps(r, indent=1))
        return
    print("Motion toolchain")
    print(f"  OS {r['os']} | Python {r['python']} | disk free {r['disk_free_gb']} GB")
    print(f"  node {r['node'] or 'MISSING'}{'' if r['node_ok'] else '  <- need 18+'} | npm {'yes' if r['npm'] else 'MISSING'} | npx {'yes' if r['npx'] else 'MISSING'}")
    print(f"  ffmpeg {r['ffmpeg'] or 'MISSING'} | ffprobe {'yes' if r['ffprobe'] else 'MISSING'}")
    print(f"  python libs: " + ", ".join(f"{k} {'yes' if v else 'MISSING'}" for k, v in libs.items()))
    if "npm_registry" in r:
        print(f"  npm registry: {'reachable, remotion ' + r['npm_registry'] if r['npm_registry'] else 'UNREACHABLE (offline: reuse an installed project)'}")
    print("Routes")
    for k, v in lanes.items():
        print(f"  {k:<17} {v}")


if __name__ == "__main__":
    main()
