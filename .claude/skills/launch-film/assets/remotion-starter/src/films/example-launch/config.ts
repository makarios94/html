import {Captions, voice} from '../../kit';
import captions from './data/captions.json';

/** Folder name and public/films/<ID>/ asset folder. new_project.py rewrites ID and NAME when it copies this film. */
export const ID = 'example-launch';
export const NAME = 'ExampleLaunch';
export const FPS = 30;
export const ASPECTS = ['9x16', '16x9'] as const;

/** Path of a file in public/films/<ID>/ (for Voice, Music, Img via staticFile). */
export const asset = (p: string) => `films/${ID}/${p}`;

/** Every cue in this film comes from the voice. Re-run align_vo.py after a new take and the film re-times. */
export const vo = voice(captions as Captions, FPS);

/** Hold after the last word so the end card can be read (at least 2 s on screen in total). */
export const TAIL = 48;
export const DURATION = vo.end + TAIL;

/** Phrase cues by id (ids are the [prefixes] in script.txt). */
export const P = {
	hook: vo.phrase('hook'),
	sent: vo.phrase('sent'),
	replies: vo.phrase('replies'),
	silence: vo.phrase('silence'),
	turn: vo.phrase('turn'),
	reveal: vo.phrase('reveal'),
	add: vo.phrase('add'),
	follow: vo.phrase('follow'),
	paid: vo.phrase('paid'),
	cta: vo.phrase('cta'),
	url: vo.phrase('url'),
};

/** Visuals land a few frames before the word: the eye reads ahead of the ear. */
export const LEAD = 3;
