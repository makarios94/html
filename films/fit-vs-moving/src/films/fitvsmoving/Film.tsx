import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ease, FilmProps, FilmShell, Music, prog, Sfx, useLayout} from '../../kit';
import {asset} from './config';
import {Mark} from './Logo';
import {ARIMO, CAROUSEL_NIGHT, FOG, FONTS, GLYPHS, INDIGO, INK, SKY, theme, VIOLET} from './theme';

/*
 * "Fit vs moving", from the 18 Nov 2026 LinkedIn carousel. Copy is the carousel's, word for word; the UI words
 * (advisor names, fit reasons, alert chips) are fictional demo data, and a fit is shown as reasons, never a score.
 * 120 BPM: a beat is 15 frames, a bar 60.
 *
 *   0-240    A list of advisors who fit, but aren't moving.   A clean list; every signal line draws flat.
 *   240-480  Alerts about advisors who move, but don't fit.   Alerts pile in on the beat, each with a "not a fit" chip.
 *   480-660  AssetLink shows both (on the drop).                    The list returns with "Why they fit" and "Signal":
 *                                                             two rows start moving and get "May be moving".
 *   660-780  Who fits and who may be moving. / Know who, why and when. / Book a demo, the mark assembles.
 * Each scene change is a wipe made of the carousel's diagonal bars.
 */

export const DURATION_FVM = 780;
const ANGLE = -30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------------------------------------------------------------------------------------------------- the bars

type Bar = {x: number; y: number; len: number; th: number};
/** Carousel bar sets, measured from the PDF pages (design px on a 1080-wide page, centre and length). */
const BARS_1: Bar[] = [
	{x: 721, y: 84, len: 340, th: 55},
	{x: 768, y: 163, len: 672, th: 55},
	{x: 912, y: 187, len: 387, th: 55},
	{x: 870, y: 317, len: 483, th: 55},
];
const BRICKS: Bar[] = [
	[541, 280, 210], [508, 410, 210], [758, 155, 190], [725, 285, 190], [682, 420, 210], [712, 512, 210],
	[945, 158, 300], [897, 295, 190], [928, 390, 190], [965, 60, 230], [1056, 195, 180], [1071, 298, 150],
].map(([x, y, len]) => ({x: x * 0.96, y: y * 0.96, len: len * 0.96, th: 53}));
const BARS_4: Bar[] = [
	{x: 770, y: 125, len: 576, th: 48},
	{x: 926, y: 123, len: 350, th: 48},
	{x: 883, y: 254, len: 451, th: 48},
];

/**
 * A set of the carousel's bars, anchored to the top-right corner. Each bar slides in along its own axis.
 * drift: px per frame along the axis, with a wobble (the bars that move). jitter: a nervous shake.
 */
const Bars: React.FC<{bars: Bar[]; fill: string; at: number; until?: number; drift?: number; jitter?: number; stagger?: number}> = ({bars, fill, at, until = 1e9, drift = 0, jitter = 0, stagger = 3}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	if (frame < at - 2 || frame >= until) return null;
	const k = L.pick({vertical: 0.85, portrait: 0.62, square: 0.5}, 0.6) * L.u;
	const rad = (ANGLE * Math.PI) / 180;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{bars.map((b, i) => {
				const p = prog(frame, at + i * stagger, 16, ease.out);
				const along = (1 - p) * 900 + (drift ? Math.sin((frame + i * 37) / 23) * drift * 18 + ((frame * drift + i * 53) % 60) - 30 : 0);
				const shake = jitter ? Math.sin(frame * 1.7 + i * 2.1) * jitter : 0;
				const cx = L.width - (1080 - b.x) * k + Math.cos(rad) * along * k;
				const cy = b.y * k + Math.sin(rad) * along * k + shake * k;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: cx - (b.len * k) / 2,
							top: cy - (b.th * k) / 2,
							width: b.len * k,
							height: b.th * k,
							background: fill,
							transform: `rotate(${ANGLE}deg)`,
							opacity: Math.min(1, p * 1.5),
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Scene change: diagonal bars sweep across and cover the frame, then sweep on and uncover the next scene. */
const BarWipe: React.FC<{at: number; fill: string; n?: number}> = ({at, fill, n = 7}) => {
	const frame = useCurrentFrame();
	if (frame < at || frame > at + 40) return null;
	return (
		<AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: '50%', top: '50%', width: '260%', height: '260%', transform: `translate(-50%, -50%) rotate(${ANGLE}deg)`}}>
				{Array.from({length: n}, (_, i) => {
					// Every strip is in by at + 15 and none leaves before at + 16: the swap at at + 15 is never seen.
					const cover = prog(frame, at + i, 9, ease.inOut);
					const leave = prog(frame, at + 16 + i, 11, ease.inOut);
					const x = -100 + cover * 100 + leave * 100;
					return <div key={i} style={{position: 'absolute', left: 0, top: `${(i * 100) / n}%`, width: '100%', height: `${100 / n + 0.4}%`, background: fill, transform: `translateX(${x.toFixed(2)}%)`}} />;
				})}
			</div>
		</AbsoluteFill>
	);
};
/** The frame at which a BarWipe fully covers the screen (swap scenes here). */
const wipeMid = (at: number) => at + 15;

// ---------------------------------------------------------------------------------------------------- headline

/** accentFrom: the word index where the accent colour starts; accentAt: when those words land (defaults to the line's). */
type HLine = {text: string; at: number; color?: string; accentFrom?: number; accentAt?: number; accent?: string};
/** The carousel headline: each word rises out of a mask; at exitAt the lines lift away one after another. */
const Headline: React.FC<{lines: HLine[]; exitAt: number; top: number; size: number; color?: string; maxW?: number}> = ({lines, exitAt, top, size, color = INK, maxW}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	return (
		<div style={{position: 'absolute', left: L.safe.left, top, width: maxW ?? L.width - 2 * L.safe.left}}>
			{lines.map((ln, li) => {
				const out = prog(frame, exitAt + li * 2, 10, ease.in);
				const words = ln.text.split(' ');
				return (
					<div key={li} style={{overflow: 'hidden', paddingBottom: size * 0.12, marginBottom: -size * 0.12}}>
						<div style={{fontFamily: theme.fonts.display, fontWeight: 600, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.025em', color: ln.color ?? color, whiteSpace: 'nowrap', transform: `translateY(${(-out * 110).toFixed(1)}%)`, opacity: 1 - out * 0.4}}>
							{words.map((w, wi) => {
								const acc = ln.accentFrom !== undefined && wi >= ln.accentFrom;
								const p = prog(frame, (acc && ln.accentAt !== undefined ? ln.accentAt + (wi - (ln.accentFrom ?? 0)) * 3 : ln.at + wi * 3), 13, ease.out);
								return (
									<span key={wi} style={{display: 'inline-block', whiteSpace: 'pre', color: acc ? ln.accent ?? VIOLET : undefined, transform: `translateY(${((1 - p) * 105).toFixed(1)}%)`}}>
										{w + (wi < words.length - 1 ? ' ' : '')}
									</span>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------- icons

const Check: React.FC<{s: number; color?: string}> = ({s, color = VIOLET}) => (
	<svg width={s} height={s} viewBox="0 0 20 20" style={{flex: 'none'}}>
		<polyline points="4,10.5 8.5,15 16,5.5" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const Cross: React.FC<{s: number; color?: string}> = ({s, color = 'rgba(9,12,54,0.55)'}) => (
	<svg width={s} height={s} viewBox="0 0 20 20" style={{flex: 'none'}}>
		<path d="M5.5 5.5 L14.5 14.5 M14.5 5.5 L5.5 14.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
	</svg>
);
const Bell: React.FC<{s: number}> = ({s}) => (
	<svg width={s} height={s} viewBox="0 0 24 24" style={{flex: 'none'}}>
		<path d="M12 3.5c-3.3 0-5.6 2.5-5.6 5.8v3.6L4.8 16h14.4l-1.6-3.1V9.3c0-3.3-2.3-5.8-5.6-5.8z" fill="#FFFFFF" />
		<circle cx="12" cy="18.6" r="2" fill="#FFFFFF" />
	</svg>
);

// ---------------------------------------------------------------------------------------------------- the list

type Row = {name: string; initials: string; fit: [string, string]; moves?: number};
const ROWS: Row[] = [
	{name: 'Dana Whitfield', initials: 'DW', fit: ['CFP', '12 yrs at one firm']},
	{name: 'Marcus Bell', initials: 'MB', fit: ['Independent RIA', 'Northeast'], moves: 0},
	{name: 'Priya Raman', initials: 'PR', fit: ['CFP', 'Hybrid channel']},
	{name: 'Owen Hart', initials: 'OH', fit: ['Wirehouse', 'Texas'], moves: 1},
];

type Sizes = {rowH: number; name: number; chip: number; sig: number; pad: number; head: number};
const useSizes = (): Sizes => {
	const L = useLayout();
	const u = L.u;
	const s = L.pick<Sizes>(
		{
			vertical: {rowH: 150, name: 36, chip: 23, sig: 220, pad: 32, head: 66},
			portrait: {rowH: 112, name: 29, chip: 19, sig: 190, pad: 26, head: 56},
			square: {rowH: 100, name: 26, chip: 17, sig: 170, pad: 22, head: 50},
		},
		{rowH: 104, name: 25, chip: 16, sig: 180, pad: 24, head: 54},
	);
	return {rowH: s.rowH * u, name: s.name * u, chip: s.chip * u, sig: s.sig * u, pad: s.pad * u, head: s.head * u};
};

/** Where the card and the alert stack sit, per shape. */
const useFrameBox = () => {
	const L = useLayout();
	const u = L.u;
	const headTop = L.pick({vertical: 470, portrait: 340, square: 72}, 320) * u;
	const headSize = L.pick({vertical: 78, portrait: 68, square: 56}, 68) * u;
	const cardTop = headTop + headSize * 1.08 * 3 + L.pick({vertical: 60, portrait: 40, square: 36}, 40) * u;
	const left = L.safe.left;
	const width = L.width - left - L.pick({vertical: 120, portrait: 72, square: 72}, 72) * u;
	return {headTop, headSize, cardTop, left, width};
};

/** The signal line: flat (no change) or rising with a pulse at its head (may be moving). */
const Signal: React.FC<{w: number; h: number; drawAt: number; moveAt?: number}> = ({w, h, drawAt, moveAt}) => {
	const frame = useCurrentFrame();
	const draw = prog(frame, drawAt, 26, ease.inOut);
	const m = moveAt === undefined ? 0 : prog(frame, moveAt, 18, ease.out);
	const n = 24;
	const pts = Array.from({length: n + 1}, (_, i) => {
		const t = i / n;
		const rise = t > 0.55 ? Math.pow((t - 0.55) / 0.45, 1.6) : 0;
		const wob = Math.sin(t * 19 + frame * 0.25) * 0.08 * t;
		const y = h * 0.62 - m * (rise * h * 0.5 + wob * h);
		return [t * w, y] as const;
	});
	const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
	const len = w * 1.3;
	const head = pts[n];
	const pulse = m > 0 ? 0.5 + 0.5 * Math.sin(frame * 0.3) : 0;
	return (
		<svg width={w} height={h} style={{overflow: 'visible', flex: 'none'}}>
			<defs>
				<linearGradient id={`sig${drawAt}`} gradientUnits="userSpaceOnUse" x1={0} x2={w} y1={0} y2={0}>
					<stop offset="0" stopColor="#A9A6C6" />
					<stop offset="0.55" stopColor="#A9A6C6" />
					<stop offset="1" stopColor={m > 0 ? VIOLET : '#A9A6C6'} />
				</linearGradient>
			</defs>
			<path d={d} fill="none" stroke={`url(#sig${drawAt})`} strokeWidth={h * 0.11} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={(1 - draw) * len} />
			{m > 0 ? (
				<>
					<circle cx={head[0]} cy={head[1]} r={h * (0.16 + 0.14 * pulse)} fill={SKY} opacity={0.25 * m} />
					<circle cx={head[0]} cy={head[1]} r={h * 0.1} fill={SKY} opacity={m} />
				</>
			) : (
				<circle cx={head[0]} cy={head[1]} r={h * 0.09} fill="#A9A6C6" opacity={draw > 0.97 ? 1 : 0} />
			)}
		</svg>
	);
};

/** One advisor row: initials, name, two fit reasons with ticks, and the signal line. */
const AdvisorRow: React.FC<{row: Row; i: number; at: number; chipsAt: number; drawAt: number; moveAt?: number; quietAt?: number; both: boolean}> = ({row, i, at, chipsAt, drawAt, moveAt, quietAt, both}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const S = useSizes();
	const p = prog(frame, at, 14, ease.out);
	const moving = moveAt !== undefined;
	const lit = moving ? prog(frame, moveAt, 14, ease.out) : 0;
	const tag = moving ? prog(frame, moveAt + 8, 12, ease.out) : 0;
	const quiet = quietAt !== undefined ? prog(frame, quietAt, 12, ease.out) : 0;
	const av = S.rowH * 0.44;
	return (
		<div style={{position: 'relative', height: S.rowH, display: 'flex', alignItems: 'center', gap: S.pad * 0.7, padding: `0 ${S.pad}px`, borderTop: i ? `${Math.max(1, L.u)}px solid #ECEBF4` : 'none', opacity: p, transform: `translateY(${((1 - p) * 24 * L.u).toFixed(1)}px)`, background: `rgba(91,51,230,${(0.06 * lit).toFixed(3)})`}}>
			<div style={{position: 'absolute', left: 0, top: S.rowH * 0.18, bottom: S.rowH * 0.18, width: 5 * L.u, background: VIOLET, transform: `scaleY(${lit})`, borderRadius: 3 * L.u}} />
			<div style={{width: av, height: av, borderRadius: '50%', flex: 'none', background: 'linear-gradient(135deg, #ECE6FF, #DCE9FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fonts.body, fontWeight: 600, fontSize: av * 0.36, color: VIOLET, letterSpacing: '0.02em'}}>{row.initials}</div>
			<div style={{flex: 1, minWidth: 0}}>
				<div style={{fontFamily: theme.fonts.body, fontWeight: 600, fontSize: S.name, color: INK, lineHeight: 1.2}}>{row.name}</div>
				<div style={{display: 'flex', gap: S.chip * 0.5, marginTop: S.chip * 0.45}}>
					{row.fit.map((c, ci) => {
						const cp = prog(frame, chipsAt + ci * 4, 10, ease.out);
						return (
							<div key={c} style={{display: 'flex', alignItems: 'center', gap: S.chip * 0.25, padding: `${S.chip * 0.25}px ${S.chip * 0.55}px ${S.chip * 0.25}px ${S.chip * 0.35}px`, borderRadius: S.chip * 0.4, background: '#F1EEFD', fontFamily: theme.fonts.body, fontWeight: 500, fontSize: S.chip, color: 'rgba(9,12,54,0.78)', whiteSpace: 'nowrap', opacity: cp, transform: `scale(${(0.85 + 0.15 * cp).toFixed(3)})`, transformOrigin: 'left center'}}>
								<Check s={S.chip * 1.05} />
								{c}
							</div>
						);
					})}
				</div>
			</div>
			<div style={{width: S.sig, flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: S.chip * 0.2}}>
				<Signal w={S.sig} h={S.rowH * 0.34} drawAt={drawAt} moveAt={moveAt} />
				<div style={{height: S.chip * 1.5, display: 'flex', alignItems: 'center'}}>
					{moving ? (
						<div style={{padding: `${S.chip * 0.18}px ${S.chip * 0.6}px`, borderRadius: S.chip, background: SKY, color: '#FFFFFF', fontFamily: theme.fonts.body, fontWeight: 600, fontSize: S.chip * 0.92, whiteSpace: 'nowrap', opacity: tag, transform: `scale(${(0.7 + 0.3 * tag).toFixed(3)})`, transformOrigin: 'right center'}}>May be moving</div>
					) : (
						<div style={{fontFamily: theme.fonts.body, fontWeight: 500, fontSize: S.chip * 0.92, color: 'rgba(9,12,54,0.45)', opacity: both ? 0 : quiet, whiteSpace: 'nowrap'}}>No change</div>
					)}
				</div>
			</div>
		</div>
	);
};

const ListCard: React.FC<{at: number; both?: boolean; rowsAt: number[]; chipsAt: number[]; drawAt: number[]; moveAt?: (number | undefined)[]; quietAt?: number; exitAt?: number; dim?: number}> = ({at, both = false, rowsAt, chipsAt, drawAt, moveAt = [], quietAt, exitAt = 1e9, dim = 0}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const S = useSizes();
	const box = useFrameBox();
	const p = prog(frame, at, 16, ease.out);
	const out = prog(frame, exitAt, 12, ease.in);
	const label: React.CSSProperties = {fontFamily: theme.fonts.body, fontWeight: 600, fontSize: S.chip * 0.86, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(9,12,54,0.5)'};
	return (
		<div
			style={{
				position: 'absolute',
				left: box.left,
				top: box.cardTop,
				width: box.width,
				background: '#FFFFFF',
				borderRadius: 18 * L.u,
				border: `${Math.max(1, 1.5 * L.u)}px solid #E3E1EF`,
				boxShadow: `0 ${24 * L.u}px ${60 * L.u}px rgba(9,12,54,0.10), 0 ${3 * L.u}px ${10 * L.u}px rgba(9,12,54,0.06)`,
				overflow: 'hidden',
				opacity: p * (1 - out),
				transform: `translateY(${((1 - p) * 70 * L.u + out * 40 * L.u).toFixed(1)}px)`,
				filter: dim ? `saturate(${1 - 0.6 * dim})` : undefined,
			}}
		>
			<div style={{height: S.head, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${S.pad}px`, borderBottom: `${Math.max(1, L.u)}px solid #ECEBF4`, background: '#FAFAFD'}}>
				<span style={label}>{both ? 'Why they fit' : 'Your list'}</span>
				<span style={label}>Signal</span>
			</div>
			{ROWS.map((r, i) => (
				<AdvisorRow key={r.name} row={r} i={i} at={rowsAt[i]} chipsAt={chipsAt[i]} drawAt={drawAt[i]} moveAt={moveAt[i]} quietAt={quietAt === undefined ? undefined : quietAt + i * 4} both={both} />
			))}
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------- the alerts

type Alert = {who: string; why: string};
const ALERTS: Alert[] = [
	{who: 'J. Moreno', why: 'Wrong channel'},
	{who: 'K. Okafor', why: 'Outside your region'},
	{who: 'S. Brooks', why: 'Below your AUM range'},
	{who: 'L. Tran', why: 'Wrong channel'},
	{who: 'A. Fischer', why: 'Outside your region'},
];

/** Alerts drop in from above, newest on top, pushing the older ones down; at flagAt every "not a fit" chip lights. */
const AlertStack: React.FC<{at: number[]; flagAt: number; exitAt: number}> = ({at, flagAt, exitAt}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const S = useSizes();
	const box = useFrameBox();
	const h = S.rowH * 0.92;
	const gap = h * 0.32;
	const flag = prog(frame, flagAt, 10, ease.out);
	return (
		<div style={{position: 'absolute', left: box.left, top: box.cardTop, width: box.width}}>
			{ALERTS.map((a, i) => {
				if (frame < at[i] - 1) return null;
				const p = prog(frame, at[i], 12, ease.out);
				// How many arrived after this one: each pushes it one slot down.
				const below = at.slice(i + 1).reduce((n, t) => n + prog(frame, t, 12, ease.out), 0);
				const out = prog(frame, exitAt + (ALERTS.length - 1 - i) * 2, 14, ease.in);
				const rot = (i % 2 ? 1 : -1) * (1.2 + (i % 3) * 0.6) * (1 - p * 0.4) + Math.sin(frame * 0.9 + i) * 0.5 * flag;
				const x = (i % 2 ? 1 : -1) * (10 + (i % 3) * 8) * L.u;
				const y = below * (h + gap) - (1 - p) * 140 * L.u + out * 900 * L.u;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							width: box.width,
							height: h,
							zIndex: i,
							display: 'flex',
							alignItems: 'center',
							gap: S.pad * 0.6,
							padding: `0 ${S.pad}px`,
							background: '#FFFFFF',
							borderRadius: 16 * L.u,
							border: `${Math.max(1, 1.5 * L.u)}px solid #E3E1EF`,
							boxShadow: `0 ${16 * L.u}px ${40 * L.u}px rgba(9,12,54,0.13)`,
							opacity: p * (1 - out),
							transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(rot + out * 14).toFixed(2)}deg)`,
						}}
					>
						<div style={{width: h * 0.46, height: h * 0.46, borderRadius: '50%', background: VIOLET, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
							<Bell s={h * 0.26} />
						</div>
						<div style={{flex: 1, minWidth: 0}}>
							<div style={{fontFamily: theme.fonts.body, fontWeight: 600, fontSize: S.name * 0.92, color: INK, lineHeight: 1.2}}>Changed firms</div>
							<div style={{fontFamily: theme.fonts.body, fontWeight: 400, fontSize: S.chip, color: 'rgba(9,12,54,0.55)', marginTop: S.chip * 0.2}}>{a.who} · Today</div>
						</div>
						<div style={{display: 'flex', alignItems: 'center', gap: S.chip * 0.25, padding: `${S.chip * 0.3}px ${S.chip * 0.6}px ${S.chip * 0.3}px ${S.chip * 0.4}px`, borderRadius: S.chip * 0.4, background: `rgba(91,51,230,${(0.1 * flag).toFixed(3)})`, border: `${Math.max(1, 1.5 * L.u)}px solid rgba(91,51,230,${(0.15 + 0.6 * flag).toFixed(3)})`, fontFamily: theme.fonts.body, fontWeight: 500, fontSize: S.chip, color: flag > 0.5 ? VIOLET : 'rgba(9,12,54,0.62)', whiteSpace: 'nowrap', flex: 'none'}}>
							<Cross s={S.chip * 1.05} color={flag > 0.5 ? VIOLET : undefined} />
							{a.why}
						</div>
					</div>
				);
			})}
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------- the CTA

const Cursor: React.FC<{s: number}> = ({s}) => (
	<svg width={s} height={s * 1.3} viewBox="0 0 20 26">
		<path d="M2 2 L2 21 L7 16.5 L10.5 24 L13.6 22.6 L10.2 15.2 L17 15.2 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
	</svg>
);

const BARS_MARK = 6;
/** The mark, its bars sliding in one by one along the logo's own diagonals, then the wordmark tracks in. */
const Lockup: React.FC<{at: number; size: number}> = ({at, size}) => {
	const frame = useCurrentFrame();
	const word = prog(frame, at + BARS_MARK * 3 + 4, 18, ease.out);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: size * 0.32}}>
			<div style={{position: 'relative', width: size, height: size * 1.14}}>
				{Array.from({length: BARS_MARK}, (_, i) => {
					const p = prog(frame, at + i * 3, 14, ease.out);
					const clip = `inset(${i * (100 / BARS_MARK)}% 0 ${100 - (i + 1) * (100 / BARS_MARK)}% 0)`;
					return (
						<div key={i} style={{position: 'absolute', inset: 0, clipPath: clip, transform: `translate(${((1 - p) * -40).toFixed(1)}%, ${((1 - p) * 23).toFixed(1)}%)`, opacity: p}}>
							<Mark mono="#FFFFFF" />
						</div>
					);
				})}
			</div>
			<span style={{fontFamily: theme.fonts.display, fontWeight: 300, fontSize: size * 0.56, letterSpacing: `${(0.22 + (1 - word) * 0.3).toFixed(3)}em`, color: '#FFFFFF', opacity: word}}>ASSETLINK</span>
		</div>
	);
};

const CTA: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const box = useFrameBox();
	if (frame < at) return null;
	const size = L.pick({vertical: 92, portrait: 78, square: 64}, 76) * u;
	const top = L.pick({vertical: 560, portrait: 380, square: 250}, 380) * u;
	const subAt = at + 40;
	const btnAt = at + 56;
	const tapAt = btnAt + 22;
	const sub = prog(frame, subAt, 16, ease.out);
	const btn = prog(frame, btnAt, 14, ease.out);
	const cur = prog(frame, btnAt + 10, 18, ease.inOut);
	const press = prog(frame, tapAt, 4, ease.out) * (1 - prog(frame, tapAt + 4, 8, ease.out));
	const ripple = prog(frame, tapAt, 22, ease.out);
	const shine = prog(frame, tapAt + 8, 18, ease.inOut);
	const lines = L.isVertical
		? [
				{text: 'Who fits and', at: at + 6},
				{text: 'who may be', at: at + 18, color: SKY},
				{text: 'moving.', at: at + 26, color: SKY},
			]
		: [
				{text: 'Who fits and who', at: at + 6},
				{text: 'may be moving.', at: at + 20, color: SKY},
			];
	const nLines = lines.length;
	const subTop = top + size * 1.08 * nLines + size * 0.45;
	const btnTop = subTop + size * 0.62 + L.pick({vertical: 90, portrait: 64, square: 44}, 60) * u;
	const btnW = L.pick({vertical: 420, portrait: 360, square: 320}, 360) * u;
	const btnH = btnW * 0.25;
	const btnX = L.safe.left;
	const logoSize = L.pick({vertical: 78, portrait: 64, square: 54}, 64) * u;
	const logoTop = L.height - L.pick({vertical: 520, portrait: 190, square: 150}, 180) * u;
	void box;
	return (
		<AbsoluteFill>
			<Headline lines={lines} exitAt={1e9} top={top} size={size} color="#FFFFFF" />
			<div style={{position: 'absolute', left: L.safe.left, top: subTop, fontFamily: ARIMO, fontWeight: 400, fontSize: size * 0.44, color: '#FFFFFF', opacity: sub, transform: `translateY(${((1 - sub) * 20 * u).toFixed(1)}px)`}}>Know who, why and when.</div>
			<div style={{position: 'absolute', left: btnX, top: btnTop, width: btnW, height: btnH, transform: `translateY(${((1 - btn) * 30 * u).toFixed(1)}px) scale(${(1 - 0.05 * press).toFixed(3)})`, opacity: btn}}>
				<div style={{position: 'absolute', inset: -ripple * 26 * u, border: `${2 * u}px solid rgba(255,255,255,${(0.7 * (1 - ripple)).toFixed(3)})`, borderRadius: 6 * u}} />
				<div style={{position: 'absolute', inset: 0, background: '#FFFFFF', borderRadius: 4 * u, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 ${14 * u}px ${36 * u}px rgba(0,0,0,0.3)`}}>
					<span style={{fontFamily: ARIMO, fontWeight: 700, fontSize: btnH * 0.36, color: INK}}>Book a demo</span>
					<div style={{position: 'absolute', top: 0, bottom: 0, width: '30%', left: `${(-40 + shine * 140).toFixed(1)}%`, background: 'linear-gradient(100deg, transparent, rgba(91,51,230,0.18), transparent)'}} />
				</div>
			</div>
			<div style={{position: 'absolute', left: btnX + btnW * interpolate(cur, [0, 1], [1.25, 0.72]), top: btnTop + btnH * interpolate(cur, [0, 1], [1.9, 0.55]), opacity: interpolate(frame, [btnAt + 10, btnAt + 16, tapAt + 30, tapAt + 40], [0, 1, 1, 0], clamp), transform: `scale(${(1 - 0.12 * press).toFixed(3)})`}}>
				<Cursor s={34 * u} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: logoTop, display: 'flex', justifyContent: 'center'}}>
				<Lockup at={at + 26} size={logoSize} />
			</div>
			<Sfx name="swish" at={subAt - 2} volume={0.22} />
			<Sfx name="pop" at={btnAt} volume={0.3} />
			<Sfx name="click" at={tapAt} volume={0.5} />
			<Sfx name="success" at={tapAt + 4} volume={0.22} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------- the film

// Bar lines of the score (120 BPM, bars on whole 2 s): the restless section starts at 8 s, the drop is at 16 s.
const S2 = wipeMid(225); // 240
const S3 = wipeMid(465); // 480, the drop
const S4 = wipeMid(645); // 660

export const Film: React.FC<FilmProps> = (props) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const box = useFrameBox();
	const push = interpolate(frame, [0, S2], [1, 1.03], clamp);
	return (
		<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background="#FFFFFF">
			{/* 1. A list of advisors who fit, but aren't moving. Nothing in the frame moves except the type. */}
			{frame < S2 ? (
				<AbsoluteFill style={{transform: `scale(${push.toFixed(4)})`, transformOrigin: '30% 60%'}}>
					<Bars bars={BARS_1} fill="linear-gradient(90deg, #010105, #1A1966)" at={-30} />
					<Headline
						top={box.headTop}
						size={box.headSize}
						exitAt={214}
						lines={[
							{text: 'A list of advisors', at: -14},
							{text: 'who fit, but', at: -20},
							{text: "aren't moving.", at: 118, color: VIOLET},
						]}
					/>
					<ListCard at={-30} rowsAt={[-24, -20, -16, -12]} chipsAt={[20, 28, 36, 44]} drawAt={[60, 66, 72, 78]} quietAt={130} exitAt={214} dim={prog(frame, 136, 30, ease.soft)} />
				</AbsoluteFill>
			) : null}
			
			{[20, 28, 36, 44].map((t) => (
				<Sfx key={`c${t}`} name="pop-high" at={t} volume={0.14} />
			))}
			<Sfx name="thud" at={119} volume={0.36} />
			<BarWipe at={225} fill={FOG} />
			<Sfx name="whoosh" at={224} volume={0.3} />

			{/* 2. Alerts about advisors who move, but don't fit. Everything moves; nothing fits. */}
			{frame >= S2 && frame < S3 ? (
				<AbsoluteFill>
					<Bars bars={BRICKS} fill={FOG} at={S2 - 4} drift={1.6} jitter={3} stagger={1} />
					<Headline
						top={box.headTop}
						size={box.headSize}
						exitAt={448}
						lines={[
							{text: 'Alerts about', at: S2 + 4},
							{text: 'advisors who move,', at: S2 + 14},
							{text: "but don't fit.", at: S2 + 24, accentFrom: 1, accentAt: 358},
						]}
					/>
					<AlertStack at={[268, 283, 298, 313, 328]} flagAt={360} exitAt={444} />
				</AbsoluteFill>
			) : null}
			{[268, 283, 298, 313, 328].map((t) => (
				<Sfx key={`a${t}`} name="ding" at={t} volume={0.2} />
			))}
			<Sfx name="nope" at={360} volume={0.3} />
			<BarWipe at={465} fill={`linear-gradient(90deg, #010105, ${INDIGO})`} />
			<Sfx name="whoosh" at={464} volume={0.3} />

			{/* 3. AssetLink shows both: the same list, now with why they fit and who may be moving. */}
			{frame >= S3 && frame < S4 ? (
				<AbsoluteFill style={{transform: `scale(${interpolate(frame, [S3, S4], [1, 1.045], clamp).toFixed(4)})`, transformOrigin: '50% 70%'}}>
					<Bars bars={BRICKS} fill={`linear-gradient(90deg, #010105, ${INDIGO})`} at={S3 - 6} stagger={2} />
					<Headline
						top={box.headTop}
						size={box.headSize * 1.12}
						exitAt={634}
						lines={[
							{text: 'AssetLink', at: S3 + 6},
							{text: 'shows both', at: S3 + 18},
						]}
					/>
					<ListCard both at={S3 + 22} rowsAt={[S3 + 24, S3 + 28, S3 + 32, S3 + 36]} chipsAt={[S3 + 30, S3 + 34, S3 + 38, S3 + 42]} drawAt={[S3 + 40, S3 + 44, S3 + 48, S3 + 52]} moveAt={[undefined, S3 + 58, undefined, S3 + 88]} exitAt={634} />
				</AbsoluteFill>
			) : null}
			<Sfx name="card" at={S3 + 22} volume={0.25} />
			<Sfx name="pop-high" at={S3 + 66} volume={0.3} />
			<Sfx name="pop-high" at={S3 + 96} volume={0.3} />
			<BarWipe at={645} fill={CAROUSEL_NIGHT} />
			<Sfx name="whoosh-long" at={642} volume={0.3} />

			{/* 4. The close, on the carousel's last slide. */}
			{frame >= S4 ? (
				<AbsoluteFill style={{background: CAROUSEL_NIGHT}}>
					<Bars bars={BARS_4} fill="linear-gradient(90deg, #6E46FF, #4F7BFA)" at={S4 + 2} stagger={4} />
					<CTA at={S4} />
				</AbsoluteFill>
			) : null}
			<Music src={asset('music.wav')} volume={0.85} fadeOut={10} />
			{void L}
		</FilmShell>
	);
};
