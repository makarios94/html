import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {FileText, Inbox, Receipt, Send, User} from 'lucide-react';
import {
	alpha,
	Avatar,
	Backdrop,
	Button,
	Camera,
	ease,
	CaptionTrack,
	Card,
	Check,
	CircleReveal,
	EndCard,
	Field,
	FilmProps,
	FilmShell,
	Grain,
	KineticText,
	ListStack,
	Music,
	Notification,
	PhoneFrame,
	Pill,
	Reveal,
	Sfx,
	Show,
	Tilt,
	Typewriter,
	useLayout,
	useTheme,
	Voice,
} from '../../kit';
import {asset, DURATION, LEAD, P, vo} from './config';
import score from './data/score.json';
import {Logo, Mark} from './Logo';
import {FONTS, GLYPHS, theme} from './theme';

/*
 * A VO-led launch film (problem, agitate, turn, reveal, how it works, CTA), the Seeran-style structure.
 * Problem world: night, monochrome, tilted cards. Turn: one huge line. Reveal: the brand colour floods in.
 * Product world: light, UI on tilted planes, every element landing on its word. End card held 2 s.
 * Every frame number comes from the voice (config.ts), so a new take re-times the film.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const IconTile: React.FC<{children: React.ReactNode; dark?: boolean}> = ({children, dark = true}) => {
	const t = useTheme();
	const {u} = useLayout();
	return (
		<div
			style={{
				width: 64 * u,
				height: 64 * u,
				borderRadius: 18 * u,
				background: dark ? alpha(t.colors.nightInk, 0.07) : t.colors.surface2,
				color: dark ? t.colors.nightMuted : t.colors.brand,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{children}
		</div>
	);
};

const Night: React.FC<{children: React.ReactNode}> = ({children}) => {
	const t = useTheme();
	return (
		<Backdrop color={t.colors.night} glow={{color: 'rgba(255,255,255,0.07)', y: 0.4, size: 1.1}} vignette={0.5}>
			{children}
		</Backdrop>
	);
};

// 1. Hook: on screen from frame 0 (frame 0 is the thumbnail and the scroll-stop). The underline lands on "weeks".
const Hook: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	return (
		<Night>
			<Camera dur={P.sent.from} scale={[1, 1.05]}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: L.isVertical ? 120 * L.u : 0}}>
					<KineticText
						text={'You did the work\n*weeks ago.*'}
						at={-30}
						size={L.pick({vertical: 104, wide: 128}, 110)}
						color={t.colors.nightInk}
						emphasis={{color: t.colors.nightInk, decoration: 'underline', decorationColor: alpha(t.colors.nightInk, 0.45), decorationAt: vo.at('weeks') - LEAD, seed: 'hook'}}
					/>
				</AbsoluteFill>
			</Camera>
		</Night>
	);
};

// 2. Sent three times: the invoice on the desk, sends stacking in on "sent", "invoice", "three".
const Sent: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const u = L.u;
	const from = P.sent.from - LEAD;
	const rows = [
		{left: <IconTile><Send size={28 * u} /></IconTile>, title: 'Invoice sent', meta: 'Mon 2 Oct, 09:12'},
		{left: <IconTile><Send size={28 * u} /></IconTile>, title: 'Reminder sent', meta: 'Mon 9 Oct, 10:40'},
		{left: <IconTile><Send size={28 * u} /></IconTile>, title: 'Reminder sent', meta: 'Mon 16 Oct, 08:55'},
	];
	return (
		<Night>
			<Tilt pose="desk" to={{rx: 22, rz: -7, y: -30, scale: 1.03}} from={from} dur={P.replies.from - from + 20}>
				<Reveal at={from} kind="scale" sfx="whoosh" sfxVolume={0.3}>
					<Card w={L.pick({vertical: 900, wide: 860}, 860)} pad={44} dark radius={38}>
						<div style={{display: 'flex', alignItems: 'center', gap: 20 * u, marginBottom: 26 * u}}>
							<IconTile><Receipt size={30 * u} /></IconTile>
							<div style={{flex: 1}}>
								<div style={{fontFamily: t.fonts.mono, fontSize: 26 * u, color: t.colors.nightMuted}}>INVOICE #1042</div>
								<div style={{fontFamily: t.fonts.display, fontWeight: 700, fontSize: 56 * u, color: t.colors.nightInk, letterSpacing: '-0.03em'}}>₦450,000</div>
							</div>
							<Pill at={from + 10} label="21 days overdue" bg={alpha(t.colors.bad, 0.16)} color={t.colors.bad} size={26} shadow={false} kind="fade" />
						</div>
						<ListStack rows={rows} at={from} rowFrames={[vo.at('sent') - LEAD, vo.at('invoice', {in: 'sent'}) - LEAD, vo.at('three') - LEAD]} w={L.pick({vertical: 812, wide: 772}, 772)} dark sfx="card" size={38} rowH={100} />
					</Card>
				</Reveal>
			</Tilt>
		</Night>
	);
};

// 3. Replies say "next week" on every beat, then go quiet: the stack blurs back and an empty inbox lands.
const Replies: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const u = L.u;
	const f = useCurrentFrame();
	const from = P.replies.from - LEAD;
	const quiet = P.silence.from - LEAD;
	const blur = interpolate(f, [quiet, quiet + 18], [0, 10], clamp);
	const dim = interpolate(f, [quiet, quiet + 18], [1, 0.32], clamp);
	const rows = [
		{left: <Avatar name="Ada Studio" size={66} mono />, title: '"Will pay next week"', meta: 'Ada Studio'},
		{left: <Avatar name="Kola Foods" size={66} mono />, title: '"Next week for sure"', meta: 'Kola Foods'},
		{left: <Avatar name="Brightway" size={66} mono />, title: '"Processing. Next week."', meta: 'Brightway'},
	];
	return (
		<Night>
			<Tilt pose="deskRight" to={{rx: 22, rz: 7, y: -26}} from={from} dur={P.turn.from - from} blur={blur} opacity={dim}>
				<Reveal at={from} kind="scale" sfx="whoosh" sfxVolume={0.3}>
					<Card w={L.pick({vertical: 900, wide: 860}, 860)} pad={28} dark radius={38}>
						<div style={{fontFamily: t.fonts.body, fontSize: 26 * u, color: t.colors.nightMuted, padding: `${6 * u}px ${24 * u}px ${12 * u}px`}}>Replies</div>
						<ListStack
							rows={rows}
							at={from}
							rowFrames={[vo.at('every') - LEAD, vo.at('reply') - LEAD, vo.at('next') - LEAD]}
							w={L.pick({vertical: 844, wide: 804}, 804)}
							rowH={118}
							dark
							sfx="pop"
							size={40}
						/>
					</Card>
				</Reveal>
			</Tilt>
			<Show from={quiet} to={P.turn.from}>
				<Tilt pose={{rx: 16, rz: -5, y: 30}} to={{rx: 12, rz: -4, y: 10}} from={quiet} dur={P.turn.from - quiet}>
					<Reveal at={vo.at('stop') - LEAD} kind="scale" sfx="card" sfxVolume={0.25}>
						<Card w={640} pad={40} dark radius={34}>
							<div style={{display: 'flex', alignItems: 'center', gap: 22 * u}}>
								<IconTile><Inbox size={32 * u} /></IconTile>
								<div>
									<div style={{fontFamily: t.fonts.body, fontWeight: 600, fontSize: 42 * u, color: t.colors.nightInk}}>Inbox</div>
									<div style={{fontFamily: t.fonts.body, fontSize: 34 * u, color: t.colors.nightMuted}}>No new messages</div>
								</div>
							</div>
						</Card>
					</Reveal>
				</Tilt>
			</Show>
		</Night>
	);
};

// 4. The turn: a quiet setup line and one huge statement, word-synced, with a single impact.
const Turn: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const w = vo.wordsOf('turn');
	// the setup line arrives as one phrase (a slow read lingers on it); the big words still land one by one on the voice
	const small = w.slice(0, 3).map((_, i) => w[0].from - LEAD + i * 4);
	const big = w.slice(3).map((x) => x.from - LEAD);
	const frame = useCurrentFrame();
	// while the voice holds the setup line, the brand's light builds behind it: the reveal's flood is already coming
	const build = interpolate(frame, [P.turn.from, big[0]], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.in});
	return (
		<Night>
			<AbsoluteFill style={{background: `radial-gradient(52% 34% at 50% ${L.isVertical ? 42 : 50}%, ${alpha(t.colors.brand, 0.36)} 0%, transparent 72%)`, opacity: 0.2 + 0.8 * build}} />
			<Camera from={P.turn.from} dur={P.reveal.from - P.turn.from + 20} scale={[1, 1.07]} easing={ease.linear}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18 * L.u, paddingBottom: L.isVertical ? 120 * L.u : 0}}>
					<KineticText text="Chasing payments is" at={small[0]} wordFrames={small} size={L.pick({vertical: 64, wide: 62}, 64)} weight={500} color={t.colors.nightMuted} style={{transform: `translateY(${(-22 * build * L.u).toFixed(2)}px)`}} />
					<KineticText text="a second job." at={big[0]} wordFrames={big} kind="blur" size={L.pick({vertical: 168, wide: 200}, 180)} weight={700} color={t.colors.nightInk} tracking="-0.045em" />
				</AbsoluteFill>
			</Camera>
			<Sfx name="impact" at={vo.at('second') - 1} volume={0.4} />
		</Night>
	);
};

// 5. Reveal: the brand colour floods the frame from the centre, then the name builds.
const RevealScene: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const start = P.reveal.from - 10;
	return (
		<>
			<Sfx name="riser" at={start} volume={0.26} />
			<Sfx name="boom" at={start} volume={0.32} />
			<CircleReveal at={start} dur={20} y={L.isVertical ? 0.45 : 0.5}>
				<Backdrop color={t.colors.brand} glow={{color: 'rgba(255,255,255,0.22)', size: 0.95, breathe: true}}>
					<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 34 * L.u, paddingBottom: L.isVertical ? 120 * L.u : 0}}>
						<KineticText text="Meet" at={vo.at('Meet') - LEAD} size={58} weight={500} color={alpha(t.colors.onBrand, 0.8)} />
						<Logo at={vo.at('Paidly', 1, P.reveal.from - 6) - 6} onBrand size={150} />
					</AbsoluteFill>
				</Backdrop>
			</CircleReveal>
		</>
	);
};

const Light: React.FC<{children: React.ReactNode}> = ({children}) => {
	const t = useTheme();
	return (
		<Backdrop color={t.colors.bg} glow={{color: alpha(t.colors.brand, 0.13), y: 0.36, size: 1.05}}>
			{children}
		</Backdrop>
	);
};

// 6. Add an invoice once: the form types itself and the button is pressed.
const Add: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const u = L.u;
	const from = P.add.from - LEAD;
	const W = L.pick({vertical: 840, wide: 900}, 860);
	return (
		<Light>
			<Tilt pose="float" to={{rx: 6, ry: -9, rz: -2, scale: 1.02}} from={from} dur={P.follow.from - from + 30}>
				<Reveal at={from} kind="scale" sfx="whoosh" sfxVolume={0.28}>
					<Card w={W} pad={48} radius={40}>
						<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 * u}}>
							<div style={{fontFamily: t.fonts.display, fontWeight: 650, fontSize: 50 * u, letterSpacing: '-0.03em'}}>New invoice</div>
							<Pill at={from + 4} label="Draft" bg={t.colors.surface2} color={t.colors.muted} size={26} shadow={false} kind="fade" />
						</div>
						<div style={{display: 'flex', flexDirection: 'column', gap: 20 * u}}>
							<Field value="Ada Studio" placeholder="Client" typeAt={from + 4} blurAt={from + 16} cps={28} w={W - 96} icon={<User size={30 * u} />} />
							<Field value="Brand refresh, ₦450,000" placeholder="Item and amount" typeAt={from + 16} cps={40} w={W - 96} icon={<FileText size={30 * u} />} />
							<div style={{marginTop: 8 * u}}>
								<Button label="Send invoice" icon={<Send size={32 * u} />} pressAt={from + 46} full size={36} />
							</div>
						</div>
					</Card>
				</Reveal>
			</Tilt>
		</Light>
	);
};

// 7. Follows up on schedule, in your words: the reminder plan stacks in, then the message types.
const Follow: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const u = L.u;
	const from = P.follow.from - LEAD;
	const day = (d: string) => (
		<div style={{width: 64 * u, height: 64 * u, borderRadius: 18 * u, background: t.colors.surface2, color: t.colors.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.fonts.mono, fontSize: 26 * u, fontWeight: 500}}>
			{d}
		</div>
	);
	const rows = [
		{left: day('D1'), title: 'Friendly reminder', meta: 'Day 1, sent automatically'},
		{left: day('D7'), title: 'Follow-up', meta: 'Day 7, sent automatically'},
		{left: day('D14'), title: 'Final reminder', meta: 'Day 14, sent automatically'},
	];
	const wordsAt = vo.at('your') - LEAD;
	const cardW = L.pick({vertical: 820, wide: 760}, 800);
	return (
		<Light>
			<AbsoluteFill style={{flexDirection: L.isWide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 40 * u, paddingBottom: L.isVertical ? 160 * u : 0}}>
				<Reveal at={from} kind="rise">
					<Card w={cardW} pad={24} radius={36}>
						<ListStack
							rows={rows}
							at={from}
							rowFrames={[vo.at('follows') - LEAD, vo.at('on', 1, P.follow.from - 6) - LEAD, vo.at('schedule') - LEAD]}
							w={cardW - 48}
							rowH={108}
							sfx="pop"
							size={36}
							highlight={{index: 0, at: wordsAt, badge: <span style={{fontFamily: t.fonts.body, fontSize: 26 * u, color: t.colors.onBrand, opacity: 0.9}}>in your words</span>}}
						/>
					</Card>
				</Reveal>
				<Reveal at={wordsAt - 4} kind="rise" sfx="swish" sfxVolume={0.25}>
					<div
						style={{
							width: L.pick({vertical: 720, wide: 640}, 700) * u,
							padding: `${30 * u}px ${36 * u}px`,
							borderRadius: `${34 * u}px ${34 * u}px ${34 * u}px ${10 * u}px`,
							background: t.colors.brand,
							color: t.colors.onBrand,
							boxShadow: t.shadow.md,
							lineHeight: 1.35,
						}}
					>
						<Typewriter text="Hi Ada, a quick reminder about invoice #1043. Thank you!" at={wordsAt} cps={42} size={36} color={t.colors.onBrand} caretColor={t.colors.onBrand} />
					</div>
				</Reveal>
			</AbsoluteFill>
		</Light>
	);
};

// 8. The moment you're paid: a phone, a notification on "moment", a tick on "paid".
const Paid: React.FC = () => {
	const t = useTheme();
	const L = useLayout();
	const u = L.u;
	const from = P.paid.from - LEAD;
	const phoneW = L.pick({vertical: 600, wide: 430}, 520);
	const noteAt = vo.at('moment') - 6;
	return (
		<Light>
			<AbsoluteFill style={{flexDirection: L.isWide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 70 * u, paddingBottom: L.isVertical ? 120 * u : 0}}>
				<Tilt pose="hero" to={{rx: 4, ry: -6, scale: 1.03}} from={from} dur={P.cta.from - from + 20} fill={false}>
					<Reveal at={from} kind="rise" distance={90} fade={false} sfx="whoosh" sfxVolume={0.28}>
						<PhoneFrame w={phoneW} screenBg={t.colors.night} statusDark={false}>
							<div style={{position: 'absolute', top: phoneW * 0.2 * u, width: '100%', textAlign: 'center', color: t.colors.nightInk}}>
								<div style={{fontFamily: t.fonts.body, fontSize: phoneW * 0.045 * u, opacity: 0.7}}>Friday 20 October</div>
								<div style={{fontFamily: t.fonts.display, fontWeight: 500, fontSize: phoneW * 0.24 * u, letterSpacing: '-0.04em', lineHeight: 1.05}}>9:41</div>
							</div>
							<div style={{position: 'absolute', top: phoneW * 0.62 * u, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
								<Notification at={noteAt} app="Paidly" icon={<div style={{width: '72%', height: '72%'}}><Mark /></div>} title="Payment received" body="₦450,000 from Ada Studio" w={phoneW * 0.9} dark />
							</div>
						</PhoneFrame>
					</Reveal>
				</Tilt>
				{L.isWide ? (
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 * u}}>
						<Check w={150} h={150} at={vo.at('paid', {in: 'paid'}) - LEAD} stroke={t.colors.ok} strokeWidth={14} />
						<KineticText text="Paid." at={vo.at('paid', {in: 'paid'}) - LEAD} size={120} weight={700} align="left" />
					</div>
				) : null}
			</AbsoluteFill>
			<Sfx name="success" at={vo.at('paid', {in: 'paid'}) - 2} volume={0.4} />
		</Light>
	);
};

// 9. End card: logo, the promise, and a destination people can type, synced to the voice.
const End: React.FC = () => {
	const t = useTheme();
	const from = P.cta.from - LEAD;
	// The logo already had its reveal at 13 s: here it pre-rolls so the card opens on it, the line follows,
	// and a slow push keeps the long hold alive (a frozen end card reads as a stalled video). The push is linear:
	// an eased one slows to a stop in its last second, and that second reads as frozen.
	return (
		<Backdrop color={t.colors.brand} glow={{color: 'rgba(255,255,255,0.2)', size: 0.95, breathe: true}}>
			<Camera from={from} dur={DURATION - from} scale={[1, 1.05]} easing={ease.linear}>
				<EndCard
					at={from}
					logo={<Logo at={from - 18} onBrand size={130} />}
					line="Get paid without the chasing."
					lineAt={Math.max(vo.at('Get') - LEAD, from + 8)}
					cta="paidly.app"
					ctaAt={vo.at('paidly.app') - LEAD}
					color={t.colors.onBrand}
					muted={alpha(t.colors.onBrand, 0.86)}
					pillBg={t.colors.onBrand}
					pillColor={t.colors.brand}
				/>
			</Camera>
		</Backdrop>
	);
};

export const Film: React.FC<FilmProps> = (props) => (
	<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background={theme.colors.night}>
		<Show from={0} to={P.sent.from - LEAD}>
			<Hook />
		</Show>
		<Show from={P.sent.from - LEAD} to={P.replies.from - LEAD}>
			<Sent />
		</Show>
		<Show from={P.replies.from - LEAD} to={P.turn.from - LEAD}>
			<Replies />
		</Show>
		<Show from={P.turn.from - LEAD} to={P.reveal.from + 14}>
			<Turn />
		</Show>
		<Show from={P.reveal.from - 10} to={P.add.from - LEAD} z={2}>
			<RevealScene />
		</Show>
		<Show from={P.add.from - LEAD} to={P.follow.from - LEAD} z={3}>
			<Add />
		</Show>
		<Show from={P.follow.from - LEAD} to={P.paid.from - LEAD} z={3}>
			<Follow />
		</Show>
		<Show from={P.paid.from - LEAD} to={P.cta.from - LEAD} z={3}>
			<Paid />
		</Show>
		<Show from={P.cta.from - LEAD} to={DURATION} z={4}>
			<End />
		</Show>
		<Grain opacity={0.045} />
		{props.captions ? (
			<CaptionTrack
				captions={vo.captions}
				hide={['hook', 'turn', 'reveal', 'cta', 'url']}
				variant={(f) => (f < P.add.from - LEAD ? 'dark' : f < P.cta.from - LEAD ? 'brand' : 'light')}
			/>
		) : null}
		<Voice src={asset('vo.wav')} />
		{/* data/score.json comes from scripts/score_beds.py: re-run it after every new take, as with align_vo.py */}
		<Music src={asset(score.problem.src)} at={score.problem.at} endAt={score.problem.endAt} volume={0.45} duckUnder={vo.speech()} duckTo={0.55} fadeIn={8} />
		<Music src={asset(score.product.src)} at={score.product.at} volume={0.45} duckUnder={vo.speech()} duckTo={0.55} fadeOut={40} />
	</FilmShell>
);
