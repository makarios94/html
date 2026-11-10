import React from 'react';
import {Composition, Folder, Freeze} from 'remotion';
import {ASPECTS, defaultFilmProps} from './kit';
import {films} from './films';
import {FilmDef} from './films/types';

// Remotion clamps every frame to its composition's range, so a cover must be as long as its film for <Freeze> to
// reach coverFrame. `remotion still <Name>-Cover-<aspect>` renders frame 0, which shows coverFrame.
const coverOf = (f: FilmDef) => {
	const Cover: React.FC<Record<string, unknown>> = () => (
		<Freeze frame={f.coverFrame ?? 0}>
			<f.Component {...defaultFilmProps} stem="none" />
		</Freeze>
	);
	return Cover;
};

export const RemotionRoot: React.FC = () => (
	<>
		{films.map((f) => (
			<Folder key={f.id} name={f.name}>
				{f.aspects.map((a) => (
					<Composition
						key={a}
						id={`${f.name}-${a}`}
						component={f.Component}
						fps={f.fps}
						durationInFrames={f.durationInFrames}
						width={ASPECTS[a].width}
						height={ASPECTS[a].height}
						defaultProps={defaultFilmProps}
					/>
				))}
				{f.aspects.map((a) => (
					<Composition
						key={`cover-${a}`}
						id={`${f.name}-Cover-${a}`}
						component={coverOf(f)}
						fps={f.fps}
						durationInFrames={f.durationInFrames}
						width={ASPECTS[a].width}
						height={ASPECTS[a].height}
					/>
				))}
			</Folder>
		))}
	</>
);
