# AGENTS.md

Shared guidance for all AI agents working in this repository.

## Commands

```bash
npm install           # install dependencies
npm run sync:blogs    # merge local markdown posts with selected Medium posts
npm run dev           # sync blogs, then start dev server (localhost:5173)
npm run build         # sync blogs, then produce dist/
npm run preview       # serve the built dist/
```

There is no test suite.

## Architecture

This is a single-page React app with no backend. Nearly all component and routing code lives in **`src/App.jsx`**.

### Data flow

```
src/data/profile.js                 ← primary editable content (profile, talks, projects, socials)
src/content/blogs/authored/*.md     ← human-written source posts with frontmatter
src/content/blogs/reviewed/*.md     ← optional AI-reviewed variants with matching filenames
scripts/sync-blogs.mjs              ← runs at build/dev time; fetches Medium RSS and builds blog index
  → src/content/blogs/*.html        ← generated Medium post HTML
  → src/generated/blog-posts.json   ← post index consumed by the app at runtime
src/App.jsx                         ← imports blog-posts.json and lazily loads content files
```

### Routing

React Router v7 with three routes all defined in `App.jsx`:

| Path | Component |
|---|---|
| `/` | `HomePage` |
| `/blog/:slug` | `BlogPostPage` |
| `*` | `NotFoundPage` |

### Blog content types

`BlogPostPage` supports two content types set in `blog-posts.json`:

- `contentType: "html"` — raw HTML sourced from Medium RSS, stored as `.html` in `src/content/blogs/`
- `contentType: "markdown"` — local markdown stored under `src/content/blogs/authored/` or `src/content/blogs/reviewed/`, rendered with `marked` + `highlight.js`

Content files are loaded lazily via `import.meta.glob` (never bundled eagerly).

### Theming

Light/dark theme is toggled by setting `data-theme` on `<html>`. All colours are CSS custom properties defined in `src/index.css`. The active theme is persisted to `localStorage` under the key `mani-theme`.

### Styling

Tailwind CSS v3 for layout/spacing; component-level styles (`.surface-card`, `.tag-*`, `.social-link`, `.blog-content`, etc.) are defined as `@layer components` in `src/index.css`. Avoid adding Tailwind utility sprawl for styles that belong in those shared classes.

### Editing conventions

- The entire UI is intentionally kept in `src/App.jsx`. Keep new UI additions there unless the user explicitly asks to extract components.
- `src/generated/blog-posts.json` and top-level `src/content/blogs/*.html` are build-time outputs. Do not edit them by hand; re-run `npm run sync:blogs` instead.
- No linter or formatter is configured. Match the existing style: 2-space indent, double quotes, and no semicolons in JSX expressions.

## Editing content

All user-facing copy that isn't a blog post lives in `src/data/profile.js`:

- `profile` — name, role, summary, bio, and all external links
- `socials` — ordered list of social icon links shown in the header/footer
- `highlights` — bullet points in the "Current Focus" sidebar
- `talks` — conference talk entries
- `openSourceProjects` — open-source project cards

To add a new local blog post, copy `src/content/blogs/authored/_template.md`, fill in the frontmatter, and re-run `npm run sync:blogs`.

For the full authored/reviewed workflow and AI prompt templates, see `docs/BLOGGING.md`.

To add a new Medium post, add its slug to `INCLUDED_POST_SLUGS` in `scripts/sync-blogs.mjs` and re-run `npm run sync:blogs`.

## Blog sync failure handling

`sync-blogs.mjs` never hard-fails the build. If the Medium fetch fails:
- Falls back to existing `src/generated/blog-posts.json` if one exists
- Otherwise writes an empty `{ posts: [] }` fallback and exits 0
