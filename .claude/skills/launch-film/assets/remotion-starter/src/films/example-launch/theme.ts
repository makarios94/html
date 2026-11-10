import {loadFont as loadDisplay} from '@remotion/google-fonts/InterTight';
import {loadFont as loadBody} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {Theme} from '../../kit';

// Subsets: latin-ext covers the naira sign's range and ṣ; vietnamese covers Yoruba dot-below vowels (ẹ, ọ).
// A range is not a promise that the face has the glyph: GLYPHS below is proven on every frame by FontGuard.
const display = loadDisplay('normal', {weights: ['500', '600', '700'], subsets: ['latin', 'latin-ext', 'vietnamese']}).fontFamily;
const body = loadBody('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext', 'vietnamese']}).fontFamily;
const mono = loadMono('normal', {weights: ['500'], subsets: ['latin', 'latin-ext']}).fontFamily;

/** Families FontGuard must see loaded, or every frame gets a red banner. */
export const FONTS = [display, body, mono];
/** Special characters each face must draw (tested: JetBrains Mono has no ₦, so amounts are never set in mono). */
export const GLYPHS = {[display]: '₦', [body]: '₦ẹọṣ'};

/** A fictional brand ("Paidly") for the example. Real films build this from the brand's source of truth. */
export const theme: Theme = {
	name: 'Paidly',
	colors: {
		bg: '#F4F2FF',
		surface: '#FFFFFF',
		surface2: '#EEEBFF',
		ink: '#15131F',
		muted: 'rgba(21,19,31,0.6)',
		faint: 'rgba(21,19,31,0.36)',
		line: 'rgba(21,19,31,0.1)',
		brand: '#4B3BFF',
		onBrand: '#FFFFFF',
		accent: '#4B3BFF',
		onAccent: '#FFFFFF',
		night: '#0B0B10',
		nightSurface: '#17161F',
		nightInk: '#F3F2F8',
		nightMuted: 'rgba(243,242,248,0.55)',
		nightLine: 'rgba(243,242,248,0.1)',
		ok: '#15A26A',
		warn: '#D99A1E',
		bad: '#E5484D',
	},
	fonts: {display, body, mono},
	weight: {display: 600, displayStrong: 700, body: 400, bodyStrong: 600},
	tracking: {display: '-0.035em', body: '-0.01em'},
	leading: {display: 1.0, body: 1.3},
	radius: {sm: 14, md: 22, lg: 36, pill: 999},
	shadow: {
		sm: '0 2px 6px rgba(22,18,70,0.06), 0 10px 30px rgba(22,18,70,0.08)',
		md: '0 8px 20px rgba(22,18,70,0.10), 0 30px 80px rgba(22,18,70,0.16)',
		lg: '0 16px 40px rgba(22,18,70,0.16), 0 60px 140px rgba(22,18,70,0.28)',
	},
	personality: 'crisp',
};
