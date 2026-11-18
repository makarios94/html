import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ease, FilmProps, FilmShell, Music, prog, Sfx, useLayout} from '../../kit';
import {asset} from './config';
import {Mark} from './Logo';
import {BLUE, CAROUSEL_NIGHT, FOG, FONTS, GLYPHS, INDIGO, INK, SERIF, SKY, theme, VIOLET} from './theme';

/*
 * "Fit vs moving", from the 18 Nov 2026 LinkedIn carousel, v2: interactive and in AssetLink's shipped style.
 * Headlines are the carousel's, word for word. The UI words (advisors, fit reasons, alerts, the detail) are fictional
 * demo data; a fit is shown as reasons, never a score. 120 BPM: a beat is 15 frames, a bar 60.
 *
 *   0-240    A list of advisors who fit, but aren't moving.  The cursor hits refresh: every signal stays flat.
 *   240-480  Alerts about advisors who move, but don't fit.  Alerts pile in on the beat with "not a fit" chips;
 *                                                            the cursor drags them off one by one.
 *   480-780  AssetLink shows both (on the drop).            Fit reasons and signals on one list; two advisors
 *                                                            start moving; the cursor opens one (why they fit, the
 *                                                            signal) and drafts the first message into Outlook drafts.
 *   780-898  Who fits and who may be moving. / Know who, why and when. / Book a demo (the signals post's close).
 * Scene changes are wipes made of the carousel's diagonal bars. The small lockup sits top left, as on the posts.
 */

export const DURATION_FVM = 898;
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

// ---------------------------------------------------------------------------------------------------- the cursor

type Key = {f: number; x: number; y: number};
/** A pointer that travels between keyframes (eased), presses on each click frame, and can carry a drag. */
const Pointer: React.FC<{keys: Key[]; clicks?: number[]; dark?: boolean}> = ({keys, clicks = [], dark = false}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	if (frame < keys[0].f || frame > keys[keys.length - 1].f) return null;
	let x = keys[0].x;
	let y = keys[0].y;
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i];
		const b = keys[i + 1];
		if (frame >= a.f && frame <= b.f) {
			const p = ease.inOut(Math.min(1, Math.max(0, (frame - a.f) / Math.max(1, b.f - a.f))));
			x = a.x + (b.x - a.x) * p;
			y = a.y + (b.y - a.y) * p;
		}
	}
	const press = clicks.reduce((m, c) => Math.max(m, prog(frame, c - 2, 3, ease.out) * (1 - prog(frame, c + 2, 6, ease.out))), 0);
	const ring = clicks.reduce((m, c) => (frame >= c && frame < c + 16 ? prog(frame, c, 16, ease.out) : m), 0);
	const fade = interpolate(frame, [keys[0].f, keys[0].f + 6, keys[keys.length - 1].f - 6, keys[keys.length - 1].f], [0, 1, 1, 0], clamp);
	const s = L.pick({vertical: 44, portrait: 38, square: 34}, 38) * L.u;
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity: fade, zIndex: 50, pointerEvents: 'none'}}>
			{ring > 0 ? <div style={{position: 'absolute', left: -s * 0.9 * ring, top: -s * 0.9 * ring, width: s * 1.8 * ring, height: s * 1.8 * ring, borderRadius: '50%', border: `${2 * L.u}px solid ${VIOLET}`, opacity: 1 - ring}} /> : null}
			<svg width={s} height={s * 1.3} viewBox="0 0 20 26" style={{transform: `scale(${(1 - 0.14 * press).toFixed(3)})`, transformOrigin: '0 0', filter: `drop-shadow(0 ${3 * L.u}px ${5 * L.u}px rgba(9,12,54,0.3))`}}>
				<path d="M2 2 L2 21 L7 16.5 L10.5 24 L13.6 22.6 L10.2 15.2 L17 15.2 Z" fill={dark ? INK : '#FFFFFF'} stroke={dark ? '#FFFFFF' : INK} strokeWidth={1.5} strokeLinejoin="round" />
			</svg>
		</div>
	);
};

// ---------------------------------------------------------------------------------------------------- the list

type Row = {name: string; initials: string; fit: [string, string]};
const ROWS: Row[] = [
	{name: 'Dana Whitfield', initials: 'DW', fit: ['CFP', '12 yrs at one firm']},
	{name: 'Marcus Bell', initials: 'MB', fit: ['Independent RIA', 'Northeast']},
	{name: 'Priya Raman', initials: 'PR', fit: ['CFP', 'Hybrid channel']},
	{name: 'Owen Hart', initials: 'OH', fit: ['Wirehouse', 'Texas']},
];
/** The advisor the cursor opens in scene 3, and what the detail shows. Fictional. */
const OPEN = 1;
const WHY = ['Independent RIA channel', 'Northeast, in your territory', 'CFP, 14 years in practice'];

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

/** Where the logo, headline, card and alert stack sit, per shape. */
const useFrameBox = () => {
	const L = useLayout();
	const u = L.u;
	const logoTop = L.pick({vertical: 300, portrait: 64, square: 40}, 60) * u;
	const headTop = L.pick({vertical: 470, portrait: 340, square: 104}, 320) * u;
	const headSize = L.pick({vertical: 78, portrait: 68, square: 54}, 68) * u;
	const cardTop = headTop + headSize * 1.08 * 3 + L.pick({vertical: 60, portrait: 40, square: 30}, 40) * u;
	const left = L.safe.left;
	const width = L.width - left - L.pick({vertical: 120, portrait: 72, square: 72}, 72) * u;
	return {logoTop, headTop, headSize, cardTop, left, width};
};

/** The signal line: flat (no change) or rising with a pulse at its head (may be moving). shimmer: a refresh pass. */
const Signal: React.FC<{w: number; h: number; drawAt: number; moveAt?: number; shimmerAt?: number}> = ({w, h, drawAt, moveAt, shimmerAt}) => {
	const frame = useCurrentFrame();
	const draw = prog(frame, drawAt, 26, ease.inOut);
	const m = moveAt === undefined ? 0 : prog(frame, moveAt, 18, ease.out);
	const sh = shimmerAt === undefined ? 0 : Math.sin(Math.PI * prog(frame, shimmerAt, 22, ease.inOut));
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
	const id = `sig${drawAt}${moveAt ?? ''}`;
	return (
		<svg width={w} height={h} style={{overflow: 'visible', flex: 'none', opacity: 1 - 0.65 * sh}}>
			<defs>
				<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} x2={w} y1={0} y2={0}>
					<stop offset="0" stopColor="#A9A6C6" />
					<stop offset="0.55" stopColor="#A9A6C6" />
					<stop offset="1" stopColor={m > 0 ? VIOLET : '#A9A6C6'} />
				</linearGradient>
			</defs>
			<path d={d} fill="none" stroke={`url(#${id})`} strokeWidth={h * 0.11} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={(1 - draw) * len} />
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

const Pill: React.FC<{text: string; p: number; size: number}> = ({text, p, size}) => (
	<div style={{padding: `${size * 0.18}px ${size * 0.6}px`, borderRadius: size, background: SKY, color: '#FFFFFF', fontFamily: theme.fonts.body, fontWeight: 600, fontSize: size * 0.92, whiteSpace: 'nowrap', opacity: p, transform: `scale(${(0.7 + 0.3 * p).toFixed(3)})`, transformOrigin: 'right center'}}>{text}</div>
);

type RowCues = {at: number; chipsAt: number; drawAt: number; moveAt?: number; quietAt?: number; shimmerAt?: number; hover?: [number, number]; collapseAt?: number};

/** One advisor row: initials, name, two fit reasons with ticks, and the signal line. */
const AdvisorRow: React.FC<{row: Row; i: number; cue: RowCues; both: boolean}> = ({row, i, cue, both}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const S = useSizes();
	const p = prog(frame, cue.at, 14, ease.out);
	const moving = cue.moveAt !== undefined;
	const lit = moving ? prog(frame, cue.moveAt!, 14, ease.out) : 0;
	const tag = moving ? prog(frame, cue.moveAt! + 8, 12, ease.out) : 0;
	const quiet = cue.quietAt !== undefined ? prog(frame, cue.quietAt, 12, ease.out) : 0;
	const hov = cue.hover ? prog(frame, cue.hover[0], 6, ease.out) * (1 - prog(frame, cue.hover[1], 6, ease.out)) : 0;
	const col = cue.collapseAt !== undefined ? prog(frame, cue.collapseAt, 14, ease.inOut) : 0;
	const av = S.rowH * 0.44;
	return (
		<div style={{height: S.rowH * (1 - col), overflow: 'hidden', opacity: 1 - col}}>
			<div style={{position: 'relative', height: S.rowH, display: 'flex', alignItems: 'center', gap: S.pad * 0.7, padding: `0 ${S.pad}px`, borderTop: i ? `${Math.max(1, L.u)}px solid #ECEBF4` : 'none', opacity: p, transform: `translateY(${((1 - p) * 24 * L.u).toFixed(1)}px)`, background: `rgba(91,51,230,${(0.06 * lit + 0.05 * hov).toFixed(3)})`}}>
				<div style={{position: 'absolute', left: 0, top: S.rowH * 0.18, bottom: S.rowH * 0.18, width: 5 * L.u, background: VIOLET, transform: `scaleY(${Math.max(lit, hov)})`, borderRadius: 3 * L.u}} />
				<div style={{width: av, height: av, borderRadius: '50%', flex: 'none', background: 'linear-gradient(135deg, #ECE6FF, #DCE9FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fonts.body, fontWeight: 600, fontSize: av * 0.36, color: VIOLET, letterSpacing: '0.02em'}}>{row.initials}</div>
				<div style={{flex: 1, minWidth: 0}}>
					<div style={{fontFamily: theme.fonts.body, fontWeight: 600, fontSize: S.name, color: INK, lineHeight: 1.2}}>{row.name}</div>
					<div style={{display: 'flex', gap: S.chip * 0.5, marginTop: S.chip * 0.45}}>
						{row.fit.map((c, ci) => {
							const cp = prog(frame, cue.chipsAt + ci * 4, 10, ease.out);
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
					<Signal w={S.sig} h={S.rowH * 0.34} drawAt={cue.drawAt} moveAt={cue.moveAt} shimmerAt={cue.shimmerAt} />
					<div style={{height: S.chip * 1.5, display: 'flex', alignItems: 'center'}}>
						{moving ? <Pill text="May be moving" p={tag} size={S.chip} /> : <div style={{fontFamily: theme.fonts.body, fontWeight: 500, fontSize: S.chip * 0.92, color: 'rgba(9,12,54,0.45)', opacity: both ? 0 : quiet, whiteSpace: 'nowrap'}}>No change</div>}
					</div>
				</div>
			</div>
		</div>
	);
};

const SectionLabel: React.FC<{text: string; size: number; style?: React.CSSProperties}> = ({text, size, style}) => (
	<div style={{fontFamily: theme.fonts.body, fontWeight: 600, fontSize: size, letterSpacing: '0.14em', textTransform: 'uppercase', color: VIOLET, ...style}}>{text}</div>
);

/** The opened advisor: why they fit, the signal, and the drafted first message. Fills the room the other rows left. */
const Detail: React.FC<{at: number; draftAt: number}> = ({at, draftAt}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const S = useSizes();
	const open = prog(frame, at, 18, ease.inOut);
	const h = 3 * S.rowH * open;
	const item = (k: number) => prog(frame, at + 14 + k * 7, 12, ease.out);
	const saved = prog(frame, draftAt, 10, ease.out);
	const btnH = S.chip * 2.7;
	const lbl = S.chip * 0.78;
	return (
		<div style={{height: h, overflow: 'hidden', borderTop: `${Math.max(1, L.u)}px solid #ECEBF4`, background: '#FBFAFF'}}>
			<div style={{height: 3 * S.rowH, padding: `${S.pad * 0.8}px ${S.pad}px ${S.pad}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column'}}>
				<div style={{display: 'flex', gap: S.pad}}>
					<div style={{flex: 1.3, opacity: item(0)}}>
						<SectionLabel text="Why they fit" size={lbl} />
						{WHY.map((w, k) => (
							<div key={w} style={{display: 'flex', alignItems: 'center', gap: S.chip * 0.35, marginTop: S.chip * 0.55, fontFamily: theme.fonts.body, fontWeight: 500, fontSize: S.chip, color: INK, opacity: item(k), transform: `translateX(${((1 - item(k)) * 16 * L.u).toFixed(1)}px)`, whiteSpace: 'nowrap'}}>
								<Check s={S.chip * 1.1} />
								{w}
							</div>
						))}
					</div>
					<div style={{flex: 1, opacity: item(3), transform: `translateY(${((1 - item(3)) * 14 * L.u).toFixed(1)}px)`}}>
						<SectionLabel text="Signal" size={lbl} />
						<div style={{marginTop: S.chip * 0.55, display: 'flex'}}>
							<Pill text="May be moving" p={item(3)} size={S.chip} />
						</div>
						<div style={{marginTop: S.chip * 0.5, fontFamily: theme.fonts.body, fontWeight: 500, fontSize: S.chip * 0.95, color: 'rgba(9,12,54,0.7)', lineHeight: 1.3}}>A recent change at their firm</div>
					</div>
				</div>
				<div style={{marginTop: 'auto', display: 'flex', alignItems: 'center', gap: S.pad * 0.6, opacity: item(4)}}>
					<div style={{height: btnH, padding: `0 ${S.chip * 1.1}px`, borderRadius: 8 * L.u, background: saved > 0.5 ? '#FFFFFF' : VIOLET, border: `${Math.max(1, 1.5 * L.u)}px solid ${VIOLET}`, display: 'flex', alignItems: 'center', gap: S.chip * 0.4, fontFamily: theme.fonts.body, fontWeight: 600, fontSize: S.chip * 1.02, color: saved > 0.5 ? VIOLET : '#FFFFFF', whiteSpace: 'nowrap', transform: `scale(${(1 - 0.05 * Math.sin(Math.PI * saved)).toFixed(3)})`, transformOrigin: 'left center'}}>
						{saved > 0.5 ? <Check s={S.chip * 1.1} /> : null}
						{saved > 0.5 ? 'Saved to your Outlook drafts' : 'Draft first message'}
					</div>
				</div>
			</div>
		</div>
	);
};

const Refresh: React.FC<{s: number; spinAt?: number}> = ({s, spinAt}) => {
	const frame = useCurrentFrame();
	const spin = spinAt === undefined ? 0 : prog(frame, spinAt, 22, ease.inOut) * 360;
	return (
		<svg width={s} height={s} viewBox="0 0 24 24" style={{transform: `rotate(${spin.toFixed(1)}deg)`}}>
			<path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="rgba(9,12,54,0.6)" strokeWidth={2.2} strokeLinecap="round" />
			<polyline points="19.5,3.8 19.5,8.2 15.1,8.2" fill="none" stroke="rgba(9,12,54,0.6)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
};

const ListCard: React.FC<{at: number; both?: boolean; cues: RowCues[]; exitAt?: number; dim?: number; spinAt?: number; openAt?: number; draftAt?: number}> = ({at, both = false, cues, exitAt = 1e9, dim = 0, spinAt, openAt, draftAt = 1e9}) => {
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
				<span style={{display: 'flex', alignItems: 'center', gap: S.chip * 0.6}}>
					<span style={label}>Signal</span>
					{both ? null : <Refresh s={S.chip * 1.5} spinAt={spinAt} />}
				</span>
			</div>
			{ROWS.map((r, i) => (
				<React.Fragment key={r.name}>
					<AdvisorRow row={r} i={i} cue={{...cues[i], collapseAt: openAt !== undefined && i !== OPEN ? openAt : undefined}} both={both} />
					{openAt !== undefined && i === OPEN ? <Detail at={openAt + 4} draftAt={draftAt} /> : null}
				</React.Fragment>
			))}
		</div>
	);
};

/** Cursor targets inside the card (px, frame space). */
const useTargets = () => {
	const S = useSizes();
	const box = useFrameBox();
	const L = useLayout();
	const rowY = (i: number) => box.cardTop + S.head + i * S.rowH + S.rowH / 2;
	return {
		refresh: {x: box.left + box.width - S.pad - S.chip * 0.75, y: box.cardTop + S.head / 2},
		rowName: (i: number) => ({x: box.left + S.pad + S.rowH * 0.44 + S.pad * 0.7 + 90 * L.u, y: rowY(i) - S.chip * 0.6}),
		// After the open: the opened row sits first, the detail fills the next three rows' room.
		draft: {x: box.left + S.pad + S.chip * 5, y: box.cardTop + S.head + 4 * S.rowH - S.pad - S.chip * 1.35},
		offRight: {x: L.width + 40 * L.u, y: L.height * 0.9},
	};
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

const useAlertGeom = () => {
	const S = useSizes();
	const box = useFrameBox();
	const h = S.rowH * 0.92;
	const gap = h * 0.32;
	/** Centre of alert i once all five have landed (the newest, i = 4, on top). */
	const at = (i: number) => ({x: box.left + box.width * 0.6, y: box.cardTop + (ALERTS.length - 1 - i) * (h + gap) + h / 2});
	return {h, gap, at};
};

/** Alerts drop in from above, newest on top, pushing the older ones down; at flagAt every "not a fit" chip lights;
 *  then the cursor drags each one off to the right (dismiss[i] is when alert i is grabbed). */
const AlertStack: React.FC<{at: number[]; flagAt: number; dismiss: number[]}> = ({at, flagAt, dismiss}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const S = useSizes();
	const box = useFrameBox();
	const {h, gap} = useAlertGeom();
	const flag = prog(frame, flagAt, 10, ease.out);
	return (
		<div style={{position: 'absolute', left: box.left, top: box.cardTop, width: box.width}}>
			{ALERTS.map((a, i) => {
				if (frame < at[i] - 1) return null;
				const p = prog(frame, at[i], 12, ease.out);
				const below = at.slice(i + 1).reduce((n, t) => n + prog(frame, t, 12, ease.out), 0);
				// Grabbed at dismiss[i]: dragged 8 frames with the cursor, then thrown.
				const drag = prog(frame, dismiss[i], 8, ease.inOut);
				const fly = prog(frame, dismiss[i] + 8, 12, ease.in);
				const dx = drag * 180 * L.u + fly * 1200 * L.u;
				const rot = (i % 2 ? 1 : -1) * (1.2 + (i % 3) * 0.6) * (1 - p * 0.4) + Math.sin(frame * 0.9 + i) * 0.5 * flag * (1 - drag) + drag * 4 + fly * 10;
				const x = (i % 2 ? 1 : -1) * (10 + (i % 3) * 8) * L.u + dx;
				const y = below * (h + gap) - (1 - p) * 140 * L.u;
				if (fly >= 1) return null;
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
							boxShadow: `0 ${16 * L.u}px ${40 * L.u}px rgba(9,12,54,${(0.13 + 0.1 * drag).toFixed(3)})`,
							opacity: p * (1 - fly),
							transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`,
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

// ---------------------------------------------------------------------------------------------------- brand

/** The small lockup at the top of every light scene, as on AssetLink's shipped posts. */
const TopLogo: React.FC<{until: number}> = ({until}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const box = useFrameBox();
	if (frame >= until) return null;
	const s = L.pick({vertical: 46, portrait: 40, square: 34}, 40) * L.u;
	return (
		<div style={{position: 'absolute', left: L.safe.left, top: box.logoTop, display: 'flex', alignItems: 'center', gap: s * 0.32}}>
			<div style={{width: s * 0.9, height: s}}>
				<Mark />
			</div>
			<span style={{fontFamily: theme.fonts.display, fontWeight: 300, fontSize: s * 0.56, letterSpacing: '0.22em', color: INK}}>ASSETLINK</span>
		</div>
	);
};

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

/** The close, in the shipped signals post's style: headline, the serif tagline, a white button with blue type. */
const CTA: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	if (frame < at) return null;
	const size = L.pick({vertical: 92, portrait: 78, square: 64}, 76) * u;
	const top = L.pick({vertical: 560, portrait: 380, square: 230}, 380) * u;
	const subAt = at + 34;
	const btnAt = at + 46;
	const tapAt = btnAt + 26;
	const sub = prog(frame, subAt, 16, ease.out);
	const btn = prog(frame, btnAt, 14, ease.out);
	const press = prog(frame, tapAt - 2, 3, ease.out) * (1 - prog(frame, tapAt + 2, 8, ease.out));
	const ripple = prog(frame, tapAt, 22, ease.out);
	const lines = L.isVertical
		? [
				{text: 'Who fits and', at: at + 4},
				{text: 'who may be', at: at + 14, color: SKY},
				{text: 'moving.', at: at + 20, color: SKY},
			]
		: [
				{text: 'Who fits and who', at: at + 4},
				{text: 'may be moving.', at: at + 16, color: SKY},
			];
	const subTop = top + size * 1.08 * lines.length + size * 0.4;
	const btnTop = subTop + size * 0.7 + L.pick({vertical: 80, portrait: 56, square: 40}, 56) * u;
	const btnW = L.pick({vertical: 420, portrait: 360, square: 320}, 360) * u;
	const btnH = btnW * 0.25;
	const logoSize = L.pick({vertical: 78, portrait: 64, square: 54}, 64) * u;
	const logoTop = L.height - L.pick({vertical: 560, portrait: 190, square: 150}, 180) * u;
	return (
		<AbsoluteFill>
			<Headline lines={lines} exitAt={1e9} top={top} size={size} color="#FFFFFF" />
			<div style={{position: 'absolute', left: L.safe.left, top: subTop, fontFamily: SERIF, fontWeight: 400, fontSize: size * 0.5, color: '#FFFFFF', opacity: sub, transform: `translateY(${((1 - sub) * 20 * u).toFixed(1)}px)`}}>Know who, why and when.</div>
			<div style={{position: 'absolute', left: L.safe.left, top: btnTop, width: btnW, height: btnH, transform: `translateY(${((1 - btn) * 30 * u).toFixed(1)}px) scale(${(1 - 0.05 * press).toFixed(3)})`, opacity: btn}}>
				<div style={{position: 'absolute', inset: -ripple * 26 * u, border: `${2 * u}px solid rgba(255,255,255,${(0.7 * (1 - ripple)).toFixed(3)})`, borderRadius: 14 * u}} />
				<div style={{position: 'absolute', inset: 0, background: '#FFFFFF', borderRadius: 10 * u, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 ${14 * u}px ${36 * u}px rgba(0,0,0,0.3)`}}>
					<span style={{fontFamily: theme.fonts.display, fontWeight: 600, fontSize: btnH * 0.34, color: BLUE}}>Book a demo</span>
				</div>
			</div>
			<Pointer dark keys={[{f: btnAt + 4, x: L.safe.left + btnW * 1.3, y: btnTop + btnH * 2.2}, {f: tapAt - 2, x: L.safe.left + btnW * 0.7, y: btnTop + btnH * 0.55}, {f: tapAt + 30, x: L.safe.left + btnW * 0.72, y: btnTop + btnH * 0.6}]} clicks={[tapAt]} />
			<div style={{position: 'absolute', left: 0, right: 0, top: logoTop, display: 'flex', justifyContent: 'center'}}>
				<Lockup at={at + 18} size={logoSize} />
			</div>
			<Sfx name="swish" at={subAt - 2} volume={0.22} />
			<Sfx name="pop" at={btnAt} volume={0.3} />
			<Sfx name="click" at={tapAt} volume={0.5} />
			<Sfx name="success" at={tapAt + 4} volume={0.22} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------------------------------- the film

// Bar lines of the score (120 BPM, bars on whole 2 s): restless from 8 s, the drop at 16 s, the groove to 26 s.
const S2 = wipeMid(225); // 240
const S3 = wipeMid(465); // 480, the drop
const S4 = wipeMid(765); // 780

export const Film: React.FC<FilmProps> = (props) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const box = useFrameBox();
	const T = useTargets();
	const AG = useAlertGeom();
	const push = interpolate(frame, [0, S2], [1, 1.03], clamp);
	const off = {x: L.width * 0.95, y: L.height * 0.92};
	// Scene 1 cues: refresh at 88, nothing changes, "aren't moving." on the bar at 120.
	const REFRESH = 88;
	// Scene 2: alerts land on the beat, "don't fit." at 358, then the cursor drags each one off (top first).
	const LAND = [268, 283, 298, 313, 328];
	const DISMISS = [436, 424, 412, 400, 388];
	// Scene 3: the list returns, two advisors start moving, the cursor opens one and drafts the first message.
	const OPEN_AT = S3 + 120;
	const DRAFT_AT = S3 + 214;
	return (
		<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background="#FFFFFF">
			{/* 1. A list of advisors who fit, but aren't moving. Refresh: still nothing moves. */}
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
					<ListCard
						at={-30}
						spinAt={REFRESH}
						cues={[-24, -20, -16, -12].map((a, i) => ({at: a, chipsAt: 20 + i * 8, drawAt: 50 + i * 5, quietAt: 124 + i * 4, shimmerAt: REFRESH + i * 2, hover: i === 1 ? [62, 80] as [number, number] : undefined}))}
						exitAt={214}
						dim={prog(frame, 136, 30, ease.soft)}
					/>
					<Pointer keys={[{f: 44, ...off}, {f: 64, ...T.rowName(1)}, {f: 74, ...T.rowName(1)}, {f: REFRESH - 2, ...T.refresh}, {f: 150, ...T.refresh}, {f: 172, ...off}]} clicks={[REFRESH]} />
				</AbsoluteFill>
			) : null}
			<TopLogo until={S4} />
			{[20, 28, 36, 44].map((t) => (
				<Sfx key={`c${t}`} name="pop-high" at={t} volume={0.14} />
			))}
			<Sfx name="click" at={REFRESH} volume={0.4} />
			<Sfx name="swish" at={REFRESH + 2} volume={0.16} />
			<Sfx name="thud" at={119} volume={0.36} />
			<BarWipe at={225} fill={FOG} />
			<Sfx name="whoosh" at={224} volume={0.3} />

			{/* 2. Alerts about advisors who move, but don't fit. They pile up; the cursor drags them off. */}
			{frame >= S2 && frame < S3 ? (
				<AbsoluteFill>
					<Bars bars={BRICKS} fill={FOG} at={S2 - 4} drift={1.6} jitter={3} stagger={1} />
					<Headline
						top={box.headTop}
						size={box.headSize}
						exitAt={450}
						lines={[
							{text: 'Alerts about', at: S2 + 4},
							{text: 'advisors who move,', at: S2 + 14},
							{text: "but don't fit.", at: S2 + 24, accentFrom: 1, accentAt: 358},
						]}
					/>
					<AlertStack at={LAND} flagAt={360} dismiss={DISMISS} />
					<Pointer
						keys={[
							{f: 370, ...off},
							...[4, 3, 2, 1, 0].flatMap((i) => [
								{f: DISMISS[i] - 4, ...AG.at(i)},
								{f: DISMISS[i] + 8, x: AG.at(i).x + 180 * L.u, y: AG.at(i).y},
							]),
							{f: 456, ...off},
						]}
						clicks={DISMISS}
					/>
				</AbsoluteFill>
			) : null}
			{LAND.map((t) => (
				<Sfx key={`a${t}`} name="ding" at={t} volume={0.2} />
			))}
			<Sfx name="nope" at={360} volume={0.3} />
			{DISMISS.map((t) => (
				<Sfx key={`d${t}`} name="swish" at={t + 6} volume={0.18} />
			))}
			<BarWipe at={465} fill={`linear-gradient(90deg, #010105, ${INDIGO})`} />
			<Sfx name="whoosh" at={464} volume={0.3} />

			{/* 3. AssetLink shows both: who fits, who may be moving; open one, draft the first message. */}
			{frame >= S3 && frame < S4 ? (
				<AbsoluteFill style={{transform: `scale(${interpolate(frame, [S3, S4], [1, 1.03], clamp).toFixed(4)})`, transformOrigin: '50% 70%'}}>
					<Bars bars={BRICKS} fill={`linear-gradient(90deg, #010105, ${INDIGO})`} at={S3 - 6} stagger={2} />
					<Headline
						top={box.headTop}
						size={box.headSize * 1.12}
						exitAt={S4 - 26}
						lines={[
							{text: 'AssetLink', at: S3 + 6},
							{text: 'shows both', at: S3 + 18},
						]}
					/>
					<ListCard
						both
						at={S3 + 22}
						openAt={OPEN_AT}
						draftAt={DRAFT_AT}
						exitAt={S4 - 24}
						cues={[0, 1, 2, 3].map((i) => ({at: S3 + 24 + i * 4, chipsAt: S3 + 30 + i * 4, drawAt: S3 + 40 + i * 4, moveAt: i === 1 ? S3 + 60 : i === 3 ? S3 + 75 : undefined, hover: i === OPEN ? [OPEN_AT - 18, OPEN_AT + 4] as [number, number] : undefined}))}
					/>
					<Pointer keys={[{f: OPEN_AT - 34, ...off}, {f: OPEN_AT - 4, ...T.rowName(OPEN)}, {f: OPEN_AT + 50, ...T.rowName(0)}, {f: DRAFT_AT - 4, ...T.draft}, {f: DRAFT_AT + 30, ...T.draft}, {f: DRAFT_AT + 44, ...off}]} clicks={[OPEN_AT, DRAFT_AT]} />
				</AbsoluteFill>
			) : null}
			<Sfx name="card" at={S3 + 22} volume={0.25} />
			<Sfx name="pop-high" at={S3 + 68} volume={0.3} />
			<Sfx name="pop-high" at={S3 + 83} volume={0.3} />
			<Sfx name="click" at={OPEN_AT} volume={0.45} />
			<Sfx name="swish" at={OPEN_AT + 4} volume={0.2} />
			<Sfx name="click" at={DRAFT_AT} volume={0.45} />
			<Sfx name="send" at={DRAFT_AT + 2} volume={0.3} />
			<BarWipe at={765} fill={CAROUSEL_NIGHT} />
			<Sfx name="whoosh-long" at={761} volume={0.3} />

			{/* 4. The close, in the signals post's style. */}
			{frame >= S4 ? (
				<AbsoluteFill style={{background: CAROUSEL_NIGHT}}>
					<Bars bars={BARS_4} fill="linear-gradient(90deg, #6E46FF, #4F7BFA)" at={S4 + 2} stagger={4} />
					<CTA at={S4} />
				</AbsoluteFill>
			) : null}
			<Music src={asset('music.wav')} volume={0.85} fadeOut={10} />
		</FilmShell>
	);
};
