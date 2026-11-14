import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {ease, prog, Sfx, SfxName, useLayout} from '../../kit';
import {asset} from './shared';
import {LINING, MARK_GRADIENT, NAVY, PURPLE, theme} from './theme';

/*
 * The event details and the call to action for the Edition V throwbacks.
 *
 * InfoBeats: date, time and venue each get their own beat and their own card: a small purple label (DATE, TIME,
 * VENUE) over one big value, centred, which replaces the one before it. Nothing is stacked or crowded.
 *
 * TicketCTA: the end card. An Edition V admission ticket flips in and gets stamped FREE TO ATTEND, the deadline
 * follows, then a big "Save your spot now" button rises; a cursor taps it (ripple and click), a shine sweeps across
 * it, and a ring keeps pulsing until the last frame.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GRAD = `linear-gradient(100deg, ${MARK_GRADIENT[0]}, ${MARK_GRADIENT[1]})`;

export type Info = {label: string; value: string; sub?: string; at: number; until: number; sfx?: SfxName};

/** One detail at a time, centred: label, value, optional sub-line. Each enters on a mask rise and leaves upward. */
export const InfoBeats: React.FC<{items: Info[]; cy?: number; size: number}> = ({items, cy = 0.5, size}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{items.map((it) => {
				if (frame < it.at - 2 || frame > it.until + 10) return null;
				const lab = prog(frame, it.at, 8, ease.out);
				const val = prog(frame, it.at + 3, 11, ease.out);
				const sub = prog(frame, it.at + 9, 11, ease.out);
				const rule = prog(frame, it.at + 2, 12, ease.draw);
				const out = prog(frame, it.until, 9, ease.in);
				const scale = 1.18 - 0.18 * val;
				return (
					<div
						key={it.label}
						style={{
							position: 'absolute',
							left: L.safe.left,
							right: L.safe.right,
							top: L.height * cy,
							transform: `translateY(-50%) translateY(${(-out * 80 * u).toFixed(1)}px)`,
							opacity: 1 - out,
							filter: out > 0 ? `blur(${(out * 10).toFixed(1)}px)` : undefined,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
						}}
					>
						<div style={{display: 'flex', alignItems: 'center', gap: 16 * u, opacity: lab, transform: `translateY(${((1 - lab) * 16 * u).toFixed(1)}px)`}}>
							<div style={{width: 48 * u, height: 4 * u, background: PURPLE, transform: `scaleX(${rule.toFixed(3)})`, transformOrigin: 'right'}} />
							<div style={{fontFamily: theme.fonts.body, fontWeight: 700, fontSize: size * 0.3 * u, letterSpacing: '0.3em', color: '#B9AEFF', paddingLeft: '0.3em'}}>{it.label}</div>
							<div style={{width: 48 * u, height: 4 * u, background: PURPLE, transform: `scaleX(${rule.toFixed(3)})`, transformOrigin: 'left'}} />
						</div>
						<div style={{overflow: 'hidden', marginTop: 14 * u, paddingBottom: '0.06em'}}>
							<div
								style={{
									fontFamily: theme.fonts.display,
									fontWeight: 800,
									fontSize: size * u,
									lineHeight: 1,
									letterSpacing: '-0.02em',
									color: '#FFFFFF',
									textTransform: 'uppercase',
									whiteSpace: 'nowrap',
									transform: `translateY(${((1 - val) * 105).toFixed(1)}%) scale(${scale.toFixed(4)})`,
									textShadow: `0 ${4 * u}px ${30 * u}px rgba(0,0,0,0.45)`,
									...LINING,
								}}
							>
								{it.value}
							</div>
						</div>
						{it.sub ? (
							<div style={{marginTop: 12 * u, fontFamily: theme.fonts.display, fontWeight: 700, fontSize: size * 0.42 * u, color: 'rgba(255,255,255,0.86)', opacity: sub, transform: `translateY(${((1 - sub) * 20 * u).toFixed(1)}px)`, textShadow: `0 ${3 * u}px ${20 * u}px rgba(0,0,0,0.5)`}}>
								{it.sub}
							</div>
						) : null}
						<Sfx name={it.sfx ?? 'swish'} at={it.at + 2} volume={0.26} />
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

/** A simple pointer cursor. */
const Cursor: React.FC<{size: number}> = ({size}) => (
	<svg width={size} height={size * 1.3} viewBox="0 0 20 26">
		<path d="M2 1 L2 21 L7 16.5 L10.5 24.5 L14 23 L10.6 15.2 L17.5 15.2 Z" fill="#FFFFFF" stroke={NAVY} strokeWidth="1.6" strokeLinejoin="round" />
	</svg>
);

/** The end card: ticket, stamp, deadline, and the button that gets pressed. */
export const TicketCTA: React.FC<{at: number; end: number}> = ({at, end}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	if (frame < at - 10) return null;
	const bgIn = prog(frame, at - 8, 10, ease.out);
	const logo = prog(frame, at, 14, ease.out);
	const ticket = prog(frame, at + 4, 14, ease.out);
	const stampAt = at + 18;
	const stampP = prog(frame, stampAt, 6, ease.in);
	const stampSettle = interpolate(frame, [stampAt + 6, stampAt + 9, stampAt + 13], [1, 0.95, 1], clamp);
	const shake = frame >= stampAt + 5 && frame < stampAt + 10 ? Math.sin((frame - stampAt) * 3.2) * 6 * (1 - (frame - stampAt - 5) / 5) : 0;
	const close = prog(frame, at + 28, 10, ease.out);
	const btnAt = at + 34;
	const btn = prog(frame, btnAt, 12, ease.out);
	const tapAt = btnAt + 20;
	const press = interpolate(frame, [tapAt, tapAt + 3, tapAt + 9], [1, 0.93, 1], clamp);
	const ripple = prog(frame, tapAt, 18, ease.out);
	const shine = prog(frame, tapAt + 6, 16, ease.inOut);
	const pulseT = Math.max(0, frame - (tapAt + 10));
	const pulse = (pulseT % 30) / 30;
	const cursorIn = prog(frame, btnAt + 6, 12, ease.out);
	const cursorOut = prog(frame, tapAt + 14, 10, ease.in);
	const push = interpolate(frame, [at, end], [1, 1.035], clamp);

	const W = L.pick({vertical: 860, square: 760}, 800) * u;
	const H = L.pick({vertical: 300, square: 250}, 270) * u;
	const btnW = L.pick({vertical: 780, square: 640}, 700) * u;
	const btnH = L.pick({vertical: 132, square: 108}, 118) * u;
	const ticketTop = L.pick({vertical: 0.41, square: 0.42}, 0.41);
	return (
		<AbsoluteFill style={{background: NAVY, opacity: bgIn, transform: `translate(${(shake * u).toFixed(1)}px, ${(shake * 0.4 * u).toFixed(1)}px)`}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(116,70,255,0.38) 0%, rgba(21,26,56,0) 62%)'}} />
			<AbsoluteFill style={{transform: `scale(${push.toFixed(4)})`}}>
				{/* Logo */}
				<div style={{position: 'absolute', left: 0, right: 0, top: L.safe.top + L.pick({vertical: 40, square: 10}, 20) * u, display: 'flex', justifyContent: 'center', opacity: logo, transform: `translateY(${((1 - logo) * -20 * u).toFixed(1)}px)`}}>
					<Img src={asset('assetlink-lockup-white.png')} style={{width: L.pick({vertical: 420, square: 360}, 380) * u}} />
				</div>

				{/* The ticket */}
				<div style={{position: 'absolute', left: (L.width - W) / 2, top: L.height * ticketTop - H / 2, width: W, height: H, perspective: 1400 * u}}>
					<div style={{position: 'relative', width: '100%', height: '100%', transform: `rotateX(${((1 - ticket) * -80).toFixed(2)}deg) translateY(${((1 - ticket) * 60 * u).toFixed(1)}px)`, transformOrigin: '50% 0%', opacity: ticket > 0 ? 1 : 0, display: 'flex', filter: `drop-shadow(0 ${24 * u}px ${40 * u}px rgba(0,0,0,0.45))`}}>
						<div style={{flex: 1, background: '#FBFBFD', borderRadius: `${18 * u}px 0 0 ${18 * u}px`, padding: `${28 * u}px ${36 * u}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 * u}}>
							<div style={{fontFamily: theme.fonts.body, fontWeight: 700, fontSize: H * 0.085, letterSpacing: '0.24em', color: PURPLE}}>ASSETLINK, MIAMI</div>
							<div style={{fontFamily: theme.fonts.display, fontWeight: 800, fontSize: H * 0.3, lineHeight: 1, letterSpacing: '-0.02em', color: NAVY, textTransform: 'uppercase'}}>Edition V</div>
							<div style={{fontFamily: theme.fonts.body, fontWeight: 600, fontSize: H * 0.085, color: 'rgba(21,26,56,0.7)'}}>5th Annual Art Basel Evening</div>
						</div>
						<div style={{width: 3 * u, backgroundImage: `linear-gradient(${NAVY} 50%, transparent 50%)`, backgroundSize: `100% ${14 * u}px`, opacity: 0.35, background: undefined}} />
						<div style={{width: H * 0.62, background: GRAD, borderRadius: `0 ${18 * u}px ${18 * u}px 0`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<div style={{transform: 'rotate(-90deg)', whiteSpace: 'nowrap', fontFamily: theme.fonts.body, fontWeight: 800, fontSize: H * 0.1, letterSpacing: '0.26em', color: '#FFFFFF'}}>ADMIT ONE</div>
						</div>
						{/* The stamp */}
						<div
							style={{
								position: 'absolute',
								right: H * 0.62 - H * 0.3,
								top: H * 0.5,
								transform: `rotate(-12deg) scale(${(stampP < 1 ? 2.6 - 1.6 * stampP : stampSettle).toFixed(4)})`,
								opacity: stampP > 0 ? Math.min(1, stampP * 2) : 0,
								border: `${6 * u}px solid #FF5A7A`,
								borderRadius: 12 * u,
								padding: `${10 * u}px ${18 * u}px`,
								color: '#FF5A7A',
								fontFamily: theme.fonts.display,
								fontWeight: 800,
								fontSize: H * 0.2,
								lineHeight: 1,
								textAlign: 'center',
								textTransform: 'uppercase',
								letterSpacing: '0.04em',
								background: 'rgba(251,251,253,0.72)',
							}}
						>
							Free
							<div style={{fontSize: H * 0.075, letterSpacing: '0.16em', marginTop: 6 * u}}>to attend</div>
						</div>
					</div>
				</div>

				{/* Deadline */}
				<div style={{position: 'absolute', left: 0, right: 0, top: L.height * ticketTop + H / 2 + L.pick({vertical: 70, square: 40}, 56) * u, textAlign: 'center', opacity: close, transform: `translateY(${((1 - close) * 20 * u).toFixed(1)}px)`, fontFamily: theme.fonts.body, fontWeight: 600, fontSize: L.pick({vertical: 40, square: 32}, 36) * u, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.04em'}}>
					Registration closes <span style={{color: '#FFFFFF', fontWeight: 800, borderBottom: `${4 * u}px solid ${PURPLE}`}}>Dec 2</span>
				</div>

				{/* The button */}
				<div style={{position: 'absolute', left: (L.width - btnW) / 2, top: L.height * ticketTop + H / 2 + L.pick({vertical: 170, square: 110}, 140) * u, width: btnW, height: btnH, opacity: btn, transform: `translateY(${((1 - btn) * 60 * u).toFixed(1)}px) scale(${press.toFixed(4)})`}}>
					{pulseT > 0 ? <div style={{position: 'absolute', inset: 0, borderRadius: 999, border: `${4 * u}px solid ${MARK_GRADIENT[1]}`, transform: `scale(${(1 + pulse * 0.16).toFixed(4)}, ${(1 + pulse * 0.5).toFixed(4)})`, opacity: 1 - pulse}} /> : null}
					<div style={{position: 'absolute', inset: 0, borderRadius: 999, background: GRAD, overflow: 'hidden', boxShadow: `0 ${16 * u}px ${40 * u}px rgba(116,70,255,0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<div style={{position: 'absolute', top: 0, bottom: 0, width: '30%', left: `${(-40 + shine * 140).toFixed(1)}%`, background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)', transform: 'skewX(-18deg)'}} />
						{ripple > 0 && ripple < 1 ? <div style={{position: 'absolute', left: '62%', top: '55%', width: btnW * 1.6 * ripple, height: btnW * 1.6 * ripple, marginLeft: -btnW * 0.8 * ripple, marginTop: -btnW * 0.8 * ripple, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', opacity: 1 - ripple}} /> : null}
						<div style={{position: 'relative', fontFamily: theme.fonts.display, fontWeight: 800, fontSize: btnH * 0.38, letterSpacing: '0.02em', color: '#FFFFFF', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 18 * u}}>
							Save your spot now
							<svg width={btnH * 0.3} height={btnH * 0.3} viewBox="0 0 24 24" style={{transform: `translateX(${(Math.sin(Math.max(0, frame - tapAt) * 0.35) * 6 * u * (pulseT > 0 ? 1 : 0)).toFixed(1)}px)`}}>
								<path d="M4 12 H19 M13 5 L20 12 L13 19" stroke="#FFFFFF" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
					</div>
				</div>

				{/* The cursor glides in and taps */}
				<div
					style={{
						position: 'absolute',
						left: (L.width - btnW) / 2 + btnW * 0.62 + interpolate(cursorIn, [0, 1], [260, 0]) * u,
						top: L.height * ticketTop + H / 2 + L.pick({vertical: 170, square: 110}, 140) * u + btnH * 0.55 + interpolate(cursorIn, [0, 1], [200, 0]) * u,
						opacity: cursorIn * (1 - cursorOut),
						transform: `scale(${(frame >= tapAt && frame < tapAt + 6 ? 0.85 : 1).toFixed(3)})`,
					}}
				>
					<Cursor size={L.pick({vertical: 70, square: 56}, 62) * u} />
				</div>
			</AbsoluteFill>
			<Sfx name="card" at={at + 4} volume={0.28} />
			<Sfx name="impact" at={stampAt + 5} volume={0.36} />
			<Sfx name="pop" at={btnAt + 2} volume={0.24} />
			<Sfx name="click" at={tapAt} volume={0.4} />
			<Sfx name="sparkle" at={tapAt + 6} volume={0.26} />
		</AbsoluteFill>
	);
};
