import React, {createContext, useContext} from 'react';
import {interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';

/**
 * Sound is attached to motion: a component that animates also places its own sound, so timing
 * changes never break sync. The `stem` prop on a film decides what plays, so the same composition
 * renders the full mix for previews and isolated stems (vo, music, sfx) for the final mix:
 *   npx remotion render Film-9x16 out/stems/sfx.wav --codec=wav --props="{\"stem\":\"sfx\"}"
 */
export type Stem = 'all' | 'vo' | 'music' | 'sfx' | 'none';

const StemCtx = createContext<Stem>('all');
export const StemProvider: React.FC<{stem: Stem; children: React.ReactNode}> = ({stem, children}) => (
	<StemCtx.Provider value={stem}>{children}</StemCtx.Provider>
);
export const useStem = () => useContext(StemCtx);
const plays = (stem: Stem, kind: 'vo' | 'music' | 'sfx') => stem === 'all' || stem === kind;

/** The bundled kit (scripts/sound_kit.py kit public/sfx). Durations in seconds, used to land risers on their hit. */
export const SFX_KIT = {
	pop: 0.16,
	'pop-high': 0.16,
	'pop-low': 0.16,
	tap: 0.07,
	click: 0.08,
	tick: 0.035,
	'tick-soft': 0.035,
	'type-1': 0.075,
	'type-2': 0.075,
	'type-3': 0.075,
	'type-4': 0.075,
	whoosh: 0.45,
	'whoosh-long': 0.9,
	swish: 0.22,
	riser: 1.5,
	'riser-short': 0.8,
	impact: 0.9,
	boom: 1.4,
	chime: 1.8,
	ding: 0.7,
	success: 0.6,
	sparkle: 0.6,
	card: 0.2,
	thud: 0.28,
	send: 0.52,
	nope: 0.42,
	glitch: 0.32,
	swell: 1.2,
} as const;
export type SfxName = keyof typeof SFX_KIT;
const ENDS_ON_HIT: SfxName[] = ['riser', 'riser-short', 'swell'];

type SfxProps = {
	name: SfxName | string;
	/** The frame the sound belongs to: the landing, the click, the hit. */
	at: number;
	volume?: number;
	/** Start this many frames early (whooshes lead their move by 3 to 5 frames). */
	lead?: number;
	/** Pitch multiplier (1 = as recorded). Small variations (0.9 to 1.12) stop repeated pops sounding mechanical. */
	pitch?: number;
	/** Folder under public/ holding the file. */
	dir?: string;
};

/** One sound effect. Risers and swells END on `at` (their hit) automatically. */
export const Sfx: React.FC<SfxProps> = ({name, at, volume = 0.45, lead = 0, pitch = 1, dir = 'sfx'}) => {
	const stem = useStem();
	const {fps} = useVideoConfig();
	if (!plays(stem, 'sfx')) return null;
	const dur = (SFX_KIT as Record<string, number>)[name];
	const endsOnHit = ENDS_ON_HIT.includes(name as SfxName);
	const from = Math.round(at - lead - (endsOnHit && dur ? dur * fps : 0));
	return (
		<Sequence from={from} layout="none" name={`sfx ${name}`}>
			<Audio src={staticFile(`${dir}/${name}.wav`)} volume={volume} toneFrequency={pitch === 1 ? undefined : pitch} />
		</Sequence>
	);
};

/** The voiceover track. */
export const Voice: React.FC<{src: string; at?: number; volume?: number}> = ({src, at = 0, volume = 1}) => {
	const stem = useStem();
	if (!plays(stem, 'vo')) return null;
	return (
		<Sequence from={at} layout="none" name="voiceover">
			<Audio src={staticFile(src)} volume={volume} />
		</Sequence>
	);
};

type MusicProps = {
	src: string;
	at?: number;
	volume?: number;
	/** Speech intervals in composition frames (voice(...).speech()); the bed dips under them. */
	duckUnder?: {from: number; to: number}[];
	/** Multiplier while ducked: 0.5 is about -6 dB, 0.35 about -9 dB. */
	duckTo?: number;
	/** Frames to dip before speech starts and to recover after it ends. */
	attack?: number;
	release?: number;
	fadeIn?: number;
	fadeOut?: number;
	/**
	 * Stop the bed here, fading out over `fadeOut` frames (default: the end of the film). Two beds crossfade at a
	 * world change: the problem bed ends at the reveal, the brand bed starts there with a fadeIn.
	 */
	endAt?: number;
	/** Skip this many frames of the source (for starting a track on its downbeat). */
	trimBefore?: number;
};

/** The music bed, with deterministic ducking under the voice and fades. */
export const Music: React.FC<MusicProps> = ({
	src,
	at = 0,
	volume = 0.5,
	duckUnder,
	duckTo = 0.45,
	attack = 6,
	release = 14,
	fadeIn = 0,
	fadeOut = 24,
	endAt,
	trimBefore,
}) => {
	const stem = useStem();
	const {durationInFrames} = useVideoConfig();
	if (!plays(stem, 'music')) return null;
	const end = endAt ?? durationInFrames;
	const volumeAt = (f: number) => {
		const abs = f + at;
		let v = volume;
		if (fadeIn > 0) v *= interpolate(abs, [at, at + fadeIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		if (fadeOut > 0) v *= interpolate(abs, [end - fadeOut, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		if (duckUnder && duckUnder.length) {
			let duck = 1;
			for (const s of duckUnder) {
				const d = interpolate(abs, [s.from - attack, s.from, s.to, s.to + release], [1, duckTo, duckTo, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				duck = Math.min(duck, d);
			}
			v *= duck;
		}
		return v;
	};
	return (
		<Sequence from={at} durationInFrames={Math.max(1, end - at)} layout="none" name="music">
			<Audio src={staticFile(src)} volume={volumeAt} trimBefore={trimBefore} />
		</Sequence>
	);
};
