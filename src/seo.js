// Per-route <head> metadata, shared by the app (client-side navigation) and
// scripts/prerender-meta.mjs (static HTML per route, so crawlers and social
// cards that don't run JavaScript still see the right title and description).
// Keep this module free of Vite-only imports so Node can load it directly.

export const siteUrl = "https://maniramezan.com";
export const siteName = "Mani Ramezan";
export const ogImage = `${siteUrl}/og-image.png`;

const homeDescription =
  "Mani Ramezan — founder of Arjang Consulting and mobile tech lead at Capital One. Writing and talks on mobile architecture, testing, CI/CD, and AI-assisted development.";

export const pageMeta = {
  "/": {
    title: `${siteName} — Founder, Arjang Consulting`,
    description: homeDescription
  },
  "/blogs": {
    title: `Writing | ${siteName}`,
    description: "Posts by Mani Ramezan on iOS testing, architecture, code signing, and developer tooling."
  },
  "/talks": {
    title: `Talks | ${siteName}`,
    description:
      "Conference talks by Mani Ramezan on modularization, testing, Xcode tooling, and release automation."
  },
  "/resume": {
    title: `Resume | ${siteName}`,
    description:
      "Resume of Mani Ramezan: 12+ years building mobile products at Capital One, LinkedIn, Amazon, and more."
  }
};

export const notFoundMeta = {
  title: `Page not found | ${siteName}`,
  description: homeDescription,
  noindex: true
};

export function postMeta(post) {
  return {
    title: `${post.title} | ${siteName}`,
    description: post.excerpt,
    type: "article",
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null
  };
}

export function canonicalUrl(path) {
  return path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`;
}

const escapeAttribute = value => String(value)
  .replace(/&/g, "&amp;")
  .replace(/"/g, "&quot;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

// Static markup for the page-meta block in index.html. The client keeps the same
// tags in sync through usePageMeta in App.jsx.
export function renderMetaTags(path, meta) {
  const title = escapeAttribute(meta.title);
  const description = escapeAttribute(meta.description);
  const url = canonicalUrl(path);
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${meta.type ?? "website"}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`
  ];
  if (meta.publishedAt) {
    tags.push(`<meta property="article:published_time" content="${meta.publishedAt}" />`);
  }
  if (meta.noindex) {
    tags.push(`<meta name="robots" content="noindex" />`);
  }
  return ["<!-- page-meta:start -->", ...tags, "<!-- page-meta:end -->"].join("\n    ");
}
