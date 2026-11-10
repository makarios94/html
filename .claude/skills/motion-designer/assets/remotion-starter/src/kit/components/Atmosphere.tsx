import React, {CSSProperties} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {useLayout} from '../layout';
import {drift} from '../motion';

type BackdropProps = {
	color: string;
	/** A soft radial light. x, y in 0..1 of the frame; size as a fraction of the long side. */
	glow?: {color: string; x?: number; y?: number; size?: number; opacity?: number; breathe?: boolean};
	/** Edge darkening, 0..1. */
	vignette?: number;
	/** Faint grid lines, in design px. */
	grid?: {size: number; color: string};
	gradient?: string;
	style?: CSSProperties;
	children?: React.ReactNode;
};

/** The ground every scene stands on: colour, optional glow, vignette and grid. */
export const Backdrop: React.FC<BackdropProps> = ({color, glow, vignette = 0, grid, gradient, style, children}) => {
	const frame = useCurrentFrame();
	const {width, height, u} = useLayout();
	const long = Math.max(width, height);
	const gOpacity = glow ? (glow.opacity ?? 1) * (glow.breathe ? 0.85 + 0.15 * Math.sin(frame / 40) : 1) : 0;
	return (
		<AbsoluteFill style={{background: gradient ?? color, overflow: 'hidden', ...style}}>
			{grid ? (
				<AbsoluteFill
					style={{
						backgroundImage: `linear-gradient(${grid.color} 1px, transparent 1px), linear-gradient(90deg, ${grid.color} 1px, transparent 1px)`,
						backgroundSize: `${grid.size * u}px ${grid.size * u}px`,
						backgroundPosition: 'center center',
					}}
				/>
			) : null}
			{glow ? (
				<div
					style={{
						position: 'absolute',
						left: (glow.x ?? 0.5) * width - (glow.size ?? 0.9) * long * 0.5,
						top: (glow.y ?? 0.45) * height - (glow.size ?? 0.9) * long * 0.5,
						width: (glow.size ?? 0.9) * long,
						height: (glow.size ?? 0.9) * long,
						borderRadius: '50%',
						background: `radial-gradient(closest-side, ${glow.color}, transparent)`,
						opacity: gOpacity,
					}}
				/>
			) : null}
			{children}
			{vignette > 0 ? (
				<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)', opacity: vignette, pointerEvents: 'none'}} />
			) : null}
		</AbsoluteFill>
	);
};

/** Film grain. Subtle (0.04 to 0.08) adds richness to flat colour; it changes every 2 frames. */
export const Grain: React.FC<{opacity?: number; blend?: CSSProperties['mixBlendMode']}> = ({opacity = 0.05, blend = 'overlay'}) => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2) % 12;
	const id = `grain-${seed}`;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: blend, opacity, zIndex: 90}}>
			<svg width="100%" height="100%">
				<filter id={id}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#${id})`} />
			</svg>
		</AbsoluteFill>
	);
};

/** A light sweep across a surface (glints on cards, logos, buttons). Place inside a relatively positioned, overflow-hidden box. */
export const Sheen: React.FC<{at: number; dur?: number; angle?: number; opacity?: number; width?: number}> = ({at, dur = 24, angle = 20, opacity = 0.45, width = 0.22}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [at, at + dur], [-0.4, 1.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	if (frame < at || frame > at + dur) return null;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: `linear-gradient(${90 + angle}deg, transparent ${(p - width) * 100}%, rgba(255,255,255,${opacity}) ${p * 100}%, transparent ${(p + width) * 100}%)`,
				pointerEvents: 'none',
				mixBlendMode: 'screen',
			}}
		/>
	);
};

/** Gentle ambient float for any element: a few px of vertical drift so held frames stay alive. */
export const Float: React.FC<{amp?: number; period?: number; phase?: number; rotate?: number; children: React.ReactNode}> = ({amp = 8, period = 110, phase = 0, rotate = 0, children}) => {
	const frame = useCurrentFrame();
	const {u} = useLayout();
	return (
		<div style={{transform: `translate3d(0, ${(drift(frame, amp, period, phase) * u).toFixed(2)}px, 0) rotate(${drift(frame, rotate, period * 1.3, phase + 17).toFixed(3)}deg)`}}>{children}</div>
	);
};
