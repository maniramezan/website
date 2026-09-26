// Per-route <head> metadata and structured data, shared by the app (client-side
// navigation) and scripts/prerender.mjs (static HTML per route, so crawlers and
// social cards that don't run JavaScript still see the right tags).
// Keep this module free of Vite-only imports so Node can load it directly.
import { profile } from "./data/profile.js";

export const siteUrl = "https://maniramezan.com";
export const siteName = "Mani Ramezan";
export const ogImage = `${siteUrl}/og-image.png`;

const homeDescription =
  "Mani Ramezan — founder of Arjang Consulting and mobile tech lead at Capital One. Writing and talks on mobile architecture, testing, CI/CD, and AI-assisted development.";

export const pageMeta = {
  "/": {
    title: `${siteName} — Founder, Arjang Consulting`,
    description: homeDescription,
    schema: "profile"
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
      "Resume of Mani Ramezan: 12+ years building mobile products at Capital One, LinkedIn, Amazon, and more.",
    schema: "profile"
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
    headline: post.title,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null
  };
}

export function canonicalUrl(path) {
  return path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`;
}

// One Person entity, referenced by @id from every page, so search engines connect
// this site with the same person's LinkedIn, GitHub, Medium, and other profiles.
const personId = `${siteUrl}/#person`;
const person = {
  "@type": "Person",
  "@id": personId,
  name: profile.name,
  url: `${siteUrl}/`,
  jobTitle: "Founder",
  worksFor: { "@type": "Organization", name: "Arjang Consulting", url: "https://arjang.consulting" },
  description: homeDescription,
  address: { "@type": "PostalAddress", addressLocality: "Brooklyn", addressRegion: "NY", addressCountry: "US" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "University of Texas at San Antonio" },
    { "@type": "CollegeOrUniversity", name: "Islamic Azad University, Tehran North Branch" }
  ],
  knowsAbout: [
    "iOS development",
    "Swift",
    "Mobile architecture",
    "Test automation",
    "CI/CD",
    "Developer tooling",
    "AI-assisted development"
  ],
  sameAs: Object.values(profile.links)
};

function structuredData(path, meta) {
  const url = canonicalUrl(path);
  if (meta.type === "article") {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: meta.headline,
      description: meta.description,
      url,
      mainEntityOfPage: url,
      image: ogImage,
      ...(meta.publishedAt ? { datePublished: meta.publishedAt } : {}),
      author: { "@type": "Person", "@id": personId, name: profile.name, url: `${siteUrl}/` }
    };
  }
  if (meta.schema === "profile") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "ProfilePage", "@id": `${url}#page`, url, name: meta.title, mainEntity: { "@id": personId } },
        person,
        ...(path === "/"
          ? [{ "@type": "WebSite", "@id": `${siteUrl}/#website`, url: `${siteUrl}/`, name: siteName, publisher: { "@id": personId } }]
          : [])
      ]
    };
  }
  if (meta.noindex) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url,
    name: meta.title,
    description: meta.description,
    author: { "@id": personId }
  };
}

// JSON inside <script> must not be able to close the tag early.
const serializeJsonLd = data => JSON.stringify(data).replace(/</g, "\\u003c");

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
  const jsonLd = structuredData(path, meta);
  if (jsonLd) {
    tags.push(`<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>`);
  }
  return ["<!-- page-meta:start -->", ...tags, "<!-- page-meta:end -->"].join("\n    ");
}
