# AGENTS.md — Adapt Trainer

Binding rules and operational notes. Read before changing anything here.
Workspace conventions live in
`OneDrive/Documents/claude-code-workspaces/CONVENTIONS.md` and take precedence.

## Layout

Source is real and builds reproducibly. **Edit `src/`, never `bundle.js`.**

```
src/adapt-trainer.jsx   the ENTIRE app — exercise DB, templates, planToday,
                        suggestTarget, all UI. One component, ~800 lines.
src/entry.jsx           mounts the app; shims window.storage onto localStorage
bundle.js               BUILD OUTPUT (minified, React inlined) — generated
index.html sw.js manifest.webmanifest icon-*.png   PWA shell
```

Build: `npm install && npm run build` (esbuild). The repo root **is** the
deployable site — Pages serves it directly, which is why `bundle.js` is
committed rather than gitignored.

> A clean build reproduced the originally-shipped bundle **byte-identically**,
> so the toolchain is trustworthy. If a build ever produces an unexpectedly
> large diff, suspect a dependency version before suspecting your change.

## Rules

- **Never hand-edit `bundle.js`.** It's minified; edits are unreviewable and
  are destroyed by the next `npm run build`. Change `src/` and rebuild.
- **Rebuild and commit `bundle.js` with any `src/` change.** Source and build
  output must never disagree — the deployed app is the build output, so a
  stale bundle means your change silently doesn't ship.
- **Never change a storage key or set/session shape without a migration.**
  State is `localStorage`-only (`adapt:v1` sessions+settings, `adapt:draft`
  mid-workout autosave, `adapt:ping` probe, `adapt:hideInstallHint`
  install-banner dismissal). There is no server copy: a rename
  orphans the user's entire training history with no way back. New fields must
  be *optional* and every reader must handle their absence — this is how `e`
  (effort) was added without touching existing data.
- The in-app Backup export is the only recovery path. Treat it as load-bearing.

## Design intent worth preserving

From the original author, still true:

- Cardio sessions (`type: "CARDIO"`) must **never** count toward lifting
  frequency in `planToday`.
- Automatic exercise rotation is **deliberately absent** — it would break
  `suggestTarget`, which compares same-exercise history.

Added since:

- **Effort (`ef`) is optional and must stay optional.** It's how the set felt,
  `1` Easy → `4` Max (higher = harder), asked only after reps are entered.
  `suggestTarget` falls back to rep-only logic whenever it's absent, which is
  every set logged before the feature existed. Never make it required or
  default it to a value — a guessed effort is worse than no effort, because it
  silently drives load changes.

- **Light days (`light: true`) are fatigue's only lever.** When ≥2/3 of the
  effort-rated sets across the trailing 7 days (min 6 rated sets over ≥2
  sessions) were Hard or Max, `planToday` keeps the scheduled session type but
  flags it `light`: 2 sets per lift, capped targets, evidence-bearing reason
  string. Fatigue must **never change the session type** — rotation and
  same-exercise comparisons depend on it. Precedence: manual override >
  REENTRY > CARDIO_DAY > fatigue; a `light: true` session in the last 7 days
  silences the check (one auto light day per rolling week). The persisted
  `light` flag on session records is optional-additive; `lastPerf` prefers
  non-light sessions so a deload never drags the next target down. The whole
  layer is wrapped in try/catch and fails closed to the base plan.
  NOTE: the 2/3 threshold's meaning is anchored to the `EFFORT_OPTS` hint
  wording ("a real fight" / "nothing left") — softening those anchors silently
  changes what the trigger measures.

- **The key is `ef`, and `e` is burned.** A first cut of this feature stored
  reps-in-reserve in `e`, where a *high* value meant *easy* — the exact
  opposite of `ef`. The field was renamed rather than repurposed so that any
  set still carrying `e` is simply ignored instead of being read upside-down
  (verified: stale `e:3` yields the normal increment, not the doubled one).
  **Never revive `e` for anything.**

## Deploy traps

- **Bump `VERSION` in `sw.js` on any deploy that changes a cached file.**
  The worker is stale-while-revalidate over a versioned cache, so a forgotten
  bump still lands the update on the *second* launch — the bump just makes it
  immediate. What is not optional is the `cache: "reload"` on the install
  precache and the background refresh: without it the worker re-caches the very
  build you're replacing, and the update never arrives at all. Verified, not
  assumed. (The original worker was cache-first on a fixed key and would have
  served the first build forever.)

- **Everything is relative-path.** `index.html` loads `bundle.js`/`sw.js`
  relatively and the manifest uses `"start_url": "./"`. That's deliberate — it
  makes the app work from the Pages sub-path `/<repo>/` as well as a domain
  root. **Don't "fix" these to absolute `/` paths**; it breaks Pages.

- **`.nojekyll` must stay.** Without it Pages runs files through Jekyll, which
  can drop names beginning with `_`.

- **iOS PWA install is Safari-only.** Chrome/Firefox on iOS cannot Add to Home
  Screen. Test in Safari or the result is meaningless.

## Documented deviations from CONVENTIONS.md

- **Conventions use Windows paths** (`C:\Users\tarek\...`); this device is
  macOS, so the same structure maps to `/Users/tarekdeek/repos/` and
  `/Users/tarekdeek/Library/CloudStorage/OneDrive-Personal/Documents/claude-code-workspaces/`.
  Structure unchanged, only the root differs.
- **Deploys are GitHub Pages, not Vercel.** The Vercel author-email trap
  doesn't apply, but the git author was set anyway — this machine had **no**
  global git identity, so commits would have failed outright.
- **No `SECRETS.md` env template with values.** No env vars, no keys, no
  backend. The workspace `SECRETS.md` records "none, by design".
- **`bundle.js` (build output) is committed.** Normally build artifacts stay
  out of git, but Pages deploys straight from the branch with no build step.

## History

`91116c3` hand-patched the minified bundle to fix the rest timer, back when the
source was believed lost. That patch was superseded by `d7aaa3e`, which fixes
it properly in `src/`. No hand-patches remain, and none should be added — the
build is reproducible, so there is no longer any excuse for one.
