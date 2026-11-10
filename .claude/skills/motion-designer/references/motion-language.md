# Motion language

1. Principles
2. Timing at 30 fps
3. Easing, springs and personality
4. Choreography
5. Kinetic typography
6. Product UI in motion
7. Camera
8. Transitions
9. Ambient life
10. Hand-drawn accents
11. Sound and motion
12. Format signatures
13. Anti-patterns
14. Technique to kit map

---

## 1. Principles

- **Purpose.** Every move explains something. Arrival means new information, direction means flow (left to right and
  upward read as forward and progress), scale means importance.
- **Hierarchy through motion.** The most important element moves first or most; supporting elements move less or not
  at all. The eye follows the biggest change.
- **Continuity.** Carry things across scenes: the same phone through three screens, the logo point becoming the origin
  of the colour flood, the button becoming the next shape. Continuity is what makes a piece feel designed.
- **Rhythm.** Vary durations: fast, fast, slow. The hero moment gets the longest hold and the biggest type.
- **Physics.** Things have mass. Entrances decelerate into place (ease-out or spring), exits accelerate away (ease-in),
  moves between two places ease both ways.
- **Overlap.** The next beat starts before the last one finishes. Sequential, polite motion reads as a slideshow;
  overlapping beats read as orchestrated. (This is the rule in the approved Coridr reveal: "nothing waits politely".)
- **Restraint.** One focal motion at a time. The brand's personality sets how much bounce exists at all.
- **Never fully still.** A held frame with nothing moving for more than about a second reads as a stalled video: keep a
  slow push, a few px of drift, or a breathing glow under every hold. Make a hold's push linear and run it to the
  last frame: an eased push slows to a stop in its final second, and that second reads as frozen (both examples'
  end cards tripped `qa.py`'s held-frame warning that way). On a flat ground a push barely changes any pixels (a 3
  percent push on navy still trips the warning), so push 4 to 6 percent, or pair it with drift on the main element.
  A held beat in the voice (a slow turn line) wants a build on screen, so the stillness reads as tension and not a
  stall: light that grows behind the words, a slow drift, the coming world's colour starting to glow (the Paidly turn
  blooms the brand colour behind its setup line before the reveal floods it).

## 2. Timing at 30 fps

| What | Frames | Seconds |
|---|---|---|
| Press, tap, toggle feedback | 3 to 6 | 0.1 to 0.2 |
| Small element in (word, pill, icon) | 8 to 14 | 0.27 to 0.47 |
| Line of text in | 12 to 20 | 0.4 to 0.67 |
| Card or panel in | 15 to 24 | 0.5 to 0.8 |
| Scene transition | 12 to 24 | 0.4 to 0.8 |
| Camera push or pull | 30 to 120 | 1 to 4 |
| Logo reveal | 45 to 140 | 1.5 to 4.6 |
| Exit | 60 to 70 percent of the entrance | |
| Stagger between siblings | words 2 to 4, rows 4 to 8, groups 6 to 10 | |
| Lead before the spoken word | 2 to 4 | the eye reads ahead of the ear |
| Text hold with no voice | `readFrames(text)`: max(1 s, 0.5 s + words / 3) | |

Beat lengths: 120 BPM is 15 frames a beat (60 a bar), 100 BPM is 18, 92 BPM is about 19.6, 90 BPM is 20. Use
`B.beat(n)` and `B.bar(n, beat)`; never hand-convert.

## 3. Easing, springs and personality

| Curve (`ease.*`) | Bezier | Use |
|---|---|---|
| `out` | 0.16, 1, 0.3, 1 | The signature entrance: hard deceleration, no overshoot |
| `soft` | 0.2, 0.75, 0.2, 1 | Type settling, small UI |
| `inOut` | 0.65, 0, 0.35, 1 | Moves between two on-screen positions, camera |
| `in` | 0.7, 0, 0.84, 0 | Exits |
| `draw` | 0.45, 0, 0.25, 1 | Strokes and paths |
| `linear` | | Only constant-speed things: tickers, progress tied to time, scrolling walls |

Personality (`theme.personality`) sets the springs every kit component uses:

| Personality | Spring | Feel | Brands |
|---|---|---|---|
| `calm` | damping 200 (no overshoot), eased | Authority, precision | B2B trust, finance, health, legal, government. Coridr. |
| `crisp` | damping 20, stiffness 190, mass 0.7 (about 4 percent overshoot) | Confident, modern | SaaS, product launches, fintech consumer |
| `playful` | damping 10, stiffness 165, mass 0.8 (visible bounce) | Joy, energy | Food, lifestyle, kids, music-led ads |

Stay inside one personality per film. One deliberate exception (a playful pop on the logo of a crisp film) is a choice;
three are a mess.

## 4. Choreography

- **Order of arrival:** context (background, device) then subject (the card) then detail (rows, fields) then label then
  accent (scribbles, badges) last.
- **Stagger follows reading order:** left to right, top to bottom. Exits go all at once or in reverse, faster.
- **Overlap:** start the next element when the previous one is about 60 percent in.
- **Direction means something:** notifications drop from the top, new rows rise from below, sent things leave up and
  right, a back step goes left. Everything entering in one scene shares a direction unless contrast is the point.
- **Distance:** type travels 20 to 40 design px, cards 60 to 120, a hero object (a phone rising) 300 or more.
- **Everything that arrives leaves** (or is covered by the next scene). Nothing lingers into the next idea: give pills,
  props and badges an `exitAt`.

## 5. Kinetic typography

| Technique | Kit | Use |
|---|---|---|
| Rise (default) | `KineticText kind="rise"` | Most lines |
| Mask reveal | `kind="mask"` | Editorial, calm, premium |
| Focus pull | `kind="blur"` | Calm brands, hero words (the Coridr wordmark uses it) |
| Pop | `kind="pop"` | Playful, on the beat |
| Typewriter | `Typewriter`, `Field typeAt` | Inputs, prompts, messages |
| On the voice | `wordFrames={vo.wordsOf('id').map(w => w.from - 3)}` | Voice-led films |
| Emphasis | `*stars*` + `emphasis={{color, weight, font, decoration}}` | One word or phrase per card |
| Decorations | `decoration: 'underline' / 'highlight' / 'circle' / 'strike'` | Hand-made energy, crossing out a belief |
| Counter | `Counter` (tabular figures, ticks) | A number that matters |
| Build or swap | `LogoReveal style="build"`, or an exit plus an entrance | "see" becoming "seen" |
| Big statement | small setup line + one hero-size line | The turn |

Rules: no more than two type animations visible at once; char-by-char only for one or two words or a logo; hold
after landing; long sentences arrive by line or by phrase, never letter by letter.

**Words that act out their meaning.** The strongest kinetic moments make the word do what it says: Seeran's
"invisible." lands huge, then fades nearly into the ground; "one at a time" can land one word at a time with gaps;
"pile" stacks; "gone" erases. Find the one word in the script that can perform itself, and give it the hero moment.

Sizes in design px (1080 short side): hero 140 to 200 (one or two words), h1 100 to 120, h2 80, body 40 to 48,
caption pills 42 to 46 on vertical. Wide frames take about 10 to 20 percent more. KineticText wraps to the centred
safe width by default (`textW`), so big type cannot run under platform UI; check the wrap on a still.

## 6. Product UI in motion

- **Rebuild the UI in code** from the design system (`Card`, `Field`, `Button`, `ListStack`, `Avatar`, `PhoneFrame`,
  `BrowserFrame`, `Notification`). It is crisp at any size, animatable, and true. Screenshots are a last resort, and
  then masked, pushed into and annotated.
- **Simplify.** Show the part of the UI that tells this beat's story. Enlarge type 1.3 to 1.6 times over the real UI so
  it reads on a phone.
- **Tilted planes.** `Tilt pose="desk"` (rx 26, rz -9) for the problem world, `float` (rx 10, ry -16, rz -3) and `hero`
  (rx 6, ry -10) for product moments. Drift a few degrees across the shot (`to`). Depth of field: blur layers behind the
  subject by 6 to 10 px and dim them.
- **Interaction.** Desktop and web get a `Cursor` (gentle arcs, a 4 to 6 frame pause before the click, a ripple);
  phones get `Tap`. Typing runs at 28 to 45 characters per second; type a line, never a paragraph.
- **State changes are the story:** empty, typing, filled, pressed, loading, success. Each change lands on a word or a beat.
- **Consistent data** across scenes: the same invoice number, amount and name everywhere.
- **Generic devices:** no manufacturer or OS marks; status bar at 9:41.
- **Push in on what is being used** (1.1 to 1.2 times) so the UI is legible, then ease back out for the next beat.

## 7. Camera

- **Push in** (`Camera scale={[1, 1.05]}`) through a scene: keeps holds alive and builds intensity.
- **Pull back** (`TileWall fromScale={2.6}`): context, scale, "one in a crowd".
- **Pan** across a stage; **rack focus** with blur.
- **Parallax:** foreground moves 1.2 to 1.5 times the background.
- One camera move at a time, eased both ways. No shake in product work.

## 8. Transitions

- **Default: a hard cut on the beat or on the stressed word.** It is the cleanest transition there is.
- **Match moves (the designed-film signature).** One object carries the story across a cut: in the Seeran ad a face
  from the pile shrinks into the logo position and becomes the app icon, and the Send button expands into the purple
  end card. Build them with `MorphBox` (from and to states: centre, size, radius, colour; contents cross-fade):

  ```tsx
  <MorphBox at={P.send.to - 6} dur={16} from={{x: 0, y: 120, w: 520, h: 150, radius: 75, color: t.colors.brand}}
            to={{x: 0, y: 0, w: L.width / L.u, h: L.height / L.u, radius: 0, color: t.colors.brand}}
            fromContent={<span style={{color: t.colors.onBrand, fontSize: 64 * L.u}}>Send</span>} />
  ```
  Plan them in the storyboard: which object leaves one scene and becomes something in the next.
- **Word swaps that pay off the name:** Seeran builds "seeran", drops "ra" and slides the "n" in to make "seen". Build
  with two KineticText layers (exit some letters, slide the rest) or per-letter `Reveal`s. Only when the pun is natural
  and on-brand (Coridr's name invites one only toward a banned word, so it gets none).
- **Push** (`PushIn`): directional progress, screen to screen. **Whip:** a fast push with motion blur
  (`@remotion/motion-blur` `CameraMotionBlur`) and a one-frame `Flash`, between product cards.
- **World change, once per film:** a circle flood from a meaningful point (`CircleReveal`) or a soft-edged wipe on the
  spoken name (`WipeReveal feather={18}`, Seeran's move).
- **Wipe** (`WipeReveal`) and **flash** (`Flash`): punctuation, sparingly.
- `@remotion/transitions` (`TransitionSeries` with fade, slide, wipe, iris and more) for crossfades between sequences;
  the WebGL ones (crosswarp, ripple, film-burn, dreamy-zoom) may need `--gl=angle` on Windows.
- Avoid spins, cubes, star wipes, and more than two transition types in one film.

## 9. Ambient life

`Float` (2 to 8 px, 90 to 140 frame period), `Backdrop glow={{breathe: true}}`, `Grain` (0.03 to 0.06), one `Sheen`
across a hero surface, the drift in `Tilt`. Keep amplitudes small so they never compete with the focal motion.

## 10. Hand-drawn accents

`ScribbleUnderline`, `Swoosh`, `HandCircle`, `Arrow`, `Check`, `Strike`, or the `emphasis.decoration` on KineticText.
Draw on in 12 to 20 frames with `ease.draw`, 4 to 6 frames after the word lands. Stroke about 7 to 8 percent of the text
size, in one accent colour; change the seed for a different hand; `eraseAt` clears it for the next idea. Playful and
crisp brands use them freely; calm brands sparingly or not at all.

## 11. Sound and motion

- Every SFX belongs to something visible. A whoosh starts 3 to 5 frames before its move (`lead`), a pop lands 2 frames
  after the landing, a riser ends on its hit (the kit does this), an impact sits on the hero word.
- Ticks for counters, keystrokes for typing, a ding for notifications, success or chime for resolution.
- Repeated sounds vary in pitch (`pitch` 0.9 to 1.12) so they never sound mechanical.
- Silence is a sound: let the music dip or drop out 6 to 12 frames before the turn so the hero word hits.

## 12. Format signatures

- **Motion ad (music-led):** one brand colour carrying the frame, playful springs on the beat, props as illustration,
  scribbles and swooshes, one phone with real UI changing screens on the bar, a payoff line, a logo that pops, the
  last chord ringing under the end card.
- **Launch film (voice-led):** two worlds, UI on tilted planes with depth of field, type synced to the voice, caption
  pills styled per world, one reframe word at hero size that acts out its meaning, a metaphor carried into the logo by
  match moves, a colour change on the spoken name, one verb per capability, the CTA button becoming the end card, the URL
  held long enough to type (2.5 s or more).

## 13. Anti-patterns

| You see | Fix |
|---|---|
| Linear moves | `ease.out` entrances, `ease.in` exits |
| Everything bouncing | Respect the personality; bounce is a brand decision |
| Text over a busy background | Plate, pill, blur or darken behind it |
| UI text too small to read on a phone | Enlarge the UI or push in |
| Elements that never leave | `exitAt` on everything that arrived |
| Dead frames (QA "held frames") outside the end card | Camera push, drift, a breathing glow |
| Black or empty frame 0 | The hook on frame 0, `at` negative so it has already landed |
| Captions repeating the headline on screen | `hide` those phrase ids |
| Fallback fonts (FontGuard banner) | Fix the font load; never ship it |
| A logo animation longer than the idea | 1.5 to 4.6 s, at the end |
| Three or more typefaces, neon gradients off-brand | Two families, the brand's colours |
| UI that misrepresents the product | Rebuild from the real product |
| Flashing faster than 3 times a second | Photosensitive viewers: keep flashes under 3 per second (WCAG 2.3.1) |
| Motion everywhere at once | One focal motion; still the rest |

## 14. Technique to kit map

| Technique | Component |
|---|---|
| Entrance and exit for anything | `Reveal` (`kind`, `exitAt`, `sfx`) |
| Kinetic type, emphasis, decorations | `KineticText` |
| Numbers | `Counter` |
| Strokes, arrows, checks, scribbles | `DrawPath`, `ScribbleUnderline`, `Swoosh`, `HandCircle`, `Arrow`, `Check`, `Strike` |
| Surfaces and chips | `Card`, `Pill`, `Button`, `Avatar`, `Marker` |
| 3D planes, camera | `Stage3D`, `Tilt`, `POSES`, `Camera` |
| Devices | `PhoneFrame`, `BrowserFrame` |
| Typing, pointer, touch | `Typewriter`, `Field`, `Cursor`, `Tap` |
| Lists, notifications | `ListStack` (highlight row, badge), `Notification` |
| Grounds and texture | `Backdrop` (glow, vignette, grid), `Grain`, `Sheen`, `Float` |
| Props and crowds | `FloatingProps`, `TileWall` |
| World changes | `CircleReveal`, `WipeReveal` (`feather` for a soft edge), `PushIn`, `Flash` |
| Match moves | `MorphBox` (one box becomes another: tile to icon, button to end card) |
| Captions | `CaptionTrack` (phrase pills or karaoke, variant per frame) |
| Brand | `LogoReveal`, `EndCard`, brand-pack `Logo` |
| Sound | `Sfx`, `Voice`, `Music` (ducking, fades) |
| QA | `SafeZones` (prop `safeZones`), `FontGuard` |
