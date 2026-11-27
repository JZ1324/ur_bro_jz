# The garden · accepted direction

The user explicitly selected the 3D block garden from the neighbouring workspace as the visual and interaction reference. `garden-reference.png` preserves that existing desktop implementation. The earlier flat photo-led concepts were superseded and removed.

## Composition

An open, quiet reading column sits beside a large orthographic voxel scene. Eight chapters use the same sticky scene: garden → cherry tree → chess set → books → headphones → flag → camera → mailbox. The original garden GLB and cherry tree geometry are preserved. The remaining objects use refined deterministic layouts with the same 3,877-instance pool.

Desktop copy uses a 5% left gutter and approximately 28% width. The scene occupies the right 73%. Mobile places the scene above the text, with an eight-chapter menu, fixed journey progress, and compact Light/Dark controls. Long chapters extend their reading interval before the object transforms.

## Type and colour

Cormorant Garamond 500 gives the large headings their character; italics use the chapter accent. DM Sans 400–600 handles introductions, body copy, navigation, project descriptions, and controls. Fonts are local. Paper and scene lighting move through sage, rose, mint, sand, lavender, olive, blue, and terracotta tones. Dark mode uses a midnight forest background (#0d1714), green surfaces (#17251e), cream text, subtle chapter washes, moonlight, a rim light, and warm lanterns. Thin dividers and generous spacing replace boxed content.

## Interactions

Native page scrolling drives the voxel positions directly. Each object holds for the first two thirds of a chapter, then morphs in the remaining third; the same scroll position always produces the same shape and colour. The Projects camera rises to a three-quarter view of all 32 chess pieces, blending on the same reversible timeline. Reduced motion shows complete objects. Rendering pauses in hidden tabs. A loading state and retry fallback keep all text and links available when WebGL cannot load.

Garden pins, the header, and the growing footer vine connect the chapters. Project details and the searchable 19-project collection use native modal dialogs. All five photographs and the keyboard-navigable viewer use solid CSS pixel frames with raised rims and stepped corners. The whole frame flips to reveal each handwritten note. Fine pointers get a restrained tilt; reduced motion removes tilt and animated flipping. Music supports actual playback, pause, seeking, and the original expanded player. Private chapters retain the existing key gate. Visitors can leave up to 24 locally saved flowers beside the mailbox.

## Intended changes from the reference

The archive is available from the header; project links now open useful details and search; photographs open full size; music plays in the chapter; private-section buttons use the current site’s access flow. The refined models, framed photographs, and midnight theme extend the garden design the user selected. Authoring lives in this repository; the original prototype remains the reference.

## Selected UI polish · 13 October 2026

`ui-polish-reference.png` is the user-selected editorial mockup. The opening keeps the original live 3D island beside a reading column with a three-line serif headline, sans-serif introduction, and one primary action. Desktop exposes About, Projects, and Memories directly; the Chapters dropdown reaches all seven chapters. Archive and account access sit alongside it. Compact phones keep archive access inside the dropdown.

One fixed bottom row groups the chapter count, linked progress marks, field guide, garden atmosphere, wish action, and theme switch. The progress count follows the real zero-based chapter range, 00–06. Atmosphere and wish controls are enabled only when the scene is ready and available; later chapters offer the next destination. Phones use two rows for these controls. Small phones and short landscape views preserve space for the primary action. Secondary scene labels appear on hover or keyboard focus.

`src/styles/garden.css` owns the garden styles and refinements in their original cascade order. The live scene, models, chapter content, account flow, and garden data remain the existing application. See the project-root `design-qa.md` for visual comparisons and interaction verification.
