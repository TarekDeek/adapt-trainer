# PROJECT.md — Adapt Trainer

Living log. Update as work lands; this is what the next session reads.

## What this is

A personal adaptive training PWA — picks each day's session from your last 7
days of history, scoped to whatever equipment you have. Offline-first, no
backend, no accounts. Hosted on GitHub Pages so it can be installed to the
iPhone Home Screen.

Not to be confused with **REPS** (`repos/reps`), the other fitness PWA in this
workspace. Separate app, separate repo. Nothing was touched there.

## Status — 2026-08-25

Repo created on macOS from `adapt-app.zip` (6 files, a pre-built React bundle
plus PWA scaffolding) found in the `adaptTrainer` workspace.

Done:
- Extracted to `/Users/tarekdeek/repos/adapt-trainer`, `git init`, branch `main`.
- Git author set to `TarekDeek / 77941062+TarekDeek@users.noreply.github.com`
  (this machine had **no global git identity** — commits would have failed).
- Added `README.md`, `AGENTS.md`, this file, `.gitignore`, `.nojekyll`.
- Verified the bundle makes **zero network calls** — genuinely offline-capable.
- Verified the app renders and resolves all assets from a Pages-style sub-path
  (`/adapt-trainer/`), and that the service worker registers and caches all 5
  assets when served from a root.
- **Fixed the rest-timer flash** (`91116c3`) — see below.

Not done — needs the owner:
- **Create the GitHub repo and push** (no `gh` CLI on this machine, and no
  remote was invented). See "Owner setup" below.
- **Enable GitHub Pages** on the repo.
- **Install on the iPhone** via Safari → Add to Home Screen.

## Owner setup

1. Create an empty repo `TarekDeek/adapt-trainer` on GitHub (no README, no
   .gitignore — this repo already has both).
2. From `/Users/tarekdeek/repos/adapt-trainer`:
   ```
   git remote add origin https://github.com/TarekDeek/adapt-trainer.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages** → Source: **Deploy from a branch**, Branch:
   `main`, Folder: `/ (root)`. Save.
4. Wait ~1 min, then open `https://tarekdeek.github.io/adapt-trainer/` **in
   Safari on the iPhone** → Share → Add to Home Screen.

**Public vs private:** GitHub Pages on a *private* repo requires a paid plan.
On the free plan the repo must be **public** for Pages to serve. There are no
secrets in this codebase, so public is safe here — but the training data is
never in the repo either way, it's only in `localStorage` on the phone.

## Fixed

- **Rest timer flashed a wrong duration** (reported 2026-08-25, fixed
  `91116c3`). Pressing "Rest 2:00" briefly showed an inflated time — `2:17`,
  `3:40`, whatever — then snapped to `2:00`. Cause: the button set an absolute
  end-timestamp, but the `now` value it's compared against only updates *while
  a timer is running*, so the first render diffed against a stale `now` and
  showed `120s + however long the app had been open`. The longer the app sat
  idle, the bigger the wrong number — which is why it looked random. Fixed by
  stamping `now` from the same timestamp in the click handler. This required
  patching minified output; the policy that permits it is in `AGENTS.md`.

## Decisions

- **Kept the pre-built `bundle.js` as-is** rather than trying to reconstruct
  source. It works, and hand-editing minified output would make the app
  unmaintainable. See `AGENTS.md`.
- **Kept all paths relative** so the app works from the Pages sub-path
  `/adapt-trainer/` without changes.
- **Left `sw.js` untouched** despite a known update-delivery flaw (cache-first,
  fixed cache name, never invalidates). Flagged rather than silently changed —
  see "Next up".

## Next up

- **Fix the service-worker update path.** As written, once the app is installed
  on the phone, *no future deploy will ever reach it*. Bump `CACHE` per release
  and purge old caches on `activate`. Worth doing before the first update, not
  after. Details in `AGENTS.md` → Deploy traps.
- **Find or reconstruct the app source.** Right now the app can never be
  changed, only replaced wholesale by a new zip. If the source exists somewhere,
  getting it into a repo is the highest-value follow-up.
- Consider a custom domain if the `github.io` URL is annoying on the Home
  Screen (the icon label already reads "Adapt" regardless).
