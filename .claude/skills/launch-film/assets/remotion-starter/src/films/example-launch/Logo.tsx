import React from 'react';
import {LogoReveal} from '../../kit';
import {theme} from './theme';

/** The example's mark: a rounded tile with a tick. A real brand uses its official SVG paths only. */
export const Mark: React.FC<{fg?: string; bg?: string}> = ({fg = theme.colors.brand, bg = '#FFFFFF'}) => (
	<svg viewBox="0 0 100 100" width="100%" height="100%">
		<rect width="100" height="100" rx="28" fill={bg} />
		<path d="M29 53 L44 67 L72 36" stroke={fg} strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/** The lockup with its reveal. Every film folder exports a Logo with this shape, so brand packs can swap it. */
export const Logo: React.FC<{at: number; onBrand?: boolean; size?: number}> = ({at, onBrand = false, size = 130}) => (
	<LogoReveal
		at={at}
		mark={<Mark fg={onBrand ? theme.colors.brand : '#FFFFFF'} bg={onBrand ? '#FFFFFF' : theme.colors.brand} />}
		markSize={size * 1.05}
		wordmark="Paidly"
		size={size}
		weight={700}
		color={onBrand ? '#FFFFFF' : theme.colors.ink}
		style="build"
		gap={size * 0.26}
	/>
);
