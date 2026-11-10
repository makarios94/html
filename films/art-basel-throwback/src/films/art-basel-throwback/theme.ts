import {loadFont as loadRaleway} from '@remotion/google-fonts/Raleway';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadSerif} from '@remotion/google-fonts/SourceSerif4';
import {Theme} from '../../kit';

/*
 * AssetLink brand pack. Read BRAND.md before writing any AssetLink copy.
 *
 * Where each token came from (re-verify when the official brand kit arrives):
 * - Colours: sampled with Pillow from two shipped AssetLink assets in the user's Google Drive:
 *   "AssetLink Marketing One-Pager.pdf" (8 Oct 2026): navy band #151A38, purple band and stat rules #5B49D3,
 *   lavender cards #F2F4FF, card border #CDC9E2, page #FBFBFD.
 *   "ASSETLINK signals Post.png" (24 Oct 2026): headline ink #161B2B, blue label and button text #3F7FF9,
 *   dark gradient #010102 -> #3533CC, logo mark gradient #7446FF -> #22A4F6.
 * - Fonts: PROVISIONAL. Identified by eye from the same two assets, not from a brand file: a heavy geometric sans
 *   for headlines (matches Raleway ExtraBold), a text serif for sublines (Source Serif 4 stands in), a neutral sans
 *   for body (Inter stands in). Swap for the real faces once the brand guide confirms them.
 */
const display = loadRaleway('normal', {weights: ['300', '700', '800'], subsets: ['latin', 'latin-ext']}).fontFamily;
const body = loadInter('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext']}).fontFamily;
const serif = loadSerif('normal', {weights: ['400', '600'], subsets: ['latin', 'latin-ext']}).fontFamily;
loadSerif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});

/** Families FontGuard must see loaded. */
export const FONTS = [display, body, serif];
/** Special characters each face must draw. AssetLink is US only: the dollar sign and plain Latin are enough. */
export const GLYPHS = {[display]: '$', [body]: '$'};

/** The serif for sublines and the tagline ("Know who, why and when."). Ration it: one line per scene. */
export const SERIF = serif;
/** Raleway draws old-style figures by default. Spread this on any number set in the display face. */
export const LINING = {fontVariantNumeric: 'lining-nums tabular-nums'} as const;

export const NAVY = '#151A38';
export const PURPLE = '#5B49D3';
export const BLUE = '#3F7FF9';
/** The logo mark's gradient, left to right. Only for the mark and for one hero graphic per film. */
export const MARK_GRADIENT = ['#7446FF', '#22A4F6'] as const;
/** The dark world's ground, left to right, as the 24 Oct 2026 social post uses it. */
export const NIGHT_GRADIENT = 'linear-gradient(90deg, #05050F 0%, #14134D 38%, #2423A0 74%, #3533CC 100%)';

export const theme: Theme = {
	name: 'AssetLink',
	colors: {
		bg: '#FBFBFD',
		surface: '#FFFFFF',
		surface2: '#F2F4FF',
		ink: NAVY,
		muted: 'rgba(21,26,56,0.68)',
		faint: 'rgba(21,26,56,0.42)',
		line: '#CDC9E2',
		// Purple carries fills and text (white on it 6.3:1, purple on white 6.3:1).
		brand: PURPLE,
		onBrand: '#FFFFFF',
		// Blue is the highlight. On white it is 3.7:1: large display type, labels in caps and graphics only.
		accent: BLUE,
		onAccent: '#0A0D22',
		night: '#0B0D26',
		nightSurface: NAVY,
		nightInk: '#FFFFFF',
		nightMuted: 'rgba(255,255,255,0.70)',
		nightLine: 'rgba(255,255,255,0.14)',
		// No reserved status colours found in the brand sources: these are neutral defaults for product UI.
		ok: '#1F8A5B',
		warn: '#B7791F',
		bad: '#C2413B',
	},
	fonts: {display, body, mono: body},
	weight: {display: 700, displayStrong: 800, body: 400, bodyStrong: 600},
	tracking: {display: '-0.015em', body: '0em'},
	leading: {display: 1.04, body: 1.34},
	// The shipped assets use small radii: near-square cards, a softly rounded button.
	radius: {sm: 8, md: 12, lg: 18, pill: 999},
	shadow: {
		sm: '0 1px 3px rgba(21,26,56,0.08), 0 6px 18px rgba(21,26,56,0.06)',
		md: '0 6px 16px rgba(21,26,56,0.10), 0 22px 56px rgba(21,26,56,0.14)',
		lg: '0 14px 34px rgba(21,26,56,0.16), 0 48px 120px rgba(21,26,56,0.26)',
	},
	// Authoritative, analytical, decisive: a finance data product that must read as trustworthy. No bounce.
	personality: 'calm',
};
