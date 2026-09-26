# AGENTS.md

Shared guidance for all AI agents working in this repository.

## Commands

```bash
npm install           # install dependencies
npm run sync:blogs    # merge local markdown posts with selected Medium posts
npm run dev           # sync blogs, then start dev server (localhost:5173)
npm run build         # sync blogs, vite build, then prerender per-route <head> meta into dist/
npm run preview       # serve the built dist/
```

There is no test suite.

## Architecture

This is a single-page React app with no backend. Nearly all component and routing code lives in **`src/App.jsx`**.

### Data flow

```
src/data/profile.js                 ← primary editable content (profile, talks, projects, socials)
src/seo.js                          ← per-route title/description/canonical; shared by App.jsx and the prerender script
src/markdown.js                     ← marked + highlight.js setup; dynamically imported, not eager
src/motion-features.js              ← Motion's domMax features, lazy-loaded by <LazyMotion>
src/content/blogs/authored/*.md     ← human-written source posts with frontmatter
src/content/blogs/reviewed/*.md     ← optional AI-reviewed variants with matching filenames
scripts/sync-blogs.mjs              ← runs at build/dev time; fetches Medium RSS and builds blog index
  → src/content/blogs/*.html        ← generated Medium post HTML
  → src/content/blogs/*.md          ← generated bodies of *published* local posts (frontmatter stripped)
  → src/generated/blog-posts.json   ← post index consumed by the app at runtime
  → public/sitemap.xml              ← generated sitemap
src/App.jsx                         ← imports blog-posts.json and lazily loads content files
scripts/prerender-meta.mjs          ← post-build: writes dist/<route>.html with that route's <head> meta
```

Only the top level of `src/content/blogs/` is globbed by the app, so drafts (`published: false`) in `authored/` and `reviewed/` never ship.

### Metadata and hosting

`index.html` has a `<!-- page-meta:start/end -->` block (title, description, canonical, Open Graph, Twitter). `scripts/prerender-meta.mjs` rewrites it per route from `src/seo.js`, writing `dist/blogs.html`, `dist/blog/<slug>.html`, etc., so link previews and non-JS crawlers see the right tags. On the client, `usePageMeta()` in `App.jsx` updates the same tags on navigation; every page component must call it. Add new static routes to `pageMeta` in `src/seo.js`.

The site deploys to Cloudflare Workers static assets (`wrangler.toml`). `not_found_handling = "single-page-application"` serves `index.html` for unknown paths so client routes don't 404.

Keep the initial bundle lean: `src/markdown.js` and `posthog-js` are both dynamically imported (`loadMarkdownModule()`, `loadPosthog()`) because most visitors never open a post. Don't hoist either back to module scope.

### Routing

React Router v7 with six routes all defined in `App.jsx`:

| Path | Component |
|---|---|
| `/` | `HomePage` |
| `/blogs` | `BlogsListPage` |
| `/talks` | `TalksListPage` |
| `/resume` | `ResumePage` |
| `/blog/:slug` | `BlogPostPage` |
| `*` | `NotFoundPage` |

### Blog content types

`BlogPostPage` supports two content types set in `blog-posts.json`:

- `contentType: "html"` — raw HTML sourced from Medium RSS, stored as `.html` in `src/content/blogs/`
- `contentType: "markdown"` — local markdown authored under `src/content/blogs/authored/` (or `reviewed/`), copied by `sync-blogs` to `src/content/blogs/<slug>.md` when published, rendered with `marked` + `highlight.js`. Code token colours are the `.hljs-*` rules in `index.css` (`--code-*` variables), not a highlight.js theme stylesheet.

Content files are loaded lazily via `import.meta.glob` (never bundled eagerly).

### Theming

Light/dark theme is toggled by setting `data-theme` on `<html>`. All colours are CSS custom properties defined in `src/index.css`; both themes share a warm undertone, and links/focus reuse `--accent-lilac` rather than separate purples.

- An inline script in `index.html` applies the saved or system theme before first paint (no flash). It duplicates the `mani-theme` storage key and the `theme-color` values from `themeColors` in `App.jsx` — keep them in sync.
- The theme is only written to `localStorage` when the visitor toggles it; until then the site follows the OS setting live.
- The toggle uses the View Transitions API for a circular reveal and falls back to an instant switch (or when reduced motion is requested).
- Social icons are neutral at rest and show their brand colour (`socialPalette` in `App.jsx`) on hover only.

### Animation

Motion is loaded through `<LazyMotion features={…} strict>`, so components must use `m.div`, `m.span`, etc. — `motion.*` throws in strict mode. Decorative infinite loops (the hero orbs, skeleton shimmer) are CSS keyframes, not Motion, so they run on the compositor and are stopped by the reduced-motion rule in `index.css`. Only add hover motion to elements that are actually interactive.

### Styling

Tailwind CSS v4 for layout/spacing, wired through the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`. `src/index.css` starts with `@import "tailwindcss"` rather than v3's `@tailwind base/components/utilities` directives.

Component-level styles (`.surface-card`, `.tag-*`, `.social-link`, `.blog-content`, etc.) are defined in `@layer components` in `src/index.css`. Avoid adding Tailwind utility sprawl for styles that belong in those shared classes.

Two v4 specifics in `index.css` worth knowing before editing it:

- `@source inline("tag-{sage,lilac,rose}")` safelists the tag classes so Tailwind's scanner keeps generating them. Extend it if you add new colour-variant classes.
- Colours are CSS custom properties, so v4 utilities like `text-lilac-500` are not available by design — use `text-[var(--accent-lilac)]` and the shared classes instead.

### Editing conventions

- The entire UI is intentionally kept in `src/App.jsx`. Keep new UI additions there unless the user explicitly asks to extract components.
- `src/generated/blog-posts.json` and top-level `src/content/blogs/*.html` are build-time outputs. Do not edit them by hand; re-run `npm run sync:blogs` instead.
- No linter or formatter is configured. Match the existing style: 2-space indent, double quotes, and no semicolons in JSX expressions.

## Editing content

All user-facing copy that isn't a blog post lives in `src/data/profile.js`:

- `profile` — name, role, location, email, `shortBio`, and all external links
- `socials` — ordered list of social icon links shown in the header/footer
- `highlights` — bullet points in the "Current Focus" sidebar
- `talks` — conference talk entries
- `openSourceGroups` — open-source orgs, each with a one-line `description` and a `projects` array; collapsed on the resume page behind a single "Show all N repos" toggle
- `podcasts` — podcast appearances
- `resumeExperience` — reverse-chronological roles (`title`, `company`, `companyUrl?`, `period`, `notes[]`)
- `resumeSkillGroups` — `{ label, skills[] }` rows on the Skills section
- `resumeEducation` — **currently unrendered**; the resume page shows no education section

Notes on the resume page:

- `notes[]` entries support `[label](url)` markdown links, rendered by `renderNoteWithLinks`. No other markdown in note text.
- Several resume entries are hardcoded in `ResumePage` rather than data-driven: the Kodeco and RightOn Education community blocks, the "Conference Speaking & Presentations" paragraph, and the section headings. Keep new copy there unless it is a list that needs ordering.
- Resume wording mirrors the owner's master resume document; when they supply an updated one, align `resumeExperience`, `resumeSkillGroups`, and the hardcoded community copy to it.

To add a new local blog post, copy `src/content/blogs/authored/_template.md`, fill in the frontmatter, and re-run `npm run sync:blogs`.

For the full authored/reviewed workflow and AI prompt templates, see `docs/BLOGGING.md`.

To add a new Medium post, add its slug to `INCLUDED_POST_SLUGS` in `scripts/sync-blogs.mjs` and re-run `npm run sync:blogs`.

## Blog sync failure handling

`sync-blogs.mjs` never hard-fails the build. If the Medium fetch fails:
- Falls back to existing `src/generated/blog-posts.json` if one exists
- Otherwise writes an empty `{ posts: [] }` fallback and exits 0
