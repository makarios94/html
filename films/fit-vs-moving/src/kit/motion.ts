import {Easing, interpolate, random, spring, SpringConfig} from 'remotion';
import {noise2D} from '@remotion/noise';

/**
 * Easing curves. `out` is the signature: it decelerates hard and lands without overshoot.
 * Entrances use out/soft, moves between two on-screen positions use inOut, exits use in.
 */
export const ease = {
	out: Easing.bezier(0.16, 1, 0.3, 1),
	soft: Easing.bezier(0.2, 0.75, 0.2, 1),
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
	in: Easing.bezier(0.7, 0, 0.84, 0),
	draw: Easing.bezier(0.45, 0, 0.25, 1),
	linear: Easing.linear,
};

export type Personality = 'calm' | 'crisp' | 'playful';

export type MotionSpec = {
	/** Spring used for entrances when the personality allows overshoot. */
	spring: Partial<SpringConfig>;
	/** Easing used when it does not. */
	ease: (t: number) => number;
	/** Default entrance length in frames (30 fps). */
	enter: number;
	/** Default exit length in frames. Exits run faster than entrances. */
	exit: number;
	/** Frames between siblings (words, list rows, pills). */
	stagger: number;
	/** Travel distance for rises and slides, in design px (1080 short side). */
	distance: number;
	/** true when entrances may overshoot (spring), false for strictly eased, no-bounce motion. */
	overshoot: boolean;
};

/**
 * Motion personalities. Pick the one that matches the brand, then stay inside it.
 * calm: B2B, finance, health, anything that must read as trustworthy. No bounce anywhere.
 * crisp: modern SaaS and product launches. Fast, confident, a hint of spring.
 * playful: consumer apps, food, lifestyle, music-led ads. Visible overshoot and bounce.
 */
export const MOTION: Record<Personality, MotionSpec> = {
	calm: {spring: {damping: 200, stiffness: 110, mass: 1}, ease: ease.out, enter: 22, exit: 12, stagger: 4, distance: 26, overshoot: false},
	crisp: {spring: {damping: 20, stiffness: 190, mass: 0.7}, ease: ease.out, enter: 15, exit: 9, stagger: 3, distance: 38, overshoot: true},
	playful: {spring: {damping: 10, stiffness: 165, mass: 0.8}, ease: ease.soft, enter: 16, exit: 9, stagger: 3, distance: 56, overshoot: true},
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Eased 0 to 1 progress of a beat that starts at `at` and lasts `dur` frames. */
export const prog = (frame: number, at: number, dur: number, easing: (t: number) => number = ease.out) =>
	interpolate(frame, [at, at + Math.max(1, dur)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing,
	});

/** Spring 0 to 1 that starts at `at`. Returns exactly 0 before `at`. */
export const springAt = (frame: number, fps: number, at: number, config?: Partial<SpringConfig>, durationInFrames?: number) =>
	frame < at ? 0 : spring({frame: frame - at, fps, config, durationInFrames});

/**
 * Entrance progress for a personality: a spring when overshoot is allowed, an eased ramp otherwise.
 * Can exceed 1 briefly for crisp and playful, which is what makes pops feel alive.
 */
export const enterProgress = (frame: number, fps: number, at: number, m: MotionSpec, dur?: number) =>
	m.overshoot ? springAt(frame, fps, at, m.spring, dur) : prog(frame, at, dur ?? m.enter, m.ease);

/** Seconds to frames. */
export const sec = (s: number, fps = 30) => Math.round(s * fps);

/** Minimum on-screen frames for text that has no voiceover carrying it: read it twice, never under 1 s. */
export const readFrames = (text: string, fps = 30) => {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.round(Math.max(1, 0.5 + words / 3) * fps);
};

/** Slow sine drift for ambient life. amp in design px (or degrees), period in frames. */
export const drift = (frame: number, amp = 6, period = 90, phase = 0) => Math.sin(((frame + phase) / period) * Math.PI * 2) * amp;

/** Organic wobble from simplex noise, -amp..amp. */
export const wobble = (frame: number, seed: string | number, amp = 1, speed = 0.012) => noise2D(seed, frame * speed, 0) * amp;

/** Deterministic random in [min, max). Never use Math.random in a composition: frames render in parallel. */
export const rand = (seed: string | number, min = 0, max = 1) => min + random(seed) * (max - min);

/** Combine a list of CSS transforms, skipping empty ones. */
export const tf = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ') || undefined;
