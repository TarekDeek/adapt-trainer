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

## Deploying

Static site, no build step — the repo root *is* the deployable site. Push to
`main` and GitHub Pages serves it. Setup steps are in
[PROJECT.md](PROJECT.md); deploy traps are in [AGENTS.md](AGENTS.md).

## Layout

```
index.html             app shell, PWA meta tags, service-worker registration
bundle.js              the entire app, pre-built (no source in this repo)
manifest.webmanifest   PWA manifest — name, icons, standalone display
sw.js                  service worker, cache-first offline
icon-180.png           iOS Home Screen icon
icon-512.png           PWA icon
.nojekyll              tell GitHub Pages to serve files as-is
```
