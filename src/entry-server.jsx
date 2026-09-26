// Build-time renderer used by scripts/prerender.mjs: turns each route into static
// HTML so crawlers get real content without running JavaScript. The browser then
// hydrates that HTML (see main.jsx).
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { loadPostHtml, PrerenderedPostContext, Site } from "./App";
import blogData from "./generated/blog-posts.json";

export async function render(url) {
  const slug = url.startsWith("/blog/") ? url.slice("/blog/".length) : null;
  const post = slug ? blogData.posts.find(entry => entry.slug === slug) : null;
  const prerenderedPost = post ? { slug, html: await loadPostHtml(post) } : null;

  return renderToString(
    <StrictMode>
      <PrerenderedPostContext value={prerenderedPost}>
        <StaticRouter location={url}>
          <Site />
        </StaticRouter>
      </PrerenderedPostContext>
    </StrictMode>
  );
}
