# ur_bro_jz

A React and Vite personal archive with a pixel-garden scroll journey, public project files, music, and Supabase-backed private sections.

## Run locally

```bash
npm install
npm run dev
```

## Update projects

Project content lives in `src/data/site.ts` inside the exported `projects` array. Each entry owns its card copy, detailed project notes, tags, stack, preview image, and public link.

- Set `featured: true` to place a project on the current-work shelf. Keep that shelf to three projects so the lead-and-side layout stays intentional.
- Use the deployed product page for `link`; the project archive generates a current preview from that URL.
- Keep the newest or most representative work near the top of the array. Earlier builds remain searchable in the archive below the featured shelf.
- Update `nowItems` and the project paragraphs in `aboutSections` when the current focus changes.

## Quality checks

```bash
npm run lint
npx tsx --test src/**/*.test.ts src/**/*.test.tsx
npm run build
```
