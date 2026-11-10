# html
git init
git add README.md
git commit -m "first commit"
git remote add origin https://github.com/makarios94/html
git push -u origin master

## AssetLink motion studio

Two Claude Code skills live in `.claude/skills/` and are set up for AssetLink:

- `launch-film`: voice-led launch, feature and explainer films (voiceover, synced captions, score).
- `motion-designer`: music-led motion ads, feature teasers and logo stings with no voice.

Both render from code with Remotion and share the AssetLink brand pack
(`.claude/skills/<skill>/assets/brand-packs/assetlink/`): colours, type, logo, and `BRAND.md`, the list of what a film
may claim and what it must never say. Film projects go in `films/<project>/`.
