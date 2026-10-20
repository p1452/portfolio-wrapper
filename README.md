# Portfolio wrapper

The existing `index.html` embeds the Portfolio application and remains unchanged.

## Lists retirement — October 20, 2026

The obsolete GitHub Pages Lists application and recovery pages have been removed.
Current production: https://spero.pfeiffee.com:8124/lists/ (verified release cde49a2).
Authoritative source: `p1452/home-assistant-config`, `apps/lists-development/`.
Compiled production assets: `apps/appdb/lists-production-www/`, delivered through the existing NUC Git/SSH static procedure to `/share/lists/`.
Read that source repository's `apps/lists-development/PRODUCTION.md` and scoped instructions before working on Lists.

This repository no longer builds or deploys Lists. Its old files remain recoverable in Git history at commit `516ccc28638f95c8a8082a0aee1571c69920a1a6`; do not restore them as production.
Only `lists/sw.js` remains as a storage-preserving retirement update for old cached installations. It displays a retirement notice when it receives an update; it does not delete IndexedDB, caches, pending operations or credentials, and it cannot retire a disconnected device before it reconnects.

The old public Lists page should return HTTP 404 for a fresh network client after Pages publishes this removal. Existing cached clients may instead see the retirement worker's HTTP 410 notice. GitHub Pages remains enabled for Portfolio.
