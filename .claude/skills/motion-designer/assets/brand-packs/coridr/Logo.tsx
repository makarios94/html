import React, {useId, useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLength} from '@remotion/paths';
import {useLayout} from '../../kit';
import {theme} from './theme';

/*
 * The approved Coridr logo reveal, ported frame-accurately from coridr-logo-reveal.html
 * (spec: coridr-logo-reveal-prompt.md). 4.6 s. Strong ease-outs, overlapping beats, one accent
 * (the light through the door), no bounce, no extra particles or colour. Do not "improve" it:
 * the founder approved this beat for beat. `speed` exists only for cutdowns and needs their OK.
 */

export const BODY =
	'M65.65 0L51.85 0C50.82 0 50 0.83 50 1.85L50 10.35C28.13 10.39 10.41 28.12 10.41 50C10.41 71.88 28.13 89.61 50 89.65L50 98.15C50 99.17 50.82 100 51.85 100L65.65 100C78.83 100 89.52 89.32 89.52 76.14L51.91 76.14C50.89 76.14 50.06 75.31 50.06 74.28L50.06 25.72C50.06 24.69 50.89 23.86 51.91 23.86L89.52 23.86C89.52 10.68 78.83 0 65.65 0Z';
export const DOOR = 'M71.64 39.33L71.64 60.46C71.64 61.19 72.07 61.86 72.74 62.15L89.52 69.65L89.52 30.14L72.74 37.64C72.07 37.94 71.64 38.6 71.64 39.33Z';

const CSS_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const DRAW = Easing.bezier(0.45, 0, 0.25, 1);
const BLOOM = Easing.bezier(0.3, 0.6, 0.2, 1);
const RISE = Easing.bezier(0.2, 0.75, 0.2, 1);
const SETTLE = Easing.bezier(0.2, 0.7, 0.2, 1);

const seg = (t: number, start: number, dur: number, easing: (x: number) => number) =>
	interpolate(t, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** CSS-style keyframes: the timing function applies to each interval, as in the browser. */
const keys = (t: number, start: number, dur: number, stops: [number, number][], easing: (x: number) => number) => {
	const x = (t - start) / dur;
	if (x <= stops[0][0]) return stops[0][1];
	for (let i = 0; i < stops.length - 1; i++) {
		const [o0, v0] = stops[i];
		const [o1, v1] = stops[i + 1];
		if (x <= o1) return v0 + (v1 - v0) * easing((x - o0) / (o1 - o0));
	}
	return stops[stops.length - 1][1];
};

const colorsFor = (dark: boolean) =>
	dark
		? {body: '#F7F7F7', door: '#2D9AD6', word: '#F2F6FC', spot: '#0A2246', glow: 'rgba(45,154,214,0.20)', vig: 0.42}
		: {body: '#042154', door: '#2D9AD6', word: '#042154', spot: '#FFFFFF', glow: 'rgba(4,33,84,0.06)', vig: 0};

/** The static mark (for app icons in notifications, small lockups). */
export const Mark: React.FC<{dark?: boolean}> = ({dark = false}) => {
	const c = colorsFor(dark);
	return (
		<svg viewBox="0 0 100 100" width="100%" height="100%" style={{overflow: 'visible'}}>
			<path d={BODY} fill={c.body} />
			<path d={DOOR} fill={c.door} />
		</svg>
	);
};

/** Length of the approved reveal in seconds; its final frame is the static lockup. */
export const REVEAL_SECONDS = 4.6;

type RevealProps = {at: number; dark?: boolean; size?: number; speed?: number; hold?: boolean};

/**
 * The lockup with the approved reveal. size = wordmark size in design px (58 in the spec at 130 px mark).
 * hold = show the final frame whatever the time (a <Freeze> cannot reach past the end of a short composition).
 */
export const CoridrReveal: React.FC<RevealProps> = ({at, dark = false, size = 116, speed = 1, hold = false}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {u} = useLayout();
	const id = useId().replace(/[^a-zA-Z0-9]/g, '');
	const len = useMemo(() => getLength(BODY), []);
	const c = colorsFor(dark);
	const t = hold ? REVEAL_SECONDS : ((frame - at) / fps) * speed;
	const k = (size / 58) * u; // spec px -> output px
	const markScale = 0.9 + 0.1 * seg(t, 0, 1.25, OUT);
	const drawn = seg(t, 0.35, 0.82, DRAW);
	const strokeOpacity = t < 0.35 ? 0 : 1 - seg(t, 1.2, 0.34, CSS_EASE);
	const fillOpacity = seg(t, 0.98, 0.55, CSS_EASE);
	const door = seg(t, 1.5, 0.66, OUT);
	const bloomO = keys(t, 1.6, 1.5, [[0, 0], [0.38, 0.62], [1, 0.16]], BLOOM);
	const bloomS = keys(t, 1.6, 1.5, [[0, 0.55], [0.38, 1.02], [1, 1]], BLOOM);
	// The approved HTML has no base scale on the lockup: it sits at 1.0 until 3.55 s, then settles from 1.014.
	const lock = t < 3.55 ? 1 : 1.014 - 0.014 * seg(t, 3.55, 0.9, SETTLE);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 24 * k, transform: `scale(${lock.toFixed(5)})`}}>
			<svg viewBox="0 0 100 100" width={130 * k} height={130 * k} style={{overflow: 'visible', transform: `scale(${markScale.toFixed(5)})`}}>
				<defs>
					<radialGradient id={`bloom${id}`} cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor="#eaf6fd" stopOpacity={1} />
						<stop offset="34%" stopColor="#2d9ad6" stopOpacity={0.72} />
						<stop offset="100%" stopColor="#2d9ad6" stopOpacity={0} />
					</radialGradient>
				</defs>
				<rect x={42} y={10} width={82} height={80} fill={`url(#bloom${id})`} opacity={bloomO} style={{transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${bloomS.toFixed(5)})`}} />
				<path d={BODY} fill={c.body} opacity={fillOpacity} />
				<path d={DOOR} fill={c.door} style={{transformBox: 'fill-box', transformOrigin: 'left center', transform: `scaleX(${door.toFixed(5)})`}} />
				<path d={BODY} fill="none" stroke={c.body} strokeWidth={2.1} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - drawn)} opacity={strokeOpacity} />
			</svg>
			<div style={{fontFamily: theme.fonts.display, fontWeight: 600, fontSize: 58 * k, letterSpacing: '-0.012em', lineHeight: 0.96, color: c.word, display: 'flex'}}>
				{[...'Coridr'].map((ch, i) => {
					const p = seg(t, 2.55 + 0.065 * i, 0.62, RISE);
					return (
						<span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${((1 - p) * 14 * k).toFixed(2)}px)`, filter: p < 0.999 ? `blur(${((1 - p) * 9 * k).toFixed(2)}px)` : undefined}}>
							{ch}
						</span>
					);
				})}
			</div>
		</div>
	);
};

/** The reveal's full-frame atmosphere (spotlight, ambient glow, vignette on dark). Put it behind the lockup. */
export const CoridrAtmosphere: React.FC<{at: number; dark?: boolean; speed?: number; hold?: boolean}> = ({at, dark = false, speed = 1, hold = false}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const c = colorsFor(dark);
	const t = hold ? REVEAL_SECONDS : ((frame - at) / fps) * speed;
	const atmos = keys(t, 0, 4.6, [[0, 0], [0.34, 0.9], [0.62, 1], [1, 0.62]], CSS_EASE);
	const ambient = keys(t, 0, 4.6, [[0, 0], [0.4, 1], [1, 0.8]], CSS_EASE);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{opacity: atmos, background: `radial-gradient(58% 62% at 60% 48%, ${c.spot} 0%, transparent 62%)`}} />
			<AbsoluteFill style={{opacity: ambient, background: `radial-gradient(42% 46% at 60% 50%, ${c.glow} 0%, transparent 72%)`}} />
			{c.vig ? <AbsoluteFill style={{opacity: c.vig, background: 'radial-gradient(125% 125% at 50% 46%, transparent 52%, rgba(0,0,0,0.55) 100%)'}} /> : null}
		</AbsoluteFill>
	);
};

/**
 * The reveal's final frame, held: the static lockup for a second appearance (an end card after an earlier reveal).
 * dark = the Reversed cut (snow body, Bell door, #F2F6FC wordmark) for Deep Navy and #030D24 grounds. Fade it with a parent.
 */
export const Lockup: React.FC<{dark?: boolean; size?: number}> = ({dark = false, size = 116}) => (
	<CoridrReveal at={0} dark={dark} size={size} hold />
);

/** The shape every film's Logo has, so this pack can replace an example's logo. onBrand = on a navy/dark ground. */
export const Logo: React.FC<{at: number; onBrand?: boolean; size?: number}> = ({at, onBrand = false, size = 116}) => <CoridrReveal at={at} dark={onBrand} size={size} />;
