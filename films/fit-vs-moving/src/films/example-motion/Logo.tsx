import React from 'react';
import {LogoReveal} from '../../kit';
import {theme} from './theme';

/** The example's mark: a basket in a circle. A real brand uses its official SVG paths only. */
export const Mark: React.FC<{fg?: string; bg?: string}> = ({fg = '#FFFFFF', bg = theme.colors.brand}) => (
	<svg viewBox="0 0 100 100" width="100%" height="100%">
		<circle cx="50" cy="50" r="50" fill={bg} />
		<path d="M32 44 C32 28, 68 28, 68 44" stroke={fg} strokeWidth="7" fill="none" strokeLinecap="round" />
		<path d="M24 44 H76 L70 72 C69 76, 66 78, 62 78 H38 C34 78, 31 76, 30 72 Z" fill={fg} />
	</svg>
);

export const Logo: React.FC<{at: number; onBrand?: boolean; size?: number}> = ({at, onBrand = false, size = 130}) => (
	<LogoReveal
		at={at}
		mark={<Mark fg={onBrand ? theme.colors.brand : '#FFFFFF'} bg={onBrand ? '#FFFFFF' : theme.colors.brand} />}
		markSize={size * 1.1}
		wordmark="basket"
		size={size}
		weight={800}
		color={onBrand ? '#FFFFFF' : theme.colors.ink}
		style="pop"
		gap={size * 0.24}
	/>
);
