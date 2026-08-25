# AGENTS.md — Adapt Trainer

Binding rules and operational notes. Read before changing anything here.
Workspace conventions live in
`OneDrive/Documents/claude-code-workspaces/CONVENTIONS.md` and take precedence.

## What this repo is

A **pre-built artifact repo**, not a source repo. `bundle.js` (~173 KB) is a
minified React build that arrived as a zip; the source that produced it is not
here and is not in version control anywhere yet.

**Do not hand-edit `bundle.js`.** It's minified. Editing it makes the app
unrebuildable and the change unreviewable. If the app's behaviour needs to
change, the source has to be located or reconstructed first — see the open item
in `PROJECT.md`.

Editing the scaffolding (`index.html`, `sw.js`, `manifest.webmanifest`, icons)
is fine — those are hand-written and readable.

### Sanctioned exception: surgical bundle patches

Small, single-expression fixes to `bundle.js` are allowed when the source is
unavailable and the bug is real, **provided every one of these holds**:

1. The change is a one-liner you can state precisely in the commit message.
2. It lands in its **own commit**, separate from any import, so `git show` is a
   readable diff.
3. `node --check bundle.js` passes.
4. Behaviour is verified before *and* after in a browser, not reasoned about.
5. It gets an entry in the table below.

Anything larger than that needs the real source. Don't refactor minified code.

### Patches applied to bundle.js

| Date | Commit | What |
|---|---|---|
| 2026-08-25 | `91116c3` | Rest timer showed a wrong duration for one frame. `onClick` set `restEnd = Date.now()+12e4` but the `now` state it's diffed against only ticks while a timer runs, so the first render showed `120s + app-idle-time` (e.g. `2:17`) before snapping to `2:00`. Fix stamps `now` from the same timestamp: `()=>{let Wq7=Date.now();Be(Wq7),K(Tt>0?null:Wq7+12e4)}`. |

> **A new zip drop silently reverts every patch in this table.** If the app is
> ever replaced from a fresh `adapt-app.zip`, re-apply these or re-verify the
> bugs were fixed upstream — otherwise old bugs quietly come back.

## Documented deviations from CONVENTIONS.md

- **Conventions are written with Windows paths** (`C:\Users\tarek\...`). This
  device is macOS, so the same structure maps to `/Users/tarekdeek/repos/` and
  `/Users/tarekdeek/Library/CloudStorage/OneDrive-Personal/Documents/claude-code-workspaces/`.
  Structure is unchanged; only the root differs.
- **Deploys are GitHub Pages, not Vercel.** The conventions' Vercel
  author-email trap doesn't apply, but the git author config was set anyway
  (this machine had *no* global git identity at all — commits would have failed
  outright).
- **No `SECRETS.md` env template with values.** This app has no env vars, no
  keys, and no backend. The workspace `SECRETS.md` records "none, by design".

## Deploy traps

- **The service worker is cache-first and never self-updates.** `sw.js` pins
  `CACHE = "adapt-v1"` and serves any cached response before hitting the
  network. Once a phone has installed it, **pushing to `main` will not reach
  that phone** — it keeps serving the old cached bundle indefinitely.

  To ship an update you must bump the cache name (`adapt-v2`, …) *and* delete
  old caches in the `activate` handler. Without that, a deploy is invisible on
  every device that already installed the app. This is the single most likely
  "I pushed but nothing changed" cause in this project.

- **Everything is relative-path.** `index.html` loads `bundle.js`/`sw.js`
  relatively and the manifest uses `"start_url": "./"`. That's deliberate — it
  makes the app work from the Pages sub-path `/<repo>/` as well as from a
  domain root. **Don't "fix" these to absolute `/` paths**; it breaks Pages.

- **`.nojekyll` must stay.** Without it GitHub Pages runs the files through
  Jekyll, which can drop files whose names begin with `_`.

- **iOS PWA install is Safari-only.** Chrome/Firefox on iOS cannot Add to Home
  Screen. Test in Safari or the result is meaningless.

## Data rules

State is `localStorage`-only under `adapt:v1`, `adapt:draft`, `adapt:ping`.
There is no server copy.

- **Never change a storage key or state shape without a migration.** A rename
  silently orphans the user's entire training history — it looks like data
  loss, and there's no backend to restore from.
- The in-app Backup export is the only recovery path. Treat it as
  load-bearing.
