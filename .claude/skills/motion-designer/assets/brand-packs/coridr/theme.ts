import {loadFont as loadSaira} from '@remotion/google-fonts/Saira';
import {loadFont as loadDMSans} from '@remotion/google-fonts/DMSans';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {Theme} from '../../kit';

/*
 * Coridr brand pack. Tokens copied from the Coridr Design System
 * (C:\Users\User\Desktop\Coridr design system\coridr-design-system.html, :root light and dark blocks)
 * and the approved logo reveal (coridr-logo-reveal.html). Re-read those files if anything looks off:
 * they are the source of truth, this file is a copy.
 *
 * Faces: Saira = display and the wordmark (marketing display, used sparingly), DM Sans = all body and UI,
 * JetBrains Mono = codes, references and amounts. Subsets include latin-ext (naira sign, West African
 * names); Saira also loads vietnamese, which carries Yoruba dot-below vowels.
 */
const display = loadSaira('normal', {weights: ['300', '400', '500', '600'], subsets: ['latin', 'latin-ext', 'vietnamese']}).fontFamily;
const body = loadDMSans('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext']}).fontFamily;
const mono = loadMono('normal', {weights: ['400', '500'], subsets: ['latin', 'latin-ext', 'vietnamese']}).fontFamily;

export const FONTS = [display, body, mono];

/*
 * Glyph coverage, tested with FontGuard (Google Fonts versions, every available subset loaded):
 *   Saira           ₦ ẹ ọ ṣ  all drawn
 *   JetBrains Mono  ẹ ọ drawn (vietnamese subset); no ₦, no ṣ
 *   DM Sans         none of the four (it has no vietnamese subset at all)
 * So in Coridr films: write amounts as "NGN 450,000" in DM Sans and mono (as the product's own flag notes do), set
 * any ₦ figure or a Yoruba name with dot-below letters in Saira, or confirm the spelling with the founder. Add a face
 * and its characters here whenever the copy needs something special, so a gap shows as a banner, never a fallback.
 */
export const GLYPHS = {[display]: '₦ẹọṣ'};

/** Palette, for reference in scenes: Deep Navy, Dodger Blue (logo and marketing hero only), Blue Bell, Ink Well, Bright Snow. */
export const PALETTE = {navy: '#042154', dodger: '#2472FC', bell: '#2D9AD6', bellText: '#1D74A8', ink: '#03080F', snow: '#F7F7F7'};

export const theme: Theme = {
	name: 'Coridr',
	colors: {
		bg: '#FFFFFF',
		surface: '#FFFFFF',
		surface2: '#F7F7F7',
		ink: '#0A1526',
		muted: 'rgba(10,21,38,0.66)',
		faint: 'rgba(10,21,38,0.52)',
		line: 'rgba(4,33,84,0.14)',
		// navy does the authority work; it is the light-theme action colour
		brand: '#042154',
		onBrand: '#FFFFFF',
		// text-safe accent on white (5.10:1). Blue Bell #2D9AD6 is 3.13:1 on white: graphics and large display only.
		accent: '#1D74A8',
		onAccent: '#FFFFFF',
		// dark theme derives from navy (never a naive inversion)
		night: '#030D24',
		nightSurface: '#061633',
		nightInk: '#F2F6FC',
		nightMuted: 'rgba(242,246,252,0.70)',
		nightLine: 'rgba(242,246,252,0.13)',
		// the verdict trio is sacred: verdict meaning only, never decoration
		ok: '#2C7A4B',
		warn: '#9A6B12',
		bad: '#A63A31',
	},
	fonts: {display, body, mono},
	// Stitch register: giant LIGHT display type, quiet, one ink with alpha steps
	weight: {display: 300, displayStrong: 600, body: 400, bodyStrong: 600},
	tracking: {display: '-0.022em', body: '-0.005em'},
	leading: {display: 1.02, body: 1.4},
	radius: {sm: 10, md: 16, lg: 20, pill: 999},
	shadow: {
		sm: '0 1px 2px rgba(4,33,84,0.05), 0 2px 8px rgba(4,33,84,0.05)',
		md: '0 2px 4px rgba(4,33,84,0.04), 0 8px 24px rgba(4,33,84,0.08)',
		lg: '0 6px 16px rgba(4,33,84,0.07), 0 28px 64px rgba(4,33,84,0.14)',
	},
	// B2B trust product: strong ease-outs, overlap, no bounce anywhere (the approved reveal's rule)
	personality: 'calm',
};
