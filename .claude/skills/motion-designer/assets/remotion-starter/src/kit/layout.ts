import {useVideoConfig} from 'remotion';

export const ASPECTS = {
	'9x16': {width: 1080, height: 1920, label: 'Vertical 9:16 (Reels, TikTok, Shorts, Stories, WhatsApp Status)'},
	'4x5': {width: 1080, height: 1350, label: 'Portrait 4:5 (Instagram, LinkedIn and Facebook feeds)'},
	'1x1': {width: 1080, height: 1080, label: 'Square 1:1'},
	'16x9': {width: 1920, height: 1080, label: 'Landscape 16:9 (YouTube, LinkedIn, X, web, decks)'},
} as const;
export type AspectKey = keyof typeof ASPECTS;

export type Shape = 'vertical' | 'portrait' | 'square' | 'wide';

/**
 * House safe zones in design px (1080 short side). Conservative on purpose: vertical feeds put the
 * handle and caption at the bottom, action buttons on the right, and status UI at the top.
 * For paid placements, check the platform's current spec and tighten if needed.
 */
export const SAFE: Record<Shape, {top: number; bottom: number; left: number; right: number}> = {
	vertical: {top: 250, bottom: 440, left: 72, right: 150},
	portrait: {top: 72, bottom: 96, left: 72, right: 72},
	square: {top: 72, bottom: 88, left: 72, right: 72},
	wide: {top: 72, bottom: 84, left: 112, right: 112},
};

/** Room a caption pill takes above the bottom safe edge, in design px (CaptionTrack at its default size and lift). */
export const CAPTION_BAND: Record<Shape, number> = {vertical: 132, portrait: 124, square: 124, wide: 112};

export const shapeOf = (width: number, height: number): Shape => {
	const a = width / height;
	if (a < 0.7) return 'vertical';
	if (a < 0.95) return 'portrait';
	if (a <= 1.3) return 'square';
	return 'wide';
};

/**
 * Layout facts for the current composition. Every size in the kit is in design px (as if the short
 * side were 1080) and is multiplied by `u`, so one scene renders correctly at every aspect ratio.
 */
export const useLayout = () => {
	const {width, height} = useVideoConfig();
	const shape = shapeOf(width, height);
	const u = Math.min(width, height) / 1080;
	const s = SAFE[shape];
	const safe = {top: s.top * u, bottom: s.bottom * u, left: s.left * u, right: s.right * u};
	const inner = {x: safe.left, y: safe.top, w: width - safe.left - safe.right, h: height - safe.top - safe.bottom};
	const stageH = inner.h - CAPTION_BAND[shape] * u;
	return {
		width,
		height,
		shape,
		isVertical: shape === 'vertical',
		isWide: shape === 'wide',
		u,
		safe,
		inner,
		/** Where product UI belongs: the safe area minus the caption band, with its own centre (px). SafeStage uses it. */
		stage: {x: inner.x, y: inner.y, w: inner.w, h: stageH, cx: inner.x + inner.w / 2, cy: inner.y + stageH / 2},
		/** Widest centred text that clears the safe zone on BOTH sides (px). KineticText wraps to this by default. */
		textW: width - 2 * Math.max(safe.left, safe.right),
		/** Centre of the safe area (where the eye should land on vertical, slightly above frame centre). */
		cx: inner.x + inner.w / 2,
		cy: inner.y + inner.h / 2,
		/** Pick a value per shape: pick({vertical: 120, wide: 150}, 130). */
		pick<T>(by: Partial<Record<Shape, T>>, fallback: T): T {
			return by[shape] ?? fallback;
		},
	};
};
export type Layout = ReturnType<typeof useLayout>;

/** Type scale in design px. Hero is one or two words; caption is the VO pill. */
export const TYPE = {
	hero: 168,
	h1: 116,
	h2: 84,
	h3: 60,
	body: 44,
	caption: 42,
	small: 32,
	micro: 26,
};
