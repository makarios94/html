import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FilmProps, FilmShell, Grain, Music, Sfx, useLayout} from '../../kit';
import {InfoBeats, TicketCTA} from './cta';
import {Kinetic, Mode} from './kinetic';
import {Knockout, Legible, NIGHT, Pop, Shot, Tag, Year} from './motion';
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

/** Each line: its text, its entrance, the beat it lands on (from the punch-through) and whether it carries the bar. */
type EdLine = {text: string; mode: Mode; beat: number; key?: boolean};
type Ed = {numeral: string; a: string; bb: string; lines: EdLine[]};
const EDS: Ed[] = [
	{numeral: 'I', a: 'e1a', bb: 'e1b', lines: [{text: 'It started', mode: 'rise', beat: 0}, {text: 'with one', mode: 'rise', beat: 1}, {text: 'evening.', mode: 'type', beat: 1.6, key: true}]},
	{numeral: 'II', a: 'e2a', bb: 'e2b', lines: [{text: 'Then it became', mode: 'rise', beat: 0}, {text: 'a tradition.', mode: 'stamp', beat: 1, key: true}]},
	{numeral: 'III', a: 'e3a', bb: 'e3b', lines: [{text: 'We rebuilt', mode: 'stack', beat: 0}, {text: 'the company.', mode: 'stack', beat: 0.7}, {text: 'We still', mode: 'rise', beat: 2}, {text: 'came back.', mode: 'rewind', beat: 2.5, key: true}]},
	{numeral: 'IV', a: 'e4a', bb: 'e4b', lines: [{text: 'Same city.', mode: 'rise', beat: 0}, {text: 'Same week.', mode: 'rise', beat: 0.6}, {text: 'More friends', mode: 'echo', beat: 2, key: true}, {text: 'in the room.', mode: 'echo', beat: 2.5}]},
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
			<Kinetic seed="open" lines={[{text: 'ASSETLINK, Miami', at: -16, mode: 'track'}, {text: 'One tradition,', at: b(0, 2) + 4, mode: 'rise'}, {text: 'four Decembers', at: b(0, 3), mode: 'stamp', key: true}]} exitAt={b(1) - 12} size={L.pick({vertical: 64, square: 52}, 58)} />

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
						<Kinetic
							seed={e.numeral}
							lines={e.lines.map((ln) => ({text: ln.text, mode: ln.mode, key: ln.key, at: Math.round(s + 2 * BEAT + 4 + ln.beat * BEAT)}))}
							exitAt={s + 8 * BEAT - 14}
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
			<InfoBeats
				cy={L.pick({vertical: 0.6, square: 0.68}, 0.64)}
				size={L.pick({vertical: 104, square: 92}, 100)}
				items={[
					{label: 'DATE', value: 'Thursday, Dec 3', at: b(9) + 12, until: b(9) + 44},
					{label: 'TIME', value: '7–10 PM', at: b(9) + 46, until: b(9) + 76, sfx: 'thud'},
					{label: 'VENUE', value: 'Seaspice', sub: 'on the Miami River', at: b(9) + 78, until: b(11) - 8},
				]}
			/>
			<Pop at={b(9) - 1} color="#7446FF" />
			<Sfx name="impact" at={b(9) - 2} volume={0.36} />
			<Sfx name="tick" at={b(9) - 4} volume={0.36} />

			<TicketCTA at={b(11)} end={DURATION_4D} />
			<Grain opacity={0.07} />
			<Music src="films/art-basel-throwback/music-4d-el.wav" volume={0.9} fadeOut={20} trimBefore={14} />
		</FilmShell>
	);
};

// Keeps LINING referenced for future number-heavy cards.
void LINING;
void AbsoluteFill;
