import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ease, FilmProps, FilmShell, Grain, Music, prog, Sfx, useLayout} from '../../kit';
import {InfoBeats, TicketCTA} from '../four-decembers/cta';
import {Kinetic} from '../four-decembers/kinetic';
import {Legible, NIGHT, Pop, Shot} from '../four-decembers/motion';
import {Freeze} from '../four-decembers/shared';
import {FONTS, GLYPHS, NAVY, PURPLE, theme} from '../four-decembers/theme';

/*
 * Throwback video 2, "Some assets don't hang on walls", v2 motion. Copy is the doc's script, word for word.
 * The idea acted out: it opens in a gallery with the evenings framed on the wall like artworks. The camera pushes
 * into the centre frame and the people break out of it, full screen. Then it pulls back to the same frame, now empty,
 * with a wall label: "Some assets don't hang on walls." 120 BPM, a beat is 15 frames.
 *   0-84     the gallery wall, "Every December, / Miami fills up with art."
 *   84-98    push into the centre frame
 *   98-210   faces mid-conversation, a cut on every beat, "But some of the best / things that week"
 *   210-300  laughter and toasts, whip cuts, "happen in conversation."
 *   300-372  pull back out of the frame: it is empty; the wall label reads the line
 *   372-480  the slow champagne pour, then the event details slam in over its last frame
 *   480-600  the end card
 */
const BEAT = 15;
const t = (n: number) => n * BEAT;
export const DURATION_SA = 600;
const WALL = '#E9E7F1';
const FACES = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];

type Box = {w: number; h: number; cy: number; side: number; gap: number};
const useBox = (): Box => {
	const L = useLayout();
	// The centre frame's opening has the screen's own aspect, so the push fills the screen exactly.
	return L.pick<Box>({vertical: {w: 468, h: 832, cy: 1010, side: 420, gap: 150}, square: {w: 440, h: 440, cy: 600, side: 360, gap: 120}}, {w: 460, h: 600, cy: 700, side: 380, gap: 130});
};

/** One framed piece on the wall: a navy moulding, a white mat, and whatever hangs inside (or nothing). */
const Framed: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode; empty?: number; over?: React.ReactNode}> = ({x, y, w, h, children, empty = 0, over}) => {
	const {u} = useLayout();
	const mat = 30 * u;
	const moulding = 16 * u;
	return (
		<div style={{position: 'absolute', left: x - w / 2 - mat - moulding, top: y - h / 2 - mat - moulding, width: w + 2 * (mat + moulding), height: h + 2 * (mat + moulding), background: NAVY, padding: moulding, boxShadow: `0 ${26 * u}px ${60 * u}px rgba(21,26,56,0.35), 0 ${4 * u}px ${10 * u}px rgba(21,26,56,0.25)`}}>
			<div style={{width: '100%', height: '100%', background: '#FBFBFD', padding: mat}}>
				<div style={{position: 'relative', width: w, height: h, overflow: 'hidden', background: WALL, boxShadow: `inset 0 ${6 * u}px ${18 * u}px rgba(21,26,56,0.22)`}}>
					<div style={{position: 'absolute', inset: 0, opacity: 1 - empty}}>{children}</div>
					{over}
				</div>
			</div>
		</div>
	);
};

/** The gallery: three frames on a lit wall, a camera that trucks and pushes. */
const Gallery: React.FC<{left: React.ReactNode; centre: React.ReactNode; right: React.ReactNode; camX: number; camScale: number; empty?: number; label?: React.ReactNode}> = ({left, centre, right, camX, camScale, empty = 0, label}) => {
	const L = useLayout();
	const u = L.u;
	const box = useBox();
	const cx = L.width / 2;
	const cy = box.cy * u;
	const sideW = box.side * u;
	const sideH = sideW * 1.25;
	const off = box.w * u / 2 + 46 * u + box.gap * u + sideW / 2 + 46 * u;
	return (
		<AbsoluteFill style={{background: WALL, overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `translateX(${(camX * u).toFixed(2)}px) scale(${camScale.toFixed(4)})`, transformOrigin: `${cx}px ${cy}px`}}>
				{/* Gallery lighting: a pool of light above each frame. */}
				{[-off, 0, off].map((dx) => (
					<div key={dx} style={{position: 'absolute', left: cx + dx - 520 * u, top: cy - 900 * u, width: 1040 * u, height: 1500 * u, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 60%)'}} />
				))}
				<Framed x={cx - off} y={cy} w={sideW} h={sideH}>
					{left}
				</Framed>
				<Framed x={cx} y={cy} w={box.w * u} h={box.h * u} empty={empty} over={label}>
					{centre}
				</Framed>
				<Framed x={cx + off} y={cy} w={sideW} h={sideH}>
					{right}
				</Framed>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const TITLE = "Some assets don't hang on walls.";

/** A small museum label, hung where the artwork should be. Its line types itself on. */
const WallCard: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const p = prog(frame, at, 14, ease.out);
	const l2 = prog(frame, at + 8 + TITLE.length * 1.3, 12, ease.out);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{width: '88%', background: '#FFFFFF', padding: `${26 * u}px ${26 * u}px`, boxShadow: `0 ${10 * u}px ${24 * u}px rgba(21,26,56,0.18)`, opacity: p, transform: `translateY(${((1 - p) * 20 * u).toFixed(2)}px)`}}>
				<div style={{width: 46 * u, height: 5 * u, background: PURPLE, marginBottom: 16 * u}} />
				<div style={{fontFamily: theme.fonts.body, fontWeight: 700, fontSize: L.pick({vertical: 44, square: 32}, 38) * u, lineHeight: 1.18, color: NAVY}}>
					{TITLE.slice(0, Math.floor(interpolate(frame, [at + 6, at + 6 + TITLE.length * 1.3], [0, TITLE.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})))}
					<span style={{display: 'inline-block', width: 4 * u, height: '0.9em', marginLeft: 3 * u, verticalAlign: '-0.1em', background: NAVY, opacity: frame < at + 6 + TITLE.length * 1.3 + 14 || Math.floor(frame / 8) % 2 === 0 ? 1 : 0}} />
				</div>
				<div style={{marginTop: 10 * u, fontFamily: theme.fonts.body, fontStyle: 'italic', fontSize: L.pick({vertical: 30, square: 22}, 26) * u, lineHeight: 1.3, color: 'rgba(21,26,56,0.7)', opacity: l2}}>Medium: advisors, capital, five years of conviction</div>
			</div>
		</AbsoluteFill>
	);
};

/** Dark navy type painted on the wall. */
const WallType: React.FC<{lines: {text: string; at: number}[]; exitAt: number}> = ({lines, exitAt}) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const u = L.u;
	const box = useBox();
	const out = prog(frame, exitAt, 8, ease.in);
	const size = L.pick({vertical: 82, square: 62}, 72);
	void box;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: L.safe.left, right: L.safe.right, top: L.safe.top, display: 'flex', flexDirection: 'column', gap: 4 * u, opacity: 1 - out}}>
				{lines.map((l) => {
					const p = prog(frame, l.at - 2, 9, ease.out);
					return (
						<div key={l.text} style={{overflow: 'hidden'}}>
							<div style={{fontFamily: theme.fonts.display, fontWeight: 800, fontSize: size * u, lineHeight: 1.04, letterSpacing: '-0.02em', color: NAVY, textTransform: 'uppercase', transform: `translateY(${((1 - p) * 105).toFixed(2)}%)`}}>{l.text}</div>
						</div>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

const Clip: React.FC<{name: string; from: number; dur: number}> = ({name, from, dur}) => <Shot name={name} from={from} dur={dur} zoom={[1.0, 1.06]} />;

export const Film: React.FC<FilmProps> = (props) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	// Opening: truck slowly left to right across the wall, then push into the centre frame (84-98).
	const truck = interpolate(frame, [0, 84], [90, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.soft});
	const push = prog(frame, 82, 16, ease.in);
	const box = useBox();
	const fill = Math.max(L.width / (box.w * L.u), L.height / (box.h * L.u)) * 1.04;
	// Pull back (300-322) out of the frame, which empties (318-330).
	const pull = prog(frame, 300, 22, ease.out);
	const empty = prog(frame, 316, 14, ease.soft);
	return (
		<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background={NIGHT}>
			{frame < 99 ? (
				<Gallery
					left={<Clip name="river" from={0} dur={99} />}
					centre={frame < 84 ? <Clip name="art" from={0} dur={84} /> : <Clip name="f1" from={84} dur={21} />}
					right={<Clip name="crowd" from={0} dur={99} />}
					camX={truck}
					camScale={1 + (fill - 1) * push}
				/>
			) : null}
			<Kinetic seed="wall" color={NAVY} shadow={false} top={L.safe.top} size={L.pick({vertical: 82, square: 62}, 72)} lines={[{text: 'Every December,', at: -14, mode: 'rise'}, {text: 'Miami fills up', at: t(2), mode: 'rise'}, {text: 'with art.', at: t(3), mode: 'paint'}]} exitAt={70} />
			<Sfx name="whoosh-long" at={78} volume={0.32} />

			{/* Out of the frame: faces, a cut on every beat. */}
			{frame >= 98 ? FACES.map((f, i) => (i === 0 ? <Clip key={f} name={f} from={84} dur={21} /> : <Clip key={f} name={f} from={105 + (i - 1) * BEAT} dur={BEAT} />)) : null}
			{frame >= 98 && frame < 210 ? <Legible /> : null}
			<Kinetic seed="best" lines={[{text: 'But some of the best', at: 104, mode: 'rise'}, {text: 'things that week', at: 120, mode: 'track', key: true}]} exitAt={196} size={L.pick({vertical: 82, square: 66}, 74)} />
			{FACES.slice(1).map((f, i) => (
				<Sfx key={f} name="tick-soft" at={105 + i * BEAT} volume={0.22} />
			))}

			{/* Laughter and toasts, whip cuts. */}
			<Shot name="t1" from={210} dur={30} whipOut />
			<Shot name="t2" from={240} dur={30} whipIn whipOut />
			<Shot name="t3" from={270} dur={30} whipIn />
			{frame >= 210 && frame < 300 ? <Legible /> : null}
			<Kinetic seed="conv" lines={[{text: 'happen in', at: 212, mode: 'rise'}, {text: 'conversation.', at: 227, mode: 'chatter', key: true}]} exitAt={284} size={L.pick({vertical: 110, square: 88}, 96)} />
			<Sfx name="swish" at={236} volume={0.24} />
			<Sfx name="swish" at={266} volume={0.24} />

			{/* Back on the wall: the frame is empty, the people left it. */}
			{frame >= 300 && frame < 372 ? (
				<Gallery
					left={<Clip name="river" from={300} dur={72} />}
					centre={<Clip name="t3" from={270} dur={60} />}
					right={<Clip name="crowd" from={300} dur={72} />}
					camX={0}
					camScale={fill - (fill - 1) * pull}
					empty={empty}
					label={frame >= 316 ? <WallCard at={318} /> : null}
				/>
			) : null}
			<Sfx name="whoosh" at={298} volume={0.3} />
			<Sfx name="chime" at={318} volume={0.22} />
			{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
				<Sfx key={`ty${i}`} name={(['type-1', 'type-2', 'type-3', 'type-4'] as const)[i % 4]} at={325 + i * 4} volume={0.18} />
			))}

			{/* The champagne pour, then the event over its last frame. */}
			<Shot name="toast" from={372} dur={94} zoom={[1.02, 1.1]} />
			<Freeze still="toast_last.jpg" from={466} dur={28} dark={0.62} />
			{frame >= 372 && frame < 494 ? <Legible strength={1.2} /> : null}
			<Pop at={372} />
			<Kinetic
				seed="event"
				lines={[
					{text: 'ASSETLINK 5th Annual', at: 380, mode: 'track'},
					{text: 'Art Basel Evening', at: 390, mode: 'stamp', key: true},
				]}
				exitAt={400}
				size={L.pick({vertical: 84, square: 66}, 74)}
				bottom={L.height * 0.42}
			/>
			<InfoBeats
				cy={0.5}
				size={L.pick({vertical: 104, square: 92}, 100)}
				items={[
					{label: 'DATE', value: 'Thursday, Dec 3', at: 418, until: 440},
					{label: 'TIME', value: '7–10 PM', at: 442, until: 462, sfx: 'thud'},
					{label: 'VENUE', value: 'Seaspice', sub: 'on the Miami River', at: 462, until: 486},
				]}
			/>

			<TicketCTA at={492} end={DURATION_SA} />
			<Grain opacity={0.06} />
			<Music src="films/art-basel-throwback/music-sa-el.wav" volume={0.9} fadeOut={20} trimBefore={74} />
		</FilmShell>
	);
};
