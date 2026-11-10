# Edition V throwback videos: delivery note (v3)

Built to the script in the Claude doc "ASSETLINK x Miami Art Week 2026, Event Promo Strategy" (Content plan tab,
section "Throwback motion videos"). Two music-led videos cut from the Edition I to IV recap footage, in the wall-label
style, ending on the shared end card. Formats per the doc: 9:16 for Reels and Stories, 1:1 for LinkedIn.

This replaces v01 (flyer only) and v02 (four-year montage), which are in git history.

## Files (`final/`)

| File | Post date in the plan |
|---|---|
| `four_decembers_9x16_v01.mp4`, `four_decembers_1x1_v01.mp4` | Throwback video 1, Fri Nov 14; Stories re-share Tue Dec 1 |
| `some_assets_9x16_v01.mp4`, `some_assets_1x1_v01.mp4` | Throwback video 2, Fri Nov 21 |
| `four_decembers_cover_*.png`, `some_assets_cover_*.png` | Thumbnails (the opening label) |

All 1080 wide, 30 fps, H.264, about -14.8 LUFS. Four Decembers runs 25 s, Some Assets 19 s (each script length
plus the 2-second end card hold).

## Video 1: "Four Decembers"

| Time | On screen (from the doc) | Footage |
|---|---|---|
| 0-2 s | ASSETLINK, Miami / One tradition, four Decembers | Slow aerial of the river (2025 venue) |
| 2-6 s | Edition I · 2022 / It started with one evening. | 2022: arrivals, then the room |
| 6-10 s | Edition II · 2023 / Then it became a tradition. | 2023: the rooftop crowd, then the talk under the ASSETLINK screen |
| 10-14 s | Edition III · 2024 / We rebuilt the company. We still came back. | 2024: guests on the terrace |
| 14-18 s | Edition IV · 2025 / Same city. Same week. More friends in the room. | 2025: the widest crowd shot, then a toast |
| 18-22 s | Edition V · 2026 / Thursday, Dec 3 · 7–10 PM / Seaspice, on the Miami River | Freeze on the 2025 crowd, darkened |
| 22-25 s | End card | |

The big year flips forward on each edition, 2022 to 2026, and holds on 2026.

## Video 2: "Some assets don't hang on walls"

| Time | On screen (from the doc) | Footage |
|---|---|---|
| 0-3 s | Every December, / Miami fills up with art. | The river aerial, then the 2025 crowd |
| 3-7 s | But some of the best things that week | Eight faces mid-conversation, a cut on every beat |
| 7-10 s | happen in conversation. | Laughter and toasts |
| 10-13 s | Some assets don't hang on walls. / Medium: advisors, capital, five years of conviction | A slow-motion champagne pour |
| 13-16 s | ASSETLINK 5th Annual Art Basel Evening / Thursday, Dec 3 · Seaspice, on the Miami River | Its last frame, darkened |
| 16-19 s | End card | |

The "Medium:" line comes from the doc's wall-label template, added so this beat reads as a real wall label.

**End card for both:** ASSETLINK logo / Free to attend / Registration closes Dec 2 / Save your spot (link in bio).

## Footage choices

- Every clip is muted; each video has its own score.
- The 2024 opening shot was trimmed past a sponsor backdrop that shows a bank's name. One 2025 moment was dropped
  because it shows a sponsor wall. No third-party brand is on screen.
- The 2023 rooftop shot shows the old DFD Partners logo on the stage screen. It is company history, so I kept it.
  Say if you want it swapped.
- The 2023 stage clip is a re-shared story. I cropped out the sharer's handle and the @dfdpartners tag.
- The 2025 reel came in at 640x316, so its shots are the softest. The original export would sharpen them.
- Guests on screen come from ASSETLINK's own event posts. Check you're happy for them to appear again, especially
  before any paid boost.

## Stand-ins

1. **Music:** temp beds synthesized by `sound_kit.py` (Four Decembers warm in D, Some Assets calm in F, both at 120 BPM). A
   licensed track would lift them. Run `scripts/beat_grid.py` on it and the cuts re-time.
2. **Wall-label type:** Inter, the brand pack's provisional body face. Swap it if the Canva wall-label template uses
   another face.

## Please confirm

- **The year lines.** The doc says the year-by-year lines are placeholders to swap for what actually happened each
  year. The videos use them as written; "We rebuilt the company" (2024) matches Devon's post.
- **The registration link.** The end card says "link in bio". Make sure the form is in the bio before Nov 14.

## Post copy (from the doc)

**Video 1:** "Four Decembers in Miami. The fifth is next month. Join us for our 5th Annual Art Basel Evening,
Thursday, Dec 3, 7–10 PM, at Seaspice on the Miami River. Free to attend. Registration closes Dec 2. Save your spot:
[link]"

**Video 2:** "Art Week is about what hangs on the walls. Our evening is about who's in the room. Five years of
advisors, firm leaders, investors and friends. Join us Thursday, Dec 3, 7–10 PM, at Seaspice on the Miami River. Free
to attend. Registration closes Dec 2. Save your spot: [link]"

**Alt text, video 1:** Footage from four ASSETLINK Art Basel evenings in Miami, one year at a time, with a large year
flipping from 2022 to 2026 and a museum-style label for each edition. It ends on "Edition V, 2026, Thursday, Dec 3,
7 to 10 PM, Seaspice, on the Miami River" and an end card: Free to attend, registration closes Dec 2, save your spot.

**Alt text, video 2:** Quick cuts of guests talking, laughing and toasting at past ASSETLINK Art Basel evenings, with
labels reading "Every December, Miami fills up with art. But some of the best things that week happen in
conversation. Some assets don't hang on walls." It ends on the event details and the end card.

## Change it

Source: `src/films/four-decembers/` (with `shared.tsx`, the wall label, year flip and end card) and
`src/films/some-assets/`. Clips: `public/films/art-basel-throwback/c2/`. From the repo root:
`python3 .claude/skills/motion-designer/scripts/finish.py finals films/art-basel-throwback FourDecembers films/art-basel-throwback/final --aspects 9x16,1x1 --stems music,sfx --lead music`
(and the same with `SomeAssets`).
