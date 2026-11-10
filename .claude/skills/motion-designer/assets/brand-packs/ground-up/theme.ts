import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';
import {Theme} from '../../kit';

/*
 * Ground Up with Ayobami (podcast) brand pack, from the reel-editor style guide
 * (C:\Users\User\.claude\skills\reel-editor\references\style-guide.md): near-black ground, #151517 cards,
 * white and grey, ONE accent = the podcast lime #D7FF40 sampled from the logo's square. Anton caps titles
 * revealed letter by letter, Inter for captions and labels, Instrument Serif for a few emphasis words.
 */
const anton = loadAnton('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']}).fontFamily;
const inter = loadInter('normal', {weights: ['500', '600'], subsets: ['latin', 'latin-ext']}).fontFamily;
const serif = loadSerif('normal', {weights: ['400'], subsets: ['latin', 'latin-ext']}).fontFamily;
loadSerif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});

export const FONTS = [anton, inter, serif];
/** Special characters each face must draw; add to it when the copy needs currency or diacritics. */
export const GLYPHS = {[inter]: '₦'};
export const SERIF = serif;
export const LIME = '#D7FF40';

export const theme: Theme = {
	name: 'Ground Up',
	colors: {
		bg: '#0B0B0C',
		surface: '#151517',
		surface2: '#1C1C1F',
		ink: '#FFFFFF',
		muted: 'rgba(255,255,255,0.62)',
		faint: 'rgba(255,255,255,0.4)',
		line: 'rgba(255,255,255,0.1)',
		brand: LIME,
		onBrand: '#0B0B0C',
		accent: LIME,
		onAccent: '#0B0B0C',
		night: '#0B0B0C',
		nightSurface: '#151517',
		nightInk: '#FFFFFF',
		nightMuted: 'rgba(255,255,255,0.62)',
		nightLine: 'rgba(255,255,255,0.1)',
		ok: '#7CDB6A',
		warn: '#FFE11A',
		bad: '#E0201B',
	},
	fonts: {display: anton, body: inter, mono: inter},
	weight: {display: 400, displayStrong: 400, body: 500, bodyStrong: 600},
	tracking: {display: '0.01em', body: '0em'},
	leading: {display: 0.95, body: 1.3},
	radius: {sm: 14, md: 22, lg: 30, pill: 999},
	shadow: {
		sm: '0 2px 8px rgba(0,0,0,0.4)',
		md: '0 10px 30px rgba(0,0,0,0.5)',
		lg: '0 24px 80px rgba(0,0,0,0.6)',
	},
	personality: 'crisp',
};
