# Never take no for an answer

1. The doctrine
2. Fallback ladders
3. Failure playbook
4. Last-resort renderer
5. When to ask the user
6. Labelling stand-ins

---

## 1. The doctrine

There are three kinds of "no":

- **The environment says no** (a tool is missing, an install fails, a render crashes, there is no internet, no voice, no
  music). That is routing. Climb down the ladder below, keep going, and deliver.
- **Quality says no** (the review loop scores under 4). That is iteration. Fix the lowest score, render, look again.
- **Truth, rights, consent, safety or the user's decision says no.** That one is real. Do not route around it; find the
  creative alternative inside it (show the product doing the job instead of claiming a number; a fictional customer
  instead of a real logo; a temp score instead of an unlicensed song; the user's wording instead of yours).

When the same fix fails twice, change the approach. Every substitute is labelled (section 6). Something real is
delivered every time, with the exact list of what would make it better.

## 2. Fallback ladders

| Need | Best | Then | Then | Last resort |
|---|---|---|---|---|
| Renderer | Remotion in the project | Reuse a project that already has `node_modules` (copy the folder, `npm install --prefer-offline`) | Remotion with the installed Chrome or Edge (`--browser-executable`) | `fallback_cards.py` (Pillow + ffmpeg), labelled |
| Node itself | Installed (18+) | `winget install OpenJS.NodeJS.LTS` (or the user installs it) | | `fallback_cards.py` |
| Fonts | Brand files or Google Fonts via `@remotion/google-fonts` | Local files in `public/fonts/` via `@remotion/fonts` (offline) | Closest free face, named in the note | Never a silent system fallback |
| Logo | Official SVG | The website's inline SVG or favicon SVG | Typographic wordmark in the brand face, labelled provisional | Never a new mark for an existing brand |
| Product UI | Real screens (screenshots, the live product) | Rebuilt from the design system | Concept UI, labelled | Never misrepresent the product |
| Voiceover | Creative connector TTS, a banked voice first, directed with `vo-direction.txt` (busy or out of credits: say so, try again later; a human read only when the user offers one) | Kokoro on this machine, `tts_kokoro.py` (no queue, no credits, passes `vo_check.py` with `af_heart` or `am_fenrir`) | `tts_local.ps1` scratch for timing only, or turn the script into on-screen copy (a motion-ad cut) |
| Word timing | TTS word timings (`--words-from`) | whisper.cpp | Estimate + speech-segment fitting (exact on clean reads with pauses) | Phrase cues placed by eye on the waveform image |
| Beat timing | The track's stated BPM + `beat_grid.py` downbeat | `beat_grid.py` estimate, checked on its PNG | The temp bed's own grid | A fixed 120 BPM grid |
| Music | A licensed track | Connector music or video-to-music | `sound_kit.py bed` | SFX-led sound design |
| SFX | `sound_kit.py kit` | Connector sound effects | ffmpeg one-liners (below) | Silence plus one hit |
| Props and imagery | Licensed or brand illustration | Connector image models + background removal | The kit's `Sticker` props (21 drawn in code) or your own `Sticker draw` | Emoji (drafts only) |
| Internet | Online | Offline: local fonts, an installed project, local TTS, whisper, the kit, beds, QA all still work | | |
| Time | Full renders | Half-scale previews, `--frames` for one scene | Fewer aspects first (9:16), the rest after | |

SFX without numpy (ffmpeg only):

```bash
ffmpeg -y -f lavfi -i "aevalsrc='sin(2*PI*(200+600*exp(-30*t))*t)*exp(-25*t)':s=48000:d=0.2" pop.wav
ffmpeg -y -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.5" -af "afade=t=in:d=0.2,afade=t=out:st=0.2:d=0.25,lowpass=f=3000,highpass=f=300" whoosh.wav
ffmpeg -y -f lavfi -i "aevalsrc='0.6*sin(2*PI*1318*t)*exp(-6*t)+0.5*sin(2*PI*1975*t)*exp(-7*t)':s=48000:d=0.7" ding.wav
```

## 3. Failure playbook

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm install` fails | Network, proxy, registry | Retry with `--prefer-offline`; copy `node_modules` from another motion project with the same `package.json` |
| Browser download or launch errors on first render | Headless shell could not download | `new_project.py` retries with the installed Chrome/Edge and saves it; or pass `--browser-executable` |
| "delayRender timed out" | A font, image or audio file never loaded | Check the network (Google Fonts), the path and case of the file, then re-render |
| 404 for a `staticFile` | Missing file in `public/` | Fix `asset()` paths; `new_project.py --sync` regenerates `public/sfx` |
| TypeScript errors | API mismatch, typo | `npx tsc --noEmit`, read the installed `.d.ts`, fix before rendering |
| Render runs out of memory or crashes | Heavy layers, high concurrency | `--concurrency=2`, less blur and grain, render in parts with `--frames` and join with ffmpeg concat |
| Red FONT NOT LOADED banner | Family name mismatch, weight not loaded, offline | Use the `fontFamily` that `loadFont` returns; load the weight; go local |
| Frame 0 black or empty | First element enters at frame 0 | Give it `at` below zero |
| Type running under platform UI | Too big for the safe width | Smaller size or let `maxWidth` wrap; check a still with `safeZones` |
| Captions out of sync | Aligned a different file than the one playing | Align the exact file `Voice` plays, after cleaning; re-run after every take |
| Captions missing behind a scene | A scene with a higher `z` | CaptionTrack sits at z 100; keep scene `z` values under that |
| Mix distorts or is too loud | Stems too hot | `finish.py mix` (measured gains, float, limiter); lower the loudest stem |
| Loudness off target after master | The limiter is working hard | Lower the loudest stem and remix (finish.py warns) |
| Whisper is very slow | CPU transcription, medium model | Use TTS word timings, or the estimate on a clean read, or a smaller model |
| SAPI timings stretched | SAPI's clock mismatch | `tts_local.ps1` calibrates against the file length; re-run it |
| Inline `--props` JSON rejected | PowerShell strips quotes | Props in a JSON file; `finish.py stems` writes them for you |
| A helper function never runs in PowerShell | Its name is an alias (`R`, `sl`, `gc`...) | Use Verb-Noun names; PowerShell names are case-insensitive too |
| Colours look shifted in a player | Untagged colour space | `qa.py` reports it; the starter tags BT.709 |
| WhatsApp turns it to mush | Heavy recompression | Deliver a 720p file under the size limit with bigger type |

## 4. Last-resort renderer

When Remotion cannot run at all, `python scripts/fallback_cards.py spec.json` renders kinetic text cards (eased rise and
fade, emphasis lines in the accent colour, per-card grounds, optional audio) straight to MP4 with Pillow and ffmpeg.
It is plain, real and on time. Label it as a fallback and rebuild in Remotion when the machine allows.

## 5. When to ask the user

Only for what only they can give: the copy questions (who it is for, what success looks like, length and versions,
the framework: `references/copywriting.md`), facts and claims, how a name is pronounced, spending beyond a small
amount of credits, brand approvals, and anything sent or published on their behalf. Ask as question cards at the gates (SKILL.md, "Asking the user"), each question with your
recommended answer first, and keep working on everything else while you wait. Everything else you decide, and you say what you decided.

Running unattended (nobody to ask): assume the most conservative answer, build on it, and put each question with the answer you assumed in the delivery note's "Questions I would have asked"
section, so the user can overturn it in one line.

## 5a. When an input does not exist

| Missing | Do this |
|---|---|
| A destination for the CTA (no URL, handle or number in any source) | Make the action complete where the film plays ("Message us to join" on a post, "Reply to this status" on WhatsApp Status); keep the address as a config slot and a `[number]` slot in the post copy; render one still with a dummy value to prove it fits; ask for the real one in the next gate's card. Never invent an address. |
| The reference video (a link that will not open, a reel you cannot download) | Tear down what you can verify: the user's description, the skill's own written teardown when it is that reference, any stills they can send. Label the teardown "principles only, not frame-timed" and take structure, not timings. |
| A voice, in a film that has none | No caption files (there is nothing to caption): every word is designed on-screen type, so write alt text in the post copy instead, and say so in the delivery note. |
| A logo | A typographic lockup in a chosen face, labelled provisional in the delivery note with the swap (where the official SVG goes). Never a new mark for a brand that has one. |
| Brand colours | A provisional palette from the product's world (a bakery's cream and raspberry), checked with `contrast.py`, labelled provisional. |
| The current product UI | Rebuild from the newest spec on disk, say which one, and ask for screenshots in gate 2's card before the product scenes are final. |

## 6. Labelling stand-ins

The delivery note has a **Stand-ins** table: item, what is used now, why, and the exact swap (file path and command).
For example: "VO: Windows scratch voice (Zira), used for timing. Swap: generate the directed read (a banked voice), save as
public/films/x/vo.wav, run align_vo.py, re-render." A stand-in nobody was told about is a broken promise; a labelled
one is a plan.
