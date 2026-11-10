import React, {CSSProperties} from 'react';
import {Img, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {EnterKind, ExitKind} from '../enter';
import {useLayout} from '../layout';
import {ease, prog, springAt} from '../motion';
import {alpha, useMotion, useTheme} from '../theme';
import {Sfx, SfxName} from '../audio';
import {Reveal} from './Reveal';

type CardProps = {
	w?: number;
	h?: number;
	pad?: number;
	radius?: number;
	bg?: string;
	/** CSS border, or false for none. Defaults to a hairline in the theme's line colour. */
	border?: string | false;
	shadow?: string | false;
	/** Use the night (dark world) surface. */
	dark?: boolean;
	style?: CSSProperties;
	children?: React.ReactNode;
};

/** A raised surface. Sizes in design px. Hairline + soft shadow by default, the way real product UI looks. */
export const Card: React.FC<CardProps> = ({w, h, pad = 36, radius, bg, border, shadow, dark = false, style, children}) => {
	const t = useTheme();
	const {u} = useLayout();
	return (
		<div
			style={{
				width: w !== undefined ? w * u : undefined,
				height: h !== undefined ? h * u : undefined,
				padding: pad * u,
				borderRadius: (radius ?? t.radius.lg) * u,
				background: bg ?? (dark ? t.colors.nightSurface : t.colors.surface),
				border: border === false ? undefined : border ?? `${Math.max(1, 1.5 * u)}px solid ${dark ? t.colors.nightLine : t.colors.line}`,
				boxShadow: shadow === false ? undefined : shadow ?? t.shadow.md,
				color: dark ? t.colors.nightInk : t.colors.ink,
				fontFamily: t.fonts.body,
				boxSizing: 'border-box',
				position: 'relative',
				...style,
			}}
		>
			{children}
		</div>
	);
};

type PillProps = {
	label: React.ReactNode;
	icon?: React.ReactNode;
	at?: number;
	kind?: EnterKind;
	/** Every element that arrives should also leave: pass the frame it exits. */
	exitAt?: number;
	exitKind?: ExitKind;
	bg?: string;
	color?: string;
	border?: string;
	size?: number;
	weight?: number;
	shadow?: string | false;
	sfx?: SfxName | false;
	pitch?: number;
	style?: CSSProperties;
};

/** A chip or tag. Pops in on `at` with the personality's spring. */
export const Pill: React.FC<PillProps> = ({label, icon, at = 0, kind = 'pop', exitAt, exitKind = 'scale', bg, color, border, size = 40, weight, shadow, sfx = false, pitch = 1, style}) => {
	const t = useTheme();
	const {u} = useLayout();
	return (
		<Reveal at={at} kind={kind} exitAt={exitAt} exitKind={exitKind} inline style={{display: 'inline-block'}}>
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: size * 0.35 * u,
					padding: `${size * 0.36 * u}px ${size * 0.62 * u}px`,
					borderRadius: t.radius.pill * u,
					background: bg ?? t.colors.brand,
					color: color ?? t.colors.onBrand,
					border,
					fontFamily: t.fonts.body,
					fontWeight: weight ?? t.weight.bodyStrong,
					fontSize: size * u,
					lineHeight: 1,
					letterSpacing: t.tracking.body,
					whiteSpace: 'nowrap',
					boxShadow: shadow === false ? undefined : shadow ?? t.shadow.sm,
					...style,
				}}
			>
				{icon ? <span style={{display: 'inline-flex', lineHeight: 0}}>{icon}</span> : null}
				<span>{label}</span>
			</div>
			{sfx ? <Sfx name={sfx} at={at + 2} volume={0.4} pitch={pitch} /> : null}
		</Reveal>
	);
};

type ButtonProps = {
	label: React.ReactNode;
	icon?: React.ReactNode;
	variant?: 'primary' | 'secondary' | 'ghost';
	size?: number;
	/** Frame of a press: the button dips and returns. */
	pressAt?: number;
	sfx?: SfxName | false;
	full?: boolean;
	bg?: string;
	color?: string;
	style?: CSSProperties;
};

/** A product button with a real press: dips to 95% over 4 frames and springs back. */
export const Button: React.FC<ButtonProps> = ({label, icon, variant = 'primary', size = 36, pressAt, sfx = 'tap', full = false, bg, color, style}) => {
	const t = useTheme();
	const {u} = useLayout();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	let scale = 1;
	let dim = 0;
	if (pressAt !== undefined && frame >= pressAt) {
		const down = prog(frame, pressAt, 4, ease.out);
		const up = springAt(frame, fps, pressAt + 4, {damping: 14, stiffness: 220, mass: 0.6});
		scale = 1 - 0.05 * down + 0.05 * up;
		dim = 0.12 * down * (1 - up);
	}
	const colors = {
		primary: {bg: bg ?? t.colors.brand, fg: color ?? t.colors.onBrand, border: 'none'},
		secondary: {bg: bg ?? t.colors.surface2, fg: color ?? t.colors.ink, border: `${1.5 * u}px solid ${t.colors.line}`},
		ghost: {bg: 'transparent', fg: color ?? t.colors.ink, border: `${1.5 * u}px solid ${t.colors.line}`},
	}[variant];
	return (
		<div
			style={{
				display: full ? 'flex' : 'inline-flex',
				justifyContent: 'center',
				alignItems: 'center',
				gap: size * 0.4 * u,
				padding: `${size * 0.55 * u}px ${size * 0.95 * u}px`,
				borderRadius: t.radius.pill * u,
				background: colors.bg,
				color: colors.fg,
				border: colors.border,
				fontFamily: t.fonts.body,
				fontWeight: t.weight.bodyStrong,
				fontSize: size * u,
				lineHeight: 1,
				whiteSpace: 'nowrap',
				transform: `scale(${scale.toFixed(4)})`,
				filter: dim ? `brightness(${(1 - dim).toFixed(3)})` : undefined,
				...style,
			}}
		>
			{icon ? <span style={{display: 'inline-flex', lineHeight: 0}}>{icon}</span> : null}
			{label}
			{pressAt !== undefined && sfx ? <Sfx name={sfx} at={pressAt} volume={0.45} /> : null}
		</div>
	);
};

/** Initials avatar (or an image). Deterministic tone per name from the theme's tints, so a list looks designed. */
export const Avatar: React.FC<{name: string; src?: string; size?: number; mono?: boolean; ring?: string; style?: CSSProperties}> = ({
	name,
	src,
	size = 72,
	mono = false,
	ring,
	style,
}) => {
	const t = useTheme();
	const {u} = useLayout();
	const initials = name
		.split(/\s+/)
		.map((p) => p[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
	const tones = [alpha(t.colors.brand, 0.16), alpha(t.colors.accent, 0.2), t.colors.surface2, alpha(t.colors.brand, 0.26), alpha(t.colors.accent, 0.12), alpha(t.colors.ink, 0.09)];
	const tone = tones[Math.floor(random(`av-${name}`) * tones.length)];
	return (
		<div
			style={{
				width: size * u,
				height: size * u,
				borderRadius: '50%',
				overflow: 'hidden',
				flexShrink: 0,
				background: mono ? alpha(t.colors.ink, 0.14) : tone,
				color: alpha(t.colors.ink, 0.7),
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: t.fonts.body,
				fontWeight: t.weight.bodyStrong,
				fontSize: size * 0.38 * u,
				boxShadow: ring ? `0 0 0 ${3 * u}px ${ring}` : undefined,
				filter: mono ? 'grayscale(1)' : undefined,
				...style,
			}}
		>
			{src ? <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : initials}
		</div>
	);
};

/** Marker highlight that sweeps behind its content. */
export const Marker: React.FC<{at: number; color?: string; opacity?: number; dur?: number; children: React.ReactNode}> = ({
	at,
	color,
	opacity = 0.35,
	dur = 12,
	children,
}) => {
	const t = useTheme();
	const frame = useCurrentFrame();
	const p = prog(frame, at, dur, ease.out);
	return (
		<span style={{position: 'relative', isolation: 'isolate', display: 'inline'}}>
			<span
				style={{
					position: 'absolute',
					left: '-0.15em',
					right: '-0.15em',
					top: '0.05em',
					bottom: '0',
					background: color ?? t.colors.warn,
					opacity,
					transform: `scaleX(${p.toFixed(4)})`,
					transformOrigin: '0 50%',
					borderRadius: '0.15em',
					zIndex: -1,
				}}
			/>
			{children}
		</span>
	);
};

export const useEnterOrder = () => useMotion().stagger;
