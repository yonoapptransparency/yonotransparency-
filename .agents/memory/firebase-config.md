---
name: Firebase config duplication
description: firebase-applet-config.json must exist in both rummy-app and api-server directories
---

`firebase-applet-config.json` contains the Firebase project config (projectId, apiKey, etc).

**Why:** The frontend imports it as a static JSON at build time (`import appletConfig from '../../firebase-applet-config.json'`). The API server reads it at runtime with `fs.readFileSync`. They are separate packages so each needs its own copy.

**How to apply:** If you update Firebase config, update both:
- `artifacts/rummy-app/firebase-applet-config.json`
- `artifacts/api-server/firebase-applet-config.json`

Both fall back to `VITE_FIREBASE_*` environment variables if the file is missing or has placeholder values. The fallback logic is in `artifacts/api-server/src/lib/firebaseHelper.ts`.
