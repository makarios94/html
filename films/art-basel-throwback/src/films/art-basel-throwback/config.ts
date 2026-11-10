import {Beats, beatGrid} from '../../kit';
import beats from './data/beats.json';

/** Folder name and public/films/<ID>/ asset folder. new_project.py rewrites ID and NAME when it copies this film. */
export const ID = 'art-basel-throwback';
export const NAME = 'ArtBaselThrowback';
export const FPS = 30;
export const ASPECTS = ['4x5', '9x16', '1x1'] as const;

export const asset = (p: string) => `films/${ID}/${p}`;

/** Every cue in this film is a bar or a beat. Swap the track, re-run beat_grid.py, and the film re-times. */
export const B = beatGrid(beats as Beats, FPS);
/**
 * The film's structure, in bars. Its length comes from the tempo: bars x 4 x 60 / BPM. 8 bars run 16.0 s at 120 BPM
 * and exactly 15.0 s at 128 BPM, so for a 15 s ad make the bed at 128 (sound_kit.py bed --bpm 128 --bars 8 --tail 2)
 * and no scene changes. The music must last at least BARS bars; Film checks it.
 */
export const BARS = 8;
/** One extra second for the last chord to ring under the end card. */
export const DURATION = B.bars(BARS) + 30;
