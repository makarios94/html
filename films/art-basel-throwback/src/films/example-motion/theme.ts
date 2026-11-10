import {loadFont as loadJakarta} from '@remotion/google-fonts/PlusJakartaSans';
import {Theme} from '../../kit';

const jakarta = loadJakarta('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin', 'latin-ext']}).fontFamily;

export const FONTS = [jakarta];
/** Special characters each face must draw (prices are in naira). FontGuard proves them on every frame. */
export const GLYPHS = {[jakarta]: '₦'};

/** A fictional consumer brand ("basket") for the music-led example. Playful personality: visible spring. */
export const theme: Theme = {
	name: 'basket',
	colors: {
		bg: '#FFF6EA',
		surface: '#FFFFFF',
		surface2: '#FFEEDB',
		ink: '#1E1A16',
		muted: 'rgba(30,26,22,0.6)',
		faint: 'rgba(30,26,22,0.36)',
		line: 'rgba(30,26,22,0.1)',
		brand: '#FF4F1F',
		onBrand: '#FFFFFF',
		accent: '#FF4F1F',
		onAccent: '#FFFFFF',
		night: '#1E1A16',
		nightSurface: '#2A251F',
		nightInk: '#FFF6EA',
		nightMuted: 'rgba(255,246,234,0.6)',
		nightLine: 'rgba(255,246,234,0.12)',
		ok: '#1FA855',
		warn: '#F2A900',
		bad: '#E23D28',
	},
	fonts: {display: jakarta, body: jakarta, mono: jakarta},
	weight: {display: 800, displayStrong: 800, body: 500, bodyStrong: 700},
	tracking: {display: '-0.04em', body: '-0.01em'},
	leading: {display: 0.98, body: 1.25},
	radius: {sm: 16, md: 26, lg: 40, pill: 999},
	shadow: {
		sm: '0 2px 6px rgba(80,40,10,0.08), 0 10px 26px rgba(80,40,10,0.10)',
		md: '0 8px 20px rgba(80,40,10,0.12), 0 30px 70px rgba(80,40,10,0.16)',
		lg: '0 16px 40px rgba(80,40,10,0.18), 0 60px 130px rgba(80,40,10,0.26)',
	},
	personality: 'playful',
};
