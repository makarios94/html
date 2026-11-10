# Audio, voiceover and captions

1. Audio first
2. Where the voice comes from
3. Directing the read
4. Recording a human read
5. Cleaning a read
6. Timing with align_vo.py
7. Captions
8. Music
9. Sound effects
10. Mixing and mastering
11. Muted and unmuted

---

## 1. Audio first

Lock the clock before you animate. In a voice-led film the voice is the timeline; in a music-led ad the beat grid is.
Every scene cue is a phrase id, a word or a bar, so when the take or the track changes you re-run one script and the
whole film re-times. Animating to typed seconds and then "fixing the timing" afterwards is how pieces end up out of sync.

## 2. Where the voice comes from

Best first; take the first one available and name the choice in the delivery note.

This user does not record their own voice ("I AM NOT RECORDING ANYTHING", 2026-11-08). Never recommend, offer or plan
around a self-recorded read: create the voice (route 2, a banked voice first) unless the user offers a recording or
hires a voice artist.

1. **A human read, only when the user offers one** (a recording they already have, or a voice artist they hire). The founder's own voice builds trust in early-stage B2B in a way
   a perfect synthetic voice cannot. Needs a script and a quiet room (section 4).
2. **ElevenLabs through the creative connector**, when the session has `creative_*` tools. Find a voice with
   `creative_list_voices` (filters: `languages`, `accent` with one language, `gender`, `age`, `use_cases` such as
   `advertisement` or `social_media`, `descriptives` such as `confident`, `calm`, `pleasant`, `professional`). Generate
   with `creative_generate_speech`, model `eleven_v4` (it reads inline direction tags like `[warmly]`), prompt = the
   spoken script from `python scripts/align_vo.py --script script.txt --print-spoken`. It renders two takes by default and
   spends credits. Get the chosen take's audio file into `public/films/<id>/vo.mp3` (the run's output URL, from
   `creative_get_flow` or the run status), then align it. The first time you do this on a machine, confirm the download
   path works before relying on it.
3. **Kokoro, a local neural voice: no queue, no credits** (Apache 2.0, runs on the CPU):
   `python scripts/tts_kokoro.py src/films/<id>/vo-direction.txt src/films/<id>/script.txt public/films/<id>/vo.wav --voice af_heart`.
   It reads the same direction file as the cloud voice and performs it in the edit: each line (or part of a line) at
   its own pace, register and level, joined with the pauses the tags ask for. Then `align_vo.py` and `vo_check.py` as
   usual. Tested on the Paidly script: with a detailed direction (a tag on most lines) `af_heart` and `am_fenrir` pass
   the delivery check; with a light direction they read flat, because Kokoro's own delivery barely moves and all the
   movement comes from the per-line edits, so give Kokoro a tag on most lines. It has no per-word stress (CAPITALS read as plain words), so it is the fallback when the cloud
   voice is busy or out of credits, not a replacement for a directed take or a human read. Setup, once (about 400 MB):
   `python -m venv <home>\venv`, then `<home>\venv\Scripts\python -m pip install kokoro-onnx soundfile`, and the model
   files `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx GitHub release `model-files-v1.0` into
   `<home>\models`. On this machine `<home>` is `C:\Users\User\Desktop\reel-studio\kokoro` (already set up);
   `check_env.py` reports it.
4. **Another TTS the user has access to** (their own API key), the same way.
5. **Scratch, local and free:** `powershell -ExecutionPolicy Bypass -File scripts/tts_local.ps1 -Script script.txt
   -Out public/films/<id>/vo.wav -Voice "Microsoft Zira Desktop" -Rate 1`. Robotic, so it is for timing drafts and
   animatics; it writes exact word timings (`vo.wav.words.json`). Replace it before anything ships, or ship it only
   with the user's explicit OK.

Licences: check the plan behind a generated voice before it goes into a paid ad (ElevenLabs' free plan has licensed
output for non-commercial use with attribution; paid plans cover commercial use). Kokoro's weights are Apache 2.0.

Rules that hold on every route: never clone or imitate a real person's voice without their consent; disclose synthetic
voices where the platform requires it; choose an accent that fits the audience (a Nigerian English voice for a Nigerian
audience is a real option: search with `languages: ["en"]` and an accent filter).

## 3. Directing the read

Brief the voice like an actor, in one paragraph: who is speaking, to whom, in what situation, with what energy. For
example: "A calm founder talking to a busy agency owner at the end of a long day. Warm, unhurried, certain. A small
smile on the reveal. The last line slower and clear."

- Pace: 2.3 to 2.9 words per second (calm brands near 2.4), with a breath between lines (the script's line breaks
  become pauses).
- The turn line slower and lower; the brand name crisp; the CTA slowest of all, every syllable clear.
- For TTS, punctuation is direction: commas and full stops make pauses, an ellipsis makes a hesitation, `{display|spoken}`
  fixes pronunciation, eleven_v4 tags set delivery.
- Take at least two, and choose on intelligibility, whether it fits the word budget, and how the hero line lands.

## 3a. Performance: the read has to tell the story

A good launch film is told, not recited. Measured with `scripts/vo_check.py`, the Seeran narration spans 11.9
semitones, sets its lines 2.4 semitones apart in register (lower at the turn, brighter at the reveal), varies its
pace line to line, and runs about 3.1 words per second of speech time. The Windows scratch voice keeps every line
at the same height (0.6 semitones apart), pauses the same length after every line (0.6 to 1.05 s), rushes (3.8 words
per second) and holds one level (2 dB between lines). Listeners hear that as "wack" within two lines.

- **Write a performance script** (`vo-direction.txt`, beside `script.txt`): the same words, plus the delivery.
  `script.txt` stays the clean caption text; the direction file is what the voice model reads. The example film
  ships one; start from it.
- **One storyteller who keeps moving.** Smooth beats acted: give the read one held beat (around the turn) and let
  every other line run on into the next, with emphasis carried by pitch on one CAPITAL word per beat. A direction
  with a pause or a new emotion on every line came out halting (23 percent of the read in pauses, 2.1 words per
  second overall) and was rejected as needing more work; the same script directed to flow (five plain tags, two
  pauses) measured 15 percent pauses at 3.2 words per second of speech, with more melody than the Seeran narration,
  and with its gaps closed in the edit (section 6, `tighten_vo.py`) it is the read in the example film.
  `vo_check.py` flags HALTING above 20 percent pauses and SLOW below 2.3 words per second overall. A silence of 1.5 s
  or more between lines (a logo drawing in, set with `insert_pause.py`) counts as designed: vo_check sets it aside,
  names it on a SET ASIDE line, and measures the pauses and the pace without it. The banked reads' longest held beats
  run 0.45 to 1.02 s, so a gap that long in a raw take is a stall: tighten it.
- **Map the arc to the voice, lightly.** Hook: conversational and close. The low point: the same voice at full
  strength, the words carry it. The turn: serious, with a beat before and after it. The reveal: warm, a lift. The
  product: brighter, an easy rhythm. The close: warm and clear. Change a tag only where the delivery really changes.
- **No whisper unless the brief asks for one.** On eleven_v4, `[softly]` read the Paidly low point hushed: 2.7 dB
  under the lines around it and 8 semitones lower. The user heard it as a whisper and called it surplus to
  requirement. Keep the low point in the surrounding tag (`[conversational]`) and let a held beat after it do the work.
- **Tools on eleven_v4:** tags before the words they colour (`[warmly]`, `[tired]`, `[dryly]`, `[slowly]`,
  `[serious]`, `[confident]`, `[upbeat]`, `[happy]`; `[softly]` only for an intended hush), held until the next tag, so
  change them where the delivery changes; pauses as `[short pause]` (a breath), `[pause]` (a beat), `[long pause]`
  (the turn); ellipses to hold a thought; one CAPITAL word per line at most for the stressed word. Describe how a line
  is spoken, never what the speaker does.
- **Fix one line, keep the take.** When a take lands everywhere but one line (a whisper, a misread word, a flat
  button), re-read only that line in the same voice and tag (the Paidly pickup cost 51 credits a take against 412 for a
  full read) and splice it in: `python scripts/pickup_line.py public/films/<id>/vo.wav --captions
  src/films/<id>/data/captions.json --cue silence --take pick1.mp3 --take pick2.mp3`. It picks the take nearest the
  neighbouring lines in pitch, matches their level, swaps it in inside the pauses and moves the later captions. Then
  `align_vo.py` for exact word cues, `tighten_vo.py`, `vo_check.py`, and listen to the join.
- **Voice first.** Pick a narrator whose natural register fits before tuning words: `creative_list_voices` with
  `use_cases` advertisement or narrative_story and a search like "warm storytelling"; avoid announcer voices.
- **Cast for the market, and offer the other voice** (asked in gate 2's question card, the recommended voice first). A film for Nigerian buyers can be read by a Nigerian voice:
  `creative_list_voices` with `languages ["en"]` and `accent "nigerian"` (label `en-nigerian`; 18 library voices in
  November 2026, among them ad and storytelling voices of both genders), or a search for "Nigerian". A second voice of
  the other gender, or another accent, costs one more take and nothing else: the script, captions and picture stay;
  only `vo.wav`, `captions.json` and the score change, so render each as its own slug (`--slug <film>_female`). Send
  the same direction to every voice so the comparison is the voice, not the read. The ear decides an accent: no
  measurement here says whether one came through. The Paidly example has four kept voices on one script: Justin Case
  (the film), Nora (British, female), Sulbyee (Nigerian, male) and Pastie (Nigerian, female). Pastie measured just
  under the register floor and the user kept her by ear: the floors catch a flat read, the listener has the last word.
- **The voice bank** (`assets/voice-bank/`) holds those four reads: lossless audio, checked captions, the voice ID,
  measurements and the listener's verdict for each. `python scripts/voice_bank.py list` shows them; `use pastie
  <project>` puts one into the example film with its captions and rescores the music, so a client can hear every
  voice in picture before a credit is spent; `add` banks a new read once it is finished and kept. For a new script, a
  banked voice is a casting choice: take its voice ID and generate with the same direction approach.
- **Judge every take twice:** by ear when anyone can listen, and always by measurement:
  `python scripts/audition_vo.py take1.mp3 take2.mp3 --script src/films/<id>/script.txt --install public/films/<id> src/films/<id>/data`
  aligns each take, runs `vo_check.py` on it, ranks them and installs the best with its captions. The winner must say
  PERFORMS. A take that fails gets re-directed (more contrast between the lines' tags, a longer beat at the turn),
  not just re-rolled.
- **The scratch voice is a stopwatch.** Use it to time a draft; never send a film that carries it as a sample or a
  deliverable without saying so in the same message, with the route to a real read.
- **When the connector is busy or out of credits** (on a free plan, "free generations are busy" refuses the take and
  charges nothing; the connector asks for no second attempt in the same turn): say so in one sentence, build on the
  scratch read meanwhile so only the take is missing, and try again when the user says to. Kokoro (route 3) covers the gap until the connector frees up.

## 4. Recording a human read (only when the user offers one)

A phone voice memo is fine when the room is right: a small furnished room (a wardrobe full of clothes is ideal), phone
15 to 20 cm from the mouth and slightly off to the side, airplane mode on, 10 seconds of silence ("room tone") at the
start, each line read twice, peaks around -12 to -6 dBFS. Ask for WAV or the highest-quality setting the phone offers.
Send it as a document on WhatsApp, not as a voice note or a video (both get compressed hard).

## 5. Cleaning a read

With the creative connector: its Voice Isolator node removes background noise from a phone read. Locally:

```bash
ffmpeg -i raw.m4a -af "highpass=f=80,afftdn=nf=-40,deesser=i=0.4,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=3" -ar 48000 -ac 1 public/films/<id>/vo.wav
```

Always align the cleaned file (filters can shift timing by milliseconds; alignment after cleaning makes that harmless).

## 6. Timing with align_vo.py

```bash
python scripts/align_vo.py public/films/<id>/vo.wav --script src/films/<id>/script.txt --out src/films/<id>/data/captions.json
```

- Writes `captions.json` (words and phrases, in seconds) plus `captions.srt` and `captions.vtt`, and prints a phrase table:
  read it. Phrases under 0.6 s are flagged; a "LOW MATCH" note means the read differs from the script (fix the script to
  match the take, then re-run).
- Spelling comes from the script, timing from the audio, so brand names are always right in the captions.
- Timing sources, best first: `--words-from` (word timings you already have: `vo.wav.words.json` from tts_local, Scribe
  words from the connector, or a previous run's `captions.timing.json`), then whisper.cpp (found automatically on this
  machine; a few minutes on CPU), then an estimate.
- With a transcript or an estimate, the script's words are then placed one by one on the speech segments that ffmpeg
  finds between the read's pauses: each segment takes the run of words whose length fits it at the read's own pace,
  and a run prefers to end where readers pause (a full stop, a comma, the end of a caption line). So a caption line
  can be split across a pause, or share one breath with the next line, wherever the reader actually breathed. This
  replaced fitting whole phrases to segments, which had put "in your words," into the next caption 0.9 s early in
  the Paidly films v10 and v11 (that reader pauses after "schedule," and runs "in your words, and tells you" on),
  while whisper's own word times had drifted 2.8 s late by then. Where two captions share a breath, the break goes on
  the deepest dip between the last word of one and the first word of the next, searched across both estimates of the
  break (the placed one and the transcript's own) and 0.3 s beyond them, since both can sit early together (on
  Pastie's 15 s Coridr take both put "with" 0.3 s before it was said). The placed one alone had put the Coridr break
  where the "s" of "pass," begins, 0.25 s early, and with a stalled transcript on the "p" closure, 0.5 s early.
  Tested on three reads in two voices, one of them before and after tightening: every break on the waveform's own
  pause, no other edge moved. Exact word lists (`--words-from` a `.words.json`, or the list `insert_pause.py` shifted)
  keep their own times and are fitted whole phrase by phrase; where two lines share a breath, the break stays where
  the words put it. It used to be split by letter count, which put the break on Pastie's paused 30 s Coridr read
  0.25 s early, inside "pass," (tested on 20 word lists: the 14 from the Windows voice and Kokoro came out identical,
  and both breaks on that read went back onto its own pause). With music under the voice, or no pauses, few segments exist
  and the transcript's timings are kept: get a clean VO stem when you can.
- The phrase table flags any phrase that runs far off the read's own pace (under 0.6 or over 1.75 times the median
  letters per second; letters, because "Coridr. Application readiness." read at an ordinary speed measured 1.3 words
  a second and was flagged for nothing): a caption edge on the wrong pause looks exactly like that. Then hear it:
  `python scripts/check_captions.py public/films/<id>/vo.wav --captions src/films/<id>/data/captions.json` cuts every
  phrase out, transcribes them in one whisper run, scores what it heard against each caption (a brand name whisper
  spells its own way still counts) and flags any edge with two or more words heard on the wrong side of it, or one word
  heard only on the wrong side. One word heard on both sides, where two lines meet in a breath, is normal. A score
  alone would have passed the Paidly defect (0.62); the edge test flags it as three words early. The one-word test
  came from the Coridr read: "Every check runs in one pass," changed 0.5 s before "pass" was said and passed the
  two-word test. Slow on a CPU (15 to 35 s a phrase), so run it once on the final read of any
  film whose captions carry the story.
- whisper.cpp can stop transcribing after a long pause, and a directed read's held beat after the turn does exactly
  that (tested: the first ElevenLabs Paidly take lost every word after the turn, 29 of 63 words matched). When detected
  speech runs on past the transcript, `align_vo.py` transcribes the rest on its own and merges it (the same take then
  matched 59 of 63). Across a longer silence (1.5 s or more, a logo reveal) whisper can also keep going and stretch
  one line over it: on the Coridr read it spread "You're finding problems one at a time." over 15 s and never wrote
  the 34 words after the silence (32 of 66 matched). So the read is transcribed in pieces cut at every such silence,
  each starting 0.25 s before its speech (64 of 66 matched), and a piece whose last word runs over a second past its
  speech (whisper's timing derailed) is transcribed once more without the prompt. A "LOW MATCH" note still means:
  look at the phrase table before trusting it.
- Word cues inside a phrase are as good as their source. A TTS word list from the same audio (`tts_local.ps1`) lands
  every word on the frame (tested against hand-corrected cues: 66 of 66 words identical). Whisper words scatter more
  (tested: 2 to 3 frames on average, a few words up to 13): for a word-synced hero moment, check its strip, or take
  the cue from the phrase start. Where whisper stacks several words on one time (it does near the end of a file),
  those words are spread over the phrase's real speech by length. On the Coridr reads whisper's starts inside a
  breath ran late, 0.1 to 0.3 s on Sulbyee and up to 0.65 s on Pastie: her "Coridr" was heard at 16.20 s and said
  at 15.52 s, which would have landed the logo's letters after the name. So when a scene moves on single words, run
  `python scripts/word_starts.py public/films/<id>/vo.wav src/films/<id>/data/captions.json --write
  src/films/<id>/data/captions.json`: it keeps every phrase edge and places the words inside each breath on the waveform's own
  boundaries (speech after a silence, a stop's closure, the start of a hiss). Tested on 15 hand-measured starts in
  two voices: 13 within 0.1 s, two 0.12 and 0.20 s late. A vowel-initial little word run into the one before ("at" in
  "one at a time") has no boundary to find: time a move to the next word with a clear start, and land a quiet line
  (a category line under a logo) as one line.
- `[id]` prefixes in the script become cue names: `vo.phrase('turn')`. Words: `vo.at('invisible')`, inside a phrase
  with `vo.at('paid', {in: 'paid'})`, the nth occurrence with `vo.at('paid', 2)`, or the first after a frame with
  `vo.at('Paidly', 1, P.reveal.from)`. A word spoken twice throws until you say which one.
- **Close the slack between lines** (every read, before the music is scored):
  `python scripts/tighten_vo.py public/films/<id>/vo.wav --captions src/films/<id>/data/captions.json --gap 0.24`.
  An ad editor closes the gaps and keeps the longer silences where the story needs a beat. TTS and human reads both
  arrive looser: the smooth Paidly take had about 0.3 s between lines and 0.6 s either side of the turn (15 percent of
  the read in pauses). Every pause shrinks by one factor, chosen so the median lands on `--gap`; that keeps the rhythm
  (beats stay long, breaths stay short). Setting every gap to one length makes the pauses uniform, which `vo_check.py`
  flags as a machine read. `--keep CUE:SECONDS` pins one pause; pauses under `--floor`
  (0.15 s) are left alone. It cuts only true silence (45 dB under the read's speech level, with a margin at each
  edge), crossfades each cut, and shifts every caption by exactly what it removed (tested: identical to a fresh
  alignment within a millisecond), so nothing needs re-aligning. In place, the original is kept once as
  `vo.untightened.wav`. A gap that holds a breath is left whole, and a beat (a pause half again the median or longer)
  then ends at least 0.1 s longer than any such gap that was shorter in the read, so the beats stay the longest
  pauses: on Pastie's 30 s Coridr read the beat before the turn had come out 0.45 s, under breaths left whole at 0.49
  and 0.52 s, and now holds at 0.62 s (tested on ten reads: the other nine came out identical). Measure pauses on the
  dry read: under a music bed the silence is gone and whisper timings blur the gaps.
- **A longer pause in one place** (the silence after the turn while a logo draws, a breath before the address):
  `python scripts/insert_pause.py public/films/<id>/vo.wav src/films/<id>/script.txt --pause reveal:2.0 --words
  public/films/<id>/vo.wav.words.json`, then align as usual (`--words-from` the edited word list). It finds the real
  silence before each named line and lengthens it, shifting later word timings to match. Works on a human read too.
- After every new take, re-run it. Nothing else changes.

## 7. Captions

- **Phrase pills** (default for voice-led ads): `<CaptionTrack captions={vo.captions} hide={[...]} variant={...} />`.
  Hide the phrases a headline already shows on screen (the hook, the turn, the reveal, the CTA). Choose the variant per
  world so the pill always contrasts: `dark` on dark scenes, `brand` or `light` on light scenes. Text contrast at least
  4.5:1 against its pill.
- **Karaoke** (`mode="karaoke"`): the current word lit. For energetic social pieces, not for calm brands.
- **Size and length:** 42 to 46 design px on vertical, 34 to 40 on wide; one line per pill; about 38 characters (42 at
  most). Common subtitle guidance (for example Netflix's English guide) caps lines near 42 characters and adult reading
  speed near 20 characters per second; ad phrases sit well inside that.
- **Timing:** on screen 2 frames before the phrase, held until the next phrase or 14 frames past its end.
- **Position:** above the bottom safe edge, never over the subject or the product UI being read.
- **Files:** ship the `.srt` and `.vtt` for platforms that take caption uploads (YouTube, LinkedIn, Facebook) and for
  accessibility. Render a clean version (`--props` with `"captions": false`) for platforms that add their own.
- Proofread every caption against the script before the final render.

## 8. Music

- **Role.** Music-led: the lead and the clock. Voice-led: a bed, felt more than heard, ducked under the voice.
- **Choosing.** Upbeat motion ads sit at 100 to 128 BPM (120 gives clean 15-frame beats); voice-led beds at 80 to 100 BPM.
  Problem worlds want minor or tense; reveals want a lift (a new section, a brighter chord); the end card wants a
  resolved chord that rings.
- **Sources, best first:**
  1. A track the user has licensed for advertising (a stock library licence that covers paid ads, not only organic posts).
  2. Generated music through the creative connector: `eleven_music_v2_5` (set instrumental and the exact duration), or the
     Video to Music node on the silent cut so the score follows the edit. Check that the user's plan covers commercial use.
  3. A temp bed on the grid: `python scripts/sound_kit.py bed public/films/<id>/music.wav --bpm 120 --bars 8 --mood drive
     --key D --sections "0:intro,1:main,6:lift,7:outro"` (moods: pulse, warm, drive, tension, calm; sections: intro, main,
     lift, break, outro, stop). It writes the matching `music.beats.json`. The user's reel-editor already ships
     synthesized scores, so this can be final when the user accepts it; label it either way.
  4. No music: SFX-led sound design, a legitimate aesthetic for calm brands.
- **Score a voice-led film from its voice.** The swells a listener feels (the bed dropping away before the turn, a
  rise into the reveal, a resolved chord on the end card) only land when the music's sections are timed to the
  words, and a bed at a typed tempo lands them by luck: the first Paidly bed ran 92 BPM regardless of the voice, had
  no drop before the turn, and lifted 0.6 s after "Meet Paidly". Use
  `python scripts/score_beds.py src/films/<id>/data/captions.json public/films/<id> --turn turn --reveal reveal --cta cta [--lead 4]`:
  it solves both tempos from the captions so a problem bed (`tension`) drops to a bare pad 8 frames before the turn
  and goes silent, and a product bed (`warm`) rises out of that quiet with a riser peaking exactly on the reveal,
  lifts through the product world and lands its outro chord on the end card. It writes `data/score.json`, and the
  film places both beds from it (see `example-launch`). Re-run it after every new take, right after `align_vo.py`.
  Check it by eye: render the music and vo stems (`finish.py stems ... --stems music,vo --no-picture`) and plot their
  levels against the cues; the drop, the rise and the dips under every line should all be visible.
- **Never** a commercial song without a licence. In-app platform music libraries are usually licensed for organic
  posts only; check before using one in an ad.
- **Editing to music.** Cut on downbeats, put hits on accents, land the logo on the last chord. Start the track on a
  downbeat with `trimBefore`; fade the tail. `beat_grid.py --png` shows whether hits sit on the grid.

## 9. Sound effects

The kit (`public/sfx/`, made by `sound_kit.py kit`, peaks at -3 dBFS so volumes are comparable):

| Sound | For |
|---|---|
| `pop`, `pop-high`, `pop-low` | Pills, badges, props, words landing (vary them) |
| `tap`, `click` | Phone taps, mouse clicks, button presses |
| `tick`, `tick-soft` | Counters, clocks |
| `type-1` to `type-4` | Keystrokes (Typewriter cycles them) |
| `whoosh`, `whoosh-long`, `swish` | Cards and panels moving, camera pushes, fast swaps |
| `riser`, `riser-short`, `swell` | Builds into a reveal; they end on their hit |
| `impact`, `boom`, `thud` | The hero word, a hard cut, a heavy landing |
| `chime`, `ding`, `success`, `sparkle` | Resolution, notifications, done, the logo |
| `card`, `send`, `nope`, `glitch` | Paper and cards, sending, rejection, broken states |

Placement rules are in motion-language section 11. Voice-led films stay sparse (one sound per scene change and per key
event); music-led ads can be richer (a pop per beat-landing element). For a bespoke sound ("a paper invoice sliding on
a desk"), the creative connector's sound-effects model makes one from a description.

## 10. Mixing and mastering

House rules, shared with reel-editor (learned on real edits: the first mixes were too loud and distorted):

- **The voice leads.** Music and SFX sit about 15 LU under it; music dips 6 to 10 dB under speech (`Music duckUnder`).
  Duck once: the film's `duckUnder` follows the word cues and can dip just before speech, so `finish.py mix` adds no
  second duck by default (`--duck 8` only for music that never went through the film's `Music`).
- **No voice:** the music leads and SFX sit about 10 LU under it.
- **Mix in float through a limiter, then master with one static gain** to about -14 LUFS integrated, with the true peak
  at or under -1 dBTP measured on the encoded file. The AAC encode adds its own overshoot (a -1.5 dBFS sample limiter
  measured -0.4 dBTP after the encode in a test), so `finish.py` limits 4x oversampled, measures the encoded file and
  lowers the ceiling until it passes. No dynamic loudness normalisation: it re-lifts quiet passages and changes the mix
  you approved. Measure, never assume.
- **Stem levels are set per stem.** `mix` measures each stem as a whole, so a volume changed inside the film moves
  sounds against each other within that stem, not the stem against the voice: raising one swell made every other SFX
  1.2 dB quieter in a test mix. Set stem balance with `--under` and `--sfx-under`; set balance within a stem in the film.

Two routes:

1. **Quick** (previews, simple pieces): the film's own mix, then
   `python scripts/finish.py master out/raw.mp4 final/film_9x16.mp4`.
2. **Final** (anything with a voice): render stems from the same film and mix them by measurement.

```bash
# every deliverable in one go: stems once (the audio is the same in every aspect), a muted picture per aspect,
# clean versions without burned captions, the measured mix and master for each, then the covers
python scripts/finish.py finals <project> Film final --aspects 9x16,4x5,16x9 --clean 4x5,16x9
# a film with no voice
python scripts/finish.py finals <project> Film final --aspects 9x16 --stems music,sfx --lead music
# step by step, for one file
python scripts/finish.py stems <project> Film-9x16 <project>/out/stems
python scripts/finish.py mix <project>/out/stems/picture.mp4 <project>/final/film_9x16.mp4 --vo <project>/out/stems/vo.wav --music <project>/out/stems/music.wav --sfx <project>/out/stems/sfx.wav
```

Extra props (a phone number, a variant) go in a JSON file passed with `--props`; `finals` and `stems` merge it into
every render. (PowerShell strips the double quotes out of inline JSON, so always use a file.) To redo one stem:
`finish.py stems ... --stems sfx --no-picture`.

`finish.py mix` measures each stem, sets gains from the numbers, ducks the music under the voice with a sidechain
compressor, mixes in float through a limiter, masters, and copies the picture without re-encoding. Then `qa.py` must
show the loudness PASS. You cannot hear the mix, so look at it:
`ffmpeg -i final.mp4 -lavfi showspectrumpic=s=1600x400:legend=0 out/qa/spectrum.png` (the voice should sit as the
brightest band through every spoken line, with the music visibly lower) and say plainly in the delivery note that the
mix was checked by measurement, and invite the user to listen.

## 11. Muted and unmuted

Check the contact sheet with no audio: does the story read from the type and the pictures alone? Then check the
soundtrack adds feel without repeating the words on screen. A piece that only works with sound fails most viewers.
