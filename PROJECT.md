# PROJECT.md — Adapt Trainer

Living log. Update as work lands; this is what the next session reads.

## What this is

A personal adaptive training PWA — picks each day's session from your last 7
days of history, scoped to whatever equipment you have, and autoregulates load
from how hard each set actually felt. Offline-first, no backend, no accounts.
Hosted on GitHub Pages so it can be installed to the iPhone Home Screen.

Not to be confused with **REPS** (`repos/reps`), the other fitness PWA in this
workspace. Separate app, separate repo. Nothing was touched there.

## Status — 2026-08-25

Repo created on macOS from `adapt-app.zip`; full source located mid-session and
committed, so the app is now normally maintainable.

Done:
- Repo at `/Users/tarekdeek/repos/adapt-trainer`, branch `main`, git author set
  to `TarekDeek / 77941062+...noreply` (this machine had **no global git
  identity** — commits would have failed).
- Source committed (`src/`), `npm run build` verified to reproduce the
  originally-shipped bundle **byte-identically**.
- Workspace docs per conventions; `adaptTrainer` row added to the shared
  `CONVENTIONS.md` project table (approved 2026-08-25).
- **Fixed the rest-timer flash** (`d7aaa3e`).
- **Added per-set effort + effort-driven progression** (`dc23696`, reworked in
  `HEAD`: subjective effort level, not reps-in-reserve — owner's call).
- **Fixed the service-worker update path** (`dc23696`, `2ee6cf3`) — deploys now
  actually reach installed phones.
- Verified: zero network calls; renders and resolves assets from a Pages-style
  sub-path; fully functional with the server stopped (real offline test).

Not done — needs the owner:
- **Create the GitHub repo and push** (no `gh` CLI here; no remote invented).
- **Enable GitHub Pages.**
- **Install on the iPhone** via Safari → Add to Home Screen.
- **Delete the OneDrive copy of the source** at
  `claude-code-workspaces/adaptTrainer/adapt-source/` once the push succeeds —
  code must not live in OneDrive (CONVENTIONS §1). Left in place pending
  confirmation; the repo copy is verified identical.

## Owner setup

1. Create an empty repo `TarekDeek/adapt-trainer` on GitHub (no README, no
   .gitignore — this repo has both).
2. From `/Users/tarekdeek/repos/adapt-trainer`:
   ```
   git remote add origin https://github.com/TarekDeek/adapt-trainer.git
   git push -u origin main
   ```
3. Settings → Pages → Source: **Deploy from a branch**, Branch `main`,
   Folder `/ (root)`. Save.
4. Wait ~1 min, open `https://tarekdeek.github.io/adapt-trainer/` **in Safari
   on the iPhone** → Share → Add to Home Screen.

**Public vs private:** Pages on a *private* repo needs a paid plan; on the free
plan the repo must be **public**. No secrets exist in this codebase, and
training data lives only in the phone's localStorage, so public is safe.

## Fixed

- **Rest timer flashed a wrong duration** (reported 2026-08-25, `d7aaa3e`).
  Pressing "Rest 2:00" briefly showed an inflated time — `2:17`, `3:40` — then
  snapped to `2:00`. The button set an absolute end-timestamp, but the `now` it
  is compared against only ticks *while a timer runs*, so the first render
  diffed against a stale `now` and showed `120s + time the app had been open`.
  Looked random because it scaled with idle time. Reproduced at 17s idle
  (`2:17`), fixed, re-verified: correct from the first frame.

- **Service worker never delivered updates** (`dc23696`, `2ee6cf3`). It was
  cache-first on a fixed key `adapt-v1`: once a phone installed the app, no
  future deploy would ever reach it. Now a versioned cache with cleanup on
  activate, stale-while-revalidate, and `cache: "reload"` so revalidation
  bypasses the browser's HTTP cache — without that last part the worker
  re-cached the build it was replacing and the update still never landed.
  Verified against a marker build: old worker stale forever; new worker updates
  immediately on a `VERSION` bump, and on the second launch without one.

## Decisions

- **Kept all paths relative** so the app works from the Pages sub-path
  `/adapt-trainer/` unchanged.
- **`bundle.js` is committed** even though it's build output — Pages deploys
  from the branch with no build step, so the artifact has to be in git.
- **Effort is a subjective level, not reps-in-reserve.** First cut asked "how
  many reps left?" (3+/2/1/0); the owner wanted "how hard did it feel?"
  instead, so it's now `Easy / Medium / Hard / Max`. Simpler to answer honestly
  mid-set, and it's what was actually asked for.
- **Stored as `ef`, not `e`.** The two schemes invert each other — high RIR
  meant *easy*, high effort means *hard*. Renaming rather than repurposing
  means any set still carrying `e` is ignored instead of read backwards.
  Nothing had shipped, so no migration was needed, but the rename costs
  nothing and removes the failure mode permanently.
- **Effort is optional, never defaulted.** A guessed effort is worse than none,
  because it silently drives load changes. All pre-existing history has no
  effort and keeps the old rep-only progression.
- **Doubled increment only when both signals agree** (all target reps hit *and*
  it felt Easy). Either signal alone keeps the normal increment.

## Next up

- Ship it: push, enable Pages, install, and train with it for a couple of weeks
  before adding anything else.
- Once there's real effort data, the obvious follow-on is **fatigue-aware
  session planning** — `planToday` currently decides from session dates and
  counts only. A week where every set is logged Hard or Max is exactly the
  signal for an easier day, and the data will finally be there to do it.
- Possible: chart effort trend per exercise in History.
