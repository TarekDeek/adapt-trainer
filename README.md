# Adapt Trainer

A personal training app that adapts each session to what you actually did over
the last 7 days. Fully offline: a single self-contained React bundle with no
backend, no accounts, and no network calls of any kind.

Installs to the iPhone Home Screen as a PWA and runs with the plane in airplane
mode.

## What it does

- **Today** — the session the app picked for you (Upper / Lower / Full Body /
  Re-Entry / Recovery-Cardio), chosen from your last 7 days of history.
- **Gym scoping** — tell it what equipment is on hand (bodyweight only,
  dumbbells, cables, machines, pull-up bar, dip station) and the exercise
  selection changes to match.
- **Logging** — sets, reps, load, rest timers, plus optional cardio and
  body/fuel (protein) entries that don't affect your split.
- **Effort per set** — after logging reps, optionally tap how many reps you had
  left (`3+ / 2 / 1 / 0`). This is what lets the app tell "hit 4×10 easily"
  apart from "barely survived 4×10", and it feeds load progression directly.
- **History** — past sessions; the first one you log becomes the baseline
  everything else adapts around.
- **Backup / restore** — export your data as text you paste somewhere safe, and
  paste it back to restore.

## Data and privacy

Everything lives in `localStorage` on the device, under these keys:

| Key | Contents |
|---|---|
| `adapt:v1` | main app state — history, settings, gym scope |
| `adapt:draft` | in-progress session, so a reload mid-workout doesn't lose it |
| `adapt:ping` | storage-availability probe |

The bundle contains **zero `fetch` calls**. Nothing leaves the phone, which also
means there is no server-side copy — **the Backup export is your only backup.**
Deleting the PWA from the Home Screen can clear its storage with it.

## Install on iPhone

1. Open the Pages URL in **Safari** (this must be Safari — Chrome/Firefox on iOS
   can't install PWAs).
2. Share → **Add to Home Screen**.
3. Launch it from the Home Screen icon once while online, so the service worker
   caches the bundle.

After that it opens full-screen with no browser chrome and works offline.

## How progression works

`suggestTarget` reads your last session for the same exercise and tells you
what to do today:

| Last time | Suggestion |
|---|---|
| Hit every rep, 3+ left in the tank | Go up — **double** the usual jump ("too easy") |
| Hit every rep, normal effort | Go up one increment |
| Hit every rep, went to failure | Repeat the same weight and own it first |
| Short of target, 3+ left | Same weight — that's an effort problem, push harder |
| Short of target | Same weight, one more rep per set |
| No effort logged | Rep-only logic, exactly as before effort existed |

Effort is always optional. Sets logged without it fall back to the last row.

## Building

```
npm install
npm run build      # esbuild -> bundle.js
```

Edit `src/adapt-trainer.jsx` — it's the whole app. Rebuild and commit
`bundle.js` with every source change; Pages deploys the build output, so a
stale bundle means your change doesn't ship.

## Deploying

Push to `main`; GitHub Pages serves the repo root as-is. **Bump `VERSION` in
`sw.js` whenever a cached file changes**, or installed phones take an extra
launch to see the update. Setup steps are in [PROJECT.md](PROJECT.md); traps
are in [AGENTS.md](AGENTS.md).

## Layout

```
src/adapt-trainer.jsx  the entire app — one React component
src/entry.jsx          mounts it; shims window.storage onto localStorage
index.html             app shell, PWA meta tags, service-worker registration
bundle.js              BUILD OUTPUT — generated, committed so Pages can serve it
manifest.webmanifest   PWA manifest — name, icons, standalone display
sw.js                  service worker: versioned cache, offline + self-updating
icon-180.png           iOS Home Screen icon
icon-512.png           PWA icon
.nojekyll              tell GitHub Pages to serve files as-is
```
