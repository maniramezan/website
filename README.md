# Mani Ramezan Website

A simple, elegant personal website built with React and Tailwind CSS.

## Tech

- React
- React Router
- Tailwind CSS
- Vite
- Marked (for rendering synced markdown blog pages)

## Run

```bash
npm install
npm run sync:blogs
npm run dev
```

## Build

```bash
npm run build
```

`npm run build` automatically runs the blog sync pipeline first.

## Blog Sync Pipeline

Blog content is generated from:

- Medium feed: https://medium.com/@maniramezan/feed
- Local markdown posts in `src/content/blogs/authored/`
- Optional AI-reviewed markdown posts in `src/content/blogs/reviewed/`

Run:

```bash
npm run sync:blogs
```

This command:

- Reads local markdown posts with frontmatter
- Publishes either the authored or reviewed version per post based on `publishVersion`
- Pulls selected Medium posts and writes them to `src/content/blogs/*.html`
- Generates `src/generated/blog-posts.json` used by the website

Markdown posts are rendered as on-site static blog pages at `/blog/:slug`.

## Writing A New Post

1. Copy `src/content/blogs/authored/_template.md`
2. Rename it to your post slug, for example `my-new-post.md`
3. Fill in the frontmatter and content
4. Set `published: true` when ready to show it on the site
5. If you want the AI-proofread version live, add a matching file under `src/content/blogs/reviewed/` and set `publishVersion: "reviewed"`
6. Put images in `public/blog-images/` and reference them with absolute paths like `/blog-images/my-diagram.png`

## AI Review Workflow

- Workflow guide: `docs/BLOGGING.md`
- Proofread prompt: `docs/blog-ai-proofread-prompt.md`
- Editorial polish prompt: `docs/blog-ai-polish-prompt.md`
- Post template: `src/content/blogs/authored/_template.md`

## Content source

- LinkedIn profile: https://www.linkedin.com/in/maniramezan/
- Speaker Deck profile: https://speakerdeck.com/maniramezan
- Blog repository: https://github.com/maniramezan/blogs

Primary editable content is in `src/data/profile.js`.
