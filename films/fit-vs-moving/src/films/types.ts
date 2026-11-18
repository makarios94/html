import {ComponentType} from 'react';
import {AspectKey, FilmProps} from '../kit';

/** What every film folder exports from its index.ts. Root.tsx registers one composition per aspect. */
export type FilmDef = {
	/** Folder name, also the public/films/<id>/ asset folder. */
	id: string;
	/** Composition prefix in the Studio and on the CLI: <name>-9x16, <name>-Cover-9x16. */
	name: string;
	fps: number;
	durationInFrames: number;
	aspects: AspectKey[];
	Component: ComponentType<FilmProps>;
	/** Frame used for the cover still (the hook, usually). */
	coverFrame?: number;
};
