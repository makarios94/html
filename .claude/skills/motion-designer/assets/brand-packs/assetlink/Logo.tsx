import React from 'react';
import {LogoReveal} from '../../kit';
import {MARK_GRADIENT, NAVY, theme} from './theme';

/*
 * STAND-IN, NOT THE OFFICIAL FILE. The AssetLink mark is rebuilt here as geometry measured from the logo on
 * "ASSETLINK signals Post.png" (24 Oct 2026): six isometric bars in a hexagon, violet to blue left to right.
 * The wordmark is set in Raleway Light caps with wide tracking as a stand-in for the real lettering.
 * Replace both with the official SVG paths as soon as the brand's logo file is available, and delete this note.
 * Until then every delivery note lists the logo as a stand-in.
 */
const BARS = [
	'404,62 686,225 576,289 294,126',
	'232,162 515,325 404,389 121,226',
	'88,282 515,528 404,592 88,410',
	'88,482 515,728 404,792 88,610',
	'720,282 720,410 576,493 465,429',
	'720,482 720,610 576,693 465,629',
];

/** The mark. `mono` draws it in one flat colour (white on a busy or brand-coloured ground). */
export const Mark: React.FC<{mono?: string}> = ({mono}) => (
	<svg viewBox="68 42 672 770" width="100%" height="100%">
		<defs>
			<linearGradient id="assetlink-mark" gradientUnits="userSpaceOnUse" x1="88" y1="0" x2="720" y2="0">
				<stop offset="0" stopColor={MARK_GRADIENT[0]} />
				<stop offset="1" stopColor={MARK_GRADIENT[1]} />
			</linearGradient>
		</defs>
		{BARS.map((points) => (
			<polygon key={points} points={points} fill={mono ?? 'url(#assetlink-mark)'} />
		))}
	</svg>
);

/**
 * The lockup with a short, plain reveal (no approved animated reveal exists yet).
 * onBrand: the lockup sits on a dark or brand-coloured ground, so the wordmark turns white.
 */
export const Logo: React.FC<{at: number; onBrand?: boolean; size?: number}> = ({at, onBrand = false, size = 130}) => (
	<LogoReveal
		at={at}
		mark={<Mark />}
		markSize={size * 1.25}
		wordmark="ASSETLINK"
		font={theme.fonts.display}
		weight={300}
		size={size * 0.62}
		tracking="0.2em"
		color={onBrand ? '#FFFFFF' : NAVY}
		style="focus"
		gap={size * 0.26}
	/>
);
