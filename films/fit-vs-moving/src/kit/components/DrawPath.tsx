import React, {CSSProperties, useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {getLength} from '@remotion/paths';
import {useLayout} from '../layout';
import {ease, prog} from '../motion';
import {useTheme} from '../theme';
import {Sfx, SfxName} from '../audio';
import {arrowHead, arrowShaft, checkMark, handCircle, scribbleUnderline, strikeLine, swooshArc} from '../paths';

type DrawProps = {
	d: string;
	/** Box the path was drawn in (design px). */
	w: number;
	h: number;
	at: number;
	dur?: number;
	easing?: (t: number) => number;
	stroke?: string;
	strokeWidth?: number;
	cap?: 'round' | 'butt' | 'square';
	/** Optional fill that fades in once the stroke completes. */
	fill?: string;
	/** Un-draw from the start after this frame (the stroke travels off its end). */
	eraseAt?: number;
	eraseDur?: number;
	sfx?: SfxName | false;
	style?: CSSProperties;
};

/** Draws any SVG path on, stroke first. Sizes are design px and scale with the layout. */
export const DrawPath: React.FC<DrawProps> = ({
	d,
	w,
	h,
	at,
	dur = 16,
	easing = ease.draw,
	stroke,
	strokeWidth = 10,
	cap = 'round',
	fill,
	eraseAt,
	eraseDur = 12,
	sfx = false,
	style,
}) => {
	const frame = useCurrentFrame();
	const {u} = useLayout();
	const theme = useTheme();
	const len = useMemo(() => getLength(d), [d]);
	const p = prog(frame, at, dur, easing);
	const e = eraseAt !== undefined ? prog(frame, eraseAt, eraseDur, ease.in) : 0;
	const fillO = fill ? prog(frame, at + dur - 4, 10, ease.soft) : 0;
	const visible = p > 0 && e < 1;
	return (
		<svg width={w * u} height={h * u} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible', ...style}}>
			{fill ? <path d={d} fill={fill} opacity={fillO} stroke="none" /> : null}
			{visible ? (
				<path
					d={d}
					fill="none"
					stroke={stroke ?? theme.colors.accent}
					strokeWidth={strokeWidth}
					strokeLinecap={cap}
					strokeLinejoin="round"
					strokeDasharray={`${len} ${len}`}
					strokeDashoffset={len * (1 - p) - len * e}
				/>
			) : null}
			{sfx ? <Sfx name={sfx} at={at} volume={0.3} /> : null}
		</svg>
	);
};

type AccentProps = Omit<DrawProps, 'd'> & {seed?: string};

export const ScribbleUnderline: React.FC<AccentProps> = ({seed = 'u', ...p}) => <DrawPath d={scribbleUnderline(p.w, p.h, seed)} {...p} />;
export const Swoosh: React.FC<AccentProps> = ({seed = 's', ...p}) => <DrawPath d={swooshArc(p.w, p.h, seed)} {...p} />;
export const HandCircle: React.FC<AccentProps> = ({seed = 'c', dur = 22, ...p}) => <DrawPath d={handCircle(p.w, p.h, seed)} dur={dur} {...p} />;
export const Strike: React.FC<AccentProps> = ({seed = 'k', dur = 10, ...p}) => <DrawPath d={strikeLine(p.w, p.h, seed)} dur={dur} {...p} />;
export const Check: React.FC<Omit<DrawProps, 'd'>> = ({dur = 12, ...p}) => <DrawPath d={checkMark(p.w, p.h)} dur={dur} {...p} />;

/** A curved arrow that draws its shaft, then its head. Coordinates are inside the w x h box. */
export const Arrow: React.FC<Omit<DrawProps, 'd'> & {x1: number; y1: number; x2: number; y2: number; bend?: number; head?: number}> = ({
	x1,
	y1,
	x2,
	y2,
	bend = 0.2,
	head = 28,
	at,
	dur = 16,
	...p
}) => {
	const {u} = useLayout();
	const shaft = arrowShaft(x1, y1, x2, y2, bend);
	const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
	const my = (y1 + y2) / 2 + (x2 - x1) * bend;
	return (
		<div style={{position: 'relative', width: p.w * u, height: p.h * u}}>
			<DrawPath d={shaft} at={at} dur={dur} {...p} style={{position: 'absolute', left: 0, top: 0}} />
			<DrawPath d={arrowHead(x2, y2, mx, my, head)} at={at + dur - 2} dur={6} {...p} style={{position: 'absolute', left: 0, top: 0}} />
		</div>
	);
};
