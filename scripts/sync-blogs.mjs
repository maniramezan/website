import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const MEDIUM_FEED_URL = "https://medium.com/feed/@maniramezan";
const INCLUDED_POST_SLUGS = new Set([
  "writing-reliable-tests-in-ios-e87cdbe2a10c",
  "manual-code-signing-59dbdbc0543c"
]);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentOutputDir = path.join(repoRoot, "src", "content", "blogs");
const authoredContentDir = path.join(contentOutputDir, "authored");
const reviewedContentDir = path.join(contentOutputDir, "reviewed");
const generatedDir = path.join(repoRoot, "src", "generated");
const generatedJsonPath = path.join(generatedDir, "blog-posts.json");

function slugify(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getFirstMatch(input, pattern) {
  const match = input.match(pattern);
  return match ? match[1] : "";
}

function stripTags(input) {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdown(input) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/^[-+*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizePublishedAt(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function excerptFromMarkdown(markdown) {
  return stripMarkdown(markdown).slice(0, 220).trim();
}

async function readOptionalFile(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "manman-website-blog-sync" }
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.text();
}

async function cleanContentDir() {
  await mkdir(contentOutputDir, { recursive: true });
  const entries = await readdir(contentOutputDir);
  await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".html"))
      .map((entry) => unlink(path.join(contentOutputDir, entry)))
  );
}

async function parseLocalMarkdownPosts() {
  await mkdir(authoredContentDir, { recursive: true });
  await mkdir(reviewedContentDir, { recursive: true });

  const entries = await readdir(authoredContentDir);
  const markdownEntries = entries.filter((entry) => entry.endsWith(".md") && !entry.startsWith("_"));

  const posts = [];

  for (const entry of markdownEntries) {
    const authoredRaw = await readFile(path.join(authoredContentDir, entry), "utf8");
    const authoredDoc = matter(authoredRaw);
    const reviewedRaw = await readOptionalFile(path.join(reviewedContentDir, entry));
    const reviewedDoc = reviewedRaw ? matter(reviewedRaw) : null;
    const requestedVersion = String(authoredDoc.data.publishVersion || "authored").toLowerCase();
    const publishVersion = requestedVersion === "reviewed" && reviewedDoc ? "reviewed" : "authored";
    const selectedDoc = publishVersion === "reviewed" ? reviewedDoc : authoredDoc;
    const selectedData = {
      ...authoredDoc.data,
      ...(publishVersion === "reviewed" ? reviewedDoc?.data ?? {} : {})
    };

    if (selectedData.published === false) {
      continue;
    }

    const slug = slugify(selectedData.slug || entry.replace(/\.md$/i, ""));
    const title = String(selectedData.title || "").trim();

    if (!title) {
      throw new Error(`Local blog post '${entry}' is missing a title in frontmatter.`);
    }

    posts.push({
      id: `post-${slug}`,
      slug,
      title,
      excerpt: String(selectedData.excerpt || excerptFromMarkdown(selectedDoc.content)),
      topic: String(selectedData.topic || "iOS"),
      tags: toArray(selectedData.tags),
      url: `/blog/${slug}`,
      publishedAt: normalizePublishedAt(selectedData.publishedAt),
      contentType: "markdown",
      contentFile: `${publishVersion}/${entry}`,
      publishVersion
    });
  }

  return posts;
}

function cleanMediumHtml(html, slug) {
  let output = html.replace(/\u00a0/g, " ").trim();

  // Remove Medium tracking pixel.
  output = output.replace(/<img[^>]+medium\.com\/_\/stat[^>]*>/gi, "");

  if (slug === "writing-reliable-tests-in-ios-e87cdbe2a10c") {
    // Remove off-site intro line so the post reads cleanly in-site.
    output = output.replace(/^<p><em>Original blog post[\s\S]*?<\/p>/i, "");
  }

  if (slug === "manual-code-signing-59dbdbc0543c") {
    // Fix a few obvious wording/typo artifacts from feed content.
    output = output
      .replace("e.i Enterprise and App Store", "e.g. Enterprise and App Store")
      .replace("looks like something like:", "looks like this:")
      .replace("Atuomatic / Manual", "Automatic / Manual")
      .replace("we’re intersted in is named", "we’re interested in is named");
  }

  return output.trim();
}

// Map each included slug to its topic label.
// Update this when adding new posts via INCLUDED_POST_SLUGS.
const SLUG_TOPICS = {
  "writing-reliable-tests-in-ios-e87cdbe2a10c": "Testing",
  "manual-code-signing-59dbdbc0543c": "Tooling"
};

function parseMediumPosts(feedXml) {
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const items = [...feedXml.matchAll(itemRegex)];

  return items
    .map((itemBlock) => {
      const block = itemBlock[1];
      const title = getFirstMatch(block, /<title><!\[CDATA\[(.*?)\]\]><\/title>/i);
      const link = getFirstMatch(block, /<link>(.*?)<\/link>/i);
      const pubDate = getFirstMatch(block, /<pubDate>(.*?)<\/pubDate>/i);
      const encodedHtml =
        getFirstMatch(block, /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i) ||
        getFirstMatch(block, /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);

      if (!title || !link || !encodedHtml) {
        return null;
      }

      const slug = slugify(
        link
          .replace(/\?.*$/, "")
          .split("/")
          .filter(Boolean)
          .at(-1) || title
      );

      if (!INCLUDED_POST_SLUGS.has(slug)) {
        return null;
      }

      const cleanedHtml = cleanMediumHtml(encodedHtml, slug);
      const excerpt = stripTags(cleanedHtml).slice(0, 220).trim();

      return {
        id: `post-${slug}`,
        slug,
        title,
        excerpt,
        topic: SLUG_TOPICS[slug] ?? "iOS",
        url: `/blog/${slug}`,
        publishedAt: pubDate || null,
        contentType: "html",
        contentFile: `${slug}.html`,
        htmlContent: cleanedHtml
      };
    })
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0));
}

async function buildMediumPosts() {
  const feedXml = await fetchText(MEDIUM_FEED_URL);
  return parseMediumPosts(feedXml);
}

async function buildPosts() {
  const [localPosts, mediumPosts] = await Promise.all([
    parseLocalMarkdownPosts(),
    buildMediumPosts()
  ]);

  const postsBySlug = new Map(mediumPosts.map((post) => [post.slug, post]));
  for (const post of localPosts) {
    postsBySlug.set(post.slug, post);
  }

  return [...postsBySlug.values()].sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0));
}

async function writeOutput(posts) {
  await mkdir(generatedDir, { recursive: true });
  const output = {
    generatedAt: new Date().toISOString(),
    posts
  };
  await writeFile(generatedJsonPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

async function loadExistingOutput() {
  try {
    const existing = await readFile(generatedJsonPath, "utf8");
    return JSON.parse(existing);
  } catch {
    return null;
  }
}

async function main() {
  try {
    const posts = await buildPosts();
    await cleanContentDir();
    for (const post of posts) {
      if (post.contentType === "html") {
        await writeFile(path.join(contentOutputDir, post.contentFile), post.htmlContent || "", "utf8");
        delete post.htmlContent;
      }
    }
    await writeOutput(posts);
    console.log(`Synced ${posts.length} complete posts.`);
  } catch (error) {
    const existing = await loadExistingOutput();
    if (existing) {
      console.warn("Blog sync failed; using existing generated content.");
      console.warn(String(error));
      process.exit(0);
    }

    await writeOutput([]);
    console.warn("Blog sync failed; generated an empty fallback blog dataset.");
    console.warn(String(error));
    process.exit(0);
  }
}

await main();
