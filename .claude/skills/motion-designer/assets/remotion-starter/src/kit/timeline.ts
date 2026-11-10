/**
 * Timing comes from audio, never from hand-typed seconds.
 * VO-led films (the launch-film skill): captions.json from scripts/align_vo.py -> voice(captions, fps) -> cues by phrase id or by word.
 * Music-led ads (the motion-designer skill): beats.json from scripts/beat_grid.py or sound_kit.py bed -> beatGrid(beats, fps) -> bars and beats.
 * Change the audio, re-run the script, and every scene re-times itself.
 */

export type Word = {text: string; start: number; end: number};
export type Phrase = {id: string; text: string; start: number; end: number; words: [number, number]};
export type Captions = {
	fps?: number;
	duration: number;
	words: Word[];
	phrases: Phrase[];
	method?: string;
	source?: string;
};

const norm = (s: string) =>
	s
		.toLowerCase()
		.replace(/[‘’]/g, "'")
		.replace(/[^\p{L}\p{N}']+/gu, '');

export type Cue = {from: number; to: number; text: string};

/** Which spoken word: inside a phrase (`in`), the nth occurrence, or the first after a frame. */
export type WordScope = {in?: string; nth?: number; after?: number};

export const voice = (c: Captions, fps: number) => {
	const f = (s: number) => Math.round(s * fps);
	const phraseById = (id: string) => {
		const p = c.phrases.find((x) => x.id === id);
		if (!p) {
			throw new Error(`No phrase "${id}" in captions. Ids: ${c.phrases.map((x) => x.id).join(', ')}`);
		}
		return p;
	};
	const findWord = (word: string, a?: number | WordScope, afterArg?: number) => {
		const scope: WordScope = typeof a === 'object' ? a : {nth: a, after: afterArg};
		const nth = scope.nth ?? 1;
		const target = norm(word);
		const explicit = typeof a === 'object' || a !== undefined || afterArg !== undefined;
		if (!explicit) {
			// a word spoken twice must be named exactly, or a cue silently lands on the wrong one
			const ids = c.phrases.filter((p) => c.words.slice(p.words[0], p.words[1] + 1).some((w) => norm(w.text) === target)).map((p) => p.id);
			const count = c.words.filter((w) => norm(w.text) === target).length;
			if (count > 1) {
				throw new Error(`"${word}" is spoken ${count} times (in ${ids.join(', ')}). Say which one: vo.at('${word}', {in: '${ids[ids.length - 1]}'}) or vo.at('${word}', 2).`);
			}
		}
		const [lo, hi] = scope.in ? phraseById(scope.in).words : [0, c.words.length - 1];
		let k = 0;
		for (let i = lo; i <= hi; i++) {
			const w = c.words[i];
			if (scope.after !== undefined && f(w.start) < scope.after) continue;
			if (norm(w.text) === target && ++k === nth) return w;
		}
		throw new Error(`Word "${word}" (occurrence ${nth}${scope.in ? ` in "${scope.in}"` : ''}${scope.after !== undefined ? `, after frame ${scope.after}` : ''}) not found in captions`);
	};
	return {
		fps,
		captions: c,
		f,
		/** Total VO length in frames. */
		end: f(c.duration),
		/** A phrase by id: {from, to, text}. Ids come from the [id] prefixes in the script file (p1, p2... by default). */
		phrase(id: string): Cue {
			const p = phraseById(id);
			return {from: f(p.start), to: f(p.end), text: p.text};
		},
		/**
		 * Frame where a spoken word starts: vo.at('invoice'), vo.at('paid', {in: 'paid'}), vo.at('paid', 2),
		 * vo.at('on', 1, fromFrame). A word spoken more than once throws until you say which one.
		 */
		at(word: string, nthOrScope?: number | WordScope, after?: number) {
			return f(findWord(word, nthOrScope, after).start);
		},
		/** Frame where a spoken word ends (same arguments as at). */
		endOf(word: string, nthOrScope?: number | WordScope, after?: number) {
			return f(findWord(word, nthOrScope, after).end);
		},
		/** The words of a phrase with their frames, for word-by-word reveals synced to the voice. */
		wordsOf(id: string): Cue[] {
			const p = phraseById(id);
			return c.words.slice(p.words[0], p.words[1] + 1).map((w) => ({from: f(w.start), to: f(w.end), text: w.text}));
		},
		/** The phrase being spoken (or just spoken) at a frame, or null in leading silence. */
		phraseAt(frame: number) {
			let cur: Phrase | null = null;
			for (const p of c.phrases) {
				if (f(p.start) <= frame) cur = p;
			}
			return cur;
		},
		/** Speech intervals in frames, for ducking music under the voice. */
		speech(): {from: number; to: number}[] {
			return c.phrases.map((p) => ({from: f(p.start), to: f(p.end)}));
		},
	};
};
export type VoiceCues = ReturnType<typeof voice>;

export type Beats = {
	bpm: number;
	offset?: number;
	beatsPerBar?: number;
	/** Detected beat times in seconds (beat_grid.py). When present they win over the bpm grid. */
	beats?: number[];
	/** Bars of music in the track (sound_kit.py bed writes it). */
	bars?: number;
	duration?: number;
};

export const beatGrid = (b: Beats, fps: number) => {
	const spb = 60 / b.bpm;
	const bpb = b.beatsPerBar ?? 4;
	const offset = b.offset ?? 0;
	const beatSec = (n: number) => (b.beats && b.beats[n] !== undefined ? b.beats[n] : offset + n * spb);
	const beatFrame = (n: number) => Math.round(beatSec(n) * fps);
	const trackBars = b.bars ?? Math.floor((b.beats?.length ?? Math.floor(((b.duration ?? 0) - offset) / spb + 1e-6)) / bpb);
	return {
		bpm: b.bpm,
		fps,
		beatsPerBar: bpb,
		/** Whole bars of music in the track. */
		trackBars,
		framesPerBeat: spb * fps,
		framesPerBar: spb * bpb * fps,
		/** Frame of beat n (0-based, counting from the first downbeat). */
		beat: beatFrame,
		/** Frame of bar n, optionally a beat inside it (bar(2, 1) is the second beat of the third bar). Halves work: bar(2, 1.5). */
		bar(n: number, beatInBar = 0) {
			const whole = Math.floor(beatInBar);
			const frac = beatInBar - whole;
			const base = beatFrame(n * bpb + whole);
			return frac === 0 ? base : Math.round(base + frac * spb * fps);
		},
		/** Frames of every beat from bar a (inclusive) to bar b (exclusive). */
		beatsIn(a: number, z: number) {
			const out: number[] = [];
			for (let i = a * bpb; i < z * bpb; i++) out.push(beatFrame(i));
			return out;
		},
		/** Total frames for n bars. */
		bars(n: number) {
			return beatFrame(n * bpb);
		},
	};
};
export type BeatGrid = ReturnType<typeof beatGrid>;
