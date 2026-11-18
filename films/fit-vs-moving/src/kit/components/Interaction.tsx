import React, {CSSProperties, useMemo} from 'react';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLayout} from '../layout';
import {ease, prog, springAt} from '../motion';
import {alpha, useMotion, useTheme} from '../theme';
import {Sfx} from '../audio';
import {Reveal} from './Reveal';

/** Frame each character appears, with human rhythm: jitter, and small pauses after spaces and punctuation. */
export const typingSchedule = (text: string, at: number, cps: number, fps: number, seed = 't') => {
	const base = fps / cps;
	const times: number[] = [];
	let t = at;
	[...text].forEach((ch, i) => {
		times.push(Math.round(t));
		let step = base * (0.65 + random(`${seed}-${i}`) * 0.7);
		if (ch === ' ') step *= 1.25;
		if (/[,.!?:;]/.test(ch)) step *= 2.4;
		t += step;
	});
	return {times, end: Math.round(t)};
};

type TypewriterProps = {
	text: string;
	at: number;
	/** Characters per second (30 to 45 reads as fast confident typing on screen). */
	cps?: number;
	caret?: boolean;
	caretColor?: string;
	/** Keep the caret blinking this many frames after typing ends. */
	holdCaret?: number;
	/** Hide the caret from this frame (focus moved to another field). */
	caretUntil?: number;
	size?: number;
	weight?: number;
	font?: string;
	color?: string;
	/** Placeholder shown before typing starts (faint). */
	placeholder?: string;
	sfx?: boolean;
	seed?: string;
	style?: CSSProperties;
};

/** Text that types itself, with a caret and optional keystroke sounds. */
export const Typewriter: React.FC<TypewriterProps> = ({
	text,
	at,
	cps = 32,
	caret = true,
	caretColor,
	holdCaret = 40,
	caretUntil,
	size = 44,
	weight,
	font,
	color,
	placeholder,
	sfx = true,
	seed = 't',
	style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = useTheme();
	const {u} = useLayout();
	const {times, end} = useMemo(() => typingSchedule(text, at, cps, fps, seed), [text, at, cps, fps, seed]);
	const shown = times.filter((x) => frame >= x).length;
	const typing = frame >= at && frame <= end;
	const blinkOn = (typing || (frame < end + holdCaret && Math.floor((frame - end) / 15) % 2 === 0)) && (caretUntil === undefined || frame < caretUntil);
	const showPlaceholder = placeholder && shown === 0;
	return (
		<span
			style={{
				fontFamily: font ?? t.fonts.body,
				fontWeight: weight ?? t.weight.body,
				fontSize: size * u,
				color: showPlaceholder ? t.colors.faint : color ?? t.colors.ink,
				whiteSpace: 'pre-wrap',
				letterSpacing: t.tracking.body,
				...style,
			}}
		>
			{showPlaceholder ? placeholder : text.slice(0, shown)}
			{caret && frame >= at - 10 && blinkOn ? (
				<span
					style={{
						display: 'inline-block',
						width: Math.max(2, size * 0.06) * u,
						height: size * 1.05 * u,
						marginLeft: size * 0.06 * u,
						background: caretColor ?? t.colors.brand,
						verticalAlign: 'text-bottom',
						borderRadius: 2,
					}}
				/>
			) : null}
			{sfx ? times.map((f, i) => (text[i] === ' ' ? null : <Sfx key={i} name={`type-${1 + (i % 4)}`} at={f} volume={0.22} />)) : null}
		</span>
	);
};

type FieldProps = {
	value?: string;
	placeholder?: string;
	at?: number;
	typeAt?: number;
	cps?: number;
	w?: number;
	size?: number;
	icon?: React.ReactNode;
	/** Frame the field takes focus (ring appears). Defaults to typeAt - 8. */
	focusAt?: number;
	/** Frame the field loses focus (ring fades, caret goes): pass the next field's typeAt. */
	blurAt?: number;
	right?: React.ReactNode;
	dark?: boolean;
	style?: CSSProperties;
};

/** An input field that can take focus and be typed into. Only one field has focus at a time: chain blurAt. */
export const Field: React.FC<FieldProps> = ({value = '', placeholder, at = 0, typeAt, cps = 30, w = 760, size = 38, icon, focusAt, blurAt, right, dark = false, style}) => {
	const t = useTheme();
	const {u} = useLayout();
	const frame = useCurrentFrame();
	const fAt = focusAt ?? (typeAt !== undefined ? typeAt - 8 : undefined);
	const focus = (fAt !== undefined ? prog(frame, fAt, 8, ease.out) : 0) * (blurAt !== undefined ? 1 - prog(frame, blurAt - 4, 8, ease.out) : 1);
	return (
		<Reveal at={at} kind="scale">
			<div
				style={{
					width: w * u,
					display: 'flex',
					alignItems: 'center',
					gap: 18 * u,
					padding: `${size * 0.62 * u}px ${size * 0.7 * u}px`,
					borderRadius: t.radius.md * u,
					background: dark ? t.colors.nightSurface : t.colors.surface,
					border: `${2 * u}px solid ${dark ? t.colors.nightLine : t.colors.line}`,
					boxShadow: `0 0 0 ${(focus * 5 * u).toFixed(2)}px ${t.colors.brand}33, ${t.shadow.sm}`,
					boxSizing: 'border-box',
					...style,
				}}
			>
				{icon ? <span style={{display: 'inline-flex', color: t.colors.muted}}>{icon}</span> : null}
				<div style={{flex: 1, overflow: 'hidden', whiteSpace: 'nowrap'}}>
					{typeAt !== undefined ? (
						<Typewriter text={value} at={typeAt} cps={cps} size={size} placeholder={placeholder} color={dark ? t.colors.nightInk : undefined} caretUntil={blurAt} />
					) : (
						<span style={{fontFamily: t.fonts.body, fontSize: size * u, color: value ? (dark ? t.colors.nightInk : t.colors.ink) : t.colors.faint}}>{value || placeholder}</span>
					)}
				</div>
				{right}
			</div>
		</Reveal>
	);
};

type CursorKey = {f: number; x: number; y: number};

type CursorProps = {
	/** Keyframes in design px relative to the parent box (position the parent with absolute fill). */
	path: CursorKey[];
	clicks?: number[];
	size?: number;
	color?: string;
	sfx?: boolean;
	style?: CSSProperties;
};

/** A pointer that travels in gentle arcs between keyframes, pauses, and clicks with a ripple. */
export const Cursor: React.FC<CursorProps> = ({path, clicks = [], size = 46, color: colorProp, sfx = true, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {u} = useLayout();
	const t = useTheme();
	const color = colorProp ?? t.colors.ink;
	if (!path.length) return null;
	let x = path[0].x;
	let y = path[0].y;
	for (let i = 0; i < path.length - 1; i++) {
		const a = path[i];
		const b = path[i + 1];
		if (frame >= a.f && frame <= b.f) {
			const p = interpolate(frame, [a.f, b.f], [0, 1], {easing: ease.inOut});
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const arc = Math.sin(Math.PI * p) * 0.08;
			x = a.x + dx * p - dy * arc;
			y = a.y + dy * p + dx * arc;
		} else if (frame > b.f) {
			x = b.x;
			y = b.y;
		}
	}
	const appear = prog(frame, path[0].f - 8, 8, ease.out);
	let press = 0;
	let ripple: React.ReactNode = null;
	for (const c of clicks) {
		if (frame >= c && frame < c + 20) {
			const down = prog(frame, c, 3, ease.out);
			const up = springAt(frame, fps, c + 3, {damping: 16, stiffness: 240, mass: 0.6});
			press = Math.max(press, down * (1 - up));
			const rp = prog(frame, c, 18, ease.out);
			ripple = (
				<div
					style={{
						position: 'absolute',
						left: -40 * u * rp,
						top: -40 * u * rp,
						width: 80 * u * rp,
						height: 80 * u * rp,
						borderRadius: '50%',
						border: `${3 * u}px solid ${t.colors.brand}`,
						opacity: 0.55 * (1 - rp),
					}}
				/>
			);
		}
	}
	return (
		<div style={{position: 'absolute', left: x * u, top: y * u, opacity: appear, zIndex: 50, pointerEvents: 'none', ...style}}>
			{ripple}
			<svg width={size * u} height={size * u} viewBox="0 0 24 24" style={{transform: `scale(${(1 - press * 0.16).toFixed(4)})`, transformOrigin: '10% 10%', filter: `drop-shadow(0 ${3 * u}px ${6 * u}px rgba(0,0,0,0.28))`}}>
				<path d="M4 2.5 L4 19.5 L8.6 15.4 L11.6 22 L14.6 20.6 L11.7 14.2 L18 14 Z" fill={color} stroke="#FFFFFF" strokeWidth={1.4} strokeLinejoin="round" />
			</svg>
			{sfx ? clicks.map((c) => <Sfx key={c} name="click" at={c} volume={0.5} />) : null}
		</div>
	);
};

/** A touch on a phone screen (phones get taps, not cursors): a soft dot that presses and ripples. Coordinates in design px inside its parent. */
export const Tap: React.FC<{x: number; y: number; at: number; size?: number; color?: string; sfx?: boolean}> = ({x, y, at, size = 70, color: colorProp, sfx = true}) => {
	const frame = useCurrentFrame();
	const {u} = useLayout();
	const t = useTheme();
	const color = colorProp ?? alpha(t.colors.ink, 0.28);
	if (frame < at - 6 || frame > at + 22) return null;
	const appear = prog(frame, at - 6, 5, ease.out);
	const press = frame >= at ? 1 - prog(frame, at, 10, ease.out) * 0.25 : 1;
	const fade = 1 - prog(frame, at + 8, 12, ease.in);
	const rp = prog(frame, at, 16, ease.out);
	const S = size * u;
	return (
		<div style={{position: 'absolute', left: x * u - S / 2, top: y * u - S / 2, width: S, height: S, pointerEvents: 'none', zIndex: 60}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: appear * fade, transform: `scale(${(0.8 * press).toFixed(3)})`}} />
			{frame >= at ? <div style={{position: 'absolute', inset: -S * 0.5 * rp, borderRadius: '50%', border: `${3 * u}px solid ${color}`, opacity: (1 - rp) * 0.9}} /> : null}
			{sfx && frame >= at - 6 ? <Sfx name="tap" at={at} volume={0.5} /> : null}
		</div>
	);
};

type Row = {left?: React.ReactNode; title: React.ReactNode; meta?: React.ReactNode; right?: React.ReactNode};

type ListProps = {
	rows: Row[];
	at: number;
	stagger?: number;
	/** Explicit frame per row (VO sync). */
	rowFrames?: number[];
	w: number;
	rowH?: number;
	gap?: number;
	size?: number;
	dark?: boolean;
	/** Highlight one row at a frame (it fills with the brand colour). */
	highlight?: {index: number; at: number; bg?: string; color?: string; badge?: React.ReactNode};
	dividers?: boolean;
	kind?: 'rise' | 'fromLeft' | 'fade' | 'pop';
	sfx?: 'pop' | 'tap' | 'card' | 'nope' | false;
	style?: CSSProperties;
};

/** Rows that stack in one by one: emails, people, steps, notifications. */
export const ListStack: React.FC<ListProps> = ({rows, at, stagger, rowFrames, w, rowH = 92, gap = 0, size = 34, dark = false, highlight, dividers = true, kind = 'rise', sfx = false, style}) => {
	const t = useTheme();
	const m = useMotion();
	const {u} = useLayout();
	const frame = useCurrentFrame();
	const step = stagger ?? m.stagger * 2;
	const ink = dark ? t.colors.nightInk : t.colors.ink;
	const muted = dark ? t.colors.nightMuted : t.colors.muted;
	const line = dark ? t.colors.nightLine : t.colors.line;
	return (
		<div style={{width: w * u, display: 'flex', flexDirection: 'column', gap: gap * u, fontFamily: t.fonts.body, ...style}}>
			{rows.map((r, i) => {
				const rowAt = rowFrames?.[i] ?? at + i * step;
				const hl = highlight && highlight.index === i ? prog(frame, highlight.at, 10, ease.out) : 0;
				return (
					<Reveal key={i} at={rowAt} kind={kind} distance={24} sfx={sfx || false} sfxVolume={0.3}>
						<div
							style={{
								position: 'relative',
								minHeight: rowH * u,
								display: 'flex',
								alignItems: 'center',
								gap: 22 * u,
								padding: `${12 * u}px ${24 * u}px`,
								borderBottom: dividers && i < rows.length - 1 && gap === 0 ? `${1.5 * u}px solid ${line}` : undefined,
								borderRadius: hl > 0 ? t.radius.md * u : 0,
								boxSizing: 'border-box',
							}}
						>
							{hl > 0 ? (
								<div
									style={{
										position: 'absolute',
										inset: 0,
										borderRadius: t.radius.md * u,
										background: highlight?.bg ?? t.colors.brand,
										opacity: hl,
										transform: `scale(${(0.98 + 0.02 * hl).toFixed(4)})`,
										boxShadow: t.shadow.md,
									}}
								/>
							) : null}
							{r.left ? <div style={{position: 'relative', flexShrink: 0}}>{r.left}</div> : null}
							<div style={{position: 'relative', flex: 1, minWidth: 0}}>
								<div style={{fontSize: size * u, fontWeight: t.weight.bodyStrong, color: hl > 0.5 ? highlight?.color ?? t.colors.onBrand : ink, lineHeight: 1.2}}>{r.title}</div>
								{r.meta ? (
									<div style={{fontSize: size * 0.74 * u, color: hl > 0.5 ? highlight?.color ?? t.colors.onBrand : muted, marginTop: 4 * u, opacity: hl > 0.5 ? 0.85 : 1}}>{r.meta}</div>
								) : null}
							</div>
							{r.right || (highlight?.index === i && highlight.badge) ? (
								<div style={{position: 'relative', flexShrink: 0, opacity: highlight?.index === i && highlight.badge ? hl : 1}}>
									{highlight?.index === i && highlight.badge ? highlight.badge : r.right}
								</div>
							) : null}
						</div>
					</Reveal>
				);
			})}
		</div>
	);
};

type NotificationProps = {
	at: number;
	app: string;
	icon?: React.ReactNode;
	title: string;
	body?: string;
	time?: string;
	w?: number;
	dark?: boolean;
	exitAt?: number;
	sfx?: 'ding' | 'success' | 'pop' | false;
	style?: CSSProperties;
};

/** A system-style notification banner that drops in with a spring. Generic: no OS or app brand marks. */
export const Notification: React.FC<NotificationProps> = ({at, app, icon, title, body, time = 'now', w = 820, dark = false, exitAt, sfx = 'ding', style}) => {
	const t = useTheme();
	const {u} = useLayout();
	return (
		<Reveal at={at} kind="drop" distance={120} exitAt={exitAt} exitKind="rise" sfx={sfx} sfxVolume={0.5}>
			<div
				style={{
					width: w * u,
					display: 'flex',
					gap: 22 * u,
					alignItems: 'flex-start',
					padding: `${24 * u}px ${28 * u}px`,
					borderRadius: 34 * u,
					background: dark ? 'rgba(36,36,40,0.9)' : 'rgba(250,250,252,0.94)',
					border: `${1.5 * u}px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
					boxShadow: t.shadow.lg,
					fontFamily: t.fonts.body,
					color: dark ? '#F5F5F7' : '#111114',
					boxSizing: 'border-box',
					...style,
				}}
			>
				<div style={{width: 68 * u, height: 68 * u, borderRadius: 16 * u, background: t.colors.brand, color: t.colors.onBrand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden'}}>
					{icon}
				</div>
				<div style={{flex: 1, minWidth: 0}}>
					<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 24 * u, opacity: 0.6, marginBottom: 6 * u, textTransform: 'uppercase', letterSpacing: '0.04em'}}>
						<span>{app}</span>
						<span style={{textTransform: 'none'}}>{time}</span>
					</div>
					<div style={{fontSize: 32 * u, fontWeight: 650, lineHeight: 1.2}}>{title}</div>
					{body ? <div style={{fontSize: 29 * u, opacity: 0.75, marginTop: 4 * u, lineHeight: 1.3}}>{body}</div> : null}
				</div>
			</div>
		</Reveal>
	);
};
