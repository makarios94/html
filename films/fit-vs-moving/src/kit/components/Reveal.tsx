import React, {CSSProperties} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {EnterKind, enterMotion, ExitKind, exitMotion, motionStyle} from '../enter';
import {useLayout} from '../layout';
import {ease, prog} from '../motion';
import {useMotion} from '../theme';
import {Sfx, SfxName} from '../audio';

export type RevealProps = {
	/** Frame the element starts arriving. */
	at?: number;
	kind?: EnterKind | 'mask';
	dur?: number;
	/** Travel in design px (defaults to the personality's distance). */
	distance?: number;
	exitAt?: number;
	exitKind?: ExitKind;
	exitDur?: number;
	/**
	 * false keeps a solid object solid: it travels in at full opacity instead of fading up (a phone rising over text
	 * would otherwise be see-through for its first frames). It stays hidden until `at`.
	 */
	fade?: boolean;
	/** Sound placed on the landing (a few frames after `at`). */
	sfx?: SfxName | false;
	sfxVolume?: number;
	inline?: boolean;
	origin?: string;
	style?: CSSProperties;
	children: React.ReactNode;
};

/**
 * The universal entrance/exit wrapper. Anything can arrive with intent:
 * <Reveal at={cue} kind="rise">...</Reveal>. "mask" slides the content up from behind a clipping line.
 */
export const Reveal: React.FC<RevealProps> = ({
	at = 0,
	kind = 'rise',
	dur,
	distance,
	exitAt,
	exitKind = 'fade',
	exitDur,
	fade = true,
	sfx = false,
	sfxVolume = 0.4,
	inline = false,
	origin = '50% 50%',
	style,
	children,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const m = useMotion();
	const {u} = useLayout();
	const ex = exitAt !== undefined ? exitMotion(frame, exitAt, exitDur ?? m.exit, exitKind, u) : undefined;
	const display = inline ? 'inline-block' : 'block';
	const sound = sfx ? <Sfx name={sfx} at={at + 2} volume={sfxVolume} /> : null;

	if (kind === 'mask') {
		const p = prog(frame, at, dur ?? m.enter, ease.out);
		const exStyle = ex ? motionStyle({opacity: 1, x: 0, y: 0, scale: 1, blur: 0, rotate: 0}, ex) : {};
		return (
			<div style={{display, overflow: 'hidden', paddingBottom: '0.06em', marginBottom: '-0.06em', ...style, ...exStyle}}>
				<div style={{transform: `translate3d(0, ${((1 - p) * 108).toFixed(2)}%, 0)`}}>{children}</div>
				{sound}
			</div>
		);
	}
	const moved = enterMotion({frame, fps, at, kind, m, u, dur, distance});
	const enter = fade ? moved : {...moved, opacity: frame < at ? 0 : 1};
	return (
		<div style={{display, transformOrigin: origin, ...style, ...motionStyle(enter, ex)}}>
			{children}
			{sound}
		</div>
	);
};
