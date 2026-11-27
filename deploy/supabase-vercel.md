# Hosted garden on the existing Supabase project

The frontend stays in Vercel project **ur-bro-jz**, at **https://ur-bro-jz.vercel.app**. The Node function `api/garden/[...path].ts` serves the existing `/api/garden/*` endpoints with cookie ownership and same-origin requests. It stores data in **uajpewjagduzdpwlynrv** via Supabase's PostgreSQL transaction pooler. Authentication still verifies email codes with that project's Supabase Auth service.

Keep the explicit `/api/garden/:path*` rewrite in `vercel.json`. The standalone function's filename alone produces a single-segment matcher; nested paths such as `/plants/:id`, `/auth/logout`, and `/account/catch` need this rewrite.

## Database setup

Set `GARDEN_DATABASE_URL` in a private shell environment to the project's **transaction pooler URI** from Supabase's Connect dialog (port 6543). Percent-encode reserved password characters. Use a trusted server database role; the ordinary publishable key cannot read session data. Never put this value in a `VITE_*` variable, source code, logs, or browser configuration.

```sh
npm run db:setup
npm run db:import             # counts only, no writes
npm run db:import -- --apply  # transactional, refuses conflicting existing records
```

`db:setup` applies `server/postgres/schema.sql` transactionally and checks all 11 tables have RLS. Tables live in **garden_private**, which must stay outside exposed Data API schemas. PUBLIC, anon and authenticated have no schema/table access; there are no public RPCs or security-definer functions. The server database role owns the tables and the API enforces visitor ownership. Provider tokens are never sent to the browser.

Production uses the dedicated `garden_server` login. An administrator owns the schema and grants that login only `USAGE` and `CREATE` within `garden_private`; the login owns its tables and has no role memberships, administrator privileges, or database-wide schema creation privilege. Schema setup supports this pre-created schema. Keep the login password in the production Vercel Secret, outside source files and public build settings.

Before import, back up the SQLite source and pause writes. `GARDEN_DATABASE` selects its location; the default is the existing parent `.garden-data/plantings.sqlite`. Imports preserve IDs, sequence order, owner hashes, timestamps, cooldowns, sessions, collection quantities and guest import IDs. A repeated identical import is safe; a conflict rolls back the entire import. The source database is read only and remains available for rollback. Import before enabling production writes, because unrelated sequence numbers can conflict.

## Vercel configuration and rollout

Set these **server-only**, production environment variables on the existing Vercel project:

- `GARDEN_DATABASE_URL`: private transaction-pooler URI, marked sensitive.
- `GARDEN_PUBLIC_URL`: `https://ur-bro-jz.vercel.app` (or the canonical custom domain).

Existing `VITE_SUPABASE_URL` and archive settings stay as configured. Preview deployments should use an isolated test database; don't attach the production database to arbitrary preview builds. Preview origins also need their own `GARDEN_PUBLIC_URL`.

Deploy from the **ur_bro_jz/** repository root with Node 24. The package engine range bounds Vercel to Node 24 while retaining local Node 22 support. TypeScript rewrites relative `.ts` imports to `.js` for the emitted Node function; shared server dependencies also need explicit source extensions. `tests/vercel-runtime.test.mjs` verifies the emitted API loads with plain Node. Vercel serves the Vite build and automatically builds the catch-all Node function. No Docker host or separate API domain is needed. Missing hosted configuration returns 503 instead of silently creating an ephemeral SQLite database. Local development keeps SQLite unless `GARDEN_DATABASE_URL` is supplied.

After deploying:

1. GET `/api/garden/account` returns JSON with `user: null` for a fresh browser. GET `/api/garden/plants` returns the shared list.
2. Publish a planting, reload, and verify its note remains. A separate browser can read it but cannot edit it.
3. Sign in with an address outside the Supabase project team, enter the code, collect a fish, and verify the same collection on another device.
4. Sign out, verify guest behavior, and check cross-site POSTs are rejected.

The last email test needs custom SMTP: see [production email setup](README.md#public-sign-in-email--external-configuration-required). A hosted database does not remove Supabase's default mailer restrictions. No email provider credentials are bundled here.

## Backups and rollback

Use the Supabase project's backup/PITR options appropriate to its plan. Validate restore in a separate database. Retain the consistent SQLite backup until migration and live verification are complete; it will not contain writes made after cutover. Rolling back code must not delete the hosted schema. Switching back to SQLite after visitors publish requires a separate reverse migration to avoid losing new work.

## Verification

`npm test` includes a real PostgreSQL engine (PGlite) running the hosted schema, RLS access checks, planting ownership/cooldown/Undo, pagination, guest claims/imports, catch retries, OTP attempts, sessions, distributed rate-limit storage, and an HTTP sign-in/save round trip. `npm run test:e2e` covers desktop/mobile visitor flows against the hosted stores in isolated local PostgreSQL. Production pooler connectivity, TLS, and email delivery must also be checked against the hosted service.
