import React, {CSSProperties, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {waitForFontsToSettle} from '../fonts';
import {useLayout} from '../layout';
import {ease, prog} from '../motion';
import {useTheme} from '../theme';
import {Sfx} from '../audio';
import {Reveal} from './Reveal';

type LogoRevealProps = {
	at?: number;
	/** The mark as inline SVG (official paths only; never redraw a brand's logo). */
	mark?: React.ReactNode;
	markSize?: number;
	wordmark?: string;
	font?: string;
	weight?: number;
	size?: number;
	color?: string;
	tracking?: string;
	gap?: number;
	/** focus: letters resolve from blur, rise and settle (calm). build: letters appear one at a time from a mask. pop: mark and word spring in. */
	style?: 'focus' | 'build' | 'pop';
	layout?: 'row' | 'column';
	sfx?: boolean;
	css?: CSSProperties;
};

/**
 * A lockup reveal: the mark arrives, then the wordmark, then a final settle. Short and restrained;
 * the logo is a signature, not a show. For a brand with an approved reveal, port that spec exactly instead.
 */
export const LogoReveal: React.FC<LogoRevealProps> = ({
	at = 0,
	mark,
	markSize = 150,
	wordmark,
	font,
	weight,
	size = 120,
	color,
	tracking,
	gap = 28,
	style = 'focus',
	layout = 'row',
	sfx = true,
	css,
}) => {
	const frame = useCurrentFrame();
	const t = useTheme();
	const {u} = useLayout();
	const markP = prog(frame, at, 30, ease.out);
	const lettersAt = at + (mark ? 14 : 0);
	const letters = [...(wordmark ?? '')];
	const settle = prog(frame, lettersAt + letters.length * 2 + 18, 26, ease.soft);
	const lockScale = 1.014 - 0.014 * settle;
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: layout === 'row' ? 'row' : 'column',
				alignItems: 'center',
				gap: gap * u,
				transform: `scale(${lockScale.toFixed(4)})`,
				...css,
			}}
		>
			{mark ? (
				<div
					style={{
						width: markSize * u,
						height: markSize * u,
						opacity: style === 'pop' ? Math.min(1, markP * 2) : markP,
						transform: `scale(${(style === 'pop' ? 0.6 + 0.4 * markP : 0.9 + 0.1 * markP).toFixed(4)})`,
					}}
				>
					{mark}
				</div>
			) : null}
			{wordmark ? (
				<div
					style={{
						fontFamily: font ?? t.fonts.display,
						fontWeight: weight ?? t.weight.displayStrong,
						fontSize: size * u,
						letterSpacing: tracking ?? t.tracking.display,
						color: color ?? t.colors.ink,
						lineHeight: 1,
						whiteSpace: 'pre',
						display: 'flex',
					}}
				>
					{letters.map((ch, i) => {
						const s = lettersAt + i * (style === 'build' ? 3 : 2);
						const p = prog(frame, s, style === 'build' ? 8 : 18, style === 'build' ? ease.out : ease.soft);
						if (style === 'build') {
							return (
								<span key={i} style={{display: 'inline-block', overflow: 'hidden'}}>
									<span style={{display: 'inline-block', transform: `translate3d(${((1 - p) * -40).toFixed(2)}%, 0, 0)`, opacity: p}}>{ch}</span>
								</span>
							);
						}
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									opacity: p,
									transform: `translate3d(0, ${((1 - p) * 14 * u).toFixed(2)}px, 0)`,
									filter: p < 0.99 ? `blur(${((1 - p) * 9 * u).toFixed(2)}px)` : undefined,
								}}
							>
								{ch}
							</span>
						);
					})}
				</div>
			) : null}
			{sfx ? (
				<>
					<Sfx name="swell" at={at + 8} volume={0.25} />
					<Sfx name="chime" at={lettersAt + letters.length * 2 + 6} volume={0.4} />
				</>
			) : null}
		</div>
	);
};

type EndCardProps = {
	at?: number;
	logo: React.ReactNode;
	line?: string;
	/** Frame the line arrives (default at + 30). Sync it to the voice saying it. */
	lineAt?: number;
	/** The URL or handle, shown in a pill. Must be the real destination. */
	cta?: string;
	/** Frame the pill pops (default at + 40). */
	ctaAt?: number;
	color?: string;
	muted?: string;
	pillBg?: string;
	pillColor?: string;
	lineSize?: number;
	ctaSize?: number;
};

/** Logo, one line, and a destination people can type. Hold it at least 2 seconds. */
export const EndCard: React.FC<EndCardProps> = ({at = 0, logo, line, lineAt, cta, ctaAt, color, muted, pillBg, pillColor, lineSize = 50, ctaSize = 44}) => {
	const t = useTheme();
	const {u, cy, height} = useLayout();
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start'}}>
			<div style={{position: 'absolute', top: cy - 160 * u, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 * u}}>
				{logo}
				{line ? (
					<Reveal at={lineAt ?? at + 30} kind="rise" distance={20}>
						<div style={{fontFamily: t.fonts.body, fontWeight: t.weight.body, fontSize: lineSize * u, color: muted ?? color ?? t.colors.muted, letterSpacing: t.tracking.body, textAlign: 'center'}}>{line}</div>
					</Reveal>
				) : null}
				{cta ? (
					<Reveal at={ctaAt ?? at + 40} kind="pop" sfx="pop" sfxVolume={0.35}>
						<div
							style={{
								padding: `${ctaSize * 0.42 * u}px ${ctaSize * 0.85 * u}px`,
								borderRadius: 999,
								background: pillBg ?? t.colors.surface,
								color: pillColor ?? t.colors.ink,
								fontFamily: t.fonts.body,
								fontWeight: t.weight.bodyStrong,
								fontSize: ctaSize * u,
								letterSpacing: t.tracking.body,
								boxShadow: t.shadow.sm,
							}}
						>
							{cta}
						</div>
					</Reveal>
				) : null}
			</div>
			<div style={{position: 'absolute', top: height}} />
		</AbsoluteFill>
	);
};

/** QA overlay: shades everything outside the safe zone. Render a still with safeZones on before finals. */
export const SafeZones: React.FC<{show: boolean}> = ({show}) => {
	const {safe, width, height} = useLayout();
	if (!show) return null;
	const shade = 'rgba(255,0,60,0.22)';
	return (
		<AbsoluteFill style={{pointerEvents: 'none', zIndex: 1000}}>
			<div style={{position: 'absolute', left: 0, top: 0, width, height: safe.top, background: shade}} />
			<div style={{position: 'absolute', left: 0, bottom: 0, width, height: safe.bottom, background: shade}} />
			<div style={{position: 'absolute', left: 0, top: safe.top, width: safe.left, height: height - safe.top - safe.bottom, background: shade}} />
			<div style={{position: 'absolute', right: 0, top: safe.top, width: safe.right, height: height - safe.top - safe.bottom, background: shade}} />
			<div style={{position: 'absolute', left: safe.left, top: safe.top, right: safe.right, bottom: safe.bottom, border: '3px dashed rgba(255,0,60,0.8)'}} />
		</AbsoluteFill>
	);
};

/**
 * Fails loudly when a brand font did not load: a red banner in every frame. Fallback fonts are the
 * fastest way to make a piece look cheap, so they must never reach a final render unnoticed.
 */
/**
 * A glyph is missing from a face when text set in "Face, fallback" measures exactly like the fallback alone,
 * for two unrelated fallbacks. Catches the silent per-character fallback that FontGuard's load check cannot
 * (a naira sign or a Yoruba dot-below vowel drawn in a system font).
 */
const missingGlyphs = (family: string, glyphs: string) => {
	const ctx = document.createElement('canvas').getContext('2d');
	if (!ctx) return [];
	const width = (font: string, ch: string) => {
		ctx.font = font;
		return ctx.measureText(ch).width;
	};
	return [...new Set([...glyphs])].filter((ch) => {
		if (!ch.trim()) return false;
		const a = width(`400 100px "${family}", monospace`, ch) === width('400 100px monospace', ch);
		const b = width(`400 100px "${family}", serif`, ch) === width('400 100px serif', ch);
		return a && b;
	});
};

/** Characters to prove per face: one string for every face, or {family: chars} for the faces that set them. */
export type GlyphSpec = string | Record<string, string>;

const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'system-ui', 'cursive', 'fantasy', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'emoji']);
const firstFamily = (css: string) => css.split(',')[0].replace(/["']/g, '').trim();

/**
 * Every non-ASCII character on screen right now, checked in the face its element is set in (emoji and generic
 * fallbacks excepted). Catches the glyphs nobody thought to list in GLYPHS. Results are cached per face and character.
 */
const scanScreen = (cache: Map<string, boolean>) => {
	const found = new Map<string, Set<string>>();
	const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	for (let n = walker.nextNode(); n; n = walker.nextNode()) {
		const text = n.nodeValue ?? '';
		if (!/[^\x00-\x7E]/.test(text)) continue;
		const el = n.parentElement;
		if (!el || el.closest('[data-fontguard]')) continue;
		const style = getComputedStyle(el);
		if (style.visibility === 'hidden' || style.display === 'none') continue;
		const family = firstFamily(style.fontFamily);
		if (!family || GENERIC.has(family.toLowerCase())) continue;
		for (const ch of new Set([...text])) {
			if (ch.charCodeAt(0) <= 0x7e || !ch.trim() || /\p{Extended_Pictographic}|[‍️ ]/u.test(ch)) continue;
			const key = `${family}|${ch}`;
			let miss = cache.get(key);
			if (miss === undefined) {
				miss = missingGlyphs(family, ch).length > 0;
				cache.set(key, miss);
			}
			if (miss) {
				if (!found.has(family)) found.set(family, new Set());
				found.get(family)?.add(ch);
			}
		}
	}
	return [...found].map(([fam, chars]) => `${fam} has no ${[...chars].join(' ')} (on screen)`);
};

export const FontGuard: React.FC<{families: string[]; glyphs?: GlyphSpec}> = ({families, glyphs = ''}) => {
	const frame = useCurrentFrame();
	const [missing, setMissing] = useState<string[]>([]);
	const [checked, setChecked] = useState(false);
	const [onScreen, setOnScreen] = useState<string[]>([]);
	const scanCache = useRef(new Map<string, boolean>());
	const lastScan = useRef('');
	const [handle] = useState(() => delayRender('Checking brand fonts'));
	const continued = useRef(false);
	// After the fonts are in, scan what this frame shows. A state change inside a layout effect re-renders before the
	// frame is captured, so the banner lands on exactly the frames that show the fallback.
	useLayoutEffect(() => {
		if (!checked) return;
		const found = scanScreen(scanCache.current);
		const k = found.join(';');
		if (k !== lastScan.current) {
			lastScan.current = k;
			setOnScreen(found);
		}
	}, [frame, checked]);
	const glyphKey = typeof glyphs === 'string' ? glyphs : JSON.stringify(glyphs);
	const key = families.join('|') + '#' + glyphKey;
	useEffect(() => {
		let alive = true;
		// Web-font loaders add a face to document.fonts only once its file has arrived, so poll for a while
		// before declaring a family missing (offline, wrong name, blocked CDN).
		const hash = key.indexOf('#');
		const fams = key.slice(0, hash).split('|').filter(Boolean);
		const spec = key.slice(hash + 1);
		const perFamily: Record<string, string> | null = spec.startsWith('{') ? JSON.parse(spec) : null;
		const charsFor = (fam: string) => (perFamily ? perFamily[fam.replace(/["']/g, '').trim()] ?? '' : spec);
		const missingNow = () => {
			const loaded = new Set<string>();
			document.fonts.forEach((f) => {
				if (f.status === 'loaded') loaded.add(f.family.replace(/["']/g, '').trim());
			});
			return fams.filter((fam) => !loaded.has(fam.replace(/["']/g, '').trim()));
		};
		const check = async () => {
			try {
				await document.fonts.ready;
				let miss = missingNow();
				for (let i = 0; i < 50 && miss.length; i++) {
					await new Promise((r) => setTimeout(r, 200));
					miss = missingNow();
				}
				// every subset must be in before a glyph is judged missing
				await waitForFontsToSettle();
				const glyphMiss = fams
					.filter((fam) => !miss.includes(fam) && charsFor(fam))
					.map((fam) => ({fam, chars: missingGlyphs(fam.replace(/["']/g, '').trim(), charsFor(fam))}))
					.filter((x) => x.chars.length)
					.map((x) => `${x.fam} has no ${x.chars.join(' ')}`);
				if (alive) setMissing([...miss.map((m) => `${m} not loaded`), ...glyphMiss]);
			} finally {
				if (alive) setChecked(true);
				if (!continued.current) {
					continued.current = true;
					continueRender(handle);
				}
			}
		};
		check();
		return () => {
			alive = false;
		};
	}, [key, handle]);
	const all = [...missing, ...onScreen.filter((x) => !missing.some((m) => x.startsWith(m)))];
	if (!all.length) return null;
	return (
		<AbsoluteFill data-fontguard="" style={{justifyContent: 'flex-start', alignItems: 'stretch', zIndex: 2000, pointerEvents: 'none'}}>
			<div style={{background: '#E00034', color: '#fff', fontFamily: 'sans-serif', fontSize: 36, fontWeight: 700, padding: 24, textAlign: 'center'}}>
				FONT PROBLEM: {all.join('; ')}
			</div>
		</AbsoluteFill>
	);
};
