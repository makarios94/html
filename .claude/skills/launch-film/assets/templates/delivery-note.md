# <Film name>: delivery

## In the box (final/)
| File | What it is |
|---|---|
| | |

(A film with no voice has no caption files: say so, and put alt text in the post copy.)

## What happens when
| Time | Beat |
|---|---|
| 0.0 s | |

## Decided on your behalf
-

## Questions I would have asked (and the answer I assumed)
Only when the run was unattended. One line each, so any answer can be overturned in one reply.
1.

## Stand-ins to replace
| Item | Used now | Why | Swap |
|---|---|---|---|
| | | | |

## Please confirm
Also asked in the conversation as gate 5's question card (SKILL.md, "Asking the user").
-

## Checks
- QA: resolution, fps, codec, BT.709, loudness <x> LUFS / true peak <y> dBTP, no black or frozen frames, safe zones,
  FontGuard clean (fonts, declared glyphs, and every on-screen character).
- Captions proofread against the script; banned-word and em-dash grep clean.
- Sound checked by measurement and spectrum (please give it a listen).
- Rubric: hook <n>, clarity <n>, rhythm <n>, craft <n>, brand <n>, legibility <n>, sound <n>, CTA <n>, truth <n>.

## Change it later
- Words: edit `src/films/<id>/script.txt`, re-record or regenerate the VO, run `align_vo.py`, re-render.
- Look: `theme.ts` (colours, fonts), `Logo.tsx`; scenes in `Film.tsx`.
- Render every deliverable: `python <skill>/scripts/finish.py finals . <NAME> final --aspects <list> [--clean <list>]`.

## Spent
- Credits: <none | what and how much>
