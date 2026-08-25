# Adapt Trainer — source

Adaptive workout tracker (PWA). Session type adapts to logged training
frequency; exercise selection adapts to available equipment.

## Files
- `adapt-trainer.jsx` — the ENTIRE app: one React component containing the
  exercise database, session templates, adaptive planning logic (planToday),
  progression engine (suggestTarget), and all UI. Edit this file.
- `entry.jsx` — mounts the app and shims `window.storage` (the API the
  component uses) onto localStorage.
- `index.html`, `manifest.webmanifest`, `sw.js`, `icon-*.png` — PWA shell.
  sw.js provides the offline cache.
- `bundle.js` — BUILD OUTPUT (minified, React inlined). Never edit directly;
  regenerate with `npm run build`.

## Build
    npm install
    npm run build

Deploy: index.html, bundle.js, manifest.webmanifest, sw.js, icon-180.png,
icon-512.png (e.g. GitHub Pages). Open in Safari → Add to Home Screen.

## Important notes
- Storage keys: `adapt:v1` (sessions + settings), `adapt:draft` (mid-workout
  autosave, cleared on Finish). All data is JSON in localStorage.
- After changing any cached file, bump the CACHE constant in sw.js
  ("adapt-v1" → "adapt-v2"), or installed clients keep serving the old build.
- Design intent worth preserving: cardio sessions (type "CARDIO") must never
  count toward lifting frequency in planToday; automatic exercise rotation is
  deliberately absent (it would break the progression engine, which compares
  same-exercise history).
