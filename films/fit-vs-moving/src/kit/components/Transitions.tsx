import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {useLayout} from '../layout';
import {ease} from '../motion';

/**
 * Scene-level reveals. Cuts on the beat or the stressed word are the default transition; use these
 * for the one or two moments that change the world (problem -> solution, logo reveal).
 * For crossfades, slides and wipes between whole sequences, @remotion/transitions (TransitionSeries)
 * is also installed: import {TransitionSeries, linearTiming} from '@remotion/transitions'.
 */

/** Reveals its children through a growing circle from (x, y) (fractions of the frame). The world-change move. */
export const CircleReveal: React.FC<{at: number; dur?: number; x?: number; y?: number; easing?: (t: number) => number; children: React.ReactNode}> = ({
	at,
	dur = 22,
	x = 0.5,
	y = 0.5,
	easing = ease.inOut,
	children,
}) => {
	const frame = useCurrentFrame();
	const {width, height} = useLayout();
	if (frame < at) return null;
	const px = x * width;
	const py = y * height;
	const maxR = Math.hypot(Math.max(px, width - px), Math.max(py, height - py));
	const r = interpolate(frame, [at, at + dur], [0, maxR], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
	return <AbsoluteFill style={{clipPath: `circle(${r.toFixed(1)}px at ${px.toFixed(1)}px ${py.toFixed(1)}px)`}}>{children}</AbsoluteFill>;
};

/**
 * Reveals its children with a wipe. angle 0 wipes left to right, 90 top to bottom, 180 right to left, 270 bottom up.
 * feather > 0 gives the edge a soft gradient (percent of the frame), the Seeran-style colour change on the name.
 */
export const WipeReveal: React.FC<{at: number; dur?: number; angle?: number; feather?: number; easing?: (t: number) => number; children: React.ReactNode}> = ({
	at,
	dur = 18,
	angle = 0,
	feather = 0,
	easing = ease.inOut,
	children,
}) => {
	const frame = useCurrentFrame();
	if (frame < at) return null;
	const p = interpolate(frame, [at, at + dur], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
	if (feather > 0) {
		// travel far enough that the soft edge fully clears the frame at both ends
		const edge = -feather + p * (1 + (2 * feather) / 100);
		const dir = angle === 90 ? 'to bottom' : angle === 180 ? 'to left' : angle === 270 ? 'to top' : 'to right';
		const mask = `linear-gradient(${dir}, #000 ${(edge - feather).toFixed(2)}%, transparent ${(edge + feather).toFixed(2)}%)`;
		return <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>{children}</AbsoluteFill>;
	}
	const inset =
		angle === 90 ? `inset(0 0 ${(100 - p).toFixed(2)}% 0)` : angle === 180 ? `inset(0 0 0 ${(100 - p).toFixed(2)}%)` : angle === 270 ? `inset(${(100 - p).toFixed(2)}% 0 0 0)` : `inset(0 ${(100 - p).toFixed(2)}% 0 0)`;
	return <AbsoluteFill style={{clipPath: inset}}>{children}</AbsoluteFill>;
};

export type MorphState = {
	/** Centre, in design px from the frame centre (so one layout works at every aspect). */
	x: number;
	y: number;
	w: number;
	h: number;
	radius?: number;
	color?: string;
	opacity?: number;
	rotate?: number;
};

/**
 * A shared-element move: one box travels, resizes, re-rounds and recolours from one state to another. The match cuts
 * that make a film feel designed: the "You" tile becoming the app icon, the Send button becoming the end card's ground.
 * `from` and `to` content cross-fade (render the outgoing thing in `from`, the arriving thing in `to`).
 */
export const MorphBox: React.FC<{
	at: number;
	dur?: number;
	from: MorphState;
	to: MorphState;
	easing?: (t: number) => number;
	fromContent?: React.ReactNode;
	toContent?: React.ReactNode;
	shadow?: string;
	style?: React.CSSProperties;
}> = ({at, dur = 22, from, to, easing = ease.inOut, fromContent, toContent, shadow, style}) => {
	const frame = useCurrentFrame();
	const {u, width, height} = useLayout();
	const p = interpolate(frame, [at, at + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
	const mix = (a: number, b: number) => a + (b - a) * p;
	const w = mix(from.w, to.w) * u;
	const h = mix(from.h, to.h) * u;
	const cx = width / 2 + mix(from.x, to.x) * u;
	const cy = height / 2 + mix(from.y, to.y) * u;
	const color = from.color && to.color ? interpolateColors(p, [0, 1], [from.color, to.color]) : from.color ?? to.color;
	return (
		<div
			style={{
				position: 'absolute',
				left: cx - w / 2,
				top: cy - h / 2,
				width: w,
				height: h,
				borderRadius: mix(from.radius ?? 0, to.radius ?? 0) * u,
				background: color,
				opacity: mix(from.opacity ?? 1, to.opacity ?? 1),
				transform: from.rotate || to.rotate ? `rotate(${mix(from.rotate ?? 0, to.rotate ?? 0).toFixed(3)}deg)` : undefined,
				boxShadow: shadow,
				overflow: 'hidden',
				...style,
			}}
		>
			{fromContent ? <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - Math.min(1, p * 2)}}>{fromContent}</AbsoluteFill> : null}
			{toContent ? <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: Math.max(0, p * 2 - 1)}}>{toContent}</AbsoluteFill> : null}
		</div>
	);
};

/** Pushes its children in from one side over the previous scene (a fast, directional cut). */
export const PushIn: React.FC<{at: number; dur?: number; from?: 'right' | 'left' | 'bottom' | 'top'; children: React.ReactNode}> = ({at, dur = 14, from = 'right', children}) => {
	const frame = useCurrentFrame();
	const {width, height} = useLayout();
	if (frame < at) return null;
	const p = interpolate(frame, [at, at + dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.out});
	const x = from === 'right' ? p * width : from === 'left' ? -p * width : 0;
	const y = from === 'bottom' ? p * height : from === 'top' ? -p * height : 0;
	return <AbsoluteFill style={{transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`}}>{children}</AbsoluteFill>;
};

/** A quick flash frame (white or brand) to punctuate a hard cut. Use once, not as a habit. */
export const Flash: React.FC<{at: number; color?: string; dur?: number; peak?: number}> = ({at, color = '#FFFFFF', dur = 8, peak = 0.85}) => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [at, at + 1, at + dur], [0, peak, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	if (o <= 0) return null;
	return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};
