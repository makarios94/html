import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
import {ease, FilmProps, FilmShell, Grain, Music, prog, Sfx, Show, useLayout} from '../../kit';
import {asset, B, BARS, DURATION} from './config';
import {FONTS, GLYPHS, SERIF, theme} from './theme';

/*
 * Art Basel throwback, v2 (music-led, no voice): four Decembers of AssetLink Art Basel events in Miami.
 * Footage: the five event reels the user uploaded (2022 to 2025). Flyer and marble: the 2025 event flyer in Drive.
 *
 * Bar 0 hook: THROWBACK over 2024 crowd footage (legible on frame 0)
 * Bar 1 "Four Decembers in Miami." on the flyer marble
 * Bars 2 to 5 one year per bar: a framed print lands on the downbeat, its clip cuts on beat 3, the year rolls 2022 to 2025
 *              (2025 opens on the event flyer itself)
 * Bar 6 thank-you over footage | Bar 7 AssetLink end card on the last chord
 */

// The flyer sets its type in Glacial Indifference Bold (not on Google Fonts). Montserrat is the stand-in.
const FLYER = loadMontserrat('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;
const ALL_FONTS = [...FONTS, FLYER];

const bar = B.bar;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const WHITE = '#FFFFFF';
/** The flyer's purple border, sampled from the PDF. */
const FLYER_PURPLE = '#5A51A1';
const clip = (name: string) => staticFile(asset(`clips/${name}.mp4`));

type Year = {year: number; a: string; b: string; rot: number};
// a: the clip that lands on the downbeat ('flyer' shows the 2025 flyer); b: the cut on beat 3.
const YEARS: Year[] = [
	{year: 2022, a: 'y22a', b: 'y22b', rot: -3},
	{year: 2023, a: 'y23a', b: 'y23b', rot: 2.5},
	{year: 2024, a: 'y24a', b: 'y24b', rot: -2.2},
	{year: 2025, a: 'flyer', b: 'y25b', rot: 2.8},
];

const caps = (size: number, u: number, tracking = '0.16em', weight = 700): React.CSSProperties => ({
	fontFamily: FLYER,
	fontWeight: weight,
	fontSize: size * u,
	letterSpacing: tracking,
	lineHeight: 1.04,
	color: WHITE,
	textTransform: 'uppercase',
	whiteSpace: 'nowrap',
});

/** The flyer's marble, with a slow push so the ground is never still. */
const Marble: React.FC<{dim?: number}> = ({dim = 0}) => {
	const frame = useCurrentFrame();
	const s = interpolate(frame, [0, DURATION], [1.12, 1.24], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: FLYER_PURPLE}}>
			<Img src={staticFile(asset('marble.jpg'))} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s.toFixed(4)})`}} />
			<AbsoluteFill style={{background: 'rgba(64,54,150,0.42)', mixBlendMode: 'multiply'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,8,40,0.38) 100%)'}} />
			{dim ? <AbsoluteFill style={{background: `rgba(8,8,30,${dim})`}} /> : null}
		</AbsoluteFill>
	);
};

/** Event footage, muted (the film has its own score), lifted a touch for night shots. */
const Clip: React.FC<{name: string; from: number; scale?: number}> = ({name, from, scale = 1}) => (
	<Sequence from={from} layout="none">
		<OffthreadVideo src={clip(name)} muted style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`, filter: 'brightness(1.08) contrast(1.06) saturate(1.05)'}} />
	</Sequence>
);

/** Full-bleed footage washed in the flyer's purple, so type sits on it cleanly. */
const Tinted: React.FC<{name: string; from: number; strength?: number}> = ({name, from, strength = 0.5}) => {
	const frame = useCurrentFrame();
	const s = interpolate(frame, [from, from + 120], [1.04, 1.12], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#120F33'}}>
			<Clip name={name} from={from} scale={s} />
			<AbsoluteFill style={{background: `rgba(70,58,170,${strength})`, mixBlendMode: 'multiply'}} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(12,10,40,0.35) 0%, rgba(12,10,40,0.15) 40%, rgba(12,10,40,0.7) 100%)'}} />
		</AbsoluteFill>
	);
};

/** A line that rises from behind a clipping edge. The settle lands on its beat. */
const Line: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number}> = ({at, children, style, dur = 14}) => {
	const frame = useCurrentFrame();
	const p = prog(frame, at - 3, dur, ease.out);
	return (
		<div style={{overflow: 'hidden', paddingBottom: '0.08em', ...style}}>
			<div style={{transform: `translateY(${((1 - p) * 105).toFixed(2)}%)`, opacity: p > 0 ? 1 : 0}}>{children}</div>
		</div>
	);
};

// Bar 0: the hook over 2024 footage. Fully legible on frame 0; on bar 1 it rewinds out (skew, smear).
const Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const out = prog(frame, bar(1) - 7, 8, ease.in);
	const jitter = out > 0 && out < 1 ? Math.sin(frame * 2.7) * 16 * u : 0;
	const size = L.pick({vertical: 176, portrait: 196, square: 168}, 190);
	return (
		<AbsoluteFill style={{opacity: 1 - out * 0.9}}>
			<Tinted name="hook" from={0} strength={0.72} />
			<AbsoluteFill style={{background: "rgba(12,10,40,0.28)"}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 120 * u : 0}}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 26 * u,
						opacity: 1 - out,
						transform: `translateX(${(-out * 260 * u + jitter).toFixed(2)}px) skewX(${(out * 18).toFixed(2)}deg)`,
						filter: out > 0 ? `blur(${(out * 6).toFixed(2)}px)` : undefined,
						textShadow: `0 ${4 * u}px ${30 * u}px rgba(10,8,40,0.55)`,
					}}
				>
					<div style={{...caps(size, u, '0.02em'), lineHeight: 0.92, textAlign: 'center'}}>
						THROW
						<br />
						BACK
					</div>
					<div style={{width: 520 * u, height: 6 * u, background: WHITE}} />
					<div style={caps(L.pick({vertical: 50, square: 42}, 46), u, '0.22em')}>Art Basel, Miami</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Bar 1: the frame for what follows.
const Decembers: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const out = prog(frame, bar(2) - 10, 10, ease.in);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 120 * u : 0, opacity: 1 - out, transform: `translateY(${(-out * 60 * u).toFixed(2)}px)`}}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * u, textAlign: 'center'}}>
				<Line at={bar(1, 0)}>
					<div style={caps(L.pick({vertical: 92, square: 84}, 96), u, '0.08em')}>Four</div>
				</Line>
				<Line at={bar(1, 1)}>
					<div style={caps(L.pick({vertical: 92, square: 84}, 96), u, '0.08em')}>Decembers</div>
				</Line>
				<Line at={bar(1, 2)}>
					<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: L.pick({vertical: 80, square: 68}, 76) * u, color: WHITE, lineHeight: 1.2}}>in Miami.</div>
				</Line>
			</div>
			<Sfx name="thud" at={bar(1, 0) - 2} volume={0.3} />
			<Sfx name="thud" at={bar(1, 1) - 2} volume={0.3} pitch={1.05} />
			<Sfx name="pop" at={bar(1, 2) - 2} volume={0.25} />
		</AbsoluteFill>
	);
};

type CardBox = {w: number; h: number; cy: number; yearSize: number};
const useCard = (): CardBox => {
	const L = useLayout();
	return L.pick<CardBox>(
		{
			vertical: {w: 800, h: 900, cy: 0.46, yearSize: 130},
			portrait: {w: 780, h: 800, cy: 0.55, yearSize: 140},
			square: {w: 620, h: 600, cy: 0.57, yearSize: 118},
		},
		{w: 780, h: 800, cy: 0.55, yearSize: 140},
	);
};

/** One year: a print with a white border lands on the downbeat, the clip cuts on beat 3, then it flies off. */
const YearCard: React.FC<{y: Year; i: number}> = ({y, i}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const c = useCard();
	const start = bar(2 + i);
	const inP = prog(frame, start - 12, 14, ease.out);
	const outP = prog(frame, bar(3 + i) - 12, 12, ease.in);
	const drift = interpolate(frame, [start, bar(3 + i)], [0, 1], clamp);
	const tx = -outP * L.width * 1.1;
	const ty = (1 - inP) * L.height * 0.85 - outP * 120 * u;
	const rot = y.rot + (1 - inP) * 9 - outP * 14 + drift * 0.6 * Math.sign(y.rot);
	const w = c.w * u;
	const h = c.h * u;
	const cut = bar(2 + i, 2);
	const flyerPush = interpolate(frame, [start - 12, bar(3 + i)], [1.0, 1.08], clamp);
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: (L.width - w) / 2,
					top: L.height * c.cy - h / 2,
					width: w,
					height: h,
					transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`,
					border: `${18 * u}px solid ${WHITE}`,
					boxShadow: `0 ${30 * u}px ${90 * u}px rgba(0,0,0,0.55)`,
					overflow: 'hidden',
					background: '#120F33',
				}}
			>
				{frame < cut ? (
					y.a === 'flyer' ? (
						<Img src={staticFile(asset('flyer.jpg'))} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', transform: `scale(${flyerPush.toFixed(4)})`}} />
					) : (
						<Clip name={y.a} from={start - 12} />
					)
				) : (
					<Clip name={y.b} from={cut} />
				)}
			</div>
			<Sfx name="whoosh" at={start - 12} volume={0.26} />
			<Sfx name="card" at={start} volume={0.32} />
			<Sfx name="swish" at={cut - 1} volume={0.2} />
		</AbsoluteFill>
	);
};

/** The year above the prints. 202 holds still; the last digit rolls 2, 3, 4, 5 on each downbeat. */
const YearStamp: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const c = useCard();
	const size = c.yearSize;
	const cardTop = L.height * c.cy - (c.h * u) / 2;
	const left = (L.width - c.w * u) / 2;
	const inP = prog(frame, bar(2) - 10, 14, ease.out);
	const outP = prog(frame, bar(6) - 8, 10, ease.in);
	const pos = [3, 4, 5].reduce((s, b) => s + prog(frame, bar(b) - 6, 10, ease.out), 0);
	const lh = size * 1.0 * u;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left, top: cardTop - lh - 26 * u, display: 'flex', alignItems: 'flex-end', opacity: inP * (1 - outP), transform: `translateY(${((1 - inP) * 40 * u - outP * 40 * u).toFixed(2)}px)`}}>
				<div style={{...caps(size, u, '0.04em'), lineHeight: 1}}>202</div>
				<div style={{height: lh, overflow: 'hidden'}}>
					<div style={{transform: `translateY(${(-pos * lh).toFixed(2)}px)`}}>
						{[2, 3, 4, 5].map((d) => (
							<div key={d} style={{...caps(size, u, '0.04em'), lineHeight: 1, height: lh}}>{d}</div>
						))}
					</div>
				</div>
			</div>
			{[3, 4, 5].map((b) => (
				<Sfx key={b} name="tick" at={bar(b) - 4} volume={0.32} />
			))}
		</AbsoluteFill>
	);
};

// Bar 6: the thank-you over footage of guests at the 2024 AssetLink step-and-repeat.
const Thanks: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const inP = prog(frame, bar(6) - 8, 10, ease.out);
	const size = L.pick({vertical: 76, portrait: 72, square: 60}, 68);
	return (
		<AbsoluteFill style={{opacity: inP}}>
			<Tinted name="thanks" from={bar(6) - 8} strength={0.5} />
			<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: L.safe.bottom + L.pick({vertical: 20, square: 20}, 60) * u}}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * u, textAlign: 'center', textShadow: `0 ${3 * u}px ${24 * u}px rgba(10,8,40,0.6)`}}>
					<Line at={bar(6, 0)}>
						<div style={{fontFamily: SERIF, fontSize: size * u, color: WHITE, lineHeight: 1.15}}>Thank you to everyone</div>
					</Line>
					<Line at={bar(6, 1)}>
						<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: size * u, color: WHITE, lineHeight: 1.15}}>who came.</div>
					</Line>
				</div>
			</AbsoluteFill>
			<Sfx name="pop" at={bar(6, 0) - 2} volume={0.25} />
			<Sfx name="pop-high" at={bar(6, 1) - 2} volume={0.22} />
		</AbsoluteFill>
	);
};

// Bar 7: the end card on the marble, held while the last chord rings.
const End: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const inP = prog(frame, bar(7) - 8, 14, ease.out);
	const logo = prog(frame, bar(7) - 2, 22, ease.soft);
	const line = prog(frame, bar(7, 1) - 3, 16, ease.out);
	const url = prog(frame, bar(7, 2) - 3, 16, ease.out);
	const push = interpolate(frame, [bar(7), DURATION], [1, 1.05], clamp);
	return (
		<AbsoluteFill style={{opacity: inP}}>
			<Marble dim={0.18} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 120 * u : 0, transform: `scale(${push.toFixed(4)})`}}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 * u}}>
					<Img src={staticFile(asset('assetlink-lockup-white.png'))} style={{width: L.pick({vertical: 640, square: 560}, 620) * u, opacity: logo, transform: `scale(${(0.96 + 0.04 * logo).toFixed(4)})`, filter: `blur(${((1 - logo) * 8).toFixed(2)}px)`}} />
					<div style={{fontFamily: SERIF, fontSize: L.pick({vertical: 58, square: 48}, 54) * u, color: WHITE, opacity: line, transform: `translateY(${((1 - line) * 16 * u).toFixed(2)}px)`}}>Know who, why and when.</div>
					<div style={{...caps(L.pick({vertical: 34, square: 30}, 32), u, '0.2em', 500), textTransform: 'none', opacity: 0.85 * url, transform: `translateY(${((1 - url) * 14 * u).toFixed(2)}px)`}}>assetlink.ai</div>
				</div>
			</AbsoluteFill>
			<Sfx name="sparkle" at={bar(7) + 4} volume={0.28} />
		</AbsoluteFill>
	);
};

export const Film: React.FC<FilmProps> = (props) => {
	if (B.trackBars < BARS) {
		throw new Error(`The music has ${B.trackBars} bars but this film is built on ${BARS}.`);
	}
	return (
		<FilmShell theme={theme} fonts={ALL_FONTS} glyphs={GLYPHS} props={props} background={FLYER_PURPLE}>
			<Show from={bar(1) - 10} to={bar(6) + 4}>
				<Marble dim={0.35} />
			</Show>
			<Show from={0} to={bar(1)} z={1}>
				<Hook />
			</Show>
			<Show from={bar(1) - 4} to={bar(2)}>
				<Decembers />
			</Show>
			{YEARS.map((y, i) => (
				<Show key={y.year} from={bar(2 + i) - 12} to={bar(3 + i) + 6}>
					<YearCard y={y} i={i} />
				</Show>
			))}
			<Show from={bar(2) - 12} to={bar(6)}>
				<YearStamp />
			</Show>
			<Show from={bar(6) - 8} to={bar(7)} z={2}>
				<Thanks />
			</Show>
			<Show from={bar(7) - 8} to={DURATION} z={3}>
				<End />
			</Show>
			<Grain opacity={0.07} />
			<Sfx name="impact" at={0} volume={0.3} />
			<Sfx name="glitch" at={bar(1) - 7} volume={0.25} />
			<Music src={asset('music.wav')} volume={0.85} fadeOut={20} />
		</FilmShell>
	);
};
