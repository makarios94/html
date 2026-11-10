import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
import {ease, FilmProps, FilmShell, Grain, Music, prog, Sfx, Show, useLayout} from '../../kit';
import {asset, B, BARS, DURATION} from './config';
import {FONTS, GLYPHS, SERIF, theme} from './theme';

/*
 * Art Basel throwback (music-led, no voice). The 4th annual AssetLink Art Basel event flyer builds itself line by
 * line on the beat, pulls back into a printed poster (the memory), then a thank-you and the AssetLink end card.
 * Every word on screen comes from the event flyer in the user's Drive ("Art Basel", Canva, uploaded 17 Jul 2026).
 *
 * Bar 0 hook (legible on frame 0) | bar 1 "4th annual" + rule | bar 2 ART / BASEL / EVENT + rule
 * bar 3 date and time | bar 4 venue + logo | bar 5 pull back to a poster | bar 6 thank you | bar 7 end card.
 */

// The flyer sets its type in Glacial Indifference Bold (not on Google Fonts). Montserrat is the stand-in.
const FLYER = loadMontserrat('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;
const ALL_FONTS = [...FONTS, FLYER];

const bar = B.bar;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const WHITE = '#FFFFFF';
/** The flyer's purple border, sampled from the PDF. */
const FLYER_PURPLE = '#5A51A1';

type Sizes = {big: number; annual: number; detail: number; logoW: number; gap: number};
const useSizes = (): Sizes => {
	const L = useLayout();
	return L.pick<Sizes>(
		{
			vertical: {big: 150, annual: 50, detail: 44, logoW: 380, gap: 34},
			portrait: {big: 158, annual: 46, detail: 40, logoW: 360, gap: 30},
			square: {big: 116, annual: 36, detail: 32, logoW: 290, gap: 22},
		},
		{big: 150, annual: 46, detail: 40, logoW: 360, gap: 30},
	);
};

/** The flyer's marble, with a slow push so the ground is never still. */
const Marble: React.FC<{dim?: number}> = ({dim = 0}) => {
	const frame = useCurrentFrame();
	const s = interpolate(frame, [0, DURATION], [1.12, 1.24], clamp);
	const x = interpolate(frame, [0, DURATION], [0, -3], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: FLYER_PURPLE}}>
			<Img src={staticFile(asset('marble.jpg'))} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s.toFixed(4)}) translateX(${x.toFixed(3)}%)`}} />
			<AbsoluteFill style={{background: 'rgba(64,54,150,0.42)', mixBlendMode: 'multiply'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,8,40,0.38) 100%)'}} />
			{dim ? <AbsoluteFill style={{background: `rgba(8,8,30,${dim})`}} /> : null}
		</AbsoluteFill>
	);
};

/** A line that rises from behind a clipping edge. The settle lands on its beat (the move starts 3 frames early). */
const Line: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number}> = ({at, children, style, dur = 14}) => {
	const frame = useCurrentFrame();
	const p = prog(frame, at - 3, dur, ease.out);
	return (
		<div style={{overflow: 'hidden', paddingBottom: '0.06em', ...style}}>
			<div style={{transform: `translateY(${((1 - p) * 105).toFixed(2)}%)`, opacity: p > 0 ? 1 : 0}}>{children}</div>
		</div>
	);
};

/** The flyer's thin white rule, drawn left to right. */
const Rule: React.FC<{at: number; w: number}> = ({at, w}) => {
	const frame = useCurrentFrame();
	const {u} = useLayout();
	const p = prog(frame, at - 2, 16, ease.draw);
	return <div style={{width: w, height: 6 * u, background: WHITE, transform: `scaleX(${p.toFixed(4)})`, transformOrigin: 'left center'}} />;
};

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

// Bar 0: the hook. Fully legible on frame 0; on bar 1 it rewinds out (a quick skew and smear).
const Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const out = prog(frame, bar(1) - 7, 8, ease.in);
	const jitter = out > 0 && out < 1 ? Math.sin(frame * 2.7) * 16 * u : 0;
	const size = L.pick({vertical: 176, portrait: 196, square: 168}, 190);
	const sub = prog(frame, B.beat(2) - 3, 14, ease.out);
	return (
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
				}}
			>
				<div style={{...caps(size, u, '0.02em'), lineHeight: 0.92, textAlign: 'center'}}>
					THROW
					<br />
					BACK
				</div>
				<div style={{width: 520 * u, height: 6 * u, background: WHITE}} />
				<div style={{...caps(L.pick({vertical: 50, square: 42}, 46), u, '0.22em'), opacity: 0.6 + 0.4 * sub}}>Art Basel, Miami</div>
			</div>
		</AbsoluteFill>
	);
};

// Bars 1 to 4: the flyer, built one line per beat, left-aligned on the flyer's grid.
const Flyer: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const z = useSizes();
	const left = L.safe.left + 24 * u;
	const ruleW = L.width - left - L.safe.right - 24 * u;
	const logo = prog(frame, bar(4, 2) - 4, 22, ease.soft);
	const top = L.safe.top + L.pick({vertical: 40, portrait: 70, square: 24}, 50) * u;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left, top, display: 'flex', flexDirection: 'column', gap: z.gap * u}}>
				<Line at={bar(1)}>
					<div style={caps(z.annual, u, '0.2em')}>
						4<sup style={{fontSize: '0.55em', verticalAlign: '0.6em', letterSpacing: '0.1em'}}>TH</sup> ANNUAL
					</div>
				</Line>
				<Rule at={bar(1, 1)} w={ruleW} />
				<div style={{display: 'flex', flexDirection: 'column', gap: z.gap * 0.15 * u}}>
					<Line at={bar(2, 0)}><div style={caps(z.big, u, '0.14em')}>Art</div></Line>
					<Line at={bar(2, 1)}><div style={caps(z.big, u, '0.14em')}>Basel</div></Line>
					<Line at={bar(2, 2)}><div style={caps(z.big, u, '0.14em')}>Event</div></Line>
				</div>
				<Rule at={bar(2, 3)} w={ruleW} />
				<div style={{display: 'flex', flexDirection: 'column', gap: z.detail * 0.35 * u, marginTop: z.gap * 0.3 * u}}>
					<Line at={bar(3, 0)}><div style={caps(z.detail, u, '0.2em')}>Dec 4</div></Line>
					<Line at={bar(3, 1)}><div style={caps(z.detail, u, '0.2em')}>5 PM - 7:30 PM</div></Line>
				</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: z.detail * 0.35 * u, marginTop: z.gap * 0.6 * u}}>
					<Line at={bar(4, 0)}><div style={caps(z.detail, u, '0.2em')}>Casa Neos</div></Line>
					<Line at={bar(4, 1)}><div style={caps(z.detail, u, '0.2em')}>Miami, Florida</div></Line>
				</div>
			</div>
			{/* The official white lockup, lifted from the flyer PDF itself. */}
			<div style={{position: 'absolute', left: 0, right: 0, bottom: L.safe.bottom + L.pick({vertical: 10, square: 6}, 20) * u, display: 'flex', justifyContent: 'center', opacity: logo, transform: `translateY(${((1 - logo) * 18 * u).toFixed(2)}px)`}}>
				<Img src={staticFile(asset('assetlink-lockup-white.png'))} style={{width: z.logoW * u}} />
			</div>
			<Sfx name="pop-low" at={bar(1) - 2} volume={0.3} />
			<Sfx name="swish" at={bar(1, 1) - 2} volume={0.22} />
			{[0, 1, 2].map((b) => (
				<Sfx key={b} name="thud" at={bar(2, b) - 2} volume={0.34} pitch={1 + b * 0.05} />
			))}
			<Sfx name="swish" at={bar(2, 3) - 2} volume={0.22} />
			<Sfx name="tick" at={bar(3, 0) - 2} volume={0.3} />
			<Sfx name="tick" at={bar(3, 1) - 2} volume={0.3} pitch={1.08} />
			<Sfx name="tick" at={bar(4, 0) - 2} volume={0.3} />
			<Sfx name="tick" at={bar(4, 1) - 2} volume={0.3} pitch={1.08} />
			<Sfx name="chime" at={bar(4, 2)} volume={0.25} />
		</AbsoluteFill>
	);
};

/**
 * Bars 0 to 6: the flyer world (marble, hook, flyer). On bar 5 the whole world pulls back into a printed poster with a
 * white border and a slight tilt, over a darker ground: the event becomes a memory.
 */
const PosterWorld: React.FC = () => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const pull = prog(frame, bar(5) - 6, 26, ease.inOut);
	const settle = prog(frame, bar(5) + 20, bar(7) - bar(5) - 20, ease.linear);
	const target = L.pick({vertical: 0.56, portrait: 0.58, square: 0.6}, 0.58);
	const scale = 1 - (1 - target) * pull - 0.015 * settle;
	const rot = -3.2 * pull + 0.8 * settle;
	const cy = L.pick({vertical: -0.11, portrait: -0.1, square: -0.1}, -0.1);
	const ty = cy * L.height * pull;
	const border = 22 * u * pull;
	return (
		<AbsoluteFill>
			<Marble dim={0.62 * pull} />
			<AbsoluteFill
				style={{
					transform: `translateY(${ty.toFixed(2)}px) scale(${scale.toFixed(4)}) rotate(${rot.toFixed(3)}deg)`,
					boxShadow: pull > 0 ? `0 ${40 * u}px ${120 * u}px rgba(0,0,0,${(0.55 * pull).toFixed(3)})` : undefined,
					outline: pull > 0 ? `${(border / scale).toFixed(2)}px solid ${WHITE}` : undefined,
					overflow: 'hidden',
				}}
			>
				<Marble />
				<Show from={0} to={bar(1)}>
					<Hook />
				</Show>
				<Show from={bar(1) - 4} to={bar(7)}>
					<Flyer />
				</Show>
			</AbsoluteFill>
			<Sfx name="whoosh" at={bar(5) - 6} volume={0.35} />
			<Sfx name="card" at={bar(5) + 16} volume={0.3} />
		</AbsoluteFill>
	);
};

// Bar 6: the thank-you under the poster, one phrase per beat.
const Thanks: React.FC = () => {
	const L = useLayout();
	const u = L.u;
	const size = L.pick({vertical: 72, portrait: 68, square: 54}, 64);
	const bottom = L.safe.bottom + L.pick({vertical: 0, portrait: 20, square: 0}, 10) * u;
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: bottom}}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * u, textAlign: 'center'}}>
				<Line at={bar(6, 0)}>
					<div style={{fontFamily: SERIF, fontSize: size * u, color: WHITE, lineHeight: 1.15}}>Thank you to everyone</div>
				</Line>
				<Line at={bar(6, 1)}>
					<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: size * u, color: WHITE, lineHeight: 1.15}}>who came.</div>
				</Line>
			</div>
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
					<div style={{...caps(L.pick({vertical: 34, square: 30}, 32), u, '0.2em', 500), opacity: 0.85 * url, transform: `translateY(${((1 - url) * 14 * u).toFixed(2)}px)`}}>assetlink.ai</div>
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
			<Show from={0} to={bar(7) + 8}>
				<PosterWorld />
			</Show>
			<Show from={bar(6) - 4} to={bar(7)} z={2}>
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
