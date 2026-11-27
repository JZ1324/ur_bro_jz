# The garden · ur_bro_jz

JZ’s personal site, built with React, TypeScript, Vite, and Three.js. The original 3D block garden becomes a cherry tree, chess set, books, headphones, camera, and mailbox as you scroll. The public site connects to the existing project files, music player, faith content, and private archive.

## Run locally

```bash
npm ci
npm run dev
```

Use Node 22.13 or newer. Open http://127.0.0.1:5179/. This is the merged application, including the framed photo gallery, chess, archive, koi pond, planting studio, shared visitor garden, and hidden game. It contains its own models and photographs.

The parent folder's `npm run dev`, `build`, `preview`, `lint`, `test`, and `start` commands delegate to this checkout. Launching from the parent retains its existing `.garden-data/plantings.sqlite` database. Launching here directly uses this checkout's `.garden-data/plantings.sqlite`; set `GARDEN_DATABASE` to an absolute path to share a database across launch locations. Do not commit that directory.

## Content and structure

- `src/components/GardenHome.tsx` connects the eight garden chapters to projects, photo dialogs, music, and archive actions.
- `src/content/profile.ts` contains the public chapter headings, introductions, faith note, contact links, and five photographs.
- `src/data/site.ts` holds all 19 project records and the existing archive/music data. Set `featured: true` on the three current builds. Featured previews are local images in `public/projects/previews/`; their `link` fields open the actual product sites.
- `src/components/EditorialProjects.tsx` provides project search, filters, and detail dialogs.
- `src/garden/` contains the Three.js renderer, deterministic voxel transitions, chapter palettes, and safe local persistence. The renderer loads separately from the initial page.
- `src/ocean/` contains the fish catalogue, rarity odds, rotating stock, saved collection, and lazy 3D reef below the visitor garden. `OceanGarden.tsx` and `ocean.css` provide its case reel, free shop, and species guide.
- `src/hooks/useJourney.ts` measures reading space and maps native scroll position onto the seven models. Scrolling backwards reverses the same transition. Deep links, history, mobile resizing, and reduced motion are supported.
- `public/models/` contains the original garden GLB and the seven layouts of 3,877 shared voxel instances.
- `src/styles/garden.css` imports the garden's component styles from `src/styles/garden/`; `src/editorial.css` styles the archive and photo dialogs. Existing archive utilities remain in `src/index.css`.

Light / Dark uses the existing saved theme preference. The island and mailbox show the latest 24 personal plantings. The shared garden below Contact has no overall planting limit. Existing flower counts migrate to daisies; older private notes stay private until explicitly shared.

## Pond and visitor garden

Six original voxel koi swim inside the existing pond, inspired by [Nagomi](https://github.com/msk1039/nagomi). Tap open water or use the keyboard-accessible fish button to call them over. Scrolling and dragging do not feed them. Reduced motion holds the fish still, and hidden scenes and dialogs pause rendering. No Nagomi source or assets are bundled.

The entrance and About tree have three saved atmospheres: **Blossom breeze**, **Soft rain**, and **Firefly night**. **Explore** in the footer groups atmosphere, Light / Dark, wishes, and background sound. Choosing an atmosphere pairs it with daylight or the existing dark theme; Light / Dark can still be changed separately. **Make a wish** closes Explore and sends a brief spiral of light up from the garden. All effects use the existing render loop, fade out before the chess chapter, pause with the scene, and become still compositions with reduced motion. Compact screens use fewer particles. The controls remain available by keyboard; Escape closes Explore and restores focus.

Contact and `#shared-garden` open a planting studio with 48 ready-made varieties: 16 flowers, 16 plants, and 16 fruit choices, plus **Design your own flower** at the start of Flowers. The designer offers round, star, and cup petals, 4–12 petals, bloom size, stem height, leaf pairs, and a centre colour. The shape updates in the live 3D preview and stays with the planting through sharing, reloads, and edits. Petal and leaf colours use the existing palettes or custom colours. Category counts and name search help visitors browse the selection. Each variety has its own voxel shape in the rotatable preview and shared garden, with public names and notes. Visitors can edit or remove their own shared plantings. The API validates the bounded flower recipe along with owner cookies, same-origin writes, cooldowns, and text moderation; local keepsakes and drafts retain the existing storage keys. Geometry tests check that every flower part connects back to a grounded stem or base, including custom designs at the control limits. The mushroom in the opening garden opens the separate Rapier-powered game, with saved progress and touch controls.

The shared API runs in both `npm run dev` and `npm run preview`. For production, `npm run build` followed by `npm start` serves the site and API together on port 4179 (`HOST`, `PORT`, and `GARDEN_DATABASE` are configurable). Production hosting needs Node, persistent SQLite storage, and a single shared database. Static-only hosting such as GitHub Pages cannot store visitor contributions; the UI reports API unavailability without discarding drafts. Existing Supabase archive and licensed-audio configuration is unchanged.

## Ocean and lucky catches

Below the shared garden, `#ocean` shows a swimming voxel reef with 36 collectible species, a taller scene, and closer framing. Tap a fish or activate **Meet a fish** by keyboard to see its name and a brief bubble reaction. Small fish have padded targets on phones; drags do not greet fish. A friend pauses briefly for its hello and then continues swimming. Reduced motion shows still bubbles. **My fish** opens the collection directly. The small chest opens a dialog with Cases, Live shop, and Collection tabs; browsing the shop or full guide does not increase the page height. The chest keeps a steady size while switching tabs, with larger illustrated case choices, readable fish cards, and a two-column collection on phones. Collection and field guide views include name search and filters for all seven rarities. The tabs support arrow keys, Home, and End. Closing a spinning case keeps its already-saved catch. Preview in reef closes the chest and returns focus to the reef; unboxing previews and rarity cutscenes open above the chest. Coral, Kelp, and Abyss cases all offer seven rarities: Common 47.9%, Uncommon 28%, Rare 15%, Epic 6.5%, Legendary 2%, Mythic 0.5%, and Ultra 0.1%. Each opening selects a rarity, then a species uniformly from that case's rarity pool. Cases are free and independent; the reel lands on the already-selected result. Reduced motion reveals the catch immediately. Rewards save before the animation, so leaving or reloading cannot lose them.

The live shop offers four different free visitors every 90 seconds, using rarity-weighted selection without replacement. Each rarity's total weight is split between its species, so the expanded catalog does not increase a rare tier's initial shop weight. Stock is deterministic for the current tide and each offer can be claimed once per tide on a device. Collections and duplicate quantities persist in `garden:ocean:v1` browser storage, independently of the shared planting database. All original species IDs remain valid. Collected species join the reef; the renderer sleeps offscreen and in background tabs. The HTML shop and field guide remain usable if WebGL is unavailable.

New creatures include Epic Megalodon and Orca, Legendary Astral whale, Mythic Kraken and Leviathans, and three Ultra creatures: Prism titan, Nebula kraken, and Leviathan Prime. Ultra creatures keep their own body colours, with a separate soft rainbow aura in illustrations and the 3D reef, plus rainbow card borders. Legendary and Mythic cards have gold and pink rims. The full guide sorts by rarity, offers filters, and shows each species' individual case chance. Preview in reef temporarily displays a creature without awarding it or changing the saved collection.

After the case reel stops, reveal animations scale with rarity: a quick splash, rising bubbles, blue ripples, an Epic burst, Legendary gold rays, and a Mythic vortex. Ultra has a fullscreen cutscene with an ocean descent, awakening chest, rainbow breach, creature entrance, and final discovery. Skip animation goes straight to the result; Escape, Close, or Back to chest returns to the chest with the saved catch. Native dialogs contain keyboard focus and restore it on exit. Playback pauses in hidden tabs, and reduced motion shows the final discovery immediately. The fish guide's Preview unboxing and Replay controls let visitors watch any reveal without awarding fish or altering their collection.

## Things to explore

- **Explore:** the compass in the footer opens simple chapter navigation and optional background sound. There is no visit tracking or sharing panel.
- **Garden soundscapes:** choose Rain or Stream in Explore, then adjust the volume. Off stops it. Sound always starts with a click, never automatically after a reload.
- **Photo wander:** start a five-postcard slideshow from Memories, or play it from the enlarged viewer. Each photo holds for five seconds. Flipping, manual navigation, or switching tabs pauses the slideshow. Save photo downloads the current original image.

These features use the existing browser storage helper and native dialogs. The soundscapes use Web Audio without additional files or services. Their styles live in the `field-guide.css`, `controls.css`, and `memories.css` modules under `src/styles/garden/`.

## Private archive

The existing access-key flow and Supabase functions are retained. The header Archive button is the single public entry; private Leadership notes remain inside it. Old `#leadership` links resolve to About. Use this project’s `.env.example` and existing Supabase configuration for private archive access; no access key or private content is bundled into the public garden. Public 3D chapters, projects, photographs, and faith content work without unlocking. Licensed music uses the existing protected audio endpoint.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

The tests include all six voxel transitions, exact reversal, stationary transforms, reduced motion, uneven chapter anchors, deep-link aliases, and malformed model data. See `design/verification.md` for browser checks and the final visual comparison.

For a GitHub Pages build, run `GITHUB_PAGES=true npm run build`; model URLs respect Vite’s configured base path.

## Model authoring and themes

`npm run export:journey` validates and exports all seven deterministic voxel layouts (3,877 instances each). `npm run validate:journey` checks the 64-square board, 32 starting pieces, six distinct silhouettes, geometry bounds and unchanged original trees. Authoring sources are in `blender/`; the original prototype remains untouched.

`src/garden/palette.ts` repaints the authored garden once at load time with sage foliage, cedar, limestone, dusty rose blossoms and teal water. The same linear colour mapping applies to the GLB and the first two morph layouts, keeping the tree consistent through the opening transition without changing the source assets. `createGarden.ts` supplies neutral daylight, soft fill and cooler moonlight with restrained amber lanterns. Visitor-selected planting colours retain their original values.

Projects uses a higher scroll-blended camera for the chessboard. Photos share a CSS 3D pixel frame, with click/keyboard flipping, arrow navigation in the enlarged viewer, and reduced-motion support. Light / Dark preserves the saved `theme` preference; the midnight garden theme extends to all public dialogs and controls.

The chess controls appear after clicking the board or focusing a square with the keyboard. Play while Projects is in view: drag with a mouse, or select a piece and a highlighted legal destination. Ivory and Sage alternate turns, with promotion, castling, check, and game-over handling powered by chess.js. Undo move and Reset board restore the position. Tab into the board, use arrow keys to choose a square, Enter/Space to select or move, and Escape to cancel. Touch swipes still scroll the page. Positions remain while navigating chapters or changing themes, and reset on reload. There is no computer opponent.

### Garden accounts

The header offers **Sign in**, and the ocean offers **Sync across devices**, through the existing **JZ’s about me** Supabase project (`uajpewjagduzdpwlynrv`). The ocean explains that guest catches are **Saved on this device**, or **Kept for this visit** when a save fails. Visitors enter their email and a one-time code in the garden. New accounts can choose a public name; email addresses remain private. Guests keep using a nickname and device storage. On sign-in, the server claims only plantings owned by that browser’s keeper cookie and imports its device fish collection once. Legacy private flowers remain private keepsakes until deliberately shared.

The server verifies the code with Supabase before creating an HttpOnly garden session. Provider tokens are never returned to the garden client. Verified account IDs are scoped to the Supabase project, and retries cannot duplicate imported fish or catches. Cloud ownership, collections and sessions are persisted in the garden’s existing SQLite database, so use its Node server or Vite API rather than static-only hosting. Keep that database on a persistent volume and back it up.

The default server configuration uses the active About Me project and its public publishable key. `GARDEN_SUPABASE_URL` and `GARDEN_PUBLISHABLE_KEY` override those values when intentionally moving to another project. `GARDEN_PUBLIC_URL` sets the canonical HTTPS origin for a hosted garden. No service-role key is required by the garden.

Supabase Auth’s **Magic link or OTP** template uses `supabase/templates/garden-sign-in.html`; **Confirm sign up** uses `supabase/templates/garden-confirm-sign-up.html`. Both display `{{ .Token }}` for the garden's code verification form. Email confirmation remains enabled. For public sign-ups, configure custom SMTP in that project; Supabase’s built-in SMTP only delivers to project team members. Email-code requests are rate limited, browser-bound and expire after ten minutes, with at most eight verification attempts.

The current setup intentionally uses Supabase's built-in email service for testing with project team members. No Resend account, API key or domain is required by the garden. Public visitor email delivery can be enabled later by configuring custom SMTP in the About Me project.

## Project maintenance

The original prototype has moved to `../archive/prototype/`. Root launch commands continue to use this application and the existing root database.

`src/styles/garden.css` is the garden's stylesheet entry point. Its imports group styles by their owning surface: foundations, header, scene, chapters and chapter details, chess, footer controls, Explore, atmosphere controls, and deferred feature feedback. Edit the relevant module in `src/styles/garden/`; each module keeps its base, interaction, and responsive rules together. Shared colours, sizing tokens, resets, and accessibility defaults belong in `base.css`. Update existing rules instead of adding another override stylesheet.

Community, planting, and game layout and dark-mode styles live beside those components in `src/components/community.css`, `planting.css`, and `game.css`. Optional dialog styles retain their existing on-demand loading.

Optional game and planting interfaces load when opened; the ocean interface loads near the viewport, including direct `#ocean` links. Failed feature downloads show a recovery action.

See [browser smoke tests](e2e/README.md) for `npm run test:e2e` and [production deployment](deploy/README.md) for persistent Docker hosting, HTTPS, backups, and the remaining SMTP setup. GitHub Pages is available only as a manually triggered static preview.

## Supabase hosted garden

Vercel now has a Node `/api/garden/*` route backed by the existing Supabase project's PostgreSQL database. See [hosted garden setup](deploy/supabase-vercel.md). The server selects PostgreSQL when `GARDEN_DATABASE_URL` is set; ordinary local development retains SQLite and the existing visitor database. Hosted tables remain private, with no browser database credentials. `npm run db:setup` applies the schema; `npm run db:import` previews a read-only SQLite import and `-- --apply` commits it transactionally.
