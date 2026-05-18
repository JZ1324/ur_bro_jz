# ur_bro_jz

A static personal archive site for `@ur_bro_jz`, built with Vite, React, TypeScript, Tailwind CSS, and Motion.

The site includes:

- Instagram-style profile card using a local profile image asset.
- Story-highlight navigation for Projects, About, School, Music, and Leadership.
- About overlay with a dynamic island table of contents.
- Project grid and project detail overlays.
- Secure private archive flow designed for Supabase private Storage and signed URLs.
- Polished archive tool modals for secondary controls.

## Run Locally

Prerequisite: Node.js.

```bash
npm install
npm run dev
```

The dev server starts on `http://localhost:3000` when available, or the next open Vite port such as `http://localhost:3001`.

Do not open `index.html` directly with a `file://` URL. Vite apps need the dev server, a production preview, or a deployed build so module imports and public assets resolve correctly.

Live production URL:

```text
https://ur-bro-jz.vercel.app
```

Preview a production build locally:

```bash
npm run build
npm run preview
```

## Checks

```bash
npm run lint
npm run build
```

## Privacy Note

Private photos must not be stored in `src/`, `public/`, `src/data/site.ts`, or committed to GitHub. The frontend now fails closed and only loads private archive content through a Supabase Edge Function after a server-side access-key check.

See [supabase/README.md](supabase/README.md) for the required private bucket, manifest, secret, and function deployment setup.
