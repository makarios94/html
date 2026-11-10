import React, {CSSProperties} from 'react';
import {useLayout} from '../layout';
import {useTheme} from '../theme';

type PhoneProps = {
	/** Outer width in design px. Height follows a modern 19.5:9 phone. */
	w?: number;
	screenBg?: string;
	frame?: string;
	statusBar?: boolean;
	/** Status bar text colour: dark text on light screens. */
	statusDark?: boolean;
	time?: string;
	shadow?: string | false;
	style?: CSSProperties;
	children?: React.ReactNode;
};

/**
 * A generic modern phone built in CSS (no device artwork, no manufacturer marks).
 * Children render inside the screen, which clips them, at screen size (w - bezels).
 */
export const PhoneFrame: React.FC<PhoneProps> = ({w = 520, screenBg, frame = '#0E0E10', statusBar = true, statusDark = true, time = '9:41', shadow, style, children}) => {
	const t = useTheme();
	const {u} = useLayout();
	const W = w * u;
	const H = W * 2.05;
	const bezel = W * 0.032;
	const outerR = W * 0.165;
	const innerR = outerR - bezel;
	const ink = statusDark ? '#111' : '#FFF';
	return (
		<div style={{position: 'relative', width: W, height: H, ...style}}>
			{/* side keys */}
			<div style={{position: 'absolute', left: -W * 0.012, top: H * 0.22, width: W * 0.014, height: H * 0.07, background: frame, borderRadius: W * 0.01}} />
			<div style={{position: 'absolute', left: -W * 0.012, top: H * 0.31, width: W * 0.014, height: H * 0.07, background: frame, borderRadius: W * 0.01}} />
			<div style={{position: 'absolute', right: -W * 0.012, top: H * 0.26, width: W * 0.014, height: H * 0.1, background: frame, borderRadius: W * 0.01}} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: outerR,
					background: frame,
					boxShadow: shadow === false ? undefined : shadow ?? `inset 0 0 0 ${W * 0.006}px rgba(255,255,255,0.08), ${t.shadow.lg}`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: bezel,
					borderRadius: innerR,
					overflow: 'hidden',
					background: screenBg ?? t.colors.bg,
					fontFamily: t.fonts.body,
					color: t.colors.ink,
				}}
			>
				{statusBar ? (
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: W * 0.12,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: `0 ${W * 0.085}px`,
							boxSizing: 'border-box',
							color: ink,
							fontSize: W * 0.036,
							fontWeight: 600,
							zIndex: 5,
						}}
					>
						<span>{time}</span>
						<span style={{display: 'flex', gap: W * 0.012, alignItems: 'flex-end'}}>
							{[0.35, 0.55, 0.75, 0.95].map((hh) => (
								<span key={hh} style={{width: W * 0.009, height: W * 0.03 * hh, background: ink, borderRadius: 1}} />
							))}
							<span style={{marginLeft: W * 0.015, width: W * 0.055, height: W * 0.026, border: `${Math.max(1, W * 0.003)}px solid ${ink}`, borderRadius: W * 0.008, position: 'relative', boxSizing: 'border-box'}}>
								<span style={{position: 'absolute', inset: W * 0.003, right: W * 0.012, background: ink, borderRadius: W * 0.004}} />
							</span>
						</span>
					</div>
				) : null}
				{/* island */}
				<div style={{position: 'absolute', top: W * 0.03, left: '50%', width: W * 0.3, height: W * 0.085, marginLeft: -W * 0.15, background: '#000', borderRadius: W * 0.05, zIndex: 6}} />
				<div style={{position: 'absolute', inset: 0}}>{children}</div>
			</div>
		</div>
	);
};

type BrowserProps = {
	w: number;
	h: number;
	url?: string;
	dark?: boolean;
	radius?: number;
	shadow?: string | false;
	style?: CSSProperties;
	children?: React.ReactNode;
};

/** A generic browser window (no browser brand). Content renders below the bar. */
export const BrowserFrame: React.FC<BrowserProps> = ({w, h, url, dark = false, radius = 22, shadow, style, children}) => {
	const t = useTheme();
	const {u} = useLayout();
	const bar = 58 * u;
	const bg = dark ? '#1C1C21' : '#FFFFFF';
	const chrome = dark ? '#26262C' : '#F3F3F5';
	const ink = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';
	return (
		<div
			style={{
				width: w * u,
				height: h * u,
				borderRadius: radius * u,
				overflow: 'hidden',
				background: bg,
				border: `${1.5 * u}px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)'}`,
				boxShadow: shadow === false ? undefined : shadow ?? t.shadow.md,
				fontFamily: t.fonts.body,
				position: 'relative',
				...style,
			}}
		>
			<div style={{height: bar, background: chrome, display: 'flex', alignItems: 'center', padding: `0 ${22 * u}px`, gap: 10 * u}}>
				{[0, 1, 2].map((i) => (
					<span key={i} style={{width: 14 * u, height: 14 * u, borderRadius: '50%', background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'}} />
				))}
				{url ? (
					<div
						style={{
							marginLeft: 22 * u,
							flex: 1,
							height: 34 * u,
							borderRadius: 999,
							background: dark ? 'rgba(255,255,255,0.07)' : '#FFFFFF',
							display: 'flex',
							alignItems: 'center',
							padding: `0 ${16 * u}px`,
							fontSize: 20 * u,
							color: ink,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
						}}
					>
						{url}
					</div>
				) : null}
			</div>
			<div style={{position: 'absolute', top: bar, left: 0, right: 0, bottom: 0}}>{children}</div>
		</div>
	);
};
