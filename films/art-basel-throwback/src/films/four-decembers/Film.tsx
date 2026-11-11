import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FilmProps, FilmShell, Grain, Music, Sfx, useLayout} from '../../kit';
import {Knockout, Legible, NIGHT, Pop, Shot, Slam, Tag, Year} from './motion';
import {EndCard} from './shared';
import {FONTS, GLYPHS, LINING, MARK_GRADIENT, theme} from './theme';

/*
 * Throwback video 1, "Four Decembers", v2 motion. Copy is the script in the Edition V promo doc, word for word.
 * 120 BPM: a beat is 15 frames, a bar 60. Each edition gets two bars:
 *   beat 0  the year, huge, with that year's footage playing inside the digits (the last digit rolls on from the
 *           previous year)
 *   beat 2  the camera punches through the digits into the footage
 *   beat 2+ the doc's line slams in, line by line, the key phrase on a purple bar
 *   beat 5  a whip cut to the second shot
 * Bar 0 is the opening card; bars 9-10 Edition V, the year in brand colour; bar 11 the end card.
 */
const BAR = 60;
const BEAT = 15;
const b = (n: number, beat = 0) => n * BAR + beat * BEAT;
export const DURATION_4D = b(12) + 30;

type Ed = {numeral: string; a: string; bb: string; lines: [string, string]; key: 0 | 1};
const EDS: Ed[] = [
	{numeral: 'I', a: 'e1a', bb: 'e1b', lines: ['It started', 'with one evening.'], key: 1},
	{numeral: 'II', a: 'e2a', bb: 'e2b', lines: ['Then it became', 'a tradition.'], key: 1},
	{numeral: 'III', a: 'e3a', bb: 'e3b', lines: ['We rebuilt the company.', 'We still came back.'], key: 1},
	{numeral: 'IV', a: 'e4a', bb: 'e4b', lines: ['Same city. Same week.', 'More friends in the room.'], key: 1},
];

export const Film: React.FC<FilmProps> = (props) => {
	const L = useLayout();
	const u = L.u;
	const yearSize = L.pick({vertical: 330, square: 300}, 320);
	const slamSize = L.pick({vertical: 84, square: 70}, 78);
	const tagTop = L.safe.top + L.pick({vertical: 10, square: 0}, 0) * u;
	const allRolls = [b(3) - 6, b(5) - 6, b(7) - 6, b(9) - 6];
	return (
		<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background={NIGHT}>
			<Shot name="river" from={0} dur={b(1)} zoom={[1.0, 1.08]} />
			{/* Bar 0: "FOUR DECEMBERS" with the river inside the letters, on frame 0; it punches into the river on beat 2. */}
			<Knockout at={0} punchAt={b(0, 2)} end={b(1)} footage={<Shot name="river" from={0} dur={b(1)} zoom={[1.0, 1.08]} />} origin="50% 52%">
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: theme.fonts.display, fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: '-0.03em', textAlign: 'center', paddingBottom: L.isVertical ? 120 * u : 0}}>
					<span style={{fontSize: L.pick({vertical: 250, square: 190}, 220) * u}}>Four</span>
					<span style={{fontSize: L.pick({vertical: 150, square: 116}, 130) * u}}>Decembers</span>
				</div>
			</Knockout>

			<Legible strength={0.8} from={0} to={b(1)} />
			<Slam lines={[{text: 'ASSETLINK, Miami', at: -6}, {text: 'One tradition,', at: b(0, 2) + 4}, {text: 'four Decembers', at: b(0, 3), key: true}]} exitAt={b(1) - 8} size={L.pick({vertical: 64, square: 52}, 58)} sfx={false} />

			{EDS.map((e, i) => {
				const s = b(1 + 2 * i);
				const digitsBefore = [2, 3, 4, 5].slice(0, i + 1);
				return (
					<React.Fragment key={e.numeral}>
						<Shot name={e.a} from={s - 8} dur={5 * BEAT + 8} whipOut zoom={[1.12, 1.2]} />
						<Shot name={e.bb} from={s + 5 * BEAT} dur={3 * BEAT} whipIn zoom={[1.0, 1.08]} />
						{/* The year with this edition's footage inside it, then the punch-through. */}
						<Knockout at={s - 6} punchAt={s + 2 * BEAT - 10} end={s + 2 * BEAT + 2} footage={<Shot name={e.a} from={s - 8} dur={2 * BEAT + 10} zoom={[1.12, 1.2]} />}>
							<Year digits={[2, 3, 4, 5]} rolls={allRolls.slice(0, i)} size={yearSize} />
						</Knockout>
						<Legible from={s - 6} to={s + 8 * BEAT} />
						<Tag text={`Edition ${e.numeral} · ${2022 + i}`} at={s} exitAt={s + 8 * BEAT - 6} top={tagTop} />
						<Slam
							lines={[
								{text: e.lines[0], at: s + 2 * BEAT + 4, key: e.key === 0},
								{text: e.lines[1], at: s + 3 * BEAT + 4, key: e.key === 1},
							]}
							exitAt={s + 8 * BEAT - 8}
							size={slamSize}
						/>
						<Pop at={s + 2 * BEAT + 1} />
						<Sfx name="whoosh" at={s + 2 * BEAT - 6} volume={0.3} />
						<Sfx name="swish" at={s + 5 * BEAT - 3} volume={0.25} />
						{digitsBefore.length > 1 ? <Sfx name="tick" at={s - 4} volume={0.36} /> : null}
					</React.Fragment>
				);
			})}

			{/* Edition V: the year rolls to 2026 in the brand gradient and slams; the details stack under it. */}
			<Knockout at={b(9) - 6} end={b(11)} footage={null} fill={`linear-gradient(100deg, ${MARK_GRADIENT[0]}, ${MARK_GRADIENT[1]})`}>
				<div style={{transform: `translateY(${(L.isVertical ? -330 : -170) * u}px)`}}>
					<Year digits={[2, 3, 4, 5, 6]} rolls={allRolls} size={yearSize} />
				</div>
			</Knockout>
			<Tag text="Edition V · 2026" at={b(9) + 4} exitAt={b(11) - 6} top={tagTop} />
			<Slam
				lines={[
					{text: 'Thursday, Dec 3', at: b(9, 2)},
					{text: '7–10 PM', at: b(9, 3)},
					{text: 'Seaspice, on the', at: b(10, 0)},
					{text: 'Miami River', at: b(10, 1), key: true},
				]}
				exitAt={b(11) - 8}
				size={L.pick({vertical: 92, square: 66}, 80)}
				bottom={L.safe.bottom + L.pick({vertical: 30, square: 20}, 30) * u}
			/>
			<Pop at={b(9) - 1} color="#7446FF" />
			<Sfx name="impact" at={b(9) - 2} volume={0.36} />
			<Sfx name="tick" at={b(9) - 4} volume={0.36} />

			<EndCard at={b(11)} end={DURATION_4D} />
			<Grain opacity={0.07} />
			<Music src="films/art-basel-throwback/music-4d2.wav" volume={0.9} fadeOut={20} />
		</FilmShell>
	);
};

// Keeps LINING referenced for future number-heavy cards.
void LINING;
void AbsoluteFill;
