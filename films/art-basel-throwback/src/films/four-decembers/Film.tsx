import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FilmProps, FilmShell, Grain, Music, Sfx, useLayout} from '../../kit';
import {EndCard, Footage, Freeze, Shade, WallLabel, YearFlip} from './shared';
import {FONTS, GLYPHS, theme} from './theme';

/*
 * Throwback video 1, "Four Decembers" (about 22 s + the end card), to the script in the Edition V promo doc.
 * 120 BPM, one bar = 2 s = 60 frames. Bar 0 open, bars 1-2 Edition I, 3-4 II, 5-6 III, 7-8 IV, 9-10 Edition V,
 * bar 11 the end card. The year flips forward on each edition, 2022 to 2026, and the last flip lands on this year.
 */
const BAR = 60;
const b = (n: number) => n * BAR;
export const DURATION_4D = b(12) + 30;

const EDITIONS = [
	{a: 'e1a', b: 'e1b', title: 'Edition I · 2022', line: 'It started with one evening.'},
	{a: 'e2a', b: 'e2b', title: 'Edition II · 2023', line: 'Then it became a tradition.'},
	{a: 'e3a', b: 'e3b', title: 'Edition III · 2024', line: 'We rebuilt the company. We still came back.'},
	{a: 'e4a', b: 'e4b', title: 'Edition IV · 2025', line: 'Same city. Same week. More friends in the room.'},
];

export const Film: React.FC<FilmProps> = (props) => {
	const L = useLayout();
	const yearSize = L.pick({vertical: 210, square: 150}, 180);
	const yearTop = L.safe.top + L.pick({vertical: 20, square: 0}, 10) * L.u;
	return (
		<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background="#0B0D26">
			{/* Bar 0: a slow river shot and the opening label, already in place on frame 0. */}
			<Footage name="river" from={0} dur={b(1) + 6} dim={0.15} />
			{EDITIONS.map((e, i) => (
				<React.Fragment key={e.title}>
					<Footage name={e.a} from={b(1 + 2 * i)} dur={BAR} />
					<Footage name={e.b} from={b(2 + 2 * i)} dur={BAR} />
				</React.Fragment>
			))}
			{/* Edition V: freeze on the last frame of 2025 and darken. */}
			<Freeze still="e4_freeze.jpg" from={b(9)} dur={b(2)} />
			<Shade />
			<WallLabel at={-12} exitAt={b(1) - 8} lines={[{text: 'ASSETLINK, Miami', at: -12, style: 'title'}, {text: 'One tradition, four Decembers', at: 8}]} />
			{EDITIONS.map((e, i) => (
				<WallLabel key={e.title} at={b(1 + 2 * i) + 2} exitAt={b(3 + 2 * i) - 8} lines={[{text: e.title, at: b(1 + 2 * i) + 4, style: 'title'}, {text: e.line, at: b(1 + 2 * i) + 16}]} />
			))}
			<WallLabel
				at={b(9) + 8}
				exitAt={b(11) - 8}
				lines={[
					{text: 'Edition V · 2026', at: b(9) + 10, style: 'title'},
					{text: 'Thursday, Dec 3 · 7–10 PM', at: b(9) + 26},
					{text: 'Seaspice, on the Miami River', at: b(9) + 40},
				]}
			/>
			<YearFlip at={b(1) - 4} exitAt={b(11) - 8} digits={[2, 3, 4, 5, 6]} flips={[b(3) - 6, b(5) - 6, b(7) - 6, b(9) - 6]} size={yearSize} top={yearTop} />
			{[1, 3, 5, 7].map((n) => (
				<Sfx key={n} name="swish" at={b(n) - 3} volume={0.18} />
			))}
			<Sfx name="impact" at={b(9) - 2} volume={0.3} />
			<EndCard at={b(11)} end={DURATION_4D} />
			<Grain opacity={0.06} />
			<Music src="films/art-basel-throwback/music-4d.wav" volume={0.85} fadeOut={20} />
		</FilmShell>
	);
};
