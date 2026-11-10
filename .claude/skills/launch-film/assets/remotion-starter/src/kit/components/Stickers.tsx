import React, {CSSProperties, useId} from 'react';
import {random} from 'remotion';
import {useLayout} from '../layout';

/*
 * Props drawn in code as die-cut stickers: each drawing is painted twice, first as a fat white silhouette (the cut
 * line), then in colour on top, with one soft shadow under the whole sticker. Free, crisp at any size, no assets.
 * Food and object colours live here because they describe the object, not a brand; the generic props take a `tint`.
 * Add your own with <Sticker draw={(c) => ...} /> using paint(), ink() and detail(). Drawings use a 200 x 200 box.
 */

const EDGE = 18;
const WHITE = '#FFFFFF';
type Attr = React.SVGAttributes<SVGElement>;
type Pt = [number, number];
export type StickerCtx = {sil: boolean; id: string; tint?: string};
export type StickerDraw = (c: StickerCtx) => React.ReactNode;

/** A filled shape. In the silhouette pass it becomes a fat white blob, so the union reads as the sticker's edge. */
export const paint = (c: StickerCtx, fill: string, stroke?: string, sw?: number): Attr =>
	c.sil
		? {fill: WHITE, stroke: WHITE, strokeWidth: EDGE + (sw ?? 0), strokeLinejoin: 'round', strokeLinecap: 'round'}
		: {fill, stroke, strokeWidth: sw, strokeLinejoin: 'round', strokeLinecap: 'round'};

/** A stroked line (stems, handles), widened the same way in the silhouette pass. */
export const ink = (c: StickerCtx, stroke: string, sw: number): Attr =>
	c.sil
		? {fill: 'none', stroke: WHITE, strokeWidth: sw + EDGE, strokeLinecap: 'round', strokeLinejoin: 'round'}
		: {fill: 'none', stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round'};

/** Detail that exists only in the colour pass. */
export const detail = (c: StickerCtx, node: React.ReactNode) => (c.sil ? null : node);

// ---------------------------------------------------------------- shape helpers

const fmt = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

export const starPath = (cx: number, cy: number, n: number, r0: number, r1: number, rot = -90, sy = 1) => {
	const pts: string[] = [];
	for (let i = 0; i < n * 2; i++) {
		const r = i % 2 === 0 ? r1 : r0;
		const a = ((rot + (i * 180) / n) * Math.PI) / 180;
		pts.push(fmt([cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy]));
	}
	return `M${pts.join(' L')} Z`;
};

const wavy = (cx: number, cy: number, r: number, bumps: number, amp: number) => {
	const pts: string[] = [];
	for (let i = 0; i <= 96; i++) {
		const a = (i / 96) * Math.PI * 2;
		const rr = r + Math.sin(a * bumps) * amp + Math.sin(a * 3 + 1) * amp * 0.5;
		pts.push(fmt([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]));
	}
	return `M${pts.join(' L')} Z`;
};

/** A body that runs from a round end at `top` to a point at `tip` (carrots, cones). */
const taper = (top: Pt, tip: Pt, w0: number, power = 0.9) => {
	const d: Pt = [tip[0] - top[0], tip[1] - top[1]];
	const len = Math.hypot(d[0], d[1]);
	const ux: Pt = [d[0] / len, d[1] / len];
	const nx: Pt = [ux[1], -ux[0]];
	const w = (t: number) => w0 * Math.pow(1 - t, power) + 1.2;
	const at = (t: number, s: number): Pt => [top[0] + d[0] * t + nx[0] * w(t) * s, top[1] + d[1] * t + nx[1] * w(t) * s];
	const left: string[] = [];
	const right: string[] = [];
	for (let i = 0; i <= 28; i++) {
		left.push(fmt(at(i / 28, 1)));
		right.unshift(fmt(at(i / 28, -1)));
	}
	const cap: string[] = [];
	for (let i = 1; i < 14; i++) {
		const th = Math.PI * (1 - i / 14);
		cap.push(fmt([top[0] + w(0) * (Math.cos(th) * nx[0] - Math.sin(th) * ux[0]), top[1] + w(0) * (Math.cos(th) * nx[1] - Math.sin(th) * ux[1])]));
	}
	return {d: `M${left.join(' L')} L${right.join(' L')} L${cap.join(' L')} Z`, at};
};

/** A crescent band along a circle arc, `w(t)` half-wide; `s0..s1` picks a strip across it (-1 inner, 1 outer). */
const arcBand = (cx: number, cy: number, r: number, a0: number, a1: number, w: (t: number) => number) => {
	const at = (t: number, s: number): Pt => {
		const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
		const rr = r + s * w(t);
		return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
	};
	const band = (t0: number, t1: number, s0: number, s1: number) => {
		const outer: string[] = [];
		const inner: string[] = [];
		for (let i = 0; i <= 24; i++) {
			const t = t0 + ((t1 - t0) * i) / 24;
			outer.push(fmt(at(t, s1)));
			inner.unshift(fmt(at(t, s0)));
		}
		return `M${outer.join(' L')} L${inner.join(' L')} Z`;
	};
	const line = (t0: number, t1: number, s: number) => {
		const pts: string[] = [];
		for (let i = 0; i <= 20; i++) pts.push(fmt(at(t0 + ((t1 - t0) * i) / 20, s)));
		return `M${pts.join(' L')}`;
	};
	return {at, band, line};
};

const leaf = (base: Pt, angle: number, len: number, width: number) => {
	const a = (angle * Math.PI) / 180;
	const tip: Pt = [base[0] + Math.cos(a) * len, base[1] + Math.sin(a) * len];
	const mid: Pt = [base[0] + Math.cos(a) * len * 0.5, base[1] + Math.sin(a) * len * 0.5];
	const n: Pt = [-Math.sin(a) * width, Math.cos(a) * width];
	return `M${fmt(base)} Q${fmt([mid[0] + n[0], mid[1] + n[1]])} ${fmt(tip)} Q${fmt([mid[0] - n[0], mid[1] - n[1]])} ${fmt(base)} Z`;
};

const SPRINKLES = ['#FFF4E6', '#F2A93B', '#6BC4E8', '#8BD17C', '#FFFFFF', '#CF2E5F'];
const sprinkleSet = (seed: string, n: number, cx: number, cy: number, r0: number, r1: number) =>
	Array.from({length: n}).map((_, i) => {
		const a = random(`${seed}-a${i}`) * Math.PI * 2;
		const r = r0 + random(`${seed}-r${i}`) * (r1 - r0);
		return {x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.92, rot: random(`${seed}-t${i}`) * 180, color: SPRINKLES[Math.floor(random(`${seed}-c${i}`) * SPRINKLES.length)]};
	});

const sprinkle = (s: {x: number; y: number; rot: number; color: string}, i: number, w: number, h: number) => (
	<rect key={i} x={s.x - w / 2} y={s.y - h / 2} width={w} height={h} rx={w / 2} fill={s.color} transform={`rotate(${s.rot.toFixed(1)} ${s.x.toFixed(1)} ${s.y.toFixed(1)})`} />
);

// ---------------------------------------------------------------- bakes

const cake: StickerDraw = (c) => {
	const dripsX = [40, 56, 74, 92, 110, 128, 146, 162];
	const dripLen = [16, 30, 14, 26, 18, 34, 15, 22];
	const arcY = (x: number) => 80 + 18 * Math.sqrt(Math.max(0, 1 - ((x - 100) / 70) ** 2));
	return (
		<>
			{detail(
				c,
				<defs>
					<linearGradient id={`${c.id}-cake`} x1="0" x2="1" y1="0" y2="0">
						<stop offset="0" stopColor="#8E4E2E" />
						<stop offset="1" stopColor="#6A3520" />
					</linearGradient>
				</defs>,
			)}
			<ellipse cx={100} cy={170} rx={90} ry={16} {...paint(c, '#EBD3B6')} />
			<ellipse cx={100} cy={166} rx={84} ry={13} {...paint(c, '#F6E6D2')} />
			<path d="M30 80 L30 156 A70 18 0 0 0 170 156 L170 80 Z" {...paint(c, `url(#${c.id}-cake)`)} />
			{detail(
				c,
				<>
					<path d="M30 116 A70 18 0 0 0 170 116 L170 127 A70 18 0 0 1 30 127 Z" fill="#F6D7B0" />
					<path d="M30 119 A70 18 0 0 0 170 119" fill="none" stroke="#FCE7CC" strokeWidth={2.5} opacity={0.8} />
					<path d="M152 92 L152 170 A70 18 0 0 0 170 156 L170 80 Z" fill="#4A2416" opacity={0.22} />
				</>,
			)}
			<ellipse cx={100} cy={80} rx={70} ry={18} {...paint(c, '#4A2416')} />
			{dripsX.map((x, i) => (
				<rect key={i} x={x - 6.5} y={arcY(x) - 8} width={13} height={dripLen[i] + 8} rx={6.5} {...paint(c, '#4A2416')} />
			))}
			{detail(
				c,
				<>
					<ellipse cx={86} cy={75} rx={40} ry={8} fill="#9A5A36" opacity={0.45} />
					{[44, 64, 86, 110, 134, 155].map((x, i) => (
						<circle key={i} cx={x} cy={arcY(x) - 7} r={6.5} fill="#FCEBD4" />
					))}
				</>,
			)}
			{[
				[74, 64],
				[100, 57],
				[126, 64],
			].map(([x, y], i) => (
				<g key={i}>
					<path d={`M${x} ${y - 9} C ${x + 2} ${y - 22}, ${x + 10} ${y - 28}, ${x + 16} ${y - 30}`} {...ink(c, '#5B7A2B', 3.2)} />
					<circle cx={x} cy={y} r={11.5} {...paint(c, '#D7263D')} />
					{detail(c, <ellipse cx={x - 4} cy={y - 4} rx={3.6} ry={2.6} fill="#FF8A97" opacity={0.9} />)}
				</g>
			))}
		</>
	);
};

const doughnut: StickerDraw = (c) => (
	<>
		<circle cx={100} cy={108} r={80} {...paint(c, '#C27E3B')} />
		<circle cx={100} cy={100} r={78} {...paint(c, '#E3A35C')} />
		{detail(
			c,
			<>
				<path d={`${wavy(100, 98, 64, 9, 4.5)} M100 72 A26 26 0 1 0 100.01 72 Z`} fill="#F2789F" fillRule="evenodd" />
				<path d="M52 70 A58 58 0 0 1 96 42" fill="none" stroke="#FFC2D4" strokeWidth={7} strokeLinecap="round" opacity={0.75} />
				<circle cx={100} cy={100} r={23} fill="#C27E3B" />
				<circle cx={100} cy={102} r={17} fill={WHITE} />
				{sprinkleSet('dn', 16, 100, 98, 34, 56).map((s, i) => sprinkle(s, i, 4.8, 14))}
			</>,
		)}
	</>
);

const CR = {cx: 100, cy: 172, r: 88, a0: 192, a1: 348, wMax: 38, wTip: 5};
const crPoint = (t: number, side: number, puff = 0): Pt => {
	const a = ((CR.a0 + (CR.a1 - CR.a0) * t) * Math.PI) / 180;
	const w = (CR.wTip + (CR.wMax - CR.wTip) * Math.pow(Math.sin(Math.PI * t), 0.85)) * (1 + puff);
	const r = CR.r + side * w;
	return [CR.cx + Math.cos(a) * r, CR.cy + Math.sin(a) * r];
};
const crBand = (t0: number, t1: number) => {
	const outer: string[] = [];
	const inner: string[] = [];
	for (let i = 0; i <= 10; i++) {
		const t = t0 + ((t1 - t0) * i) / 10;
		const puff = 0.13 * Math.sin((Math.PI * i) / 10);
		outer.push(fmt(crPoint(t, 1, puff)));
		inner.unshift(fmt(crPoint(t, -1, puff * 0.6)));
	}
	return `M${outer.join(' L')} L${inner.join(' L')} Z`;
};
const CR_BANDS = [
	{t0: 0, t1: 0.17, fill: '#B96A25'},
	{t0: 0.17, t1: 0.36, fill: '#E39A45'},
	{t0: 0.36, t1: 0.64, fill: '#EBA54B'},
	{t0: 0.64, t1: 0.83, fill: '#E39A45'},
	{t0: 0.83, t1: 1, fill: '#B96A25'},
];

const croissant: StickerDraw = (c) => (
	<>
		<path d={crBand(0, 1)} {...paint(c, '#E39A45')} />
		{detail(
			c,
			CR_BANDS.map((b, i) => {
				const mid = (b.t0 + b.t1) / 2;
				const h0 = crPoint(mid - (b.t1 - b.t0) * 0.28, 0.62);
				const h1 = crPoint(mid + (b.t1 - b.t0) * 0.28, 0.62);
				return (
					<g key={i}>
						<path d={crBand(b.t0, b.t1)} fill={b.fill} stroke="#B96A25" strokeWidth={3} strokeLinejoin="round" />
						<path d={`M${fmt(h0)} L${fmt(h1)}`} stroke="#F7C877" strokeWidth={i === 2 ? 8 : 6} strokeLinecap="round" opacity={0.85} />
					</g>
				);
			}),
		)}
	</>
);

const cupcake: StickerDraw = (c) => (
	<>
		<path d="M50 118 L150 118 L134 184 Q133 188 128 188 L72 188 Q67 188 66 184 Z" {...paint(c, '#CF2E5F')} />
		{detail(
			c,
			[62, 78, 94, 110, 126, 140].map((x, i) => <path key={i} d={`M${x} 120 L${72 + ((x - 50) / 100) * 56} 186`} stroke="#E8638A" strokeWidth={5} strokeLinecap="round" />),
		)}
		<ellipse cx={100} cy={116} rx={58} ry={20} {...paint(c, '#E7809F')} />
		<ellipse cx={100} cy={110} rx={56} ry={20} {...paint(c, '#F6A5BE')} />
		<ellipse cx={100} cy={90} rx={44} ry={19} {...paint(c, '#F6A5BE')} />
		<ellipse cx={100} cy={71} rx={30} ry={16} {...paint(c, '#F6A5BE')} />
		<path d="M88 64 Q100 30 112 64 Z" {...paint(c, '#F6A5BE')} />
		{detail(
			c,
			<>
				<path d="M50 112 Q100 128 150 112" fill="none" stroke="#E7809F" strokeWidth={3} opacity={0.7} />
				<path d="M58 93 Q100 108 142 93" fill="none" stroke="#E7809F" strokeWidth={3} opacity={0.7} />
				<path d="M72 74 Q100 86 128 74" fill="none" stroke="#E7809F" strokeWidth={3} opacity={0.7} />
				<ellipse cx={80} cy={98} rx={14} ry={5} fill="#FFD3E0" opacity={0.8} />
				{sprinkleSet('cc', 10, 100, 96, 8, 40).map((s, i) => sprinkle(s, i, 4.4, 12))}
			</>,
		)}
		<path d="M100 36 C 102 24, 110 18, 118 16" {...ink(c, '#5B7A2B', 3.2)} />
		<circle cx={100} cy={40} r={12} {...paint(c, '#D7263D')} />
		{detail(c, <ellipse cx={96} cy={36} rx={3.8} ry={2.8} fill="#FF8A97" />)}
	</>
);

const cookieEdge = () => {
	const pts: string[] = [];
	for (let i = 0; i <= 60; i++) {
		const a = (i / 60) * Math.PI * 2;
		const rr = 74 + (random(`ck-${i % 60}`) - 0.5) * 6;
		pts.push(fmt([100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr]));
	}
	return `M${pts.join(' L')} Z`;
};

const cookie: StickerDraw = (c) => (
	<>
		<path d={cookieEdge()} {...(c.sil ? paint(c, WHITE) : paint(c, '#DDA15A', '#B97A35', 6))} />
		{detail(
			c,
			<>
				<path d="M60 58 Q90 40 128 50" fill="none" stroke="#EDBB79" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
				{[
					[70, 72, 11],
					[118, 62, 9],
					[136, 104, 12],
					[92, 112, 10],
					[60, 128, 9],
					[110, 146, 11],
					[148, 140, 7],
					[84, 86, 6],
				].map(([x, y, r], i) => (
					<path
						key={i}
						d={`M${x - r} ${y} Q${x - r * 0.8} ${y - r * 1.1} ${x} ${y - r} Q${x + r * 1.1} ${y - r * 0.7} ${x + r} ${y + r * 0.1} Q${x + r * 0.6} ${y + r * 1.05} ${x - r * 0.1} ${y + r * 0.9} Q${x - r * 1.05} ${y + r * 0.6} ${x - r} ${y} Z`}
						fill="#4E2716"
					/>
				))}
				<path d="M98 132 l10 6 M140 80 l8 -4 M50 100 l6 8" stroke="#B97A35" strokeWidth={3} strokeLinecap="round" />
			</>,
		)}
	</>
);

const spiral = () => {
	const pts: string[] = [];
	for (let i = 0; i <= 120; i++) {
		const t = i / 120;
		const a = t * 2.6 * Math.PI * 2;
		const r = 6 + t * 50;
		pts.push(fmt([100 + Math.cos(a) * r, 100 + Math.sin(a) * r * 0.94]));
	}
	return `M${pts.join(' L')}`;
};

const roll: StickerDraw = (c) => (
	<>
		<ellipse cx={100} cy={112} rx={72} ry={68} {...paint(c, '#A9662C')} />
		<ellipse cx={100} cy={102} rx={70} ry={66} {...paint(c, '#D48F48')} />
		{detail(
			c,
			<>
				<path d={spiral()} fill="none" stroke="#9E5A25" strokeWidth={8} strokeLinecap="round" />
				<path d={spiral()} fill="none" stroke="#E9AE68" strokeWidth={3} strokeLinecap="round" opacity={0.6} transform="translate(-3 -3)" />
				<path d="M44 84 C 64 70, 74 104, 96 88 S 132 70, 156 90" fill="none" stroke="#FFF8EE" strokeWidth={9} strokeLinecap="round" />
				<path d="M52 122 C 72 108, 90 138, 112 122 S 142 112, 152 124" fill="none" stroke="#FFF8EE" strokeWidth={8} strokeLinecap="round" />
			</>,
		)}
	</>
);

const loaf: StickerDraw = (c) => (
	<>
		{detail(
			c,
			<defs>
				<linearGradient id={`${c.id}-loaf`} x1="0" x2="0" y1="0" y2="1">
					<stop offset="0" stopColor="#E7A04A" />
					<stop offset="1" stopColor="#C8782F" />
				</linearGradient>
			</defs>,
		)}
		<path d="M24 150 C 24 66, 176 66, 176 150 Q 176 168 158 168 L 42 168 Q 24 168 24 150 Z" {...paint(c, `url(#${c.id}-loaf)`)} />
		{detail(
			c,
			<>
				<path d="M24 150 Q 24 168 42 168 L 158 168 Q 176 168 176 150 Q 100 160 24 150 Z" fill="#B96A25" opacity={0.55} />
				{[
					[62, 92, 84, 132],
					[92, 84, 114, 128],
					[122, 88, 142, 128],
				].map(([x1, y1, x2, y2], i) => (
					<g key={i}>
						<path d={`M${x1} ${y1} Q ${(x1 + x2) / 2 + 8} ${(y1 + y2) / 2} ${x2} ${y2}`} fill="none" stroke="#F8D69A" strokeWidth={9} strokeLinecap="round" />
						<path d={`M${x1 + 3} ${y1 + 2} Q ${(x1 + x2) / 2 + 10} ${(y1 + y2) / 2 + 2} ${x2 + 2} ${y2}`} fill="none" stroke="#B96A25" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
					</g>
				))}
				<path d="M44 100 Q 70 76 104 74" fill="none" stroke="#F7C877" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
			</>,
		)}
	</>
);

// ---------------------------------------------------------------- groceries

const PEAR = 'M100 16 C 125 16 137 42 143 70 C 149 98 174 114 174 148 C 174 179 141 195 100 195 C 59 195 26 179 26 148 C 26 114 51 98 57 70 C 63 42 75 16 100 16 Z';
const inset = (s: number, cy: number) => `translate(100 ${cy}) scale(${s}) translate(-100 -${cy})`;

const avocado: StickerDraw = (c) => (
	<>
		<path d={PEAR} {...paint(c, '#2E5A22')} />
		{detail(
			c,
			<>
				<path d={PEAR} fill="#6B9A3A" transform={inset(0.92, 124)} />
				<path d={PEAR} fill="#D3E58C" transform={inset(0.86, 126)} />
				<path d={PEAR} fill="#E9F2B4" transform={inset(0.6, 138)} opacity={0.75} />
				<circle cx={100} cy={142} r={31} fill="#7E4B22" />
				<path d="M77 134 A 25 25 0 0 1 108 117" fill="none" stroke="#A56D3C" strokeWidth={6} strokeLinecap="round" />
				<ellipse cx={89} cy={130} rx={8} ry={5.5} fill="#C8925D" opacity={0.9} />
			</>,
		)}
	</>
);

const TOMATO = 'M100 50 C 131 40 176 58 178 110 C 180 160 143 188 100 188 C 57 188 20 160 22 110 C 24 58 69 40 100 50 Z';
const tomato: StickerDraw = (c) => (
	<>
		<path d={TOMATO} {...paint(c, '#E2412E')} />
		{detail(
			c,
			<>
				<path d="M150 70 C 176 104 170 160 116 182 C 160 172 186 120 150 70 Z" fill="#B42E1E" opacity={0.55} />
				<path d="M100 58 C 90 96 90 150 100 186" fill="none" stroke="#C2331F" strokeWidth={3} opacity={0.35} />
				<ellipse cx={66} cy={92} rx={17} ry={10} fill="#FF9C82" opacity={0.75} transform="rotate(-38 66 92)" />
			</>,
		)}
		<path d={starPath(100, 58, 5, 7, 36, -90, 0.55)} {...paint(c, '#3E8E3A')} />
		<path d="M100 56 C 100 44 104 34 112 28" {...ink(c, '#2F6E2B', 7)} />
		{detail(c, <path d={starPath(100, 58, 5, 4, 20, -90, 0.55)} fill="#57A64C" />)}
	</>
);

const LEMON = 'M20 112 C 16 103 24 97 32 96 C 44 62 80 44 112 46 C 144 48 166 68 172 92 C 182 93 188 104 180 113 C 174 150 134 170 98 168 C 62 166 38 150 32 128 C 24 126 20 120 20 112 Z';
const lemon: StickerDraw = (c) => (
	<>
		<path d="M118 50 C 128 22 162 12 186 22 C 178 46 146 60 118 50 Z" {...paint(c, '#4E9A3F')} />
		{detail(c, <path d="M122 48 C 142 36 160 28 180 24" fill="none" stroke="#3A7C2F" strokeWidth={3} strokeLinecap="round" />)}
		<path d={LEMON} {...paint(c, '#F7D13C')} />
		{detail(
			c,
			<>
				<path d="M40 136 C 70 166 140 166 176 116 C 150 150 80 160 40 136 Z" fill="#E3A928" opacity={0.6} />
				<ellipse cx={82} cy={78} rx={30} ry={11} fill="#FFF2A6" opacity={0.85} transform="rotate(-14 82 78)" />
				{[
					[60, 110],
					[96, 96],
					[130, 84],
					[118, 124],
					[84, 134],
					[146, 108],
					[70, 90],
				].map(([x, y], i) => (
					<circle key={i} cx={x} cy={y} r={2.2} fill="#E7B62E" opacity={0.55} />
				))}
			</>,
		)}
	</>
);

const CARROT = taper([148, 52], [44, 178], 30);
const carrot: StickerDraw = (c) => {
	const base: Pt = [160, 38];
	return (
		<>
			<path d={leaf(base, -112, 50, 12)} {...paint(c, '#3F8E3A')} />
			<path d={leaf(base, -76, 58, 13)} {...paint(c, '#4FA247')} />
			<path d={leaf(base, -40, 48, 12)} {...paint(c, '#5DB552')} />
			<path d={CARROT.d} {...paint(c, '#F2862E')} />
			{detail(
				c,
				<>
					<path d={`M${fmt(CARROT.at(0.06, 0.55))} L${fmt(CARROT.at(0.55, 0.55))}`} stroke="#FFB46A" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
					{[0.22, 0.38, 0.54, 0.7].map((t, i) => {
						const s = i % 2 === 0 ? 1 : -1;
						return <path key={i} d={`M${fmt(CARROT.at(t, s * 0.95))} Q${fmt(CARROT.at(t + 0.02, s * 0.55))} ${fmt(CARROT.at(t + 0.04, s * 0.15))}`} fill="none" stroke="#CF661A" strokeWidth={4} strokeLinecap="round" />;
					})}
				</>,
			)}
		</>
	);
};

const EGG = 'M100 18 C 139 18 168 88 168 127 C 168 167 137 192 100 192 C 63 192 32 167 32 127 C 32 88 61 18 100 18 Z';
const egg: StickerDraw = (c) => (
	<>
		<path d={EGG} {...paint(c, '#EDC398')} />
		{detail(
			c,
			<>
				<path d="M142 64 C 172 104 176 164 122 186 C 160 168 164 112 142 64 Z" fill="#D39C68" opacity={0.6} />
				<ellipse cx={76} cy={74} rx={13} ry={24} fill="#FBE4C9" opacity={0.95} transform="rotate(22 76 74)" />
				{[
					[118, 98],
					[86, 132],
					[132, 148],
					[104, 168],
					[70, 108],
				].map(([x, y], i) => (
					<circle key={i} cx={x} cy={y} r={2.4} fill="#C98F5C" opacity={0.45} />
				))}
			</>,
		)}
	</>
);

const cheese: StickerDraw = (c) => (
	<>
		<path d="M22 124 L140 60 L182 94 L182 154 L22 158 Z" {...paint(c, '#F6C33E')} />
		{detail(
			c,
			<>
				<path d="M22 124 L140 60 L182 94 Z" fill="#FFE07C" />
				<path d="M168 96.6 L182 94 L182 154 L168 154.4 Z" fill="#E09F25" opacity={0.9} />
				{[
					[64, 140, 10, 7.5],
					[108, 130, 13, 9.5],
					[146, 140, 8, 6],
					[126, 147, 6, 4.5],
					[40, 146, 5, 4],
				].map(([x, y, rx, ry], i) => (
					<ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#DE9F2A" />
				))}
				{[
					[112, 92, 11, 5],
					[142, 86, 7, 3.4],
					[78, 106, 6, 3],
				].map(([x, y, rx, ry], i) => (
					<ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#F2C24C" />
				))}
				<path d="M24 124 L180 94" stroke="#FFF0B0" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
			</>,
		)}
	</>
);

const baguette: StickerDraw = (c) => (
	<g transform="rotate(-32 100 100)">
		{detail(
			c,
			<defs>
				<clipPath id={`${c.id}-bag`}>
					<rect x={10} y={76} width={180} height={48} rx={24} />
				</clipPath>
			</defs>,
		)}
		<rect x={10} y={76} width={180} height={48} rx={24} {...paint(c, '#E19C4C')} />
		{detail(
			c,
			<>
				<rect x={0} y={103} width={200} height={30} fill="#C27A33" opacity={0.55} clipPath={`url(#${c.id}-bag)`} />
				<path d="M34 86 L166 86" stroke="#F0BB6E" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
				{[40, 74, 108, 142].map((x, i) => (
					<g key={i}>
						<path d={`M${x} 86 Q ${x + 14} 96 ${x + 22} 112`} fill="none" stroke="#F8D594" strokeWidth={8} strokeLinecap="round" />
						<path d={`M${x + 3} 89 Q ${x + 16} 99 ${x + 23} 113`} fill="none" stroke="#B96F2C" strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
					</g>
				))}
			</>,
		)}
	</g>
);

const GRAPES: Pt[] = [
	[49, 70],
	[83, 70],
	[117, 70],
	[151, 70],
	[66, 100],
	[100, 100],
	[134, 100],
	[83, 130],
	[117, 130],
	[100, 160],
];
const grapes: StickerDraw = (c) => (
	<>
		<path d="M100 52 C 100 40 106 28 116 20" {...ink(c, '#6B4A26', 7)} />
		<path d="M96 50 C 80 24 50 18 30 26 C 44 48 72 58 96 50 Z" {...paint(c, '#4E9A3F')} />
		{detail(c, <path d="M94 48 C 76 36 56 30 36 28" fill="none" stroke="#3A7C2F" strokeWidth={3} strokeLinecap="round" />)}
		{GRAPES.map(([x, y], i) => (
			<g key={i}>
				<circle cx={x} cy={y} r={19} {...paint(c, '#5E2C7E')} />
				{detail(
					c,
					<>
						<circle cx={x - 1.5} cy={y - 1.5} r={16} fill="#7E42A6" />
						<ellipse cx={x - 6} cy={y - 7} rx={5.5} ry={3.8} fill="#C9A2E2" opacity={0.9} transform={`rotate(-30 ${x - 6} ${y - 7})`} />
					</>,
				)}
			</g>
		))}
	</>
);

const BANANA = arcBand(100, -40, 150, 126, 54, (t) => 3 + 31 * Math.pow(Math.sin(Math.PI * t), 0.7));
const banana: StickerDraw = (c) => (
	<g transform="rotate(-16 100 100)">
		<path d="M11.8 81.4 L3 73" {...ink(c, '#6B4A1E', 9)} />
		<path d={BANANA.band(0, 1, -1, 1)} {...paint(c, '#F6CE40')} />
		{detail(
			c,
			<>
				<path d={BANANA.band(0.02, 0.98, 0.25, 1)} fill="#E2AA2C" opacity={0.55} />
				<path d={BANANA.line(0.08, 0.92, 0.1)} fill="none" stroke="#E0A42A" strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
				<path d={BANANA.line(0.18, 0.8, -0.5)} fill="none" stroke="#FFE88A" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
				<circle cx={188.2} cy={81.4} r={4.5} fill="#5B3E1A" />
			</>,
		)}
	</g>
);

// ---------------------------------------------------------------- generic props (tintable)

const bag: StickerDraw = (c) => (
	<>
		<path d="M40 70 L160 70 L170 186 Q170 194 162 194 L38 194 Q30 194 30 186 Z" {...paint(c, c.tint ?? '#E3A867')} />
		{detail(
			c,
			<>
				<path d="M40 70 L160 70 L161.3 84 L38.8 84 Z" fill="#000000" opacity={0.12} />
				<path d="M130 84 L161.3 84 L170 186 Q170 194 162 194 L140 194 Z" fill="#000000" opacity={0.09} />
				<circle cx={76} cy={100} r={5} fill="#000000" opacity={0.35} />
				<circle cx={124} cy={100} r={5} fill="#000000" opacity={0.35} />
			</>,
		)}
		<path d="M76 100 C 74 30 126 30 124 100" {...ink(c, '#6E4220', 8)} />
	</>
);

const parcel: StickerDraw = (c) => {
	const tape = c.tint ?? '#F3D9A6';
	return (
		<>
			<path d="M100 36 L178 76 L178 152 L100 194 L22 152 L22 76 Z" {...paint(c, '#D29655')} />
			{detail(
				c,
				<>
					<path d="M100 36 L178 76 L100 116 L22 76 Z" fill="#EAB878" />
					<path d="M100 116 L178 76 L178 152 L100 194 Z" fill="#BC7F42" />
					<path d="M53.9 59.65 L68.1 52.35 L146.1 92.35 L131.9 99.65 Z" fill={tape} opacity={0.95} />
					<path d="M131.9 99.65 L146.1 92.35 L146.1 168.35 L131.9 175.65 Z" fill={tape} opacity={0.8} />
					<path d="M100 116 L100 194" stroke="#A86F38" strokeWidth={2} opacity={0.6} />
				</>,
			)}
		</>
	);
};

const HEART = 'M100 184 C 34 138 16 98 26 68 C 36 38 78 28 100 60 C 122 28 164 38 174 68 C 184 98 166 138 100 184 Z';
const heart: StickerDraw = (c) => (
	<>
		<path d={HEART} {...paint(c, c.tint ?? '#EF4A68')} />
		{detail(
			c,
			<>
				<path d="M150 60 C 176 90 166 130 112 170 C 150 136 168 100 150 60 Z" fill="#000000" opacity={0.14} />
				<ellipse cx={62} cy={72} rx={16} ry={10} fill={WHITE} opacity={0.45} transform="rotate(-36 62 72)" />
			</>,
		)}
	</>
);

const star: StickerDraw = (c) => {
	const base = c.tint ?? '#FFC63A';
	return (
		<>
			<path d={starPath(100, 106, 5, 38, 84)} {...paint(c, base, base, 16)} />
			{detail(
				c,
				<>
					{[0, 1, 2, 3, 4].map((k) => {
						const a0 = ((-90 + 72 * k) * Math.PI) / 180;
						const a1 = ((-54 + 72 * k) * Math.PI) / 180;
						return <path key={k} d={`M100 106 L${fmt([100 + Math.cos(a0) * 84, 106 + Math.sin(a0) * 84])} L${fmt([100 + Math.cos(a1) * 38, 106 + Math.sin(a1) * 38])} Z`} fill="#000000" opacity={0.09} />;
					})}
					<path d={starPath(100, 106, 5, 16, 38)} fill={WHITE} opacity={0.28} />
				</>,
			)}
		</>
	);
};

const coin: StickerDraw = (c) => {
	const base = c.tint ?? '#F2B532';
	return (
		<>
			<circle cx={100} cy={108} r={80} {...paint(c, base)} />
			{detail(c, <circle cx={100} cy={108} r={80} fill="#000000" opacity={0.24} />)}
			<circle cx={100} cy={100} r={80} {...paint(c, base)} />
			{detail(
				c,
				<>
					<circle cx={100} cy={100} r={62} fill="none" stroke={WHITE} strokeWidth={6} opacity={0.35} />
					<circle cx={100} cy={100} r={56} fill="#000000" opacity={0.06} />
					<path d={starPath(100, 100, 5, 13, 30)} fill={WHITE} stroke={WHITE} strokeWidth={5} strokeLinejoin="round" opacity={0.45} />
					<path d="M44 64 A 66 66 0 0 1 92 34" fill="none" stroke={WHITE} strokeWidth={8} strokeLinecap="round" opacity={0.5} />
				</>,
			)}
		</>
	);
};

export const STICKERS = {
	cake,
	doughnut,
	croissant,
	cupcake,
	cookie,
	roll,
	loaf,
	avocado,
	tomato,
	lemon,
	carrot,
	egg,
	cheese,
	baguette,
	grapes,
	banana,
	bag,
	parcel,
	heart,
	star,
	coin,
} satisfies Record<string, StickerDraw>;

export type StickerKind = keyof typeof STICKERS;

export type StickerProps = {
	kind?: StickerKind;
	/** Your own drawing (200 x 200 box), painted with the same die-cut edge and shadow. */
	draw?: StickerDraw;
	/** Design px; the drawing is square. */
	size?: number;
	/** The white die-cut edge. Off for thumbnails inside product UI. */
	edge?: boolean;
	shadow?: boolean;
	/** Main colour of the generic props: bag, heart, star, coin, and the parcel's tape. */
	tint?: string;
	style?: CSSProperties;
};

/**
 * One prop as a sticker: <Sticker kind="avocado" size={150} />. Kinds: cake, doughnut, croissant, cupcake, cookie,
 * roll, loaf, avocado, tomato, lemon, carrot, egg, cheese, baguette, grapes, banana, bag, parcel, heart, star, coin.
 */
export const Sticker: React.FC<StickerProps> = ({kind, draw, size = 160, edge = true, shadow = true, tint, style}) => {
	const {u} = useLayout();
	const id = `st${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const fn = draw ?? (kind ? STICKERS[kind] : undefined);
	if (!fn) return null;
	return (
		<svg
			viewBox="-12 -12 224 224"
			width={size * u}
			height={size * u}
			style={{display: 'block', overflow: 'visible', filter: shadow ? `drop-shadow(0 ${(6 * u).toFixed(1)}px ${(9 * u).toFixed(1)}px rgba(40,24,16,0.26))` : undefined, ...style}}
		>
			{edge ? <g>{fn({sil: true, id, tint})}</g> : null}
			<g>{fn({sil: false, id, tint})}</g>
		</svg>
	);
};
