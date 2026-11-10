import {CSSProperties} from 'react';
import {interpolate} from 'remotion';
import {ease, enterProgress, MotionSpec, prog, tf} from './motion';

export type EnterKind = 'rise' | 'drop' | 'fromLeft' | 'fromRight' | 'pop' | 'scale' | 'blur' | 'fade' | 'none';
export type ExitKind = 'fade' | 'rise' | 'drop' | 'blur' | 'scale' | 'left' | 'right' | 'none';

type EnterArgs = {
	frame: number;
	fps: number;
	at: number;
	kind: EnterKind;
	m: MotionSpec;
	/** Layout unit (px per design px). */
	u: number;
	dur?: number;
	distance?: number;
};

export type Motion = {opacity: number; x: number; y: number; scale: number; blur: number; rotate: number};

export const enterMotion = ({frame, fps, at, kind, m, u, dur, distance}: EnterArgs): Motion => {
	const d = (distance ?? m.distance) * u;
	const base: Motion = {opacity: 1, x: 0, y: 0, scale: 1, blur: 0, rotate: 0};
	if (kind === 'none') return frame < at ? {...base, opacity: 0} : base;
	const p = enterProgress(frame, fps, at, m, dur);
	const o = prog(frame, at, Math.max(4, Math.round((dur ?? m.enter) * 0.55)), ease.soft);
	const inv = 1 - p;
	switch (kind) {
		case 'rise':
			return {...base, opacity: o, y: inv * d};
		case 'drop':
			return {...base, opacity: o, y: -inv * d};
		case 'fromLeft':
			return {...base, opacity: o, x: -inv * d};
		case 'fromRight':
			return {...base, opacity: o, x: inv * d};
		case 'pop':
			return {...base, opacity: o, scale: 0.55 + 0.45 * p};
		case 'scale':
			return {...base, opacity: o, scale: 0.94 + 0.06 * p, y: inv * d * 0.35};
		case 'blur':
			return {...base, opacity: o, y: inv * 14 * u, blur: Math.max(0, inv) * 10 * u};
		case 'fade':
			return {...base, opacity: o};
		default:
			return base;
	}
};

export const exitMotion = (frame: number, at: number, dur: number, kind: ExitKind, u: number, distance = 30): Motion => {
	const base: Motion = {opacity: 1, x: 0, y: 0, scale: 1, blur: 0, rotate: 0};
	if (frame < at || kind === 'none') return base;
	const p = prog(frame, at, dur, ease.in);
	const d = distance * u;
	const o = 1 - p;
	switch (kind) {
		case 'fade':
			return {...base, opacity: o};
		case 'rise':
			return {...base, opacity: o, y: -p * d};
		case 'drop':
			return {...base, opacity: o, y: p * d};
		case 'left':
			return {...base, opacity: o, x: -p * d * 2};
		case 'right':
			return {...base, opacity: o, x: p * d * 2};
		case 'blur':
			return {...base, opacity: o, blur: p * 12 * u};
		case 'scale':
			return {...base, opacity: o, scale: 1 - 0.06 * p};
		default:
			return base;
	}
};

/** Merge an entrance and an exit into one style. */
export const motionStyle = (a: Motion, b?: Motion): CSSProperties => {
	const m = b
		? {
				opacity: a.opacity * b.opacity,
				x: a.x + b.x,
				y: a.y + b.y,
				scale: a.scale * b.scale,
				blur: a.blur + b.blur,
				rotate: a.rotate + b.rotate,
			}
		: a;
	return {
		opacity: m.opacity,
		transform: tf(
			(m.x !== 0 || m.y !== 0) && `translate3d(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px, 0)`,
			m.scale !== 1 && `scale(${m.scale.toFixed(4)})`,
			m.rotate !== 0 && `rotate(${m.rotate.toFixed(3)}deg)`,
		),
		filter: m.blur > 0.05 ? `blur(${m.blur.toFixed(2)}px)` : undefined,
	};
};

/** 0 to 1 visibility for something that should only exist between two frames (with fades). */
export const window01 = (frame: number, from: number, to: number, fadeIn = 6, fadeOut = 6) =>
	interpolate(frame, [from, from + fadeIn, to - fadeOut, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
