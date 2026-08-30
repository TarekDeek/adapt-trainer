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
  barbell, dumbbells, cables, machines, pull-up bar, dip station) and the
  exercise selection changes to match. Every exercise has a **Swap** picker
  listing equipment-matched alternatives with the muscles they work.
- **Logging** — sets, reps, load, rest timers, plus optional cardio and
  body/fuel (protein) entries that don't affect your split. Finishing is
  **press-and-hold** ("Finished for the day?") so a stray tap can't end the
  session early.
- **Effort per set** — after logging reps, a chip appears beside the set: tap
  it to cycle `E / M / H / X` (Easy → Max, fifth tap clears). This is what lets
  the app tell "hit 4×10 easily" apart from "barely survived 4×10", and it
  feeds both load progression and session planning.
- **Automatic light days** — when two-thirds or more of your effort-rated sets
  over the last 7 days (at least 6 sets across 2+ sessions) felt Hard or Max,
  the app keeps the scheduled session but halves the sets and caps the targets,
  telling you exactly why ("9 of your last 12 logged sets felt Hard or Max…").
  At most one automatic light day per rolling week; a manual override always
  wins; with no effort logged the feature is silent.
- **Progress** — all-time totals (sessions, sets, volume, cardio minutes),
  the mix of how your rated sets felt, and a per-exercise trend of top set
  weight (best reps for bodyweight moves). Tap a dot for that session's
  details.
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
| `adapt:hideInstallHint` | set once the "Add to Home Screen" banner is dismissed |

The bundle contains **zero `fetch` calls**. Nothing leaves the phone, which also
means there is no server-side copy — **the Backup export is your only backup.**
Deleting the PWA from the Home Screen can clear its storage with it.
(The Edit → Share button opens the phone's share sheet with the app's URL —
an OS affordance, not a network call; the zero-fetch guarantee stands.)

## Install on iPhone

1. Open the Pages URL in **Safari** (this must be Safari — Chrome/Firefox on iOS
   can't install PWAs).
2. Share → **Add to Home Screen**.
3. Launch it from the Home Screen icon once while online, so the service worker
   caches the bundle.

After that it opens full-screen with no browser chrome and works offline.

## Sharing it with friends

Send the **app** link, not the repository link:

```
https://tarekdeek.github.io/adapt-trainer/
```

The GitHub repository page shows source code; the Pages URL above *is* the
app. The in-app **Edit → Share** button opens the phone's share sheet with
exactly that link.

Everyone who opens it gets their own independent copy: data lives in that
phone's `localStorage`, so nobody sees anyone else's log and no account or
server is involved. iPhone friends should install from Safari (Share → Add
to Home Screen) **before** logging anything — the browser and the installed
app keep separate storage. On Android: Chrome → ⋮ → Add to Home screen.

Two owner-side notes: the repo must stay **public** for Pages on the free
plan, and everyone loads the same deployed files — push to `main` and every
installed copy picks up the update within a launch or two.

## How progression works

`suggestTarget` reads your last session for the same exercise and tells you
what to do today:

| Last time | Suggestion |
|---|---|
| Hit every rep, felt **Easy** | Go up — **double** the usual jump ("felt easy") |
| Hit every rep, Medium or Hard | Go up one increment |
| Hit every rep, felt **Max** | Repeat the same weight and own it first |
| Short of target, felt **Easy** | Same weight — that's an effort problem, push harder |
| Short of target | Same weight, one more rep per set |
| Short of target, felt **Max** | Repeat the weight — recover it before you push it |
| No effort logged | Rep-only logic, exactly as before effort existed |

Effort is always optional. Sets logged without it fall back to the last row.

Stored per set as `ef` (1 = Easy → 4 = Max). Deliberately **not** `e`: an earlier
build briefly used `e` for reps-in-reserve, where a *high* number meant *easy*.
Reusing the key would have silently inverted the meaning of that data.

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
