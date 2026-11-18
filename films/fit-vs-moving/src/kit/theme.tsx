import React, {createContext, useContext} from 'react';
import {MOTION, MotionSpec, Personality} from './motion';

/**
 * A theme is the brand, in tokens. Build it from the brand's real source of truth
 * (design system file, brand book, live CSS), never from memory. One theme per film.
 */
export type Theme = {
	name: string;
	colors: {
		/** Light world: background, raised surfaces, text. */
		bg: string;
		surface: string;
		surface2: string;
		ink: string;
		muted: string;
		faint: string;
		line: string;
		/** Brand fill and the text that sits on it. */
		brand: string;
		onBrand: string;
		/** One accent. Ration it: emphasis words, the one thing to look at. */
		accent: string;
		onAccent: string;
		/** Dark world: the "problem" half of a story, or a dark theme. */
		night: string;
		nightSurface: string;
		nightInk: string;
		nightMuted: string;
		nightLine: string;
		/** Status colours, for UI that needs them. */
		ok: string;
		warn: string;
		bad: string;
	};
	fonts: {display: string; body: string; mono: string};
	weight: {display: number; displayStrong: number; body: number; bodyStrong: number};
	/** Display tracking (letter-spacing) and leading. Big type wants tight tracking. */
	tracking: {display: string; body: string};
	leading: {display: number; body: number};
	radius: {sm: number; md: number; lg: number; pill: number};
	shadow: {sm: string; md: string; lg: string};
	personality: Personality;
};

export const neutralTheme: Theme = {
	name: 'Neutral',
	colors: {
		bg: '#FFFFFF',
		surface: '#FFFFFF',
		surface2: '#F5F5F7',
		ink: '#111114',
		muted: 'rgba(17,17,20,0.62)',
		faint: 'rgba(17,17,20,0.38)',
		line: 'rgba(17,17,20,0.12)',
		brand: '#4F46E5',
		onBrand: '#FFFFFF',
		accent: '#4F46E5',
		onAccent: '#FFFFFF',
		night: '#0B0B0E',
		nightSurface: '#17171C',
		nightInk: '#F5F5F7',
		nightMuted: 'rgba(245,245,247,0.6)',
		nightLine: 'rgba(245,245,247,0.12)',
		ok: '#1F8A4C',
		warn: '#B7791F',
		bad: '#C53030',
	},
	fonts: {display: 'sans-serif', body: 'sans-serif', mono: 'monospace'},
	weight: {display: 600, displayStrong: 700, body: 450, bodyStrong: 600},
	tracking: {display: '-0.03em', body: '-0.005em'},
	leading: {display: 1.02, body: 1.3},
	radius: {sm: 12, md: 22, lg: 34, pill: 999},
	shadow: {
		sm: '0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)',
		md: '0 6px 16px rgba(0,0,0,0.08), 0 24px 60px rgba(0,0,0,0.12)',
		lg: '0 12px 30px rgba(0,0,0,0.12), 0 50px 120px rgba(0,0,0,0.22)',
	},
	personality: 'crisp',
};

/**
 * A theme colour at an opacity: alpha(t.colors.brand, 0.12). Use it instead of typing rgba() values, so a film
 * re-skins cleanly when its theme (or brand pack) changes. Non-hex inputs come back unchanged.
 */
export const alpha = (color: string, a: number) => {
	const h = color.trim().replace('#', '');
	if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(h)) return color;
	const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
	const n = parseInt(full, 16);
	return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const ThemeCtx = createContext<Theme>(neutralTheme);

export const ThemeProvider: React.FC<{theme: Theme; children: React.ReactNode}> = ({theme, children}) => (
	<ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>
);

export const useTheme = () => useContext(ThemeCtx);
export const useMotion = (): MotionSpec => MOTION[useContext(ThemeCtx).personality];
