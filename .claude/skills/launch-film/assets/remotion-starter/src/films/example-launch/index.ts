import {FilmDef} from '../types';
import {ASPECTS, DURATION, FPS, ID, NAME} from './config';
import {Film} from './Film';

export const film: FilmDef = {
	id: ID,
	name: NAME,
	fps: FPS,
	durationInFrames: DURATION,
	aspects: [...ASPECTS],
	Component: Film,
	coverFrame: 20,
};
