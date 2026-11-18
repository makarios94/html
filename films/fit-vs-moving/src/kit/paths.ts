import {random} from 'remotion';

/**
 * Procedural hand-drawn paths. Each is ONE continuous stroke (so it draws on cleanly) inside a
 * w x h box, with seeded imperfection: change the seed for a different hand, keep it for consistency.
 */

const r = (seed: string, i: number, amp: number) => (random(`${seed}-${i}`) - 0.5) * 2 * amp;
const n = (v: number) => v.toFixed(2);

/** A quick marker underline that overshoots and hooks back slightly, like a real flick of the wrist. */
export const scribbleUnderline = (w: number, h: number, seed = 'u') => {
	const y0 = h * 0.62 + r(seed, 1, h * 0.08);
	const y1 = h * 0.42 + r(seed, 2, h * 0.08);
	const c1x = w * 0.3;
	const c1y = h * 0.78 + r(seed, 3, h * 0.08);
	const c2x = w * 0.7;
	const c2y = h * 0.32 + r(seed, 4, h * 0.08);
	const hookX = w * 0.86 + r(seed, 5, w * 0.03);
	const hookY = h * 0.72 + r(seed, 6, h * 0.06);
	return `M ${n(w * 0.01)} ${n(y0)} C ${n(c1x)} ${n(c1y)}, ${n(c2x)} ${n(c2y)}, ${n(w * 0.99)} ${n(y1)} Q ${n(w * 1.02)} ${n(h * 0.55)}, ${n(hookX)} ${n(hookY)}`;
};

/** A swooping arc (rises left to right), for "out of groceries?" style accents under or around a line. */
export const swooshArc = (w: number, h: number, seed = 's') => {
	const sx = w * 0.02;
	const sy = h * 0.85 + r(seed, 1, h * 0.05);
	const ex = w * 0.98;
	const ey = h * 0.2 + r(seed, 2, h * 0.05);
	return `M ${n(sx)} ${n(sy)} C ${n(w * 0.35)} ${n(h * 1.05)}, ${n(w * 0.7)} ${n(h * 0.75)}, ${n(ex)} ${n(ey)}`;
};

/** A hand-drawn loop around something: about 1.15 turns with a wobbling radius. */
export const handCircle = (w: number, h: number, seed = 'c') => {
	const cx = w / 2;
	const cy = h / 2;
	const steps = 48;
	const turns = 1.15;
	const start = -Math.PI * 0.75 + r(seed, 0, 0.3);
	let d = '';
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const a = start + t * turns * Math.PI * 2;
		const wob = 1 + r(seed, i % 7, 0.035) + t * 0.04;
		const x = cx + Math.cos(a) * (w / 2) * wob;
		const y = cy + Math.sin(a) * (h / 2) * wob;
		d += i === 0 ? `M ${n(x)} ${n(y)}` : ` L ${n(x)} ${n(y)}`;
	}
	return d;
};

/** A slightly uneven strike-through. */
export const strikeLine = (w: number, h: number, seed = 'k') =>
	`M ${n(-w * 0.02)} ${n(h * 0.55 + r(seed, 1, h * 0.06))} C ${n(w * 0.33)} ${n(h * 0.45)}, ${n(w * 0.66)} ${n(h * 0.6)}, ${n(w * 1.02)} ${n(h * 0.48 + r(seed, 2, h * 0.06))}`;

/** A check mark in a w x h box. */
export const checkMark = (w: number, h: number) => `M ${n(w * 0.12)} ${n(h * 0.55)} L ${n(w * 0.4)} ${n(h * 0.82)} L ${n(w * 0.9)} ${n(h * 0.2)}`;

/** A curved arrow shaft from (x1,y1) to (x2,y2); bend is the sideways bulge as a fraction of length. */
export const arrowShaft = (x1: number, y1: number, x2: number, y2: number, bend = 0.2) => {
	const mx = (x1 + x2) / 2;
	const my = (y1 + y2) / 2;
	const dx = x2 - x1;
	const dy = y2 - y1;
	const cx = mx - dy * bend;
	const cy = my + dx * bend;
	return `M ${n(x1)} ${n(y1)} Q ${n(cx)} ${n(cy)}, ${n(x2)} ${n(y2)}`;
};

/** Arrow head at (x2,y2) pointing along the direction from (cx,cy). */
export const arrowHead = (x2: number, y2: number, fromX: number, fromY: number, size = 26) => {
	const a = Math.atan2(y2 - fromY, x2 - fromX);
	const l = {x: x2 - Math.cos(a - 0.5) * size, y: y2 - Math.sin(a - 0.5) * size};
	const rr = {x: x2 - Math.cos(a + 0.5) * size, y: y2 - Math.sin(a + 0.5) * size};
	return `M ${n(l.x)} ${n(l.y)} L ${n(x2)} ${n(y2)} L ${n(rr.x)} ${n(rr.y)}`;
};
