import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ease, prog, Sfx, useLayout} from '../../kit';
import {LINING, NAVY, PURPLE, theme} from './theme';

/*
 * Shared pieces for the Edition V throwback videos, built to "ASSETLINK x Miami Art Week 2026, Event Promo Strategy"
 * (the user's Claude doc): the museum wall label as the one visual device, event footage from Editions I to IV,
 * and one end card for both videos.
 */

export const ASSET_DIR = 'films/art-basel-throwback';
export const asset = (p: string) => staticFile(`${ASSET_DIR}/${p}`);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Full-bleed event footage, muted (the film carries its own score), with a slow push. */
export const Footage: React.FC<{name: string; from: number; dur: number; dim?: number}> = ({name, from, dur, dim = 0}) => {
	const frame = useCurrentFrame();
	if (frame < from - 1 || frame > from + dur + 1) return null;
	const s = interpolate(frame, [from, from + dur], [1.03, 1.09], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#0B0D26'}}>
			<Sequence from={from} layout="none">
				<OffthreadVideo
					src={asset(`c2/${name}.mp4`)}
					muted
					style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s.toFixed(4)})`, filter: 'brightness(1.06) contrast(1.05)'}}
				/>
			</Sequence>
			{dim ? <AbsoluteFill style={{background: `rgba(11,13,38,${dim})`}} /> : null}
		</AbsoluteFill>
	);
};

/** A held frame (the "freeze on the last frame, darken" beat), easing darker and a touch tighter. */
export const Freeze: React.FC<{still: string; from: number; dur: number; dark?: number}> = ({still, from, dur, dark = 0.62}) => {
	const frame = useCurrentFrame();
	if (frame < from - 1 || frame > from + dur + 1) return null;
	const d = prog(frame, from, 18, ease.soft);
	const s = interpolate(frame, [from, from + dur], [1.09, 1.12], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#0B0D26'}}>
			<Img src={asset(`c2/${still}`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s.toFixed(4)})`, filter: `saturate(${(1 - 0.5 * d).toFixed(3)})`}} />
			<AbsoluteFill style={{background: `rgba(11,13,38,${(dark * d).toFixed(3)})`}} />
		</AbsoluteFill>
	);
};

/** Gradients that keep the year and the label legible over any footage. */
export const Shade: React.FC = () => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,13,38,0.55) 0%, rgba(11,13,38,0) 34%, rgba(11,13,38,0) 55%, rgba(11,13,38,0.55) 100%)'}} />
);

type LabelSizes = {w: number; title: number; body: number; pad: number};
export const useLabelSizes = (): LabelSizes => {
	const L = useLayout();
	return L.pick<LabelSizes>({vertical: {w: 820, title: 46, body: 40, pad: 40}, square: {w: 660, title: 38, body: 33, pad: 32}}, {w: 760, title: 42, body: 36, pad: 36});
};

export type LabelLine = {text: string; at: number; style?: 'title' | 'body' | 'italic'};

/**
 * The museum wall label: an off-white card, a short purple rule, a bold first line and plain lines under it. It slides
 * in from the left, each line arriving on its own cue, and slides out at exitAt.
 */
export const WallLabel: React.FC<{at: number; exitAt: number; lines: LabelLine[]; bottomGap?: number; sfx?: boolean}> = ({at, exitAt, lines, bottomGap = 40, sfx = true}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const z = useLabelSizes();
	const inP = prog(frame, at, 14, ease.out);
	const outP = prog(frame, exitAt, 10, ease.in);
	if (frame < at - 1 || frame > exitAt + 12) return null;
	const rule = prog(frame, at + 4, 14, ease.draw);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: L.safe.left,
					bottom: L.safe.bottom + bottomGap * u,
					width: z.w * u,
					background: '#FBFBFD',
					color: NAVY,
					padding: `${z.pad * u}px ${z.pad * 1.1 * u}px`,
					boxShadow: `0 ${18 * u}px ${60 * u}px rgba(0,0,0,0.38)`,
					opacity: inP * (1 - outP),
					transform: `translateX(${((1 - inP) * -70 * u - outP * 50 * u).toFixed(2)}px)`,
				}}
			>
				<div style={{width: 64 * u, height: 6 * u, background: PURPLE, marginBottom: 22 * u, transform: `scaleX(${rule.toFixed(4)})`, transformOrigin: 'left'}} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 10 * u}}>
					{lines.map((l) => {
						const p = prog(frame, l.at, 12, ease.out);
						const kind = l.style ?? 'body';
						return (
							<div
								key={l.text}
								style={{
									fontFamily: theme.fonts.body,
									fontWeight: kind === 'title' ? 700 : 400,
									fontStyle: kind === 'italic' ? 'italic' : 'normal',
									fontSize: (kind === 'title' ? z.title : z.body) * u,
									lineHeight: 1.22,
									letterSpacing: kind === 'title' ? '0.01em' : '0em',
									color: kind === 'title' ? NAVY : 'rgba(21,26,56,0.78)',
									opacity: p,
									transform: `translateY(${((1 - p) * 10 * u).toFixed(2)}px)`,
								}}
							>
								{l.text}
							</div>
						);
					})}
				</div>
			</div>
			{sfx ? <Sfx name="card" at={at} volume={0.26} /> : null}
		</AbsoluteFill>
	);
};

/** The end card both videos share (from the doc): logo, Free to attend, Registration closes Dec 2, Save your spot. */
export const EndCard: React.FC<{at: number; end: number}> = ({at, end}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	if (frame < at - 10) return null;
	const inP = prog(frame, at - 8, 12, ease.out);
	const logo = prog(frame, at - 2, 20, ease.soft);
	const l1 = prog(frame, at + 10, 14, ease.out);
	const l2 = prog(frame, at + 16, 14, ease.out);
	const pill = prog(frame, at + 24, 16, ease.out);
	const push = interpolate(frame, [at, end], [1, 1.04], clamp);
	const big = L.pick({vertical: 60, square: 50}, 54);
	const rise = (p: number) => `translateY(${((1 - p) * 16 * u).toFixed(2)}px)`;
	return (
		<AbsoluteFill style={{background: NAVY, opacity: inP}}>
			<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 42%, rgba(91,73,211,0.35) 0%, rgba(21,26,56,0) 62%)`}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 140 * u : 0, transform: `scale(${push.toFixed(4)})`}}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 * u, textAlign: 'center'}}>
					<Img src={asset('assetlink-lockup-white.png')} style={{width: L.pick({vertical: 640, square: 540}, 600) * u, opacity: logo, filter: `blur(${((1 - logo) * 8).toFixed(2)}px)`}} />
					<div style={{height: 10 * u}} />
					<div style={{fontFamily: theme.fonts.display, fontWeight: 800, fontSize: big * u, color: '#FFFFFF', opacity: l1, transform: rise(l1)}}>Free to attend</div>
					<div style={{fontFamily: theme.fonts.body, fontWeight: 500, fontSize: big * 0.62 * u, color: 'rgba(255,255,255,0.82)', opacity: l2, transform: rise(l2), ...LINING}}>Registration closes Dec 2</div>
					<div style={{marginTop: 18 * u, background: PURPLE, color: '#FFFFFF', fontFamily: theme.fonts.body, fontWeight: 600, fontSize: big * 0.58 * u, padding: `${20 * u}px ${44 * u}px`, borderRadius: 999, opacity: pill, transform: `${rise(pill)} scale(${(0.96 + 0.04 * pill).toFixed(4)})`}}>
						Save your spot (link in bio)
					</div>
				</div>
			</AbsoluteFill>
			<Sfx name="sparkle" at={at + 2} volume={0.26} />
		</AbsoluteFill>
	);
};

/** One digit that flips (split-flap style) whenever its value changes at one of `flips`. */
const FlipDigit: React.FC<{values: number[]; flips: number[]; size: number}> = ({values, flips, size}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	let idx = 0;
	flips.forEach((f, i) => {
		if (frame >= f + 6) idx = i + 1;
	});
	const active = flips.findIndex((f) => frame >= f && frame < f + 12);
	const style: React.CSSProperties = {fontFamily: theme.fonts.display, fontWeight: 800, fontSize: size * L.u, lineHeight: 1, color: '#FFFFFF', ...LINING, display: 'inline-block', backfaceVisibility: 'hidden'};
	if (active < 0) return <span style={style}>{values[Math.min(idx, values.length - 1)]}</span>;
	const f0 = flips[active];
	const outRot = interpolate(frame, [f0, f0 + 6], [0, -90], {...clamp, easing: ease.in});
	const inRot = interpolate(frame, [f0 + 6, f0 + 12], [90, 0], {...clamp, easing: ease.out});
	const showingNew = frame >= f0 + 6;
	const v = values[showingNew ? active + 1 : active];
	return <span style={{...style, transform: `perspective(${600 * L.u}px) rotateX(${showingNew ? inRot : outRot}deg)`}}>{v}</span>;
};

/** The big year over the footage: "202" holds, the last digit flips forward on each cut. */
export const YearFlip: React.FC<{at: number; exitAt: number; digits: number[]; flips: number[]; size: number; top: number}> = ({at, exitAt, digits, flips, size, top}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const inP = prog(frame, at, 12, ease.out);
	const outP = prog(frame, exitAt, 10, ease.in);
	if (frame < at - 1 || frame > exitAt + 12) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: L.safe.left, top, display: 'flex', alignItems: 'flex-end', opacity: inP * (1 - outP), transform: `perspective(${600 * u}px) rotateX(${((1 - inP) * 70).toFixed(2)}deg)`, transformOrigin: '50% 100%', textShadow: `0 ${6 * u}px ${36 * u}px rgba(0,0,0,0.45)`}}>
				<span style={{fontFamily: theme.fonts.display, fontWeight: 800, fontSize: size * u, lineHeight: 1, color: '#FFFFFF', ...LINING}}>202</span>
				<FlipDigit values={digits} flips={flips} size={size} />
			</div>
			{flips.map((f) => (
				<Sfx key={f} name="tick" at={f + 4} volume={0.34} />
			))}
		</AbsoluteFill>
	);
};
