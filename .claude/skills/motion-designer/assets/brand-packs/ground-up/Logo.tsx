import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, prog, springAt, useLayout} from '../../kit';
import {LIME, SERIF, theme} from './theme';

/*
 * Typographic recreation of the Ground Up lockup as the style guide describes it: white Anton "GROUND UP",
 * the lime square sitting on the baseline after "UP", then "with Ayobami" in serif. Letters reveal one per
 * frame with a tiny drop-in. If the real logo file is available (ground-up-logo.png), show that instead.
 */
export const Mark: React.FC = () => <div style={{width: '100%', height: '100%', background: LIME}} />;

export const Logo: React.FC<{at: number; onBrand?: boolean; size?: number}> = ({at, onBrand = false, size = 150}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {u} = useLayout();
	const letters = [...'GROUND UP'];
	const ink = onBrand ? '#0B0B0C' : '#FFFFFF';
	const sq = springAt(frame, fps, at + letters.length + 2, {damping: 14, stiffness: 220, mass: 0.6});
	const sub = prog(frame, at + letters.length + 8, 14, ease.soft);
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.08 * u}}>
			<div style={{display: 'flex', alignItems: 'baseline', fontFamily: theme.fonts.display, fontSize: size * u, color: ink, lineHeight: 0.95, letterSpacing: '0.01em'}}>
				{letters.map((ch, i) => {
					const p = prog(frame, at + i, 5, ease.out);
					return (
						<span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${((1 - p) * -10 * u).toFixed(2)}px)`}}>
							{ch}
						</span>
					);
				})}
				<span style={{display: 'inline-block', width: size * 0.2 * u, height: size * 0.2 * u, marginLeft: size * 0.06 * u, background: onBrand ? '#0B0B0C' : LIME, transform: `scale(${sq.toFixed(4)})`}} />
			</div>
			<div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: size * 0.42 * u, color: ink, opacity: sub, transform: `translateY(${((1 - sub) * 10 * u).toFixed(2)}px)`}}>with Ayobami</div>
		</div>
	);
};
