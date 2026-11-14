import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ease, prog, rand, Sfx, SfxName, useLayout} from '../../kit';
import {LINING, MARK_GRADIENT, NAVY, PURPLE, theme} from './theme';

/*
 * Kinetic type for the Edition V throwbacks: every line has its own entrance, chosen so the words act out what they
 * say, and every line leaves with the same exit (the words fall off the frame with a little spin).
 *
 *   rise    words come up from behind a mask one by one, with a slight tilt that straightens
 *   track   letters start spread wide and blurred and pull together
 *   stamp   the line lands big and fast, overshoots, and the frame shakes once (a seal on a document)
 *   type    letters type on with a caret
 *   echo    the line arrives with three ghost copies that catch up with it (more friends in the room)
 *   rewind  the line overshoots to the left, then rewinds back into place (came back)
 *   stack   words drop in from above and land on each other, like building blocks (rebuilt)
 *   wave    letters ride in on a wave (the Miami River)
 *   chatter letters bob up and down alternately before settling (conversation)
 *   paint   the line appears as outline, then a brand-colour fill sweeps through it (art)
 */

export type Mode = 'rise' | 'track' | 'stamp' | 'type' | 'echo' | 'rewind' | 'stack' | 'wave' | 'chatter' | 'paint';
export type KLine = {text: string; at: number; mode: Mode; key?: boolean};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const SFX: Record<Mode, SfxName | null> = {
	rise: 'swish',
	track: 'whoosh',
	stamp: 'impact',
	type: null,
	echo: 'pop-high',
	rewind: 'whoosh',
	stack: 'thud',
	wave: 'swish',
	chatter: 'pop',
	paint: 'swish',
};

type Ctx = {frame: number; at: number; size: number; color: string; u: number};

const chars = (text: string) => [...text];
const words = (text: string) => text.split(' ');

/** One line, drawn in its mode. Returns the line's elements; the caller handles the shared exit. */
const LineBody: React.FC<{l: KLine; c: Ctx; seed: string}> = ({l, c, seed}) => {
	const {frame, at, u} = c;
	const span: React.CSSProperties = {display: 'inline-block', whiteSpace: 'pre'};
	switch (l.mode) {
		case 'rise':
			return (
				<>
					{words(l.text).map((w, i) => {
						const p = prog(frame, at + i * 3, 10, ease.out);
						return (
							<span key={i} style={{...span, overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em'}}>
								<span style={{...span, transform: `translateY(${((1 - p) * 110).toFixed(1)}%) rotate(${((1 - p) * 8).toFixed(2)}deg)`, transformOrigin: 'left bottom'}}>{w + (i < words(l.text).length - 1 ? ' ' : '')}</span>
							</span>
						);
					})}
				</>
			);
		case 'track': {
			const p = prog(frame, at, 16, ease.out);
			return <span style={{...span, letterSpacing: `${(0.6 * (1 - p) - 0.02).toFixed(3)}em`, opacity: p, filter: p < 1 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : undefined}}>{l.text}</span>;
		}
		case 'stamp': {
			const p = prog(frame, at, 7, ease.in);
			const settle = interpolate(frame, [at + 7, at + 10, at + 14], [1, 0.94, 1], clamp);
			const s = p < 1 ? 2.4 - 1.4 * p : settle;
			return <span style={{...span, opacity: p > 0 ? Math.min(1, p * 2) : 0, transform: `scale(${s.toFixed(4)})`, transformOrigin: 'left center'}}>{l.text}</span>;
		}
		case 'type': {
			const cs = chars(l.text);
			const n = Math.floor(interpolate(frame, [at, at + cs.length * 1.6], [0, cs.length], clamp));
			const caret = frame >= at && (frame < at + cs.length * 1.6 + 12 ? true : Math.floor(frame / 8) % 2 === 0) && frame < at + cs.length * 1.6 + 30;
			return (
				<span style={span}>
					{cs.slice(0, n).join('')}
					<span style={{...span, opacity: caret ? 1 : 0, width: 0.08 * c.size * u, height: '0.9em', background: c.color, marginLeft: 0.04 * c.size * u, verticalAlign: '-0.08em'}} />
				</span>
			);
		}
		case 'echo': {
			const p = prog(frame, at, 14, ease.out);
			return (
				<span style={{...span, position: 'relative'}}>
					{[3, 2, 1].map((k) => {
						const g = prog(frame, at + k * 2, 14, ease.out);
						return (
							<span key={k} style={{...span, position: 'absolute', left: 0, top: 0, opacity: (1 - g) * 0.5 * (frame >= at ? 1 : 0), transform: `translate(${((1 - g) * k * 60 * u).toFixed(1)}px, ${((1 - g) * -k * 14 * u).toFixed(1)}px)`, color: k % 2 ? MARK_GRADIENT[1] : MARK_GRADIENT[0]}}>
								{l.text}
							</span>
						);
					})}
					<span style={{...span, position: 'relative', opacity: p, transform: `translateX(${((1 - p) * -30 * u).toFixed(1)}px)`}}>{l.text}</span>
				</span>
			);
		}
		case 'rewind': {
			// Shoots past to the left, then rewinds back with a smear.
			const x = interpolate(frame, [at, at + 6, at + 14], [700, -120, 0], {...clamp, easing: ease.inOut});
			const blur = Math.abs(interpolate(frame, [at, at + 6, at + 14], [1, 0.6, 0], clamp)) * 12;
			return <span style={{...span, opacity: frame >= at ? 1 : 0, transform: `translateX(${(x * u).toFixed(1)}px) skewX(${(interpolate(frame, [at, at + 6, at + 14], [-14, 10, 0], clamp)).toFixed(2)}deg)`, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined}}>{l.text}</span>;
		}
		case 'stack':
			return (
				<>
					{words(l.text).map((w, i) => {
						const t0 = at + i * 4;
						const y = interpolate(frame, [t0, t0 + 7, t0 + 10, t0 + 13], [-420, 12, -4, 0], clamp);
						const r = interpolate(frame, [t0, t0 + 7, t0 + 12], [rand(`${seed}${i}`, -12, 12), 0, 0], clamp);
						return (
							<span key={i} style={{...span, opacity: frame >= t0 ? 1 : 0, transform: `translateY(${(y * u).toFixed(1)}px) rotate(${r.toFixed(2)}deg)`}}>
								{w + (i < words(l.text).length - 1 ? ' ' : '')}
							</span>
						);
					})}
				</>
			);
		case 'wave':
			return (
				<>
					{chars(l.text).map((ch, i) => {
						const t0 = at + i * 1.2;
						const p = prog(frame, t0, 12, ease.out);
						const y = (1 - p) * 60 + Math.sin((frame - t0) * 0.5) * 18 * (1 - p);
						return (
							<span key={i} style={{...span, opacity: p, transform: `translateY(${(y * u).toFixed(1)}px)`}}>
								{ch}
							</span>
						);
					})}
				</>
			);
		case 'chatter':
			return (
				<>
					{chars(l.text).map((ch, i) => {
						const t0 = at + i * 1.4;
						const p = prog(frame, t0, 10, ease.out);
						const dir = i % 2 ? 1 : -1;
						const y = dir * (1 - p) * 70 + dir * Math.sin(Math.max(0, frame - t0) * 0.9) * 10 * (1 - prog(frame, t0, 22, ease.out));
						return (
							<span key={i} style={{...span, opacity: p, transform: `translateY(${(y * u).toFixed(1)}px) rotate(${(dir * (1 - p) * 14).toFixed(2)}deg)`}}>
								{ch}
							</span>
						);
					})}
				</>
			);
		case 'paint': {
			const show = prog(frame, at, 6, ease.out);
			const fill = prog(frame, at + 4, 16, ease.inOut);
			return (
				<span
					style={{
						...span,
						opacity: show,
						WebkitTextStroke: `${(2.5 * u).toFixed(2)}px ${c.color}`,
						color: 'transparent',
						backgroundImage: `linear-gradient(100deg, ${MARK_GRADIENT[0]}, ${MARK_GRADIENT[1]})`,
						backgroundRepeat: 'no-repeat',
						backgroundSize: `${(fill * 100).toFixed(1)}% 100%`,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
					}}
				>
					{l.text}
				</span>
			);
		}
	}
};

/**
 * A block of kinetic lines, left-aligned at the safe edge. The key line sits on a purple bar that wipes in. All lines
 * leave at exitAt: each word drops off the frame with a spin.
 */
export const Kinetic: React.FC<{
	lines: KLine[];
	exitAt: number;
	size: number;
	top?: number;
	bottom?: number;
	color?: string;
	shadow?: boolean;
	seed?: string;
	gap?: number;
}> = ({lines, exitAt, size, top, bottom, color = '#FFFFFF', shadow = true, seed = 'k', gap = 8}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	if (frame < lines[0].at - 4 || frame > exitAt + 16) return null;
	const pos: React.CSSProperties = top !== undefined ? {top} : {bottom: bottom ?? L.safe.bottom + 30 * u};
	// One frame-shake when a stamp lands.
	const shake = lines.filter((l) => l.mode === 'stamp').reduce((s, l) => s + (frame >= l.at + 6 && frame < l.at + 11 ? Math.sin((frame - l.at) * 3.1) * 7 * (1 - (frame - l.at - 6) / 5) : 0), 0);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', transform: `translate(${(shake * u).toFixed(1)}px, ${(shake * 0.5 * u).toFixed(1)}px)`}}>
			<div style={{position: 'absolute', left: L.safe.left, right: L.safe.right, ...pos, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: gap * u}}>
				{lines.map((l, li) => {
					const out = prog(frame, exitAt + li * 2, 12, ease.in);
					const r = rand(`${seed}-${li}`, -18, 18);
					const bar = l.key ? prog(frame, l.at + 6, 9, ease.out) * (1 - out) : 0;
					return (
						<div key={l.text} style={{position: 'relative', transform: `translateY(${(out * 380 * u).toFixed(1)}px) rotate(${(out * r).toFixed(2)}deg)`, opacity: 1 - out * 0.9}}>
							{l.key ? <div style={{position: 'absolute', left: -14 * u, right: -14 * u, top: '6%', bottom: '0%', background: PURPLE, transform: `scaleX(${bar.toFixed(4)})`, transformOrigin: 'left'}} /> : null}
							<div
								style={{
									position: 'relative',
									fontFamily: theme.fonts.display,
									fontWeight: 800,
									fontSize: size * u,
									lineHeight: 1.04,
									letterSpacing: '-0.02em',
									color,
									textTransform: 'uppercase',
									textShadow: shadow && !l.key && l.mode !== 'paint' ? `0 ${4 * u}px ${30 * u}px rgba(0,0,0,0.5)` : 'none',
									whiteSpace: 'nowrap',
									...LINING,
								}}
							>
								<LineBody l={l} c={{frame, at: l.at, size, color, u}} seed={`${seed}${li}`} />
							</div>
						</div>
					);
				})}
			</div>
			{lines.map((l) => {
				const s = SFX[l.mode];
				return s ? <Sfx key={l.text} name={s} at={l.at - 1} volume={l.mode === 'stamp' ? 0.34 : 0.24} /> : null;
			})}
			{lines
				.filter((l) => l.mode === 'type')
				.flatMap((l) =>
					[...Array(Math.ceil(l.text.length / 3))].map((_, i) => (
						<Sfx key={`${l.text}-${i}`} name={(['type-1', 'type-2', 'type-3', 'type-4'] as SfxName[])[i % 4]} at={Math.round(l.at + i * 3 * 1.6)} volume={0.2} />
					)),
				)}
		</AbsoluteFill>
	);
};

void NAVY;
