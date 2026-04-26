# AGENTS.md

Shared guidance for all AI agents working in this repository.

## Commands

```bash
npm install           # install dependencies
npm run sync:blogs    # fetch blog content from Medium + GitHub
npm run dev           # sync blogs, then start dev server (localhost:5173)
npm run build         # sync blogs, then produce dist/
npm run preview       # serve the built dist/
```

There is no test suite.

## Architecture

This is a single-page React app with no backend. Nearly all component and routing code lives in **`src/App.jsx`**.

### Data flow

```
src/data/profile.js          ← primary editable content (profile, talks, projects, socials)
scripts/sync-blogs.mjs       ← runs at build/dev time; fetches Medium RSS + GitHub markdown
  → src/content/blogs/*.html / *.md   ← per-post content files (git-ignored output)
  → src/generated/blog-posts.json     ← post index consumed by the app at runtime
src/App.jsx                  ← imports blog-posts.json and lazily loads content files
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
- `contentType: "markdown"` — markdown from GitHub, stored as `.md`, rendered with `marked` + `highlight.js`

Content files are loaded lazily via `import.meta.glob` (never bundled eagerly).

### Theming

Light/dark theme is toggled by setting `data-theme` on `<html>`. All colours are CSS custom properties defined in `src/index.css`. The active theme is persisted to `localStorage` under the key `mani-theme`.

### Styling

Tailwind CSS v3 for layout/spacing; component-level styles (`.surface-card`, `.tag-*`, `.social-link`, `.blog-content`, etc.) are defined as `@layer components` in `src/index.css`. Avoid adding Tailwind utility sprawl for styles that belong in those shared classes.

## Editing content

All user-facing copy that isn't a blog post lives in `src/data/profile.js`:

- `profile` — name, role, summary, bio, and all external links
- `socials` — ordered list of social icon links shown in the header/footer
- `highlights` — bullet points in the "Current Focus" sidebar
- `talks` — conference talk entries
- `openSourceProjects` — open-source project cards

To add a new blog post from Medium, add its slug to `INCLUDED_POST_SLUGS` in `scripts/sync-blogs.mjs` and re-run `npm run sync:blogs`.

## Blog sync failure handling

`sync-blogs.mjs` never hard-fails the build. If the Medium fetch fails:
- Falls back to existing `src/generated/blog-posts.json` if one exists
- Otherwise writes an empty `{ posts: [] }` fallback and exits 0
