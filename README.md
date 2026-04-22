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

- GitHub repo: https://github.com/maniramezan/blogs
- Medium feed: https://medium.com/@maniramezan/feed

Run:

```bash
npm run sync:blogs
```

This command:

- Pulls markdown posts from GitHub and writes them to `src/content/blogs/*.md`
- Pulls Medium posts and merges metadata
- Generates `src/generated/blog-posts.json` used by the website

GitHub markdown posts are rendered as on-site static blog pages at `#/blog/:slug`.

## Content source

- LinkedIn profile: https://www.linkedin.com/in/maniramezan/
- Speaker Deck profile: https://speakerdeck.com/maniramezan
- Blog repository: https://github.com/maniramezan/blogs

Primary editable content is in `src/data/profile.js`.
