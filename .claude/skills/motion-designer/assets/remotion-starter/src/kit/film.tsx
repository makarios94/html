import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stem, StemProvider} from './audio';
import {FontGuard, GlyphSpec, SafeZones} from './components/Brand';
import {FontsContext} from './fonts';
import {Theme, ThemeProvider} from './theme';

/** Props every film composition accepts (pass with --props when rendering). */
export type FilmProps = {
	/** Which audio plays: all for previews, vo / music / sfx to render stems for the final mix, none for silent picture. */
	stem: Stem;
	/** Burned-in captions on or off (render a clean version for platforms that add their own). */
	captions: boolean;
	/** QA overlay of the safe zones. */
	safeZones: boolean;
};

export const defaultFilmProps: FilmProps = {stem: 'all', captions: true, safeZones: false};

/**
 * The wrapper every film uses: theme, stem routing, font check, safe-zone overlay.
 * `glyphs`: the special characters the copy uses (currency, diacritics, symbols), as one string for every face
 * ("₦ẹọṣ") or per face ({'DM Sans': '₦', Saira: 'ẹọṣ'}). FontGuard proves each face draws them; a frame with a
 * missing glyph gets a red banner naming the face and the character.
 */
export const FilmShell: React.FC<{theme: Theme; fonts: string[]; glyphs?: GlyphSpec; props: FilmProps; background?: string; children: React.ReactNode}> = ({
	theme,
	fonts,
	glyphs,
	props,
	background,
	children,
}) => (
	<ThemeProvider theme={theme}>
		<FontsContext.Provider value={fonts}>
			<StemProvider stem={props.stem}>
				<AbsoluteFill style={{background: background ?? theme.colors.bg, overflow: 'hidden'}}>
					{children}
					<SafeZones show={props.safeZones} />
					<FontGuard families={fonts} glyphs={glyphs} />
				</AbsoluteFill>
			</StemProvider>
		</FontsContext.Provider>
	</ThemeProvider>
);

/**
 * A scene window in ABSOLUTE time: children see the film's real frame numbers, so cues from the
 * voice or beat grid plug in directly. The window stays mounted (hidden) for `tail` frames after `to`
 * so sounds that started inside the scene finish instead of being cut.
 */
export const Show: React.FC<{from: number; to: number; tail?: number; z?: number; children: React.ReactNode}> = ({from, to, tail = 60, z, children}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame >= to + tail) return null;
	const hidden = frame >= to;
	return <AbsoluteFill style={{visibility: hidden ? 'hidden' : 'visible', zIndex: z}}>{children}</AbsoluteFill>;
};
