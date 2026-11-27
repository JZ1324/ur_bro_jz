# Browser smoke tests

```sh
npx playwright install chromium
npm run test:e2e
```

Tests run on desktop and mobile Chromium against a dedicated Vite server on port 5189. Each run uses an isolated in-memory PostgreSQL engine (PGlite) running the production hosted stores and schema and isolated browser contexts, never the visitor database or a hosted project. Coverage includes initial rendering, deferred downloads, mobile overflow, chapter-menu Escape/focus, planting persistence and editing, ocean catch persistence, and dialog dismissal.

Traces and results go to the OS temporary directory (override with `PLAYWRIGHT_OUTPUT_DIR`). Auth unit/integration tests use a fake provider; smoke tests never send email or touch hosted accounts.
