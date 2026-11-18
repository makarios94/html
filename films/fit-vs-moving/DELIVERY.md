# Fit vs moving: delivery note (v2, interactive)

The 18 Nov 2026 LinkedIn carousel "Fit vs moving" as a 30-second music-led motion video. v2 (client direction, Nov 18: "more interactive and on brand") puts a cursor to work in every scene and takes the close from AssetLink's shipped signals post. The words are the
carousel's, slide for slide. The film acts each slide out with the product idea, so it reads with the sound off.

## Files (`final/`)

| File | Use |
|---|---|
| `fit_vs_moving_4x5_v01.mp4` | LinkedIn and Instagram feed (recommended for LinkedIn) |
| `fit_vs_moving_1x1_v01.mp4` | LinkedIn feed, square |
| `fit_vs_moving_9x16_v01.mp4` | Reels, Stories, Shorts |
| `fit_vs_moving_cover_*.png` | Thumbnails: the list with "aren't moving." landed |

All 1080 wide, 30 fps, H.264, mastered to about -16 LUFS (the first half of the score is quiet by design; the limiter holds the peaks).

## The film

| Time | On screen (the carousel's copy) | What you see |
|---|---|---|
| 0-8 s | A list of advisors / who fit, but / **aren't moving.** | A clean list, each advisor ticking its reasons to fit. The cursor hovers an advisor, then hits refresh: the signal lines flicker and come back flat, "No change". |
| 8-16 s | Alerts about / advisors who move, / but **don't fit.** | "Changed firms" alerts drop in on the beat and pile up, each with why it is not a fit (Wrong channel, Outside your region, Below your AUM range). On "don't fit." every reason lights; then the cursor drags the alerts off one by one. |
| 16-26 s | AssetLink / shows both | On the drop: the list returns with "Why they fit" and "Signal". Two advisors start moving ("May be moving"). The cursor opens one: why they fit (Independent RIA channel, Northeast in your territory, CFP), the signal (a recent change at their firm), then clicks "Draft first message": "Saved to your Outlook drafts". |
| 26-30 s | Who fits and who / **may be moving.** / Know who, why and when. / Book a demo | The signals post's close: dark gradient, the serif tagline, a white button with blue type, tapped; the mark assembles bar by bar. |

Each scene change is a wipe made of the carousel's diagonal bars (grey, then navy to indigo, then the end gradient).

## Look and sound

- **Type:** Montserrat SemiBold for headlines (the carousel's face), the brand serif for "Know who, why and when." (as on
  the one-pager and the signals post), Inter for the UI. Section labels in purple caps, as on the one-pager.
- **Logo:** the small lockup sits top left through the light scenes, as on the shipped posts.
- **Colours:** sampled from the carousel: ink `#090C36`, violet `#5B33E6`, grey bars `#D4D5E2`, indigo `#3432C9`,
  blue `#23A2F4`.
- **Logo:** the mark is drawn as vector from the brand pack's geometry, which matches the carousel's logo; the
  wordmark is set in Montserrat Light. Swap in the official SVG when it is available.
- **Music:** ElevenLabs Music v2.5, made for this film (instrumental, 120 BPM): sparse and stuck for the list,
  restless for the alerts, and the full groove drops at 16 s on "AssetLink shows both". The cuts sit on its bar
  lines. For v2 the groove is two bars longer (bars 18 to 22 repeated on the bar line) to give the demo room. On the ElevenLabs canvas "ASSETLINK Edition V throwback music" as "Fit vs moving score". Cost: 780 credits
  (two takes; take 1 used).

## Truth check

- Advisors, initials, alert names and fit reasons are fictional demo data. No real advisor, firm or contact detail.
- A fit is shown as reasons, never a score or rank. Movement is "May be moving", never a prediction.
- The alerts in the middle stand for the tools the viewer already has; the film does not claim AssetLink sends
  alerts.
- The UI is drawn as plain cards in the brand's style. It is not a screenshot of the product. The detail follows the
  positioning document's safe demo path (a list, one advisor, a signal, a draft into the drafts folder).

## Please confirm

- **The demo rows.** Happy with the fictional names and fit reasons (CFP, 12 yrs at one firm, Independent RIA,
  Northeast, Hybrid channel, Wirehouse, Texas)?
- **"assetlink.ai" is not on the end card**, to match the carousel. Say if you want it added under the button.

## Post copy (suggested)

"Most advisor data gives you one of two things: a list of advisors who fit but aren't moving, or alerts about advisors
who move but don't fit. AssetLink shows both. Who fits, and who may be moving. Know who, why and when. Book a demo:
[link]"

**Alt text:** An advisor list where every signal line stays flat even after a refresh, then a pile of alerts about
advisors who are not a fit being swiped away, then the same list with two advisors marked "May be moving", one opened to
show why they fit and a first message saved to drafts. Ends on "Who fits and who may be moving. Know who,
why and when. Book a demo" and the AssetLink logo.

## Change it

Source: `src/films/fitvsmoving/Film.tsx` (scenes, timings and demo data at the top of each section). From the repo
root: `python3 .claude/skills/motion-designer/scripts/finish.py finals films/fit-vs-moving FitVsMoving films/fit-vs-moving/final --aspects 9x16,4x5,1x1 --stems music,sfx --lead music`
