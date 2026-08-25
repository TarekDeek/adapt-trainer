# Original delivery

Verbatim copies of the two files from the original `adapt-source` drop that
are **not** otherwise reproducible from git history:

- `README.md` — the original author's notes. Superseded by the repo README and
  `AGENTS.md` (its "Important notes" section was folded into AGENTS.md under
  *Design intent worth preserving*), but kept because it is the author's own
  description of intent.
- `package.json` — as delivered, before the build script was repointed at
  `src/entry.jsx` and a description was added.

Everything else from that drop is byte-identical to files already in git:
`index.html`, `manifest.webmanifest`, `sw.js`, `icon-180.png`, `icon-512.png`
and the original `bundle.js` are all in commit `a88f7c5`; `entry.jsx` and
`adapt-trainer.jsx` are in `bff3eca` under `src/`.

These are historical artifacts. **Do not build or deploy from this directory** —
the live source is `src/`.
