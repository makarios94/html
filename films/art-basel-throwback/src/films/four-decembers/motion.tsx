import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {ease, prog, Sfx, useLayout} from '../../kit';
import {asset} from './shared';
import {LINING, PURPLE, theme} from './theme';

/*
 * The v2 motion vocabulary for the Edition V throwbacks: footage that whips in and out, giant type with footage
 * inside it (a knockout), a punch through the type into the footage, lines that slam in on the beat with a purple
 * highlight bar, and an odometer year.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const NIGHT = '#0B0D26';

/**
 * Event footage. whipIn / whipOut: a 5-frame horizontal whip (translate plus blur) into or out of the shot.
 * Renders only inside its window so stacked shots never cover each other.
 */
export const Shot: React.FC<{name: string; from: number; dur: number; whipIn?: boolean; whipOut?: boolean; zoom?: [number, number]; grade?: string; style?: React.CSSProperties}> = ({
	name,
	from,
	dur,
	whipIn = false,
	whipOut = false,
	zoom = [1.04, 1.12],
	grade = 'brightness(1.06) contrast(1.08) saturate(1.08)',
	style,
}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame >= from + dur + (whipOut ? 5 : 0)) return null;
	const inP = whipIn ? prog(frame, from, 6, ease.out) : 1;
	const outP = whipOut ? prog(frame, from + dur - 1, 6, ease.in) : 0;
	const x = (1 - inP) * 55 - outP * 55;
	const blur = (1 - inP) * 26 + outP * 26;
	const s = interpolate(frame, [from, from + dur], zoom, clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', ...style}}>
			<Sequence from={from} layout="none">
				<OffthreadVideo
					src={asset(`c2/${name}.mp4`)}
					muted
					style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `translateX(${x.toFixed(2)}%) scale(${s.toFixed(4)})`, filter: `${grade} blur(${blur.toFixed(1)}px)`}}
				/>
			</Sequence>
		</AbsoluteFill>
	);
};

/** Darkening that keeps white type legible over any footage. */
export const Legible: React.FC<{strength?: number; from?: number; to?: number}> = ({strength = 1, from = -1e9, to = 1e9}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame >= to) return null;
	return (
	<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(11,13,38,${0.5 * strength}) 0%, rgba(11,13,38,${0.12 * strength}) 38%, rgba(11,13,38,${0.2 * strength}) 60%, rgba(11,13,38,${0.78 * strength}) 100%)`}} />
	);
};

/**
 * Giant type with the footage playing inside the letters: the footage sits underneath, and a night layer with white
 * type multiplies over it. punchAt: the type scales up hard while the night layer clears, so the camera goes through
 * the letters into the shot.
 */
export const Knockout: React.FC<{
	children: React.ReactNode;
	footage: React.ReactNode;
	at: number;
	punchAt?: number;
	end: number;
	origin?: string;
	fill?: string;
}> = ({children, footage, at, punchAt, end, origin = '50% 50%', fill}) => {
	const frame = useCurrentFrame();
	if (frame < at || frame >= end) return null;
	const punch = punchAt !== undefined ? prog(frame, punchAt, 12, ease.in) : 0;
	const drift = interpolate(frame, [at, punchAt ?? end], [1.0, 1.06], clamp);
	const scale = drift * (1 + punch * 5.5);
	return (
		<AbsoluteFill style={{isolation: 'isolate', background: NIGHT}}>
			{fill ? <AbsoluteFill style={{background: fill}} /> : <AbsoluteFill style={{filter: `brightness(${(1.9 - 0.9 * punch).toFixed(3)}) saturate(1.25) contrast(1.1)`}}>{footage}</AbsoluteFill>}
			<AbsoluteFill style={{background: NIGHT, mixBlendMode: 'multiply', opacity: 1 - punch}}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${scale.toFixed(4)})`, transformOrigin: origin}}>{children}</AbsoluteFill>
			</AbsoluteFill>
			{fill ? null : (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${scale.toFixed(4)})`, transformOrigin: origin, opacity: 0.38 * (1 - punch), mixBlendMode: 'screen'}}>{children}</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

/** "202" plus an odometer last digit that rolls up to each new value at its cue, with a motion smear. */
export const Year: React.FC<{digits: number[]; rolls: number[]; size: number; color?: string}> = ({digits, rolls, size, color = '#FFFFFF'}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const h = size * L.u;
	let pos = 0;
	let moving = 0;
	rolls.forEach((r) => {
		const p = prog(frame, r, 9, ease.inOut);
		pos += p;
		if (p > 0 && p < 1) moving = Math.sin(p * Math.PI);
	});
	const style: React.CSSProperties = {fontFamily: theme.fonts.display, fontWeight: 800, fontSize: h, lineHeight: 1, letterSpacing: '-0.02em', color, ...LINING};
	return (
		<div style={{display: 'flex', alignItems: 'flex-start'}}>
			<span style={style}>202</span>
			<span style={{height: h, overflow: 'hidden', display: 'inline-block'}}>
				<span style={{display: 'block', transform: `translateY(${(-pos * h).toFixed(2)}px)`, filter: moving ? `blur(${(moving * 6).toFixed(2)}px)` : undefined}}>
					{digits.map((d) => (
						<span key={d} style={{...style, display: 'block', height: h}}>
							{d}
						</span>
					))}
				</span>
			</span>
		</div>
	);
};

export type SlamLine = {text: string; at: number; key?: boolean};

/**
 * Lines that slam in on their beat (scale 1.5 to 1, 7 frames), left-aligned, with the key line on a purple bar that
 * wipes in under it. They leave together at exitAt with a fast rise.
 */
export const Slam: React.FC<{lines: SlamLine[]; exitAt: number; size: number; bottom?: number; top?: number; align?: 'left' | 'center'; sfx?: boolean}> = ({lines, exitAt, size, bottom, top, align = 'left', sfx = true}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const out = prog(frame, exitAt, 8, ease.in);
	if (frame < lines[0].at - 3 || frame > exitAt + 9) return null;
	const pos: React.CSSProperties = top !== undefined ? {top} : {bottom: bottom ?? L.safe.bottom + 30 * u};
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: L.safe.left,
					right: L.safe.right,
					...pos,
					display: 'flex',
					flexDirection: 'column',
					alignItems: align === 'left' ? 'flex-start' : 'center',
					gap: 8 * u,
					opacity: 1 - out,
					transform: `translateY(${(-out * 90 * u).toFixed(2)}px)`,
					filter: out > 0 ? `blur(${(out * 10).toFixed(2)}px)` : undefined,
				}}
			>
				{lines.map((l) => {
					const p = prog(frame, l.at - 2, 7, ease.out);
					const bar = l.key ? prog(frame, l.at + 2, 8, ease.out) : 0;
					return (
						<div key={l.text} style={{position: 'relative', opacity: p > 0 ? 1 : 0, transform: `scale(${(1.5 - 0.5 * p).toFixed(4)})`, transformOrigin: align === 'left' ? 'left center' : 'center', filter: p < 1 ? `blur(${((1 - p) * 8).toFixed(2)}px)` : undefined}}>
							{l.key ? (
								<div style={{position: 'absolute', left: -14 * u, right: -14 * u, top: '8%', bottom: '2%', background: PURPLE, transform: `scaleX(${bar.toFixed(4)})`, transformOrigin: 'left'}} />
							) : null}
							<div
								style={{
									position: 'relative',
									fontFamily: theme.fonts.display,
									fontWeight: 800,
									fontSize: size * u,
									lineHeight: 1.02,
									letterSpacing: '-0.02em',
									color: '#FFFFFF',
									textTransform: 'uppercase',
									textShadow: l.key ? 'none' : `0 ${4 * u}px ${30 * u}px rgba(0,0,0,0.5)`,
									...LINING,
								}}
							>
								{l.text}
							</div>
						</div>
					);
				})}
			</div>
			{sfx ? lines.map((l) => <Sfx key={l.text} name="thud" at={l.at - 1} volume={0.32} />) : null}
		</AbsoluteFill>
	);
};

/** A small purple tag, like a gallery edition stamp, that snaps in. */
export const Tag: React.FC<{text: string; at: number; exitAt: number; top: number}> = ({text, at, exitAt, top}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const p = prog(frame, at, 8, ease.out);
	const out = prog(frame, exitAt, 6, ease.in);
	if (frame < at - 1 || frame > exitAt + 7) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: L.safe.left,
				top,
				background: PURPLE,
				color: '#FFFFFF',
				fontFamily: theme.fonts.body,
				fontWeight: 700,
				fontSize: L.pick({vertical: 34, square: 28}, 30) * u,
				letterSpacing: '0.16em',
				textTransform: 'uppercase',
				padding: `${12 * u}px ${22 * u}px`,
				opacity: p * (1 - out),
				transform: `translateX(${((1 - p) * -40 * u).toFixed(2)}px)`,
				clipPath: `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`,
				...LINING,
			}}
		>
			{text}
		</div>
	);
};

/** Hard-light flash on a cut, kept under 3 a second. */
export const Pop: React.FC<{at: number; color?: string}> = ({at, color = '#FFFFFF'}) => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [at, at + 1, at + 5], [0, 0.55, 0], clamp);
	if (o <= 0) return null;
	return <AbsoluteFill style={{background: color, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};
