# ProHeredex

ProHeredex is a high-performance, security-hardened web application for digital asset management and distribution. Built with React, TypeScript, and Vite, it features a dual-backend architecture (Vercel Serverless + Node.js) with deep security integrations.

## 🛡️ Security Architecture

ProHeredex implements a "Defense in Depth" strategy:

- **Bot Armor**: Multi-layered detection using behavioral scoring, Proof-of-Work (PoW), and Cloudflare Turnstile.
- **Link Masking**: Real destination URLs are AES-256 encrypted at rest and never exposed to the client or search crawlers.
- **Access Control**: Admin verification via Firebase Auth with strict Firestore-backed role validation.
- **Fail-Closed Design**: Critical security checks (like bot verification) fail-closed to prevent unauthorized access during network issues.
- **Replay Protection**: Single-use cryptographic tokens prevent download link reuse and automated scraping.

## 🚀 Reliability & Performance

- **Local Backup First**: The download engine prioritizes local filesystem backups (`secure_links_backup.json`) to ensure 100% uptime even if cloud databases hit quota limits.
- **Hybrid Backend**: Seamlessly switches between Vercel (`api/index.ts`) and Node.js (`server.ts`) environments while maintaining consistent security logic.
- **SEO Engine**: Automated metadata scrubbing ensures that protected information is never leaked into public search indexes.

## 🛠️ Getting Started

1.  **Environment Setup**:
    Copy `.env.example` to `.env`. Ensure `AES_SECRET` and `TOKEN_SECRET` are set to strong, unique strings.
2.  **Installation**:
    ```bash
    pnpm install
    ```
3.  **Deployment**:
    - For Vercel: `vercel deploy`
    - For Node.js: `pnpm build && pnpm start`

## 🔒 Responsible Disclosure

If you discover a security vulnerability, please report it via the official support channels. This repository has been audited to remove all hardcoded secrets and sensitive diagnostic tools.
