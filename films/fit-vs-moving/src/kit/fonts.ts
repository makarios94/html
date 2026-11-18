import {createContext, useContext} from 'react';

/*
 * Web-font loaders (including @remotion/google-fonts) add a face to document.fonts only once its file has arrived,
 * so document.fonts.ready can resolve while a brand face is still downloading. Anything that measures text waits here.
 */

const clean = (f: string) => f.split(',')[0].replace(/["']/g, '').trim();

/** The web-font families the film loads; FilmShell provides them from its `fonts` prop. */
export const FontsContext = createContext<string[]>([]);
export const useFilmFonts = () => useContext(FontsContext);

const loadedFace = (family: string, weight?: number | string) => {
	let ok = false;
	document.fonts.forEach((f) => {
		if (ok || f.status !== 'loaded' || clean(f.family) !== family) return;
		const w = String(f.weight);
		if (weight === undefined || w === String(weight) || w.includes(' ')) ok = true;
	});
	return ok;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolves once font loading has gone quiet: no face added for `quietMs` and nothing loading. A family counts as
 * loaded as soon as its first subset arrives, while the subset that holds a currency sign or a diacritic can still
 * be on its way, so glyph checks and text measurement wait for this.
 */
export const waitForFontsToSettle = async (quietMs = 600, timeoutMs = 10000) => {
	const t0 = Date.now();
	let size = document.fonts.size;
	let since = Date.now();
	while (Date.now() - t0 < timeoutMs) {
		await sleep(50);
		if (document.fonts.size !== size || document.fonts.status === 'loading') {
			size = document.fonts.size;
			since = Date.now();
		} else if (Date.now() - since >= quietMs) {
			break;
		}
	}
	await document.fonts.ready;
};

/**
 * Resolves once `family` has loaded (at `weight` when given), or after the timeout. Families the film does not load
 * as web fonts (system faces) resolve at once.
 */
export const waitForFont = async (family: string, filmFonts: string[], weight?: number | string, timeoutMs = 10000) => {
	const fam = clean(family);
	if (!filmFonts.some((f) => clean(f) === fam)) return;
	const t0 = Date.now();
	while (!loadedFace(fam) && Date.now() - t0 < timeoutMs) await sleep(40);
	const t1 = Date.now();
	while (weight !== undefined && !loadedFace(fam, weight) && Date.now() - t1 < 1500) await sleep(40);
	await waitForFontsToSettle();
};
