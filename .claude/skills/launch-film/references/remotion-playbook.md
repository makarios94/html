# Remotion playbook

1. Project anatomy
2. Commands
3. How a film is built
4. Kit reference
5. Writing a scene
6. Aspect ratios and safe zones
7. Fonts
8. Logos, images and video
9. Rendering
10. Performance
11. Determinism
12. Gotchas
13. Check the API before you use it
14. Licence

---

## 1. Project anatomy

`python scripts/new_project.py <dir> --name "Coridr launch" --format vo --brand coridr` creates:

```text
<project>/
  package.json, tsconfig.json, remotion.config.ts   (Remotion 4.0.541, React 19, pinned)
  src/index.ts, src/Root.tsx                         registers every film in every aspect, plus cover stills
  src/kit/                                           the motion kit (skill-owned; --sync replaces it)
  src/films/index.ts                                 which films exist
  src/films/<id>/                                    YOUR film
    config.ts   ID, NAME, FPS, ASPECTS, asset(), the cues (vo / B), DURATION
    theme.ts    brand tokens and fonts (FONTS)
    Logo.tsx    Mark and Logo (from a brand pack, or the example's placeholder)
    Film.tsx    scenes, captions, audio
    script.txt  the VO script, one caption phrase per line
    data/       captions.json (+ .srt, .vtt) and score.json
  src/films/example-launch/                          the reference film (Paidly), kept for comparison
  public/sfx/                                        synthesized SFX kit
  public/films/<id>/                                 vo.wav, music.wav, images
  out/                                               previews, stills, stems, qa
  final/                                             what you deliver
```

Your film starts as a copy of the matching example, so it renders on minute one. Replace, in order: `theme.ts`,
`Logo.tsx`, `script.txt` and the VO (or the track and `beats.json`), then the scenes in `Film.tsx`.

More films in the same project (a cutdown, a variant): `new_project.py <project> --add "Coridr 15s" --format copy:<id>`.
Refresh an old project's kit: `new_project.py <project> --sync` (your films are untouched; run `npx tsc --noEmit` after).

## 2. Commands

Run from the project folder.

```bash
npx tsc --noEmit                                                        # type errors before any render
npx remotion studio                                                     # interactive preview in the browser
node tools/stills.mjs out/frames CoridrLaunch-9x16:20:hook CoridrLaunch-16x9:640:flag   # many stills, one bundle
node tools/stills.mjs out/safe CoridrLaunch-9x16:300 --props=out/props_safe.json          # with {"safeZones":true}
npx remotion still CoridrLaunch-9x16 out/frames/hook.png --frame=20    # a single still (bundles every call)
npx remotion still CoridrLaunch-Cover-9x16 final/cover_9x16.png        # the cover (the film frozen at coverFrame)
npx remotion render CoridrLaunch-9x16 out/preview.mp4 --scale=0.5 --image-format=jpeg  # fast preview
npx remotion render CoridrLaunch-9x16 out/raw_9x16.mp4                 # final quality (png frames, bt709)
npx remotion render CoridrLaunch-9x16 out/part.mp4 --frames=300-420    # just one scene
python <skill>/scripts/finish.py finals . CoridrLaunch final --aspects 9x16,4x5,16x9 --clean 4x5,16x9   # every deliverable
```

Composition ids are `<NAME>-<aspect>` and `<NAME>-Cover-<aspect>`. A cover is a composition as long as its film, frozen
at `coverFrame` (Remotion clamps every frame to its composition's range, so a 1-frame still could only ever show frame
0); `remotion still` renders its frame 0, which shows `coverFrame`. Use `tools/stills.mjs` for style frames and review
rounds: it bundles once, so 8 stills take about 20 s here instead of about 20 s each. The entry point is set in
`remotion.config.ts`, so commands take the composition id directly. On this machine a full-size 28 s vertical film
renders in a few minutes; the half-scale preview in about 1.5.

## 3. How a film is built

- **`config.ts`** turns audio into cues. Voice-led: `export const vo = voice(captions, FPS)` and
  `P = {hook: vo.phrase('hook'), ...}`. Music-led: `export const B = beatGrid(beats, FPS)`. `DURATION` comes from the
  audio (`vo.end + TAIL`, or `B.bars(n) + tail`), never typed.
- **`Film.tsx`** wraps everything in `<FilmShell theme fonts props>` (theme, stem routing, FontGuard, safe-zone
  overlay), places scenes with `<Show from to>` windows, then `<CaptionTrack>`, `<Voice>`, `<Music>`, `<Grain>`.
- **`Show` uses absolute time.** Inside a scene every frame number is the film's real frame, so cues plug in directly:
  `at={vo.at('invisible') - LEAD}`, `at={B.bar(3, 2)}`. Show stays mounted (hidden) for 60 frames after `to` so sounds
  that began in the scene finish. Use `z` when a scene must sit over the previous one (a circle flood).
- `Sequence` re-bases time to 0. Use it only for something reused at several points or for video clips, and then
  convert cues (`cue - sequenceFrom`).
- **Props** (`FilmProps`): `stem` (all, vo, music, sfx, none), `captions` (burned in or clean), `safeZones` (QA overlay).

## 4. Kit reference

Everything imports from `../../kit`. Sizes are design px (as if the short side were 1080) and scale with `u`.

**Timing and motion**
- `voice(captions, fps)`: `.phrase(id)` {from, to, text}, `.at(word)`, `.at(word, {in: 'phraseId'})`, `.at(word, 2)`
  (second occurrence), `.at(word, 1, afterFrame)`, `.endOf(...)` (same arguments), `.wordsOf(id)` [{from, to, text}],
  `.phraseAt(frame)`, `.speech()` (intervals for ducking), `.end`. A word spoken more than once throws until you say
  which one, naming the phrases it is in: an unscoped "every" once put a CTA 2 s early in a test film.
- `beatGrid(beats, fps)`: `.beat(n)`, `.bar(n, beatInBar?)` (fractional beats allowed), `.beatsIn(a, z)`, `.bars(n)`,
  `.framesPerBeat`, `.framesPerBar`, `.trackBars` (whole bars of music in the track).
- `ease.{out, soft, inOut, in, draw, linear}`, `prog(frame, at, dur, easing)`, `springAt(frame, fps, at, config)`,
  `enterProgress`, `MOTION[personality]`, `readFrames(text)`, `drift`, `wobble`, `rand(seed, min, max)`, `sec(s)`.
- `useLayout()`: `width, height, shape, isVertical, isWide, u, safe, inner, stage, textW, cx, cy,
  pick({vertical, wide}, fallback)`. `stage` {x, y, w, h, cx, cy} is the safe area minus the caption band: where
  product UI belongs.
- `useTheme()`, `useMotion()`, `alpha(color, a)` (a theme colour at an opacity: `alpha(t.colors.brand, 0.12)`).
- `waitForFont(family, fonts, weight?)`, `waitForFontsToSettle()`: for anything that measures text (web faces join
  `document.fonts` only once their file arrives, so `document.fonts.ready` can resolve too early).

**Components** (main props)
- `Reveal` at, kind (rise, drop, fromLeft, fromRight, pop, scale, blur, fade, mask), dur, distance, exitAt, exitKind, sfx,
  fade (`false` keeps a solid object solid as it travels in: a phone rising over text is otherwise see-through at first).
- `KineticText` text (`*emphasis*`, `\n`), at, by (word, char, line), kind (+ mask, type), stagger, wordFrames, size,
  weight, font, color, align, maxWidth (defaults to the safe width), fit (default on: if one word, or an emphasis
  group with its decoration, is wider than maxWidth, the whole block is set smaller until it fits, measured once the
  brand font is in), emphasis {color, weight, font, italic, decoration (underline, highlight, circle, strike),
  decorationColor, decorationAt, decorationSfx, seed}, exitAt, sfx. A circle leans away from neighbouring lines; in a
  tight stack it still reads best on a line of its own.
- `Counter` from, to, at, dur, decimals, prefix, suffix, separator, size, ticks.
- `DrawPath` d, w, h, at, dur, stroke, strokeWidth, fill, eraseAt; presets `ScribbleUnderline`, `Swoosh`, `HandCircle`,
  `Strike`, `Check`, `Arrow` (x1, y1, x2, y2, bend). Path generators in `paths.ts`.
- `Card` w, h, pad, radius, bg, border, shadow, dark. `Pill` label, icon, at, kind, exitAt, bg, color, size, sfx, pitch.
  `Button` label, icon, variant, pressAt, full. `Avatar` name, src, size, mono. `Marker` at, color.
- `Stage3D`, `Tilt` pose (POSES: flat, desk, deskRight, float, floatRight, hero, lean, or numbers), to, from, dur, blur,
  opacity, perspective, fill (`false` inside flex rows and columns, so it takes part in the layout). `Camera` from, dur,
  scale [a, b], x, y. `SafeStage` captions, align: a box at `useLayout().stage` that centres product UI inside the
  safe zone and above the caption band (vertical feeds keep more room on the right, so the frame's centre is wrong).
- `PhoneFrame` w, screenBg, statusDark, time. `BrowserFrame` w, h, url, dark. Device and OS chrome (these two and
  `Notification`) stays neutral on purpose, as real hardware does; captions, avatars, cursor and taps follow the theme.
- `Typewriter` text, at, cps, caret, caretUntil, placeholder, sfx. `Field` value, placeholder, typeAt, blurAt (chain
  it to the next field's typeAt: one caret at a time), w, icon. `Cursor` path
  [{f, x, y}], clicks. `Tap` x, y, at. `ListStack` rows [{left, title, meta, right}], at, rowFrames, w, rowH, dark,
  highlight {index, at, badge}, sfx. `Notification` at, app, icon, title, body, w, dark, sfx.
- `Backdrop` color, glow {color, x, y, size, opacity, breathe}, vignette, grid. `Grain` opacity. `Sheen` at.
  `Float` amp, period.
- `FloatingProps` items [{node, x, y (fractions of the frame), size, rotate, delay}], at, exitAt, sfx, seed.
  `TileWall` cols, rows, tile, fromScale, toScale, dur, hero {col, row, at, label}, renderTile, mono.
- `Sticker` kind, size, edge, shadow, tint, draw: props drawn in code as die-cut stickers, free and crisp at any size.
  Kinds: cake, doughnut, croissant, cupcake, cookie, roll, loaf, avocado, tomato, lemon, carrot, egg, cheese, baguette,
  grapes, banana, and tintable bag, parcel, heart, star, coin. `edge={false} shadow={false}` for thumbnails inside UI.
  Your own: `<Sticker draw={(c) => <path d=... {...paint(c, '#E2412E')} />} />` with `paint`, `ink` and `detail`
  (a 200 x 200 box; the silhouette pass makes the white edge). These are the free route for final props; emoji are
  for drafts only.
- `CircleReveal` at, dur, x, y. `WipeReveal` at, dur, angle, feather (soft edge, percent). `PushIn` at, from. `Flash` at.
- `MorphBox` at, dur, from / to {x, y (centre, design px from frame centre), w, h, radius, color, opacity, rotate},
  fromContent, toContent: one box becomes another (match moves).
- `CaptionTrack` captions, mode (phrase, karaoke), variant (dark, light, brand, glass, or a function of the frame; all
  from theme tokens, so a navy-derived night world gets navy pills), pill {bg, fg, border} to override, hide [ids],
  size, lift, maxChars (a phrase too long for one line splits into the fewest, most even word-timed chunks, at a comma
  when there is one, never leaving a short word alone).
- `LogoReveal` mark, wordmark, style (focus, build, pop), size. `EndCard` logo, line, lineAt, cta, ctaAt, pill colours.
- `Sfx` name, at, volume, lead, pitch. `Voice` src. `Music` src, at, volume, duckUnder, duckTo, fadeIn, fadeOut,
  endAt (two beds crossfade at a world change), trimBefore.
- `SafeZones` (via the `safeZones` prop), `FontGuard` (via FilmShell: `fonts` must load, `glyphs` must be drawable,
  and every frame's on-screen text is scanned: any non-ASCII character a face cannot draw puts a red banner on exactly
  the frames that show it, "DM Sans has no ✓ ₦ (on screen)". Emoji and generic fallbacks are skipped).
- `lucide-react` icons are installed: `import {Send, Search} from 'lucide-react'`, sized `size={30 * u}`.

## 5. Writing a scene

```tsx
// 4. The turn: a quiet setup line and one huge statement, synced to the voice, one impact.
const Turn: React.FC = () => {
  const t = useTheme();
  const L = useLayout();
  const w = vo.wordsOf('turn');                              // [{from, to, text}] for "Chasing payments is a second job."
  const small = w.slice(0, 3).map((x) => x.from - LEAD);
  const big = w.slice(3).map((x) => x.from - LEAD);
  return (
    <Backdrop color={t.colors.night} glow={{color: 'rgba(255,255,255,0.07)', y: 0.4}} vignette={0.5}>
      <Camera from={P.turn.from} dur={P.reveal.from - P.turn.from + 20} scale={[1, 1.06]}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18 * L.u}}>
          <KineticText text="Chasing payments is" at={small[0]} wordFrames={small} size={64} weight={500} color={t.colors.nightMuted} />
          <KineticText text="a second job." at={big[0]} wordFrames={big} kind="blur" size={L.pick({vertical: 168, wide: 200}, 180)} weight={700} />
        </AbsoluteFill>
      </Camera>
      <Sfx name="impact" at={vo.at('second') - 1} volume={0.4} />
    </Backdrop>
  );
};
// in Film: <Show from={P.turn.from - LEAD} to={P.reveal.from + 14}><Turn /></Show>
```

Pattern: one component per storyboard row, a comment naming the beat, cues from config, sizes from `pick`, sound
inside the scene that makes it.

## 6. Aspect ratios and safe zones

One film renders in every aspect listed in `config.ts` (`ASPECTS`): `9x16` 1080x1920, `4x5` 1080x1350, `1x1` 1080x1080,
`16x9` 1920x1080. Layout adapts through `useLayout()`: `pick({vertical, wide}, fallback)` for sizes, `isWide` for
side-by-side versus stacked arrangements. Check every aspect on a still before rendering it: a layout that works on
vertical can collide on square.

House safe zones (design px): vertical top 250, bottom 440, left 72, right 150 (handle, caption and buttons live there);
portrait, square and wide about 72 to 112 all round. Render a still with `safeZones: true` and look: key text and the
product inside the dashed line; nothing important under the bottom band on vertical.

## 7. Fonts

- Google Fonts: `import {loadFont} from '@remotion/google-fonts/DMSans'` then
  `loadFont('normal', {weights: ['400', '600'], subsets: ['latin', 'latin-ext']}).fontFamily`. Load only the weights you use.
  `latin-ext` carries the naira sign (₦) and most West African letters; add `vietnamese` where a face has it for Yoruba
  dot-below vowels (ẹ, ọ). Render a still with the real names to prove the glyphs.
- Local or licensed files: put them in `public/fonts/` and use `@remotion/fonts`:
  `loadFont({family: 'Brand Sans', url: staticFile('fonts/BrandSans-Bold.woff2'), weight: '700'})`.
- List every family in `FONTS`; FontGuard paints a red "FONT PROBLEM" banner on every frame when one is missing, so
  a fallback can never slip into a final. A banner means fix the load (name, weight, network), never ship it.
- A subset's range is not a promise the face has the glyph. List the special characters each face must draw in
  `GLYPHS` (`{[body]: '₦', [display]: 'ẹọṣ'}`) and pass it to `FilmShell`: FontGuard measures each character against
  two fallbacks and banners any face that cannot draw it. Tested on Google Fonts: Inter, Inter Tight, Plus Jakarta Sans
  and Saira draw ₦ (Inter and Saira also ẹ ọ ṣ with the vietnamese subset); DM Sans draws none of ₦ ẹ ọ ṣ; JetBrains
  Mono draws ẹ ọ but not ₦ or ṣ. For brand files on disk, `python scripts/glyph_check.py font.ttf "₦ẹọṣ"`.
- Fonts load from the network at render time: offline machines need the local-file route.

## 8. Logos, images and video

- Logos: inline SVG from the official file (copy the path data, as the Coridr pack does). Never redraw, recolour outside
  the brand's own variants, or distort a mark.
- Images: put them in `public/films/<id>/` and render with `<Img src={staticFile(asset('x.png'))} />` (Img waits for
  the load). Props for finals: generated 3D renders with the background removed (creative connector image models plus
  background removal), or a licensed set.
- Video clips (screen recordings, B-roll): `import {Video} from '@remotion/media'` inside a `Sequence`, with
  `trimBefore`/`trimAfter` in frames. Convert phone or variable-frame-rate recordings first:
  `ffmpeg -i in.mov -vf "fps=30,scale=1080:-2" -c:v libx264 -crf 17 -pix_fmt yuv420p -an clip.mp4`.

## 9. Rendering

- **Style frames first:** `npx remotion still` at full size for the hook, the turn, one product frame and the end
  card. Look at each at 100 percent before animating further.
- **Style frames without a project** (a plan-only request): write the frame as an HTML page (brand fonts from the
  design system or Google Fonts, tokens as CSS variables) and screenshot it with the installed Chrome:
  `"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --hide-scrollbars --window-size=1080,1920 --screenshot=C:\path\frame.png file:///C:/path/frame.html`.
  Rebuild them in Remotion once the film is a go.
- **Previews:** `--scale=0.5 --image-format=jpeg` (about four times faster), then `qa.py`.
- **Finals:** the defaults in `remotion.config.ts` (png frames, bt709, CRF 18, H.264, yuv420p), one render per aspect,
  then `finish.py` for audio and `qa.py --expect WxH` on each file.
- **Stems:** `finish.py stems` (see audio-vo-captions section 10).
- **Audio-only codecs** exist: `--codec=wav|mp3|aac`. `--separate-audio-to` writes the mix beside the video.
- **Partial renders:** `--frames=a-b` to re-check one scene fast.

## 10. Performance

- Prefer `transform` and `opacity`; blur and big shadows on large layers cost the most. Keep `blur` under about 12 px.
- `Grain` (an SVG noise filter over the frame) adds render time; drop it for previews if renders crawl.
- Memoise expensive work (`useMemo` for path lengths, text parsing); keep per-frame code pure arithmetic.
- `--concurrency` sets how many frames render in parallel; lower it if the machine runs out of memory, raise it on a
  big machine.

## 11. Determinism

Frames render in parallel and out of order, so every frame must be a pure function of its frame number:
- `rand(seed)` or Remotion's `random(seed)`, never `Math.random()`; no `Date.now()`.
- No CSS transitions, CSS keyframe animations or animated GIFs: drive everything from `useCurrentFrame()`.
- No state that accumulates across frames.

## 12. Gotchas

- `Audio`/`Video` come from `@remotion/media`; the core `Audio` is deprecated (renamed `Html5Audio`).
- A missing file in `public/` fails the render with a 404: check `asset()` paths and that `public/sfx/` exists
  (`new_project.py --sync` regenerates it).
- Frame 0 must show the hook: give the first element an `at` below zero so it has already landed.
- JSON imported into config needs a cast (`captions as Captions`, `beats as Beats`).
- The name `R` is a PowerShell alias (Invoke-History) and PowerShell strips quotes from inline JSON arguments: use
  props files and plain function names in scripts.
- The bundled headless browser downloads on first render (internet once). If that fails, `new_project.py` retries with
  the installed Chrome or Edge and saves `Config.setBrowserExecutable(...)`.
- WebGL transitions may need `--gl=angle` on Windows.
- Nested 3D: `Tilt` applies its own `perspective()`, so it stays 3D at any depth; plain wrappers between a `Stage3D`
  and a rotated child would otherwise flatten it.
- `useVideoConfig().durationInFrames` inside a `Show` is the whole film's length; pass scene lengths explicitly.
- Colours in scenes come from the theme (`t.colors.*`, `alpha(...)`), never typed hex or rgba: films start as copies
  and get re-skinned by brand packs, and a typed white on a lime brand becomes unreadable (tested: the Ground Up skin).
  Text on a brand fill uses `onBrand`.
- `Tilt` is a full-frame layer by default; inside a flex row or column pass `fill={false}` or it ignores the layout.
- **Overlapping `Show` windows and opaque grounds.** When the next scene's window opens a few frames early (for its
  entrance), its own opaque `Backdrop` hides the outgoing scene's exit and can leave empty frames (tested: 7 blank
  frames in a bakery ad). Give scenes that overlap one shared ground (a `Backdrop` in its own `Show` under them) and keep
  the scenes transparent; only a scene meant to cover (a `CircleReveal` flood, a wipe,
  an end card) brings its own ground.
- A `<Freeze>` cannot reach past the end of its composition (frames are clamped to the composition's range): to hold
  a late frame in a short composition, drive the component from a time value instead (the Coridr `Lockup` does).
- `console.warn` from the kit (a fitted headline, a font problem) shows in the Studio console and in renders with
  `--log=verbose`.

## 13. Check the API before you use it

Remotion moves fast. When a prop or export is in doubt, read the installed types instead of guessing:
`node_modules/remotion/dist/cjs/index.d.ts`, `node_modules/@remotion/<pkg>/dist/**/*.d.ts`, and
`npx remotion render --help`. Then run `npx tsc --noEmit`.

## 14. Licence

From the installed `node_modules/remotion/LICENSE.md`: Remotion is free (including commercial work) for individuals,
for-profit organisations with up to 3 employees, non-profits, and evaluation. Larger for-profit companies need a
company licence (remotion.pro). Check the user's company size once and say so if a licence is needed.
