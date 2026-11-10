// Many full-size stills from one bundle (`npx remotion still` bundles again on every call, which is slow for
// style frames and review rounds).
//   node tools/stills.mjs <outdir> <composition>:<frame>[:name] ... [--props=path.json] [--scale=1]
//   node tools/stills.mjs out/frames Film-9x16:0:hook Film-9x16:240:turn Film-16x9:640:flag --props=out/qa.json
// Props default to the film's defaults; pass {"safeZones": true} in a props file for safe-zone checks.
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const outdir = args.shift();
if (!outdir || !args.length) {
	console.error('usage: node tools/stills.mjs <outdir> <composition>:<frame>[:name] ... [--props=path.json] [--scale=1]');
	process.exit(1);
}
const opts = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const jobs = args
	.filter((a) => !a.startsWith('--'))
	.map((a) => {
		const [comp, frame, name] = a.split(':');
		return {comp, frame: Number(frame), name: name ?? `${comp}_${frame}`};
	});
const inputProps = opts.props ? JSON.parse(fs.readFileSync(opts.props, 'utf8')) : {};
fs.mkdirSync(outdir, {recursive: true});
// Use the browser new_project.py saved in remotion.config.ts (or REMOTION_BROWSER_EXECUTABLE) when the bundled
// headless browser cannot be downloaded, as in a cloud session with a restricted network.
const cfg = fs.existsSync('remotion.config.ts') ? fs.readFileSync('remotion.config.ts', 'utf8') : '';
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? cfg.match(/setBrowserExecutable\(String\.raw`([^`]+)`\)/)?.[1] ?? null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const compositions = {};
for (const j of jobs) {
	compositions[j.comp] ??= await selectComposition({serveUrl, id: j.comp, inputProps, browserExecutable});
	const out = path.join(outdir, `${j.name}.png`);
	await renderStill({serveUrl, browserExecutable, composition: compositions[j.comp], frame: j.frame, output: out, inputProps, scale: Number(opts.scale ?? 1), overwrite: true});
	console.log('wrote', out);
}
