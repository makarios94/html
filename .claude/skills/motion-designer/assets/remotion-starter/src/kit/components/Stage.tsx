import React, {CSSProperties} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {useLayout} from '../layout';
import {ease} from '../motion';

/**
 * A 3D stage. Put Tilt layers inside it. Perspective in design px: lower is more dramatic.
 * Product UI on a tilted plane reads as "the product, presented", which is the launch-film signature.
 */
export const Stage3D: React.FC<{perspective?: number; origin?: string; style?: CSSProperties; children: React.ReactNode}> = ({
	perspective = 1900,
	origin = '50% 42%',
	style,
	children,
}) => {
	const {u} = useLayout();
	return <AbsoluteFill style={{perspective: perspective * u, perspectiveOrigin: origin, transformStyle: 'preserve-3d', ...style}}>{children}</AbsoluteFill>;
};

export type Pose = {rx: number; ry: number; rz: number; x: number; y: number; z: number; scale: number};
const ZERO: Pose = {rx: 0, ry: 0, rz: 0, x: 0, y: 0, z: 0, scale: 1};

/** Named poses (degrees, design px). desk = lying back like Seeran-style cards, float = three-quarter hero. */
export const POSES: Record<string, Partial<Pose>> = {
	flat: {},
	desk: {rx: 26, rz: -9},
	deskRight: {rx: 26, rz: 9},
	float: {rx: 10, ry: -16, rz: -3},
	floatRight: {rx: 10, ry: 16, rz: 3},
	hero: {rx: 6, ry: -10, rz: 0},
	lean: {rx: 0, ry: -24, rz: 0},
};

type TiltProps = {
	/** Pose at `from` (a POSES name or numbers). */
	pose?: Partial<Pose> | keyof typeof POSES;
	/** Pose at `from + dur`: the slow camera drift that keeps a held shot alive. */
	to?: Partial<Pose> | keyof typeof POSES;
	from?: number;
	dur?: number;
	easing?: (t: number) => number;
	/** Depth of field: blur in design px for layers that sit behind the subject. */
	blur?: number;
	/** Opacity, for background layers. */
	opacity?: number;
	/** Perspective in design px, applied on the layer itself so it stays 3D at any nesting depth. */
	perspective?: number;
	/** true: a full-frame layer that centres its child. false: an in-flow element (inside flex rows and columns). */
	fill?: boolean;
	style?: CSSProperties;
	children: React.ReactNode;
};

const resolve = (p?: Partial<Pose> | string): Pose => ({...ZERO, ...(typeof p === 'string' ? POSES[p] : p)});

/** A tilted layer, centred by default, drifting from one pose to another (the slow camera move that keeps a held shot alive). */
export const Tilt: React.FC<TiltProps> = ({pose, to, from = 0, dur = 90, easing = ease.inOut, blur = 0, opacity = 1, perspective = 1900, fill = true, style, children}) => {
	const frame = useCurrentFrame();
	const {u} = useLayout();
	const a = resolve(pose);
	// a named `to` is a full pose; an object `to` only changes the fields it names
	const b: Pose = to ? (typeof to === 'string' ? resolve(to) : {...a, ...to}) : a;
	const t = interpolate(frame, [from, from + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
	const mix = (k: keyof Pose) => a[k] + (b[k] - a[k]) * t;
	const layer = (
		<div
			style={{
				transformStyle: 'preserve-3d',
				transform: `perspective(${(perspective * u).toFixed(1)}px) translate3d(${(mix('x') * u).toFixed(2)}px, ${(mix('y') * u).toFixed(2)}px, ${(mix('z') * u).toFixed(2)}px) rotateX(${mix('rx').toFixed(3)}deg) rotateY(${mix('ry').toFixed(3)}deg) rotateZ(${mix('rz').toFixed(3)}deg) scale(${mix('scale').toFixed(4)})`,
				filter: blur ? `blur(${(blur * u).toFixed(2)}px)` : undefined,
				opacity,
				...style,
			}}
		>
			{children}
		</div>
	);
	if (!fill) return layer;
	return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transformStyle: 'preserve-3d'}}>{layer}</AbsoluteFill>;
};

/** Slow push-in (or pull-out) for a whole scene so nothing is ever fully still. */
export const Camera: React.FC<{from?: number; dur: number; scale?: [number, number]; x?: [number, number]; y?: [number, number]; easing?: (t: number) => number; origin?: string; children: React.ReactNode}> = ({
	from = 0,
	dur,
	scale = [1, 1.05],
	x = [0, 0],
	y = [0, 0],
	easing = ease.inOut,
	origin = '50% 50%',
	children,
}) => {
	const frame = useCurrentFrame();
	const {u} = useLayout();
	const t = interpolate(frame, [from, from + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
	const s = scale[0] + (scale[1] - scale[0]) * t;
	const tx = (x[0] + (x[1] - x[0]) * t) * u;
	const ty = (y[0] + (y[1] - y[0]) * t) * u;
	return (
		<AbsoluteFill style={{transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(4)})`, transformOrigin: origin}}>
			{children}
		</AbsoluteFill>
	);
};

/**
 * The box product UI belongs in: inside the safe zone and above the caption band, centred on the safe area rather
 * than the frame (vertical feeds keep more room on the right for their buttons). <SafeStage><Tilt>...</Tilt></SafeStage>.
 * captions={false} for a scene with no caption pill.
 */
export const SafeStage: React.FC<{captions?: boolean; align?: 'center' | 'start' | 'end'; style?: CSSProperties; children: React.ReactNode}> = ({
	captions = true,
	align = 'center',
	style,
	children,
}) => {
	const L = useLayout();
	return (
		<div
			style={{
				position: 'absolute',
				left: L.stage.x,
				top: L.stage.y,
				width: L.stage.w,
				height: captions ? L.stage.h : L.inner.h,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: align === 'center' ? 'center' : align === 'start' ? 'flex-start' : 'flex-end',
				...style,
			}}
		>
			{children}
		</div>
	);
};
