# Production deployment

## Existing Vercel site

The updated garden frontend and API are live at `https://ur-bro-jz.vercel.app` in project `ur-bro-jz`, backed by the existing Supabase project's private PostgreSQL schema. The 31 October 2026 rollout deployed the local working tree while preserving its uncommitted and untracked work. See the [rollout record](rollout-2026-10-31.md) for the deployment, SQLite backup, checks, and live persistence verification.

The database schema, SQLite import, and production server variables are configured. Use the [Supabase + Vercel setup](supabase-vercel.md) for maintenance and future rollouts. Shared visitor saves work live. Public sign-in email still needs custom SMTP and an external-address delivery test.

## Optional persistent Node backend

The garden needs a long-running Node server and one persistent SQLite database. Run one replica; do not deploy this database to ephemeral serverless storage. The Docker setup serves the API and built site together, with Caddy providing HTTPS.

## Launch

1. Point a domain's DNS at your Docker host and allow ports 80/443.
2. In this directory, create `.env` containing `GARDEN_DOMAIN=your.actual.domain` (no scheme or trailing slash).
3. Run `docker compose build`, then `docker compose up -d`. Check `docker compose ps` and `https://your.actual.domain/healthz`.

The named `garden-data` volume survives container replacement. Never use `docker compose down -v` on the production instance. Caddy needs public access to issue its TLS certificate.

To migrate existing visitors, stop the old server and copy its `.garden-data/plantings.sqlite` into the volume at `/data/plantings.sqlite` before launching the new server. Include all data using a consistent SQLite backup, rather than copying an active database file. Keep the old database as a rollback copy. If the new domain differs, browser-local guest saves and keeper cookies cannot transfer automatically.

## Backups and restore

From the application directory:

```sh
GARDEN_DATABASE=/persistent/path/plantings.sqlite node scripts/backup-garden.mjs /backups/garden-2026-10-31.sqlite
```

In Docker:

```sh
docker compose exec garden node --input-type=module -e "import {DatabaseSync,backup} from 'node:sqlite'; const db=new DatabaseSync('/data/plantings.sqlite',{readOnly:true}); try {await backup(db,'/data/backup.sqlite')} finally {db.close()}"
docker compose cp garden:/data/backup.sqlite ./backup.sqlite
```

Schedule backups daily on the host and copy them off the host. For restore, stop the garden, preserve the current database plus WAL/SHM sidecars elsewhere, replace it with the backup (owned by container user `node`, UID 1000), then restart. Test a restore into a separate volume before launch. The API and account tables share this database.

## Public sign-in email — external configuration required

The app uses the existing About Me Supabase project. Public email delivery is **not enabled by these files**. Supabase's default mailer only sends to project team members.

1. Choose an SMTP provider and verify your sending domain with its required DNS records.
2. In Supabase → Authentication → Email → SMTP settings, enable custom SMTP and enter the provider's host, port, credentials and verified sender. Keep credentials in Supabase, never frontend environment variables.
3. Set Supabase Auth Site URL to the canonical HTTPS origin. Retain email confirmation and install `supabase/templates/garden-sign-in.html` and `garden-confirm-sign-up.html` as the corresponding email templates; both must display the OTP token.
4. Review the provider's email limits and Supabase Auth rate limits for expected traffic.
5. From a fresh browser, sign in with an address outside the project team, enter the emailed code, and confirm the collection survives sign-out/sign-in on another device. Also check invalid and expired codes. This is the launch acceptance check; fake-provider automated tests cannot prove mail delivery.

Official setup: https://supabase.com/docs/guides/auth/auth-smtp

`GARDEN_PUBLIC_URL` controls same-origin writes and secure cookies; Compose sets it from your domain. Server overrides `GARDEN_SUPABASE_URL` and `GARDEN_PUBLISHABLE_KEY` are only needed when moving to another Supabase project. No service-role key is needed. Private archive build settings remain in `.env.example`; the Docker build sets the existing project URL by default (override with its `VITE_SUPABASE_URL` build argument).

## CI and static previews

`checks.yml` runs types, logic tests, client/server builds, and desktop/mobile browser tests. The old GitHub Pages deployment is now manual and explicitly labelled a static preview; it cannot host accounts or shared contributions. Docker support remains an optional persistent SQLite hosting path; current production uses Supabase and Vercel.
