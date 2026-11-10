import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import {Carrot, CupSoda, LucideIcon, MapPin, Pill as PillIcon, Search, ShoppingBasket, Soup} from 'lucide-react';
import {
	alpha,
	Avatar,
	Backdrop,
	Camera,
	Card,
	Check,
	CircleReveal,
	DrawPath,
	ease,
	EndCard,
	FilmProps,
	FilmShell,
	FloatingProps,
	Grain,
	KineticText,
	Music,
	Notification,
	PhoneFrame,
	Pill,
	PushIn,
	Reveal,
	Sfx,
	Show,
	springAt,
	Sticker,
	StickerKind,
	Tap,
	Tilt,
	useLayout,
	useTheme,
	rand,
} from '../../kit';
import {asset, B, BARS, DURATION} from './config';
import {Logo, Mark} from './Logo';
import {FONTS, GLYPHS, theme} from './theme';

/*
 * A music-led motion ad (the Mano-style format): no voiceover, every move on the grid.
 * Bar 0 hook (on screen at frame 0) + props on the beats, bar 1 the promise, bars 2-5 one phone
 * whose screen changes on the bar (home, add to basket, tracking), bar 6 the payoff in brand colour,
 * bar 7 the logo, held while the last chord rings.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const bar = B.bar;

// Props are code-drawn stickers from the kit (free, crisp at any size); emoji are for drafts only.
const FOOD: StickerKind[] = ['avocado', 'tomato', 'baguette', 'cheese', 'carrot', 'lemon', 'grapes', 'egg'];
// The app's own UI uses icons, as a real app would.
const CATEGORIES: [LucideIcon, string][] = [
	[Carrot, 'Groceries'],
	[PillIcon, 'Pharmacy'],
	[Soup, 'Meals'],
	[CupSoda, 'Drinks'],
];
// Props frame the headline without touching it: bands above and below on vertical, the flanks on wide.
const SPOTS_V = [
	[0.2, 0.2], [0.8, 0.19], [0.5, 0.15], [0.31, 0.3], [0.69, 0.3], [0.2, 0.64], [0.8, 0.65], [0.5, 0.73],
];
const SPOTS_W = [
	[0.12, 0.24], [0.88, 0.24], [0.07, 0.55], [0.93, 0.55], [0.16, 0.83], [0.84, 0.83], [0.34, 0.13], [0.66, 0.87],
];

// Bars 0-1. Frame 0 already shows the whole hook; the food lands on the beats and scatters on bar 1.
const Hook: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const spots = L.isWide ? SPOTS_W : SPOTS_V;
	const size = L.pick({vertical: 160, wide: 150}, 160);
	const items = FOOD.map((kind, i) => ({
		node: <Sticker kind={kind} size={size} />,
		x: spots[i][0],
		y: spots[i][1],
		size,
		rotate: rand(`food-${i}`, -14, 14),
		// two are already in on frame 0 (the thumbnail); the rest land on the half beats of bar 0
		delay: i < 2 ? -30 : B.beat(1) + (i - 2) * Math.round(B.framesPerBeat * 0.34),
	}));
	const promiseAt = bar(1);
	return (
		<>
			<FloatingProps items={items} at={0} exitAt={promiseAt + 6} sfx="pop" seed="food" />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 140 * L.u : 0}}>
				<KineticText
					text={'Out of\n*groceries?*'}
					at={-24}
					size={L.pick({vertical: 132, wide: 160}, 140)}
					exitAt={promiseAt - 6}
					exitKind="rise"
					emphasis={{color: t.colors.brand, decoration: 'underline', decorationColor: t.colors.ink, decorationAt: B.beat(1), decorationSfx: 'swish', seed: 'gro'}}
				/>
			</AbsoluteFill>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 140 * L.u : 0}}>
				<KineticText
					text={'Get it all in\n*one app.*'}
					at={promiseAt}
					wordFrames={[promiseAt, promiseAt + 3, promiseAt + 6, promiseAt + 9, bar(1, 2), bar(1, 2) + 4]}
					kind="pop"
					size={L.pick({vertical: 124, wide: 150}, 132)}
					sfx="pop-high"
					sfxVolume={0.28}
					exitAt={bar(2) - 6}
					exitKind="rise"
					emphasis={{decoration: 'highlight', color: t.colors.ink, decorationColor: t.colors.brand, decorationAt: bar(1, 3)}}
				/>
			</AbsoluteFill>
		</>
	);
};

// ---- phone screens (sizes in design px inside a ~520 px screen)
const SCREEN_PAD = 34;

const HomeScreen: React.FC = () => {
	const t = useTheme();
	const {u} = useLayout();
	return (
		<div style={{position: 'absolute', inset: 0, padding: `${112 * u}px ${SCREEN_PAD * u}px 0`, background: t.colors.bg, fontFamily: t.fonts.body}}>
			<div style={{fontSize: 24 * u, color: t.colors.muted}}>Good morning, Ada</div>
			<div style={{fontSize: 38 * u, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 4 * u}}>What do you need today?</div>
			<div style={{marginTop: 22 * u, display: 'flex', alignItems: 'center', gap: 12 * u, padding: `${16 * u}px ${20 * u}px`, borderRadius: 999, background: t.colors.surface, boxShadow: t.shadow.sm, color: t.colors.faint, fontSize: 24 * u}}>
				<Search size={26 * u} /> Search groceries, meds, meals
			</div>
			<div style={{marginTop: 24 * u, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 * u}}>
				{CATEGORIES.map(([Icon, label], i) => (
					<Reveal key={label} at={bar(2) + 6 + i * 3} kind="pop">
						<div style={{background: t.colors.surface, borderRadius: 26 * u, padding: `${22 * u}px ${18 * u}px`, boxShadow: t.shadow.sm}}>
							<div style={{width: 68 * u, height: 68 * u, borderRadius: 20 * u, background: alpha(t.colors.brand, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<Icon size={38 * u} color={t.colors.brand} strokeWidth={2.4} />
							</div>
							<div style={{fontSize: 26 * u, fontWeight: 700, marginTop: 12 * u}}>{label}</div>
						</div>
					</Reveal>
				))}
			</div>
		</div>
	);
};

const PRODUCTS: [StickerKind, string, string][] = [
	['avocado', 'Avocados', '₦1,500'],
	['tomato', 'Tomatoes', '₦900'],
	['banana', 'Bananas', '₦700'],
];
const ROW_TOP = 210;
const ROW_STEP = 136;

const ProductScreen: React.FC<{taps: number[]; screenW: number}> = ({taps, screenW}) => {
	const t = useTheme();
	const {u} = useLayout();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const count = taps.filter((x) => frame >= x).length;
	const last = taps.filter((x) => frame >= x).pop();
	const bump = last !== undefined ? 1 + 0.25 * (1 - springAt(frame, fps, last, {damping: 9, stiffness: 200, mass: 0.6})) : 1;
	const totals = ['₦0', '₦1,500', '₦2,400', '₦3,100'];
	return (
		<div style={{position: 'absolute', inset: 0, background: t.colors.bg, fontFamily: t.fonts.body}}>
			<div style={{position: 'absolute', top: 112 * u, left: SCREEN_PAD * u, fontSize: 38 * u, fontWeight: 800, letterSpacing: '-0.03em'}}>Fresh today</div>
			{PRODUCTS.map(([kind, name, price], i) => {
				const added = frame >= taps[i];
				return (
					<div
						key={name}
						style={{
							position: 'absolute',
							top: (ROW_TOP + i * ROW_STEP) * u,
							left: SCREEN_PAD * u,
							right: SCREEN_PAD * u,
							height: 118 * u,
							borderRadius: 26 * u,
							background: t.colors.surface,
							boxShadow: t.shadow.sm,
							display: 'flex',
							alignItems: 'center',
							gap: 18 * u,
							padding: `0 ${18 * u}px`,
						}}
					>
						<div style={{width: 80 * u, height: 80 * u, borderRadius: 20 * u, background: t.colors.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<Sticker kind={kind} size={62} edge={false} shadow={false} />
						</div>
						<div style={{flex: 1}}>
							<div style={{fontSize: 28 * u, fontWeight: 700}}>{name}</div>
							<div style={{fontSize: 24 * u, color: t.colors.muted}}>{price}</div>
						</div>
						<div
							style={{
								padding: `${10 * u}px ${18 * u}px`,
								borderRadius: 999,
								background: added ? 'transparent' : t.colors.brand,
								color: added ? t.colors.ok : t.colors.onBrand,
								border: `${2 * u}px solid ${added ? t.colors.ok : t.colors.brand}`,
								fontSize: 24 * u,
								fontWeight: 800,
							}}
						>
							{added ? 'Added' : 'Add'}
						</div>
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute',
					left: SCREEN_PAD * u,
					right: SCREEN_PAD * u,
					bottom: 44 * u,
					height: 100 * u,
					borderRadius: 999,
					background: t.colors.ink,
					color: t.colors.bg,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: `0 ${30 * u}px`,
					fontSize: 28 * u,
					fontWeight: 800,
				}}
			>
				<span style={{display: 'flex', alignItems: 'center', gap: 14 * u}}>
					<ShoppingBasket size={34 * u} />
					Basket
					<span style={{display: 'inline-flex', minWidth: 40 * u, height: 40 * u, borderRadius: 999, background: t.colors.brand, color: t.colors.onBrand, alignItems: 'center', justifyContent: 'center', fontSize: 24 * u, transform: `scale(${bump.toFixed(3)})`}}>{count}</span>
				</span>
				<span>{totals[count]}</span>
			</div>
			{taps.map((at, i) => (
				<Tap key={at} x={screenW - SCREEN_PAD - 18 - 46} y={ROW_TOP + i * ROW_STEP + 59} at={at} />
			))}
		</div>
	);
};

const ROUTE = 'M 70 300 C 150 290, 120 190, 220 176 S 360 120, 410 64';

const TrackScreen: React.FC<{at: number}> = ({at}) => {
	const t = useTheme();
	const {u} = useLayout();
	const frame = useCurrentFrame();
	const len = useMemo(() => getLength(ROUTE), []);
	const p = interpolate(frame, [at + 6, at + 6 + B.framesPerBeat * 3], [0, 1], clamp);
	const pt = getPointAtLength(ROUTE, len * p) ?? {x: 70, y: 300};
	return (
		<div style={{position: 'absolute', inset: 0, background: t.colors.bg, fontFamily: t.fonts.body}}>
			<div style={{position: 'absolute', top: 112 * u, left: SCREEN_PAD * u, fontSize: 38 * u, fontWeight: 800, letterSpacing: '-0.03em'}}>Arriving soon</div>
			<div style={{position: 'absolute', top: 186 * u, left: SCREEN_PAD * u, right: SCREEN_PAD * u, height: 380 * u, borderRadius: 30 * u, overflow: 'hidden', background: t.colors.surface2, boxShadow: t.shadow.sm}}>
				<svg viewBox="0 0 456 380" width="100%" height="100%">
					{[60, 140, 220, 300].map((y) => (
						<line key={y} x1="0" x2="456" y1={y} y2={y + 20} stroke={alpha(t.colors.ink, 0.07)} strokeWidth="14" />
					))}
					{[90, 210, 330].map((x) => (
						<line key={x} y1="0" y2="380" x1={x} x2={x - 30} stroke={alpha(t.colors.ink, 0.07)} strokeWidth="14" />
					))}
				</svg>
				<div style={{position: 'absolute', inset: 0}}>
					<DrawPath d={ROUTE} w={456} h={380} at={at + 6} dur={Math.round(B.framesPerBeat * 3)} stroke={t.colors.brand} strokeWidth={9} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
				</div>
				<div style={{position: 'absolute', left: `${(pt.x / 456) * 100}%`, top: `${(pt.y / 380) * 100}%`, width: 34 * u, height: 34 * u, marginLeft: -17 * u, marginTop: -17 * u, borderRadius: '50%', background: t.colors.ink, border: `${5 * u}px solid ${t.colors.bg}`, boxShadow: t.shadow.sm}} />
				<div style={{position: 'absolute', left: `${(410 / 456) * 100}%`, top: `${(64 / 380) * 100}%`, transform: 'translate(-50%, -90%)', color: t.colors.brand}}>
					<MapPin size={46 * u} fill={t.colors.brand} color={t.colors.bg} />
				</div>
			</div>
			<div style={{position: 'absolute', top: 600 * u, left: SCREEN_PAD * u, right: SCREEN_PAD * u, display: 'flex', alignItems: 'center', gap: 16 * u, padding: `${18 * u}px`, borderRadius: 26 * u, background: t.colors.surface, boxShadow: t.shadow.sm}}>
				<Avatar name="Musa Ali" size={70} />
				<div>
					<div style={{fontSize: 28 * u, fontWeight: 700}}>Musa is on the way</div>
					<div style={{fontSize: 24 * u, color: t.colors.muted}}>3 items from basket</div>
				</div>
			</div>
		</div>
	);
};

// Bars 2-5: one phone, three screens, each change on a downbeat. Pills burst out on bar 3 and leave on
// bar 4; the camera pushes in on each new screen so the UI is readable on a phone.
const PhoneStage: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const u = L.u;
	const frame = useCurrentFrame();
	const phoneW = L.pick({vertical: 600, wide: 440}, 540);
	const push = interpolate(frame, [bar(4) - 8, bar(4) + 6, bar(5) - 6, bar(5) + 8, bar(6) - 10, bar(6)], [1, 1.14, 1.14, 1.1, 1.1, 1.0], {...clamp, easing: (x) => x * x * (3 - 2 * x)});
	const taps = [bar(4, 1), bar(4, 2), bar(4, 3)];
	// vertical: the right-hand pills sit further in, because the safe zone keeps 150 px on the right for feed buttons
	const spots: [number, number][] = L.isWide
		? [[-560, -200], [560, -120], [-520, 160], [540, 230]]
		: [[-300, -560], [215, -420], [-320, 360], [215, 500]];
	return (
		<>
			<AbsoluteFill style={{transform: `scale(${push.toFixed(4)})`, transformOrigin: L.isVertical ? '50% 44%' : '50% 50%'}}>
			<Tilt pose={{rx: 4, ry: -8, rz: -2}} to={{rx: 2, ry: 8, rz: 2}} from={bar(2)} dur={bar(6) - bar(2)}>
				<Reveal at={bar(2) - 4} kind="rise" fade={false} distance={L.isVertical ? 420 : 300} sfx="whoosh" sfxVolume={0.35}>
					<PhoneFrame w={phoneW} statusDark>
						<HomeScreen />
						<PushIn at={bar(4) - 3} from="right">
							<ProductScreen taps={taps} screenW={phoneW * (1 - 2 * 0.032)} />
						</PushIn>
						<PushIn at={bar(5) - 3} from="right">
							<TrackScreen at={bar(5)} />
							<div style={{position: 'absolute', top: 70 * u, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
								<Notification at={bar(5, 2)} app="basket" icon={<div style={{width: '74%', height: '74%'}}><Mark /></div>} title="On the way" body="Musa picked up 3 items" w={phoneW * 0.9} sfx="ding" />
							</div>
						</PushIn>
					</PhoneFrame>
				</Reveal>
			</Tilt>
			</AbsoluteFill>
			<Sfx name="swish" at={bar(4) - 4} volume={0.3} />
			<Sfx name="swish" at={bar(5) - 4} volume={0.3} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', paddingBottom: L.isVertical ? 120 * u : 0}}>
				{CATEGORIES.map(([Icon, label], i) => (
					<div key={label} style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${spots[i][0] * u}px), calc(-50% + ${spots[i][1] * u}px))`}}>
						<Pill at={bar(3, i)} exitAt={bar(4) - 6 + i} label={label} icon={<Icon size={40 * u} color={t.colors.brand} strokeWidth={2.4} />} size={42} bg={t.colors.surface} color={t.colors.ink} sfx="pop-high" pitch={1 + i * 0.06} />
					</div>
				))}
			</AbsoluteFill>
		</>
	);
};

// Bar 6: the payoff, one word per beat, in brand colour.
const Payoff: React.FC = () => {
	const L = useLayout();
	const at = bar(6);
	return (
		<CircleReveal at={at - 8} dur={14} y={0.48}>
			<Backdrop color={theme.colors.brand} glow={{color: 'rgba(255,255,255,0.18)', size: 1}}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 140 * L.u : 0}}>
					<KineticText
						text={L.isWide ? 'Shop. Track. *Done.*' : 'Shop.\nTrack.\n*Done.*'}
						at={at}
						wordFrames={[bar(6, 0), bar(6, 1), bar(6, 2)]}
						kind="pop"
						size={L.pick({vertical: 190, wide: 170}, 180)}
						color={theme.colors.onBrand}
						sfx="thud"
						sfxVolume={0.45}
						emphasis={{color: theme.colors.onBrand, decoration: 'circle', decorationColor: theme.colors.onBrand, decorationAt: bar(6, 3), seed: 'done'}}
					/>
				</AbsoluteFill>
				<Sfx name="success" at={bar(6, 3)} volume={0.35} />
			</Backdrop>
		</CircleReveal>
	);
};

// Bar 7: the logo and the action, held while the final chord rings out, with a linear push to the last frame.
const End: React.FC = () => {
	const t = useTheme();
	return (
		<Backdrop color={t.colors.bg} glow={{color: alpha(t.colors.brand, 0.12), size: 1, breathe: true}}>
			<Camera from={bar(7)} dur={DURATION - bar(7)} scale={[1, 1.06]} easing={ease.linear}>
				<EndCard at={bar(7)} logo={<Logo at={bar(7) - 8} size={140} />} line="Groceries, sorted." lineAt={bar(7, 1)} cta="Get the app" ctaAt={bar(7, 2)} pillBg={t.colors.brand} pillColor={t.colors.onBrand} />
			</Camera>
			<Sfx name="sparkle" at={bar(7) + 10} volume={0.3} />
		</Backdrop>
	);
};

// The scenes before the payoff are transparent and share one ground, so an overlap between their Show windows can
// never hide the outgoing scene behind the incoming one's backdrop. Only scenes meant to cover bring their own ground.
export const Film: React.FC<FilmProps> = (props) => {
	if (B.trackBars < BARS) {
		throw new Error(`The music has ${B.trackBars} bars but this film is built on ${BARS}. Make the bed with --bars ${BARS} (change --bpm to change the length), or rework the scenes.`);
	}
	return (
	<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props}>
		<Show from={0} to={bar(6) + 8}>
			<Backdrop color={theme.colors.bg} glow={{color: alpha(theme.colors.brand, 0.1), y: 0.47, size: 1}} />
		</Show>
		<Show from={0} to={bar(2)}>
			<Hook />
		</Show>
		<Show from={bar(2) - 6} to={bar(6) + 8}>
			<PhoneStage />
		</Show>
		<Show from={bar(6) - 8} to={bar(7)} z={2}>
			<Payoff />
		</Show>
		<Show from={bar(7)} to={DURATION} z={3}>
			<End />
		</Show>
		<Grain opacity={0.035} />
		<Music src={asset('music.wav')} volume={0.85} fadeOut={20} />
	</FilmShell>
	);
};
