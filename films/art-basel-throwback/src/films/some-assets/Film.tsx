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
 * Paced to sit like "Four Decembers": every line gets its bar, every cut its two beats.
 *   0-156    the gallery wall, "Every December, / Miami fills up / with art.", then the push into the centre frame
 *   154-360  faces mid-conversation, a cut every two beats, "But some of the best / things that week"
 *   360-480  laughter and toasts, whip cuts, "happen in conversations."
 *   480-660  pull back out of the frame: it is empty; the wall label types the line, the camera leans in to read it
 *   660-834  the slow champagne pour, the event title, then date, time and venue one at a time
 *   836-940  the end card
 */
const BEAT = 15;
const t = (n: number) => n * BEAT;
export const DURATION_SA = 940;
const WALL = '#E9E7F1';
const FACES = ['f2', 'f3', 'f4', 'f5', 'f6', 'f7'];
const TYPE_RATE = 2.2;

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
	const p = prog(frame, at, 18, ease.out);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{width: '88%', background: '#FFFFFF', padding: `${32 * u}px ${30 * u}px`, boxShadow: `0 ${10 * u}px ${24 * u}px rgba(21,26,56,0.18)`, opacity: p, transform: `translateY(${((1 - p) * 20 * u).toFixed(2)}px)`}}>
				<div style={{width: 46 * u, height: 5 * u, background: PURPLE, marginBottom: 16 * u}} />
				<div style={{fontFamily: theme.fonts.body, fontWeight: 700, fontSize: L.pick({vertical: 60, square: 44}, 52) * u, lineHeight: 1.12, color: NAVY}}>
					{TITLE.slice(0, Math.floor(interpolate(frame, [at + 10, at + 10 + TITLE.length * TYPE_RATE], [0, TITLE.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})))}
					<span style={{display: 'inline-block', width: 4 * u, height: '0.9em', marginLeft: 3 * u, verticalAlign: '-0.1em', background: NAVY, opacity: frame < at + 10 + TITLE.length * TYPE_RATE + 14 || Math.floor(frame / 8) % 2 === 0 ? 1 : 0}} />
				</div>
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

const Clip: React.FC<{name: string; from: number; dur: number; fit?: boolean; rate?: number}> = ({name, from, dur, fit = true, rate = 1}) => <Shot name={name} from={from} dur={dur} zoom={[1.0, 1.06]} fit={fit} rate={rate} />;

export const Film: React.FC<FilmProps> = (props) => {
	const frame = useCurrentFrame();
	const L = useLayout();
	const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
	// Opening: a slow truck across the wall, then the push into the centre frame (136-154).
	const truck = interpolate(frame, [0, 140], [110, 0], {...cl, easing: ease.soft});
	const push = prog(frame, 136, 18, ease.in);
	const box = useBox();
	const fill = Math.max(L.width / (box.w * L.u), L.height / (box.h * L.u)) * 1.04;
	// Pull back (480-504) out of the frame, which empties (498-514); then lean in on the label to read it.
	const pull = prog(frame, 480, 24, ease.out);
	const empty = prog(frame, 498, 16, ease.soft);
	const lean = interpolate(frame, [516, 650], [1, 1.32], {...cl, easing: ease.soft});
	return (
		<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background={NIGHT}>
			{frame < 156 ? (
				<Gallery
					left={<Clip name="river" from={0} dur={156} fit={false} rate={0.6} />}
					centre={frame < 140 ? <Clip name="art" from={0} dur={140} fit={false} rate={0.6} /> : <Clip name="f1" from={140} dur={16} fit={false} rate={0.66} />}
					right={<Clip name="crowd" from={0} dur={156} fit={false} rate={0.6} />}
					camX={truck}
					camScale={1 + (fill - 1) * push}
				/>
			) : null}
			<Kinetic seed="wall" color={NAVY} shadow={false} top={L.safe.top + L.pick({vertical: 0, square: 30}, 0) * L.u} size={L.pick({vertical: 82, square: 62}, 72)} lines={[{text: 'Every December,', at: -14, mode: 'rise'}, {text: 'Miami fills up', at: 30, mode: 'rise'}, {text: 'with art.', at: 62, mode: 'paint'}]} exitAt={124} />
			<Sfx name="whoosh-long" at={130} volume={0.32} />

			{/* Out of the frame: faces, a cut every two beats. */}
			{frame >= 154 ? <Clip name="f1" from={140} dur={40} rate={0.66} /> : null}
			{FACES.map((f, i) => <Clip key={f} name={f} from={180 + i * 2 * BEAT} dur={2 * BEAT} rate={0.85} />)}
			{frame >= 154 && frame < 360 ? <Legible /> : null}
			<Kinetic seed="best" lines={[{text: 'But some of the best', at: 166, mode: 'rise'}, {text: 'things that week', at: 196, mode: 'track', key: true}]} exitAt={338} size={L.pick({vertical: 82, square: 66}, 74)} />
			{FACES.map((f, i) => (
				<Sfx key={f} name="tick-soft" at={180 + i * 2 * BEAT} volume={0.22} />
			))}

			{/* Laughter and toasts, whip cuts. */}
			<Shot name="t1" from={360} dur={40} whipOut />
			<Shot name="t2" from={400} dur={40} whipIn whipOut />
			<Shot name="t3" from={440} dur={40} whipIn rate={0.75} />
			{frame >= 360 && frame < 480 ? <Legible /> : null}
			<Kinetic seed="conv" lines={[{text: 'happen in', at: 366, mode: 'rise'}, {text: 'conversations.', at: 392, mode: 'chatter', key: true}]} exitAt={462} size={L.pick({vertical: 98, square: 80}, 88)} />
			<Sfx name="swish" at={396} volume={0.24} />
			<Sfx name="swish" at={436} volume={0.24} />

			{/* Back on the wall: the frame is empty, the people left it. */}
			{frame >= 480 && frame < 660 ? (
				<Gallery
					left={<Clip name="river" from={480} dur={180} fit={false} rate={0.5} />}
					centre={<Clip name="t3" from={440} dur={80} fit={false} rate={0.75} />}
					right={<Clip name="crowd" from={480} dur={180} fit={false} rate={0.5} />}
					camX={0}
					camScale={(fill - (fill - 1) * pull) * lean}
					empty={empty}
					label={frame >= 510 ? <WallCard at={512} /> : null}
				/>
			) : null}
			<Sfx name="whoosh" at={478} volume={0.3} />
			<Sfx name="chime" at={512} volume={0.22} />
			{Array.from({length: 16}, (_, i) => (
				<Sfx key={`ty${i}`} name={(['type-1', 'type-2', 'type-3', 'type-4'] as const)[i % 4]} at={522 + Math.round(i * 4.4)} volume={0.16} />
			))}

			{/* The champagne pour, then the event over its last frame. */}
			<Shot name="toast" from={660} dur={116} zoom={[1.02, 1.12]} rate={0.8} />
			<Freeze still="toast_last.jpg" from={776} dur={64} dark={0.62} />
			{frame >= 660 && frame < 840 ? <Legible strength={1.2} /> : null}
			{/* A darker wash once the event details start, so the DATE and TIME cards read over the bright pour. */}
			{frame >= 704 && frame < 840 ? <AbsoluteFill style={{background: NIGHT, opacity: interpolate(frame, [704, 720, 776, 784], [0, 0.52, 0.52, 0], cl)}} /> : null}
			<Pop at={660} />
			<Kinetic
				seed="event"
				lines={[
					{text: 'ASSETLINK 5th Annual', at: 668, mode: 'track'},
					{text: 'Art Basel Evening', at: 684, mode: 'stamp', key: true},
				]}
				exitAt={712}
				size={L.pick({vertical: 84, square: 66}, 74)}
				bottom={L.height * 0.42}
			/>
			<InfoBeats
				cy={0.5}
				size={L.pick({vertical: 104, square: 92}, 100)}
				items={[
					{label: 'DATE', value: 'Thursday, Dec 3', at: 722, until: 756},
					{label: 'TIME', value: '7–10 PM', at: 758, until: 790, sfx: 'thud'},
					{label: 'VENUE', value: 'Seaspice', sub: 'on the Miami River', at: 792, until: 830},
				]}
			/>

			<TicketCTA at={836} end={DURATION_SA} />
			<Grain opacity={0.06} />
			<Music src="films/art-basel-throwback/music-sa-el-ext.wav" volume={0.9} fadeOut={20} />
		</FilmShell>
	);
};
