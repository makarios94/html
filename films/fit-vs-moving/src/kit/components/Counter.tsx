import React, {CSSProperties} from 'react';
import {useCurrentFrame} from 'remotion';
import {useLayout} from '../layout';
import {ease, prog} from '../motion';
import {useTheme} from '../theme';
import {Sfx} from '../audio';

type CounterProps = {
	from?: number;
	to: number;
	at: number;
	dur?: number;
	easing?: (t: number) => number;
	decimals?: number;
	prefix?: string;
	suffix?: string;
	/** Thousands separator. */
	separator?: string;
	size?: number;
	weight?: number;
	font?: string;
	color?: string;
	/** Soft ticks while the number rolls. */
	ticks?: boolean;
	style?: CSSProperties;
};

const format = (v: number, decimals: number, sep: string) => {
	const fixed = v.toFixed(decimals);
	const [int, frac] = fixed.split('.');
	const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
	return frac ? `${withSep}.${frac}` : withSep;
};

/** A number that rolls to its value and lands with weight. Tabular figures so it never jitters. */
export const Counter: React.FC<CounterProps> = ({
	from = 0,
	to,
	at,
	dur = 28,
	easing = ease.out,
	decimals = 0,
	prefix = '',
	suffix = '',
	separator = ',',
	size = 160,
	weight,
	font,
	color,
	ticks = false,
	style,
}) => {
	const frame = useCurrentFrame();
	const theme = useTheme();
	const {u} = useLayout();
	const p = prog(frame, at, dur, easing);
	const v = from + (to - from) * p;
	const shown = decimals === 0 ? Math.round(v) : v;
	const tickFrames: number[] = [];
	if (ticks) {
		let last = Math.round(from);
		for (let f = at; f <= at + dur; f += 2) {
			const val = Math.round(from + (to - from) * prog(f, at, dur, easing));
			if (val !== last) tickFrames.push(f);
			last = val;
		}
	}
	return (
		<div
			style={{
				fontFamily: font ?? theme.fonts.display,
				fontWeight: weight ?? theme.weight.displayStrong,
				fontSize: size * u,
				color: color ?? theme.colors.ink,
				fontVariantNumeric: 'tabular-nums',
				letterSpacing: theme.tracking.display,
				lineHeight: 1,
				...style,
			}}
		>
			{prefix}
			{format(shown, decimals, separator)}
			{suffix}
			{tickFrames.map((f, i) => (
				<Sfx key={f} name="tick-soft" at={f} volume={0.22 * (1 - i / Math.max(1, tickFrames.length) * 0.5)} />
			))}
		</div>
	);
};
