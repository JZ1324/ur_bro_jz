# Garden implementation verification

Baseline verified on 20 September 2026 against the user's selected 3D garden folder. The earlier flat editorial homepage was replaced by the actual garden assets and reversible scroll journey.

## Baseline checks (20 September)

- `npm run lint`: TypeScript passes.
- `npm test`: 66 tests pass. This includes all seven real voxel transitions, unchanged transforms while stationary, exact reverse positions and colours, reduced-motion object states, uneven reading intervals, reachable final anchors, deep-link aliases, and malformed asset handling.
- `npm run build`: production build passes. Three.js and the model loader are loaded in a separate chunk; the existing private overlays and project archive are also loaded on demand. Vite reports its advisory for the 656 KB uncompressed Three.js chunk (about 169 KB gzipped).
- `git diff --check`: passes.

## Baseline browser verification (20 September)

Used the Codex in-app browser through its CUA browser controls and DOM inspection. Browser screenshots were captured with the browser's screenshot API, not generated or recreated. Checked the reference's native 1536 × 1024 composition, the normal 1280 × 720 desktop viewport, 390 × 844 mobile, and the compact 320 × 568 phone viewport. No horizontal overflow at the tested sizes.

- All eight objects render: garden, cherry tree, laptop, books, headphones, flag, camera, mailbox. Long project copy stays readable while the laptop holds its shape.
- Native scroll reversal was checked at the garden/tree transition: at scrollY 1177.5, progress was 0.117304 and morph 0.4452; scrolling up changed the morph to 0.0550, and returning to the same position restored 0.4452 exactly. The unit checks verify the actual matrices and colours, too.
- Header, garden pins, chapter menu, and footer navigation connect to the correct chapters. Direct contact loading restores the mailbox; resize preserves the reading position.
- Project archive opens from the laptop chapter. All 19 records appear. Searching Decibal and selecting macOS returns one result. Empty search, clearing filters, and nested project details were checked during the archive implementation. Escape closes the modal and restores the triggering button. Native search-input Escape first clears its value.
- Music played from the existing endpoint, reported a 169-second duration, advanced its playback position, paused correctly, and accepted keyboard seeking without opening the expanded player.
- All five photographs are available. Next/previous buttons and arrow keys navigate the viewer; Escape closes it and restores focus to the photo button. The mobile viewer keeps the full photograph visible.
- Day/Dusk changes the scene and page palette. One planted flower appeared by the mailbox and remained after reload; the saved dusk preference also restored.
- Faith overlay opens with the garden inert, traps Tab/Shift+Tab, and closes with Escape. A pre-existing duplicate `jesus` heading ID caused a React key warning in its table of contents; the introduction now has a unique ID, verified in the rendered DOM.
- The archive map opens and closes. School opens the existing private gate; Continue reaches the key form; Escape dismisses it. No access key was entered, so successful private-data retrieval was not verified.

## Baseline visual fidelity ledger (20 September)

Accepted reference: `design/garden-reference.png`, copied from the user's original garden folder. The reference and the final native-size browser screenshot were opened using `view_image` in the same comparison pass. The original `../design/garden-mobile.png` and final 390 × 844 browser screenshot were also compared with `view_image`. Temporary screenshots used for QA are removed after review. `public/preview-garden.png` is a separate, retained social-preview asset captured from the finished site.

| Comparison | Reference evidence | Render evidence / resolution |
| --- | --- | --- |
| Overall composition | Narrow left reading column; floating island fills the right side; open paper background | Same 5% gutter, original scene position, camera, and responsive layout. No photo collage remains. |
| Typography | Cormorant display heading with sage italic “grow.”, small sans-serif controls | Local Cormorant Garamond and DM Sans; same heading scale, line treatment, and emphasis. |
| Palette and lighting | Warm off-white paper, muted greens, pink blossoms, soft shadows | Original chapter palettes and day/dusk lighting reused; scoped CSS prevents archive theme styles overriding the scene controls. |
| 3D assets | Cherry canopy, bridge, pond, workbench, flowers, and block terrain | The exact original GLB and voxel layouts are bundled locally. No illustrative replacement or flat screenshot is used for the scene. |
| Spacing and controls | Floating landmark pins; quiet header and bottom controls | Pin positions retained. Header adds all eight chapters and the archive; a growing vine now indicates scroll progress. |
| Chapter states | Original source defines the tree, laptop, books, headphones, flag, camera, and mailbox | All seven later objects checked in the browser. Text remains alongside the object on desktop and below it on mobile; longer content extends its reading interval. |
| Mobile | Original garden’s stacked scene and reading column | 390 × 844 and 320 × 568 checked. Menu collapses, controls remain visible, and compact phones simplify pins so copy still fits. |
| Scroll behaviour | Original reversible block transformations | Same deterministic transitions reused. An inherited global smooth-scroll rule was removed so deep-link restoration is immediate; deliberate chapter navigation remains smooth. |

Above-the-fold copy comparison: “the garden.”, “A little space to grow.”, “Take a wander”, and Day/Dusk match. Intentional copy changes are the JZ byline and factual personal introduction, “Little moments” pin label, eight named chapter links plus “The archive”, and the scrolling caption/progress indicator. Compared with the older mobile reference screenshot, the current scroll journey intentionally moves the model above the left-aligned copy so the object remains visible while reading each chapter; this follows the existing garden folder’s current responsive implementation. These support the user's request to connect the original site to the existing 3D garden.

The implementation was faithfully verified against the selected garden design, with the intentional content and functional improvements above. No material visual mismatch remains in the inspected garden views. Private archive authentication still requires the site's existing Supabase configuration and a valid key; the backend and live deployment were not changed.


## Model and midnight-theme refinement (23 September 2026)

The later approved refinement replaces the Projects laptop with a complete ivory-and-sage chess set, adds solid pixel photo frames, and replaces Day/Dusk with Light/Dark. This supersedes the baseline model and palette descriptions above.

- Asset validation checks all 64 board cells, the 32 starting pieces, six distinct silhouettes, square containment and facing, finite transforms, and eight layouts of 3,877 instances. Export reproduction is byte-for-byte deterministic. The original garden GLB and first two tree layouts retain their baseline hashes.
- The main suite passes 70 tests, including board visibility at desktop and phone aspect ratios, camera holds/blends/reversal, and both chapter palette timelines meeting 4.5:1 text contrast. The two nested verse-preview tests also pass. TypeScript and the production build pass; the existing large-chunk advisory remains.
- Desktop and phone checks cover the chessboard, gallery and enlarged frames, photo flips, arrow navigation, Escape/focus restoration, and the dark archive, map, private gate, music player, puzzle, verse popover, and faith dialog. Saved Dark restores after reload. Changing themes during playback retains the chapter, scroll position, and advancing audio.
- Public content, links, music, and private gates remain intact. No private key was entered. The original prototype and deployed site were not changed; the deliverable is the local clone preview.

## Garden account sign-in (12 October 2026)

- Account authentication uses the active `uajpewjagduzdpwlynrv` About Me project. Both its sign-in and signup confirmation templates now display an email code for verification inside the garden. Email verification is enabled.
- All 156 tests pass. Account API tests cover browser-bound email challenges, wrong-code retry limits, replay rejection, cross-account ownership, cross-device collections, persistent sessions, one-time guest imports, authoritative catches, private keepsakes, logout and planting cooldowns. TypeScript and the production build pass. The existing large-bundle advisory remains.
- The live About Me authentication service rejects an invalid email code with 401. Successful email delivery and live sign-in have not yet been exercised with a real recipient. The project currently has no custom SMTP provider; Supabase's built-in service delivers only to organization team members.
- Browser checks verify the header, reef and ocean collection all open the same native sign-in dialog. Escape restores the triggering control, including when the collection is underneath. The form is readable in the normal compact browser panel and at 390 × 844; its dialog has no horizontal or vertical overflow. No email or password was submitted during QA.
- The existing five guest fish and one private planting remain after reload and dialog interactions. Guests retain nickname entry and device collection storage. Account ownership uses a verified Supabase UID scoped to its project; provider tokens are kept off the browser.
- Account collections are stored in the garden server's SQLite database, authenticated through Supabase. Hosted use requires a persistent Node server and shared database, as documented in the README.
- The user selected Supabase's built-in email service for now. The About Me SMTP settings show custom SMTP disabled. No domain or external email provider was configured. This testing setup is limited to Supabase organization team email addresses and the provider's current sending limits.
