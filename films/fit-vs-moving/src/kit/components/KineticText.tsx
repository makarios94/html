import React, {CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {EnterKind, enterMotion, ExitKind, exitMotion, motionStyle} from '../enter';
import {useLayout} from '../layout';
import {ease, prog} from '../motion';
import {useMotion, useTheme} from '../theme';
import {Sfx, SfxName} from '../audio';
import {useFilmFonts, waitForFont} from '../fonts';
import {handCircle, scribbleUnderline, strikeLine} from '../paths';

type Token = {text: string; emph: number | null; line: number; glue: boolean};

/** Rough advance width of a string in em for a grotesque sans (good to about 15%). */
const emWidth = (s: string) =>
	[...s].reduce((acc, ch) => {
		if (ch === ' ') return acc + 0.28;
		if (/[iIl.,'!:;|1jft]/.test(ch)) return acc + 0.32;
		if (/[mwMW@%]/.test(ch)) return acc + 0.82;
		if (/[A-Z0-9?]/.test(ch)) return acc + 0.64;
		return acc + 0.55;
	}, 0);

/** "Order in *one app*.\nToday" -> tokens with emphasis groups and line numbers. */
const parse = (text: string) => {
	const tokens: Token[] = [];
	let group = -1;
	text.split('\n').forEach((lineText, line) => {
		let inEm = false;
		let buf = '';
		const flush = (nextIsEm: boolean) => {
			if (buf.length) {
				const startsGlued = !/^\s/.test(buf) && tokens.length > 0 && tokens[tokens.length - 1].line === line;
				const words = buf.split(/\s+/).filter(Boolean);
				words.forEach((w, i) => tokens.push({text: w, emph: inEm ? group : null, line, glue: i === 0 && startsGlued}));
			}
			buf = '';
			if (nextIsEm) group += 1;
		};
		for (const ch of lineText) {
			if (ch === '*') {
				flush(!inEm);
				inEm = !inEm;
			} else {
				buf += ch;
			}
		}
		flush(false);
	});
	return tokens;
};

export type Emphasis = {
	color?: string;
	weight?: number;
	font?: string;
	italic?: boolean;
	decoration?: 'none' | 'underline' | 'highlight' | 'circle' | 'strike';
	decorationColor?: string;
	/** Frame the decoration starts drawing (default: just after the group lands). */
	decorationAt?: number;
	decorationSfx?: SfxName | false;
	seed?: string;
};

export type KineticTextProps = {
	/** Use *stars* around words to emphasise them and \n for hard line breaks. */
	text: string;
	at: number;
	by?: 'word' | 'char' | 'line';
	kind?: EnterKind | 'mask' | 'type';
	/** Frames between units. Defaults to the personality's stagger (chars default to 1). */
	stagger?: number;
	/** Explicit start frame per word (VO sync: vo.wordsOf('p3').map(w => w.from)). */
	wordFrames?: number[];
	dur?: number;
	distance?: number;
	/** Design px. */
	size?: number;
	weight?: number;
	font?: string;
	color?: string;
	align?: 'left' | 'center' | 'right';
	leading?: number;
	tracking?: string;
	/** Max width in design px before words wrap. Defaults to the centred safe width, so type never runs under platform UI. */
	maxWidth?: number;
	/**
	 * A single word (or an emphasis group, which never wraps) wider than maxWidth would run past the safe edge. With
	 * fit on (the default) the whole block is set smaller until the widest one fits, measured once the fonts are in.
	 */
	fit?: boolean;
	uppercase?: boolean;
	emphasis?: Emphasis;
	exitAt?: number;
	exitKind?: ExitKind;
	exitDur?: number;
	/** Sound on each unit's landing (pops for playful, nothing for calm). */
	sfx?: SfxName | false;
	sfxVolume?: number;
	style?: CSSProperties;
};

/**
 * Kinetic typography. Word by word, char by char, or line by line, eased by the brand's personality,
 * optionally synced to the voice word timings, with emphasis that can recolour, highlight, underline,
 * circle or strike a phrase.
 */
export const KineticText: React.FC<KineticTextProps> = ({
	text,
	at,
	by = 'word',
	kind = 'rise',
	stagger,
	wordFrames,
	dur,
	distance,
	size = 96,
	weight,
	font,
	color,
	align = 'center',
	leading,
	tracking,
	maxWidth,
	fit = true,
	uppercase = false,
	emphasis,
	exitAt,
	exitKind = 'fade',
	exitDur,
	sfx = false,
	sfxVolume = 0.32,
	style,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const m = useMotion();
	const theme = useTheme();
	const {u, textW} = useLayout();
	const tokens = useMemo(() => parse(text), [text]);
	const limit = maxWidth ? maxWidth * u : textW;

	// Fit: measure the widest unbreakable unit after the fonts load (layout widths ignore entrance transforms),
	// shrink once, and hold the frame until the fitted size is on screen.
	const ref = useRef<HTMLDivElement>(null);
	const filmFonts = useFilmFonts();
	const [fitScale, setFitScale] = useState(1);
	const [fitted, setFitted] = useState(!fit);
	const [fitHandle] = useState(() => (fit ? delayRender('Fitting kinetic text') : null));
	useLayoutEffect(() => {
		if (!fit) return;
		let live = true;
		Promise.all([
			waitForFont(font ?? theme.fonts.display, filmFonts, weight ?? theme.weight.display),
			emphasis?.font ? waitForFont(emphasis.font, filmFonts, emphasis.weight) : null,
		]).then(() => {
			if (!live) return;
			const el = ref.current;
			let widest = 0;
			// data-kw holds how far a unit's decoration reaches past it (a hand-drawn circle spans 128%)
			el?.querySelectorAll<HTMLElement>('[data-kw]').forEach((n) => {
				widest = Math.max(widest, n.offsetWidth * (parseFloat(n.dataset.kw ?? '') || 1));
			});
			if (widest > limit) {
				const s = Math.max(0.5, (limit / widest) * 0.98);
				setFitScale(s);
				console.warn(`KineticText: "${text.replace(/\n/g, ' ')}" has a unit ${Math.round(widest)} px wide (decoration included) against a ${Math.round(limit)} px safe width; set at ${Math.round(s * 100)}% of size ${size}.`);
			}
			setFitted(true);
		});
		return () => {
			live = false;
		};
		// measured once per mount, at the requested size
	}, []);
	useEffect(() => {
		if (fitted && fitHandle !== null) continueRender(fitHandle);
	}, [fitted, fitHandle]);
	useEffect(
		() => () => {
			if (fitHandle !== null) continueRender(fitHandle);
		},
		[fitHandle],
	);
	const step = stagger ?? (by === 'char' ? 1 : m.stagger);
	const lines = Math.max(...tokens.map((t) => t.line)) + 1;

	// start frame for each token (word) and, in char mode, each char
	const wordStart: number[] = [];
	let charCursor = 0;
	const charStarts: number[][] = [];
	tokens.forEach((t, i) => {
		if (by === 'line') {
			wordStart.push(at + t.line * step * 2);
		} else if (by === 'char') {
			const starts = [...t.text].map((_, k) => at + (charCursor + k) * step);
			charStarts.push(starts);
			wordStart.push(starts[0]);
			charCursor += t.text.length;
		} else {
			const explicit = wordFrames?.[i];
			const prev = i > 0 ? wordStart[i - 1] : at - step;
			wordStart.push(explicit ?? (wordFrames && i >= wordFrames.length ? prev + step : at + i * step));
		}
	});

	const ex = exitAt !== undefined ? exitMotion(frame, exitAt, exitDur ?? m.exit, exitKind, u) : undefined;
	const emphColor = emphasis?.color ?? (emphasis?.decoration === 'highlight' ? undefined : theme.colors.accent);
	const baseStyle: CSSProperties = {
		fontFamily: font ?? theme.fonts.display,
		fontWeight: weight ?? theme.weight.display,
		fontSize: size * u * fitScale,
		lineHeight: leading ?? theme.leading.display,
		letterSpacing: tracking ?? theme.tracking.display,
		color: color ?? theme.colors.ink,
		textAlign: align,
		textTransform: uppercase ? 'uppercase' : undefined,
		maxWidth: limit,
		fontKerning: 'normal',
		...style,
	};

	const unitStyle = (start: number): CSSProperties => {
		if (kind === 'type') return {opacity: frame >= start ? 1 : 0};
		if (kind === 'mask') return {};
		return motionStyle(enterMotion({frame, fps, at: start, kind, m, u, dur, distance}));
	};

	const renderUnit = (content: string, start: number, key: string, word = true) => {
		const kw = word ? {'data-kw': ''} : {};
		if (kind === 'mask') {
			const p = prog(frame, start, dur ?? m.enter, ease.out);
			return (
				<span key={key} {...kw} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.08em', marginBottom: '-0.08em'}}>
					<span style={{display: 'inline-block', transform: `translate3d(0, ${((1 - p) * 110).toFixed(2)}%, 0)`}}>{content}</span>
				</span>
			);
		}
		return (
			<span key={key} {...kw} style={{display: 'inline-block', whiteSpace: 'pre', ...unitStyle(start)}}>
				{content}
			</span>
		);
	};

	const renderWord = (t: Token, i: number) => {
		if (by === 'char') {
			return (
				<span key={`w${i}`} data-kw="" style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
					{[...t.text].map((ch, k) => renderUnit(ch, charStarts[i][k], `c${i}-${k}`, false))}
				</span>
			);
		}
		return renderUnit(t.text, wordStart[i], `w${i}`);
	};

	const decoration = (groupEnd: number, groupText: string, line: number) => {
		if (!emphasis || !emphasis.decoration || emphasis.decoration === 'none') return null;
		const dAt = emphasis.decorationAt ?? groupEnd + 6;
		const dColor = emphasis.decorationColor ?? theme.colors.accent;
		const seed = emphasis.seed ?? 'k';
		const sound = emphasis.decorationSfx ? <Sfx name={emphasis.decorationSfx} at={dAt} volume={0.3} /> : null;
		if (emphasis.decoration === 'highlight') {
			const p = prog(frame, dAt, 12, ease.out);
			return (
				<>
					<span
						style={{
							position: 'absolute',
							left: '-0.08em',
							right: '-0.08em',
							top: '50%',
							bottom: '0.02em',
							background: dColor,
							opacity: 0.3,
							borderRadius: '0.12em',
							transform: `scaleX(${p.toFixed(4)}) rotate(-1deg)`,
							transformOrigin: '0% 50%',
							zIndex: -1,
						}}
					/>
					{sound}
				</>
			);
		}
		const p = prog(frame, dAt, emphasis.decoration === 'circle' ? 20 : 14, ease.draw);
		// Work in em units (100 = 1em) with a viewBox shaped like the real box, so strokes stay even
		// and the draw-on reads as one continuous stroke. The group's width is estimated from its text.
		const wEm = emWidth(groupText);
		const lead = leading ?? theme.leading.display;
		// The circle leans away from neighbouring lines so it never cuts through the line above or below.
		const above = line > 0;
		const below = line < lines - 1;
		const [cTop, cH] = above && below ? [-10, 120] : above ? [-4, 136] : below ? [-32, 140] : [-22, 144];
		const spec =
			emphasis.decoration === 'underline'
				? {box: {left: '-2%', width: '104%', top: '82%', height: '0.34em'}, w: wEm * 104, h: 34, d: (w: number, h: number) => scribbleUnderline(w, h, seed)}
				: emphasis.decoration === 'strike'
					? {box: {left: '-3%', width: '106%', top: '38%', height: '0.3em'}, w: wEm * 106, h: 30, d: (w: number, h: number) => strikeLine(w, h, seed)}
					: {box: {left: '-14%', width: '128%', top: `${cTop}%`, height: `${cH}%`}, w: wEm * 128, h: cH * lead, d: (w: number, h: number) => handCircle(w, h, seed)};
		return (
			<>
				<svg viewBox={`0 0 ${spec.w.toFixed(1)} ${spec.h.toFixed(1)}`} preserveAspectRatio="none" style={{position: 'absolute', overflow: 'visible', ...spec.box}}>
					{p > 0 ? (
						<path
							d={spec.d(spec.w, spec.h)}
							fill="none"
							stroke={dColor}
							strokeWidth={emphasis.decoration === 'circle' ? 6 : 7.5}
							strokeLinecap="round"
							strokeLinejoin="round"
							pathLength={1}
							strokeDasharray="1 1"
							strokeDashoffset={1 - p}
						/>
					) : null}
				</svg>
				{sound}
			</>
		);
	};

	const out: React.ReactNode[] = [];
	for (let line = 0; line < lines; line++) {
		const lineTokens = tokens.map((t, i) => ({t, i})).filter((x) => x.t.line === line);
		const parts: React.ReactNode[] = [];
		let k = 0;
		while (k < lineTokens.length) {
			const {t, i} = lineTokens[k];
			const space = k > 0 && !t.glue ? ' ' : '';
			if (t.emph === null) {
				if (space) parts.push(space);
				parts.push(renderWord(t, i));
				k++;
				continue;
			}
			// an emphasis group: consecutive tokens with the same group id
			const g = t.emph;
			const members: {t: Token; i: number}[] = [];
			while (k < lineTokens.length && lineTokens[k].t.emph === g) {
				members.push(lineTokens[k]);
				k++;
			}
			const groupEnd = Math.max(...members.map((x) => wordStart[x.i])) + (dur ?? m.enter) * 0.5;
			if (space) parts.push(space);
			parts.push(
				<span
					key={`g${g}`}
					data-kw={emphasis?.decoration === 'circle' ? '1.28' : ''}
					style={{
						position: 'relative',
						display: 'inline-block',
						whiteSpace: 'nowrap',
						isolation: 'isolate',
						color: emphColor,
						fontWeight: emphasis?.weight,
						fontFamily: emphasis?.font,
						fontStyle: emphasis?.italic ? 'italic' : undefined,
					}}
				>
					{members.map((x, j) => (
						<React.Fragment key={`m${x.i}`}>
							{j > 0 && !x.t.glue ? ' ' : ''}
							{renderWord(x.t, x.i)}
						</React.Fragment>
					))}
					{decoration(groupEnd, members.map((x) => x.t.text).join(' '), line)}
				</span>,
			);
		}
		out.push(
			<div key={`l${line}`} style={{display: 'block'}}>
				{parts}
			</div>,
		);
	}

	return (
		<div ref={ref} style={{...baseStyle, ...(ex ? motionStyle({opacity: 1, x: 0, y: 0, scale: 1, blur: 0, rotate: 0}, ex) : {})}}>
			{out}
			{sfx ? wordStart.map((s, i) => <Sfx key={`s${i}`} name={sfx} at={s + 2} volume={sfxVolume} pitch={1 + ((i % 3) - 1) * 0.06} />) : null}
		</div>
	);
};
