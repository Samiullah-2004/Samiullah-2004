# Profile assets

Every animated card on the profile (hero, section headings, stack panels, project cards, contact card and buttons) is an SVG in `assets/svg`, generated from `content.mjs`.

```bash
node scripts/build.mjs
```

Node 18+ and no dependencies. The first run downloads the Anton font from Google Fonts into `scripts/.cache` (git-ignored) and embeds a subset of it in each SVG.

## Common edits

- **Add a skill:** add `{ name, icon }` to its category in `content.mjs`. Icons can point at `Icons/Animated`, `Icons/Logos`, or a Lucide line icon (`lucide:<name>`, see `lucide.json`).
- **Add a project card:** drop a 16:9 WebP screenshot into `assets/screens/<slug>.webp`, add the project to `projects` in `content.mjs`, and add a cell for it in the README.
- **Change the intro, stats or headings:** edit `site`, `headings` or `contact` in `content.mjs`.

## Icon sources

- `Icons/Animated`: the original animated icon set (Devicon, SVG Logos, theSVG).
- `Icons/Logos`: brand logos from the portfolio and from [Iconify](https://iconify.design) (SVG Logos, Simple Icons, Material Design Icons).
- `lucide.json`: icon paths from [Lucide](https://lucide.dev), ISC License.
