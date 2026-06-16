---
name: API routing setup
description: How the Vite frontend proxies to the Express API server, and the port layout
---

The rummy-app frontend uses **relative `/api/...` paths** for all API calls (no hardcoded host/port).

**Why:** The original Vercel app served both frontend and API on the same origin. In the Replit monorepo the API is a separate workflow on port 8080 while the frontend (Vite dev server) is on port 25629 (mapped to external port 80).

**How to apply:** In `artifacts/rummy-app/vite.config.ts`, a server proxy forwards `/api`, `/sitemap.xml`, and `/robots.txt` to `http://localhost:8080`. This means the Vite dev server acts as a gateway and the browser never sees cross-origin requests.

Port map (from `.replit`):
- Port 25629 → external 80 → rummy-app (Vite)
- Port 8080 → external 8080 → api-server (Express)

For production deployment both must run; the API server must be at port 8080.
