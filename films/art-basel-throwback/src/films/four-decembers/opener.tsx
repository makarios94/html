import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ease, prog, Sfx, useLayout} from '../../kit';
import {MARK_GRADIENT, SERIF, theme} from './theme';

/*
 * The opening of "Four Decembers", as two cards with room to breathe before the FOUR DECEMBERS title:
 *   card 1  ASSETLINK, MIAMI (tracked label)  /  Art Basel  /  Evening      0 to ~46
 *   card 2  One tradition,                                                  ~46 to 90
 * Between them the camera flies through card 1 (it scales past the lens and blurs) and card 2 comes up out of the
 * depth, so the move reads as one push forward. Card 2 parts sideways just before the title lands on the downbeat.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Fly-through transition: in from depth (small, blurred), out past the lens (big, blurred). */
const depth = (frame: number, inAt: number, outAt: number, inDur = 12, outDur = 10) => {
	const i = prog(frame, inAt, inDur, ease.out);
	const o = prog(frame, outAt, outDur, ease.in);
	return {
		scale: (0.82 + 0.18 * i) * (1 + 0.9 * o),
		blur: (1 - i) * 14 + o * 22,
		opacity: Math.min(i * 1.4, 1) * (1 - o),
	};
};

/** Letters that rise out of a mask one after another. */
const RiseLetters: React.FC<{text: string; at: number; step?: number; style: React.CSSProperties}> = ({text, at, step = 1.2, style}) => {
	const frame = useCurrentFrame();
	return (
		<span style={{display: 'inline-flex', overflow: 'hidden', paddingBottom: '0.06em', ...style}}>
			{[...text].map((ch, i) => {
				const p = prog(frame, at + i * step, 11, ease.out);
				return (
					<span key={i} style={{display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${((1 - p) * 105).toFixed(1)}%)`}}>
						{ch}
					</span>
				);
			})}
		</span>
	);
};

export const Opener: React.FC<{titleAt: number}> = ({titleAt}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const v = L.isVertical;
	if (frame >= titleAt + 2) return null;

	const big = (v ? 168 : 136) * u;
	const label = (v ? 30 : 26) * u;

	// Card 1
	const c1 = depth(frame, -12, 40);
	const track = prog(frame, 0, 18, ease.out);
	const rule = prog(frame, 6, 16, ease.out);
	const eve = prog(frame, 12, 18, ease.out) * 1.5;

	// Card 2
	const c2in = 44;
	const c2 = depth(frame, c2in, 999, 16);
	const part = prog(frame, titleAt - 10, 10, ease.in);
	const words = ['One', 'tradition,'];

	const display: React.CSSProperties = {fontFamily: theme.fonts.display, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 0.95, textShadow: '0 4px 40px rgba(11,13,38,0.45)'};

	return (
		<AbsoluteFill>
			{/* A soft vignette so the type sits on the river without a hard box. */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 55% at 50% 50%, rgba(11,13,38,0.55) 0%, rgba(11,13,38,0.2) 60%, rgba(11,13,38,0) 100%)', opacity: interpolate(frame, [titleAt - 6, titleAt], [1, 0], clamp)}} />

			{c1.opacity > 0.001 ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${c1.scale.toFixed(4)})`, filter: `blur(${c1.blur.toFixed(1)}px)`, opacity: c1.opacity}}>
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
						<div style={{display: 'flex', alignItems: 'center', gap: 22 * u, marginBottom: 34 * u}}>
							<div style={{width: 70 * u * rule, height: 2 * u, background: 'rgba(255,255,255,0.8)'}} />
							<span style={{fontFamily: theme.fonts.body, fontWeight: 600, fontSize: label, color: '#FFFFFF', letterSpacing: `${(0.9 - 0.58 * track).toFixed(3)}em`, opacity: track, filter: `blur(${((1 - track) * 6).toFixed(1)}px)`, textTransform: 'uppercase'}}>
								ASSETLINK, Miami
							</span>
							<div style={{width: 70 * u * rule, height: 2 * u, background: 'rgba(255,255,255,0.8)'}} />
						</div>
						<RiseLetters text="Art Basel" at={4} style={{...display, fontSize: big}} />
						<span
							style={{
								...display,
								fontFamily: SERIF,
								fontWeight: 400,
								fontStyle: 'italic',
								fontSize: big * 0.66,
								letterSpacing: '0',
								marginTop: 8 * u,
								backgroundImage: `linear-gradient(100deg, #FFFFFF 0%, #FFFFFF ${(eve * 100 - 30).toFixed(0)}%, ${MARK_GRADIENT[1]} ${(eve * 100).toFixed(0)}%, rgba(255,255,255,0) ${(eve * 100 + 8).toFixed(0)}%)`,
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text',
								color: 'transparent',
								textShadow: 'none',
							}}
						>
							Evening
						</span>
					</div>
				</AbsoluteFill>
			) : null}

			{frame >= c2in ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${c2.scale.toFixed(4)})`, filter: `blur(${(c2.blur + part * 10).toFixed(1)}px)`, opacity: c2.opacity * (1 - part)}}>
					<div style={{display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: v ? 0 : 0.25 * big}}>
						{words.map((w, i) => {
							const p = prog(frame, c2in + 4 + i * 6, 14, ease.out);
							const dir = i === 0 ? -1 : 1;
							return (
								<span key={w} style={{...display, fontSize: big * (i === 0 ? 0.78 : 1), display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * 40 * u).toFixed(1)}px) translateX(${(dir * part * 260 * u).toFixed(1)}px)`}}>
									{w}
								</span>
							);
						})}
					</div>
				</AbsoluteFill>
			) : null}

			<Sfx name="whoosh" at={2} volume={0.22} />
			<Sfx name="whoosh" at={38} volume={0.3} />
			<Sfx name="swish" at={c2in + 2} volume={0.25} />
			<Sfx name="swish" at={titleAt - 10} volume={0.25} />
		</AbsoluteFill>
	);
};
