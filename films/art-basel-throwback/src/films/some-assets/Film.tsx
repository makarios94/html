import React from 'react';
import {FilmProps, FilmShell, Grain, Music, Sfx} from '../../kit';
import {EndCard, Footage, Freeze, Shade, WallLabel} from '../four-decembers/shared';
import {FONTS, GLYPHS, theme} from '../four-decembers/theme';

/*
 * Throwback video 2, "Some assets don't hang on walls" (16 s + the end card), to the script in the Edition V promo doc.
 * No years: moments from every edition. 120 BPM, one beat = 0.5 s = 15 frames.
 * 0-3 s wide busy shots, "Every December, / Miami fills up with art."
 * 3-7 s faces mid-conversation, a cut on every beat, "But some of the best things that week"
 * 7-10 s laughter and toasts, the sentence completes: "happen in conversation."
 * 10-13 s one slow toast, the line set as a wall label
 * 13-16 s the darkened last frame and the event label; 16-18 s the end card.
 */
const BEAT = 15;
const t = (n: number) => n * BEAT;
export const DURATION_SA = t(36) + 30;
const FACES = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];
const TOASTS = ['t1', 't2', 't3'];

export const Film: React.FC<FilmProps> = (props) => (
	<FilmShell theme={theme} fonts={FONTS} glyphs={GLYPHS} props={props} background="#0B0D26">
		<Footage name="river" from={0} dur={t(3)} />
		<Footage name="wide" from={t(3)} dur={t(3)} />
		{FACES.map((f, i) => (
			<Footage key={f} name={f} from={t(6 + i)} dur={BEAT} />
		))}
		{TOASTS.map((f, i) => (
			<Footage key={f} name={f} from={t(14 + 2 * i)} dur={t(2)} />
		))}
		<Footage name="toast" from={t(20)} dur={t(6)} />
		<Freeze still="toast_last.jpg" from={t(26)} dur={t(6)} />
		<Shade />
		<WallLabel at={-12} exitAt={t(6) - 8} lines={[{text: 'Every December,', at: -12, style: 'title'}, {text: 'Miami fills up with art.', at: t(2)}]} />
		<WallLabel
			at={t(6)}
			exitAt={t(20) - 8}
			lines={[
				{text: 'But some of the best things that week', at: t(6) + 2, style: 'title'},
				{text: 'happen in conversation.', at: t(14)},
			]}
		/>
		<WallLabel
			at={t(20) + 2}
			exitAt={t(26) - 8}
			lines={[
				{text: "Some assets don't hang on walls.", at: t(20) + 4, style: 'title'},
				{text: 'Medium: advisors, capital, five years of conviction', at: t(21) + 6, style: 'italic'},
			]}
		/>
		<WallLabel
			at={t(26)}
			exitAt={t(32) - 8}
			lines={[
				{text: 'ASSETLINK 5th Annual Art Basel Evening', at: t(26) + 2, style: 'title'},
				{text: 'Thursday, Dec 3 · Seaspice, on the Miami River', at: t(27) + 4},
			]}
		/>
		{FACES.map((f, i) => (
			<Sfx key={f} name="tick-soft" at={t(6 + i)} volume={0.2} />
		))}
		<Sfx name="swish" at={t(14) - 2} volume={0.2} />
		<Sfx name="chime" at={t(20) + 4} volume={0.22} />
		<EndCard at={t(32)} end={DURATION_SA} />
		<Grain opacity={0.06} />
		<Music src="films/art-basel-throwback/music-sa.wav" volume={0.85} fadeOut={20} />
	</FilmShell>
);
