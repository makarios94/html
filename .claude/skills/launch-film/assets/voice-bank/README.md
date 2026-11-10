# Voice bank

Directed, checked voiceovers the skill has made and a listener has kept. Each folder holds the read (`vo.flac`,
lossless), its checked captions (`captions.json`, `.srt`, `.vtt`) and `voice.json` (the voice ID to generate new takes
with, the film and script it was made for, its measurements and the verdict).

| Bank id | Voice | Gender | Accent | voice_id | Length | vo_check | Verdict |
|---|---|---|---|---|---|---|---|
| `justin-case` | Justin Case (warm, trustworthy, clear) | male | en-american | `DtQLDxHbTiQTpVVanTy1` | 21.9 s | PERFORMS | Kept: the user said it sounds nice; the whispered low line was re-read at full voice. |
| `nora` | Nora (engaging ads and educational pro) | female | en-british | `L51A0Vt79LFJ0refo6v8` | 23.8 s | PERFORMS | Kept: the female version the user asked for. |
| `pastie` | Pastie (warm Nigerian storyteller) | female | en-nigerian | `y47FZICqt6oFf4Z89DXT` | 24.0 s | NEEDS DIRECTION | Kept by ear (they sound good, keep both) although vo_check flags her register. |
| `sulbyee` | Sulbyee (Nigerian professional) | male | en-nigerian | `i9sr2Eu9ynYVEaDDkF8I` | 22.2 s | PERFORMS | Kept: the user listened and said they sound good, keep both. |

Put one into a film whose script it was made for (the example launch film for all of these):

```bash
python scripts/voice_bank.py use pastie <project>
```

It copies the read and its captions into the film and rescores the music to it; render as usual, under its own slug
(`finish.py finals <project> ExampleLaunch <out> --slug paidly_launch_naija_female`). For a different script, use the
voice_id for a new take with the same `vo-direction.txt` approach, then the usual chain. Bank a finished read with
`voice_bank.py add`.
