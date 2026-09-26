// Runs after `vite build`: writes one HTML file per route with that route's
// title, description, canonical URL, and Open Graph tags baked in. The body is
// still the SPA shell; this only fixes what non-JS crawlers and link previews see.
//
// Cloudflare's static assets serve `/blogs` from `blogs.html` and
// `/blog/<slug>` from `blog/<slug>.html`; anything else falls back to index.html.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pageMeta, postMeta, renderMetaTags } from "../src/seo.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
const blogPostsPath = path.join(repoRoot, "src", "generated", "blog-posts.json");
const metaBlockPattern = /<!-- page-meta:start -->[\s\S]*?<!-- page-meta:end -->/;

const template = await readFile(path.join(distDir, "index.html"), "utf8");
if (!metaBlockPattern.test(template)) {
  throw new Error("dist/index.html is missing the <!-- page-meta:start/end --> block.");
}

const { posts } = JSON.parse(await readFile(blogPostsPath, "utf8"));
const pages = [
  ...Object.entries(pageMeta).map(([route, meta]) => ({ route, meta })),
  ...posts.map(post => ({ route: `/blog/${post.slug}`, meta: postMeta(post) }))
];

for (const { route, meta } of pages) {
  const html = template.replace(metaBlockPattern, renderMetaTags(route, meta));
  const outFile = path.join(distDir, route === "/" ? "index.html" : `${route.slice(1)}.html`);
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, html, "utf8");
}

console.log(`Prerendered meta for ${pages.length} routes.`);
