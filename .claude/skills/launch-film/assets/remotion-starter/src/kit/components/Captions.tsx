import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLayout} from '../layout';
import {ease, prog} from '../motion';
import {alpha, useTheme} from '../theme';
import {Captions} from '../timeline';

export type CaptionVariant = 'dark' | 'light' | 'brand' | 'glass';

type Chunk = {id: string; text: string; start: number; end: number; words: [number, number]};

/**
 * Where to split a phrase that is too long for one pill: the fewest, most even pieces (minimum raggedness), helped
 * by a comma or colon, and never a lone short word. Returns the end index (exclusive) of each piece.
 */
const balancedCuts = (texts: string[], maxChars: number) => {
	const n = texts.length;
	const best = new Array<number>(n + 1).fill(Infinity);
	const back = new Array<number>(n + 1).fill(0);
	best[0] = 0;
	for (let j = 1; j <= n; j++) {
		for (let i = j - 1; i >= 0; i--) {
			const len = texts.slice(i, j).join(' ').length;
			if (len > maxChars && j - i > 1) break;
			let cost = (maxChars - Math.min(len, maxChars)) ** 2;
			if (j < n && /[,;:]$/.test(texts[j - 1])) cost *= 0.5;
			if (j - i === 1 && len < 10 && n > 1) cost += maxChars * maxChars;
			if (best[i] + cost < best[j]) {
				best[j] = best[i] + cost;
				back[j] = i;
			}
		}
	}
	const cuts: number[] = [];
	for (let j = n; j > 0; j = back[j]) cuts.unshift(j);
	return cuts;
};

/** Split phrases longer than one line into balanced chunks, each timed from its own words. */
const chunkPhrases = (c: Captions, maxChars: number): Chunk[] => {
	const out: Chunk[] = [];
	for (const p of c.phrases) {
		if (p.text.length <= maxChars || p.words[1] <= p.words[0]) {
			out.push({id: p.id, text: p.text, start: p.start, end: p.end, words: p.words});
			continue;
		}
		const idx: number[] = [];
		for (let i = p.words[0]; i <= p.words[1]; i++) idx.push(i);
		let from = 0;
		for (const to of balancedCuts(idx.map((k) => c.words[k].text), maxChars)) {
			const first = idx[from];
			const last = idx[to - 1];
			out.push({
				id: p.id,
				text: idx.slice(from, to).map((k) => c.words[k].text).join(' '),
				start: first === p.words[0] ? p.start : c.words[first].start,
				end: last === p.words[1] ? p.end : c.words[last].end,
				words: [first, last],
			});
			from = to;
		}
	}
	return out;
};

type CaptionTrackProps = {
	captions: Captions;
	/** phrase: one pill per spoken phrase. karaoke: the phrase with the current word lit. */
	mode?: 'phrase' | 'karaoke';
	/** Fixed, or chosen per frame so the pill always contrasts with the scene behind it. */
	variant?: CaptionVariant | ((frame: number) => CaptionVariant);
	/** Phrase ids not to caption (a title on screen already says the same words). */
	hide?: string[];
	/** Design px. Defaults by shape: 44 vertical, 40 portrait/square, 34 wide. */
	size?: number;
	/** Distance above the bottom safe edge (design px). */
	lift?: number;
	maxWidth?: number;
	/** Longest pill in characters before a phrase is split (default: what fits on one line). */
	maxChars?: number;
	/** Frames to show a pill before the phrase is spoken. */
	lead?: number;
	/** Frames to keep a pill after its phrase ends when nothing follows. */
	hold?: number;
	/** Override the variant's pill colours (any of them), for a brand's own pill. */
	pill?: {bg?: string; fg?: string; border?: string};
};

/**
 * Burned-in captions for VO-led films: one-line pills synced to the voice, inside the safe zone, always
 * contrasting with the scene. Long phrases split into timed chunks so a pill never wraps. Ship the .srt/.vtt too.
 */
export const CaptionTrack: React.FC<CaptionTrackProps> = ({captions, mode = 'phrase', variant = 'dark', hide = [], size, lift = 24, maxWidth, maxChars, lead = 2, hold = 14, pill}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = useTheme();
	const {u, safe, shape, width} = useLayout();
	const f = (s: number) => Math.round(s * fps);
	const fontSize = (size ?? (shape === 'vertical' ? 44 : shape === 'wide' ? 34 : 40)) * u;
	const pillMax = maxWidth ? maxWidth * u : width - safe.left - safe.right;
	const fit = maxChars ?? Math.max(16, Math.floor((pillMax - fontSize * 1.44) / (fontSize * 0.53)));
	const chunks = useMemo(() => chunkPhrases(captions, fit), [captions, fit]);
	let active: Chunk | null = null;
	let activeIndex = -1;
	for (let i = 0; i < chunks.length; i++) {
		const p = chunks[i];
		const start = f(p.start) - lead;
		const next = chunks[i + 1];
		const end = next ? Math.min(f(next.start) - lead, f(p.end) + hold) : f(p.end) + hold;
		if (frame >= start && frame < end) {
			active = p;
			activeIndex = i;
		}
	}
	if (!active || hide.includes(active.id)) return null;
	const v = typeof variant === 'function' ? variant(frame) : variant;
	const startF = f(active.start) - lead;
	const p = prog(frame, startF, 5, ease.out);
	const styles = {
		...{
			dark: {bg: alpha(t.colors.nightSurface, 0.9), fg: t.colors.nightInk, border: `1px solid ${t.colors.nightLine}`},
			light: {bg: alpha(t.colors.surface, 0.94), fg: t.colors.ink, border: `1px solid ${t.colors.line}`},
			brand: {bg: t.colors.brand, fg: t.colors.onBrand, border: 'none'},
			glass: {bg: alpha(t.colors.night, 0.4), fg: t.colors.nightInk, border: `1px solid ${t.colors.nightLine}`},
		}[v],
		...pill,
	};
	const words = captions.words.slice(active.words[0], active.words[1] + 1);
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none', zIndex: 100}}>
			<div
				key={activeIndex}
				style={{
					marginBottom: safe.bottom + lift * u,
					maxWidth: pillMax,
					padding: `${fontSize * 0.38}px ${fontSize * 0.72}px`,
					borderRadius: 999,
					background: styles.bg,
					border: styles.border,
					color: styles.fg,
					fontFamily: t.fonts.body,
					fontWeight: t.weight.bodyStrong,
					fontSize,
					lineHeight: 1.25,
					letterSpacing: t.tracking.body,
					textAlign: 'center',
					whiteSpace: 'nowrap',
					backdropFilter: v === 'glass' ? 'blur(14px)' : undefined,
					opacity: p,
					transform: `translate3d(0, ${((1 - p) * 10 * u).toFixed(2)}px, 0)`,
					boxShadow: v === 'light' ? t.shadow.sm : undefined,
				}}
			>
				{mode === 'karaoke'
					? words.map((w, i) => (
							<span key={i} style={{opacity: frame >= f(w.start) - 1 ? 1 : 0.45}}>
								{i > 0 ? ' ' : ''}
								{w.text}
							</span>
						))
					: active.text}
			</div>
		</AbsoluteFill>
	);
};
