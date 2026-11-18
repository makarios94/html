import React, {CSSProperties} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {EnterKind, enterMotion, motionStyle} from '../enter';
import {useLayout} from '../layout';
import {drift, ease, prog} from '../motion';
import {useMotion, useTheme} from '../theme';
import {Sfx, SfxName} from '../audio';
import {Avatar} from './Surfaces';

export type PropItem = {
	node: React.ReactNode;
	/** Position as a fraction of the frame (0..1), so the same layout works at every aspect. */
	x: number;
	y: number;
	/** Box size in design px (font-size for emoji). */
	size?: number;
	rotate?: number;
	/** Extra frames after the group's start. */
	delay?: number;
	/** Float amplitude in design px. */
	float?: number;
};

type FloatingPropsProps = {
	items: PropItem[];
	at?: number;
	stagger?: number;
	kind?: EnterKind;
	/** Frame at which every item leaves (they scatter outward). */
	exitAt?: number;
	sfx?: SfxName | false;
	seed?: string;
};

/**
 * Objects that pop in around a statement and keep floating: groceries round "out of groceries?",
 * coins round a money line. Use real illustrations for finals: the kit's <Sticker> props (free, drawn in code),
 * generated 3D renders with the background removed, or a licensed set. Emoji are fine for drafts.
 */
export const FloatingProps: React.FC<FloatingPropsProps> = ({items, at = 0, stagger, kind = 'pop', exitAt, sfx = false, seed = 'props'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const m = useMotion();
	const {width, height, u, cx, cy} = useLayout();
	const step = stagger ?? m.stagger;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{items.map((it, i) => {
				const start = at + (it.delay ?? i * step);
				const enter = enterMotion({frame, fps, at: start, kind, m, u});
				const phase = random(`${seed}-${i}`) * 200;
				const period = 80 + random(`${seed}-p${i}`) * 50;
				const fy = drift(frame, (it.float ?? 10) * u, period, phase);
				const fr = drift(frame, 4, period * 1.4, phase + 30);
				let out = {dx: 0, dy: 0, o: 1};
				if (exitAt !== undefined && frame >= exitAt) {
					const p = prog(frame, exitAt + i, 12, ease.in);
					const px = it.x * width - cx;
					const py = it.y * height - cy;
					const len = Math.hypot(px, py) || 1;
					out = {dx: (px / len) * 400 * u * p, dy: (py / len) * 400 * u * p, o: 1 - p};
				}
				const size = (it.size ?? 120) * u;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: it.x * width - size / 2 + out.dx,
							top: it.y * height - size / 2 + fy + out.dy,
							width: size,
							height: size,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: size * 0.86,
							lineHeight: 1,
							opacity: out.o,
							transform: `rotate(${((it.rotate ?? 0) + fr).toFixed(3)}deg)`,
						}}
					>
						<div style={motionStyle(enter)}>{it.node}</div>
						{sfx ? <Sfx name={sfx} at={start + 2} volume={0.28} pitch={0.9 + random(`${seed}-s${i}`) * 0.3} /> : null}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

type TileWallProps = {
	cols: number;
	rows: number;
	/** Tile size in design px. */
	tile?: number;
	gap?: number;
	at?: number;
	/** The pull-back: camera scale from -> to over dur frames, centred on the hero tile. */
	fromScale?: number;
	toScale?: number;
	dur?: number;
	/** One tile that becomes "you": it pops to colour, grows and gets a label. */
	hero?: {col: number; row: number; at: number; label?: string; node?: React.ReactNode};
	renderTile?: (i: number, col: number, row: number) => React.ReactNode;
	/** Grayscale crowd (the hero stays in colour). */
	mono?: boolean;
	tilt?: number;
	sfx?: SfxName | false;
	style?: CSSProperties;
};

const NAMES = ['Ada Obi', 'Tunde Bello', 'Chioma Eze', 'Musa Ali', 'Grace Mensah', 'Kofi Asante', 'Zainab Yusuf', 'Emeka Nwosu', 'Funke Ade', 'Ibrahim Sani', 'Ngozi Okafor', 'Yaw Boateng', 'Amina Lawal', 'Segun Ojo', 'Efua Owusu', 'Bola Ajayi'];

/**
 * A crowd of tiles with a camera pull-back: "one CV in a pile of hundreds". Initials avatars by default;
 * pass renderTile for images. Never use real people's photos without permission.
 */
export const TileWall: React.FC<TileWallProps> = ({cols, rows, tile = 150, gap = 18, at = 0, fromScale = 2.6, toScale = 1, dur = 60, hero, renderTile, mono = true, tilt = 0, sfx = false, style}) => {
	const frame = useCurrentFrame();
	const t = useTheme();
	const {u, width, height} = useLayout();
	const T = tile * u;
	const G = gap * u;
	const W = cols * T + (cols - 1) * G;
	const H = rows * T + (rows - 1) * G;
	const s = interpolate(frame, [at, at + dur], [fromScale, toScale], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.inOut});
	const hx = hero ? hero.col * (T + G) + T / 2 : W / 2;
	const hy = hero ? hero.row * (T + G) + T / 2 : H / 2;
	const hp = hero ? prog(frame, hero.at, 14, ease.out) : 0;
	return (
		<AbsoluteFill style={{overflow: 'hidden', perspective: 2000 * u, ...style}}>
			<div
				style={{
					position: 'absolute',
					left: width / 2 - hx,
					top: height / 2 - hy,
					width: W,
					height: H,
					transformOrigin: `${hx}px ${hy}px`,
					transform: `rotateX(${tilt}deg) scale(${s.toFixed(4)})`,
				}}
			>
				{Array.from({length: cols * rows}).map((_, i) => {
					const c = i % cols;
					const r = Math.floor(i / cols);
					const isHero = hero && hero.col === c && hero.row === r;
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: c * (T + G),
								top: r * (T + G),
								width: T,
								height: T,
								borderRadius: T * 0.18,
								overflow: 'visible',
								background: t.colors.nightSurface,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								filter: mono && !isHero ? 'grayscale(1) brightness(0.8)' : undefined,
								transform: isHero ? `scale(${(1 + 0.22 * hp).toFixed(4)})` : undefined,
								zIndex: isHero ? 2 : 1,
								boxShadow: isHero ? `0 0 0 ${(4 * u * hp).toFixed(2)}px ${t.colors.brand}, ${t.shadow.lg}` : undefined,
							}}
						>
							{renderTile ? (
								renderTile(i, c, r)
							) : isHero && hero?.node ? (
								hero.node
							) : (
								<Avatar name={NAMES[(i * 7 + r) % NAMES.length]} size={tile * 0.78} mono={mono && !isHero} />
							)}
							{isHero && hero?.label ? (
								<div
									style={{
										position: 'absolute',
										top: T + 14 * u,
										left: '50%',
										transform: `translateX(-50%) translateY(${((1 - hp) * 10 * u).toFixed(2)}px)`,
										opacity: hp,
										color: t.colors.nightInk,
										fontFamily: t.fonts.body,
										fontWeight: t.weight.bodyStrong,
										fontSize: tile * 0.22 * u,
										whiteSpace: 'nowrap',
									}}
								>
									{hero.label}
								</div>
							) : null}
						</div>
					);
				})}
			</div>
			{hero && sfx ? <Sfx name={sfx} at={hero.at} volume={0.45} /> : null}
		</AbsoluteFill>
	);
};
