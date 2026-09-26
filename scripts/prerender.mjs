// Runs after the client and SSR builds. For every route it writes static HTML with
// the page's markup already rendered (via dist-server/entry-server.js) and its
// title, description, canonical URL, Open Graph tags, and JSON-LD baked in, so
// crawlers and link previews see real content without running JavaScript.
//
// Cloudflare's static assets serve `/blogs` from `blogs.html` and `/blog/<slug>`
// from `blog/<slug>.html`; any other path falls back to index.html, which main.jsx
// detects (data-prerendered-path mismatch) and renders client-side instead.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pageMeta, postMeta, renderMetaTags } from "../src/seo.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
const serverEntry = path.join(repoRoot, "dist-server", "entry-server.js");
const blogPostsPath = path.join(repoRoot, "src", "generated", "blog-posts.json");
const metaBlockPattern = /<!-- page-meta:start -->[\s\S]*?<!-- page-meta:end -->/;
const rootPlaceholder = '<div id="root"></div>';

const template = await readFile(path.join(distDir, "index.html"), "utf8");
if (!metaBlockPattern.test(template) || !template.includes(rootPlaceholder)) {
  throw new Error("dist/index.html is missing the page-meta block or the empty #root element.");
}

const { render } = await import(pathToFileURL(serverEntry).href);
const { posts } = JSON.parse(await readFile(blogPostsPath, "utf8"));
const pages = [
  ...Object.entries(pageMeta).map(([route, meta]) => ({ route, meta })),
  ...posts.map(post => ({ route: `/blog/${post.slug}`, meta: postMeta(post) }))
];

for (const { route, meta } of pages) {
  const appHtml = await render(route);
  const html = template
    .replace(metaBlockPattern, () => renderMetaTags(route, meta))
    .replace(rootPlaceholder, () => `<div id="root" data-prerendered-path="${route}">${appHtml}</div>`);
  const outFile = path.join(distDir, route === "/" ? "index.html" : `${route.slice(1)}.html`);
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, html, "utf8");
}

console.log(`Prerendered ${pages.length} routes.`);
