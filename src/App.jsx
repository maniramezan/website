import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import {
  HiOutlineArrowRight,
  HiOutlineArrowUpRight,
  HiOutlineMagnifyingGlass,
  HiOutlineMoon,
  HiOutlineSun,
  HiPlay,
} from "react-icons/hi2";
import { FaLinkedin } from "react-icons/fa6";
import {
  SiBluesky,
  SiGithub,
  SiMastodon,
  SiSpeakerdeck,
  SiX
} from "react-icons/si";
import { BrowserRouter, Link, Route, Routes, useLocation, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, LazyMotion, m, MotionConfig, useScroll, useSpring } from "motion/react";
import blogData from "./generated/blog-posts.json";
import { canonicalUrl, notFoundMeta, pageMeta, postMeta } from "./seo";

import {
  podcasts,
  profile,
  openSourceGroups,
  resumeExperience,
  resumeSkillGroups,
  socials,
  siteCopy,
  talks
} from "./data/profile";

// Only the top level of content/blogs is globbed: sync-blogs writes published posts
// there, so drafts in authored/ and reviewed/ never end up in the bundle.
const markdownModules = import.meta.glob("./content/blogs/*.md", {
  query: "?raw",
  import: "default",
  eager: false
});

const htmlModules = import.meta.glob("./content/blogs/*.html", {
  query: "?raw",
  import: "default",
  eager: false
});

const getContentLoader = post =>
  (post.contentType === "html" ? htmlModules : markdownModules)[`./content/blogs/${post.contentFile}`];

// Motion's animation features (including layout animations for the nav pill) load
// in their own chunk; `m.*` components render immediately and animate once it lands.
const loadMotionFeatures = () => import("./motion-features").then(module => module.default);

// marked + highlight.js are only needed for markdown posts, so they are fetched
// on demand and cached, keeping ~100 kB off the initial bundle.
let markdownModule = null;
const loadMarkdownModule = () => {
  if (!markdownModule) markdownModule = import("./markdown");
  return markdownModule;
};

function preparePostHtml(html) {
  let sectionIndex = 0;
  return html
    .replace(/<pre\b([^>]*)>/g, (_, attributes) => `<pre${attributes.replace(/\s+tabindex="[^"]*"/g, "")} tabindex="0">`)
    .replace(/<h([2-4])([^>]*)>/g, (_, level, attributes) => {
      sectionIndex += 1;
      return `<h${level}${attributes.replace(/\s+id="[^"]*"/g, "")} id="section-${sectionIndex}">`;
    });
}

function articleDetails(html) {
  if (!html) return { headings: [], minutes: null };
  const plainText = text => text.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&(?:nbsp|#160);/g, " ").replace(/&quot;/g, "\"").replace(/&#(?:39|x27);/g, "’").trim();
  const headings = [...html.matchAll(/<h[2-4][^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h[2-4]>/g)]
    .map(match => ({ id: match[1], title: plainText(match[2]) }));
  const words = plainText(html).split(/\s+/).length;
  return { headings, minutes: Math.max(1, Math.ceil(words / 220)) };
}

// Returns a post's final body HTML. Used by BlogPostPage on the client and by
// src/entry-server.jsx when prerendering posts at build time.
export async function loadPostHtml(post) {
  const loader = getContentLoader(post);
  if (!loader) throw new Error(`No bundled content for ${post.contentFile}`);
  if (post.contentType === "html") {
    const raw = await loader();
    // Medium emits its own heading levels; flatten them to keep one h1 on the page.
    const accessibleHtml = raw
      .replace(/<h[2-6]/g, "<h2")
      .replace(/<\/h[2-6]>/g, "</h2>");
    return preparePostHtml(accessibleHtml);
  }
  const [{ renderMarkdown }, raw] = await Promise.all([loadMarkdownModule(), loader()]);
  return preparePostHtml(renderMarkdown(raw));
}

// Set by the build-time prerender so a post's body is part of the static HTML.
export const PrerenderedPostContext = createContext(null);

function initialPostHtml(prerenderedPost, slug) {
  if (prerenderedPost?.slug === slug) return prerenderedPost.html;
  if (typeof document === "undefined") return null;
  // First client render of a prerendered post: reuse the body already in the page so
  // hydration matches and the post isn't fetched twice.
  return document.querySelector(`[data-post-slug="${slug}"]`)?.innerHTML ?? null;
}

const socialIcons = {
  linkedin: FaLinkedin,
  github: SiGithub,
  twitter: SiX,
  bluesky: SiBluesky,
  mastodon: SiMastodon,
  speakerDeck: SiSpeakerdeck
};

// Brand colours only appear on hover; darkColor is a lighter variant that keeps
// at least 3:1 contrast on the dark surfaces.
const socialPalette = {
  linkedin: { color: "#0A66C2", darkColor: "#5AA4F0" },
  github: { color: "#24292F", darkColor: "#F0F6FC" },
  twitter: { color: "#111111", darkColor: "#F5F5F5" },
  bluesky: { color: "#1185FE", darkColor: "#4DA3FF" },
  mastodon: { color: "#6364FF", darkColor: "#8C8DFF" },
  speakerDeck: { color: "#05998B", darkColor: "#2EC4B4" }
};

// Keep the storage key and colours in sync with the inline script in index.html.
const themeStorageKey = "mani-theme";
const themeColors = { light: "#f7f7f2", dark: "#1b1e1b" };
// Fixed locale and time zone so build-time HTML and the browser agree.
const postDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric"
});

function readSavedTheme() {
  try {
    const saved = window.localStorage.getItem(themeStorageKey);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the toggle still works for this visit.
  }
}

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// <html data-theme> is the source of truth: index.html sets it before first paint and
// setTheme updates it. Prerendered HTML is always built as "light"; useSyncExternalStore
// hydrates with that and then re-renders with the real theme.
const themeListeners = new Set();

function subscribeTheme(listener) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function getThemeSnapshot() {
  const applied = document.documentElement.dataset.theme;
  return applied === "light" || applied === "dark" ? applied : readSavedTheme() ?? systemTheme();
}

const getServerThemeSnapshot = () => "light";

function setTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[theme]);
  themeListeners.forEach(listener => listener());
}

/* ── Page metadata ──────────────────────────────────────────────── */

function setHeadAttribute(selector, attribute, value) {
  document.head.querySelector(selector)?.setAttribute(attribute, value);
}

// Keeps <head> in step with client-side navigation. The same values are baked into
// per-route HTML at build time by scripts/prerender-meta.mjs.
function usePageMeta({ title, description, type = "website", noindex = false }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const url = canonicalUrl(pathname.replace(/\/+$/, "") || "/");
    document.title = title;
    setHeadAttribute('meta[name="description"]', "content", description);
    setHeadAttribute('link[rel="canonical"]', "href", url);
    setHeadAttribute('meta[property="og:type"]', "content", type);
    setHeadAttribute('meta[property="og:title"]', "content", title);
    setHeadAttribute('meta[property="og:description"]', "content", description);
    setHeadAttribute('meta[property="og:url"]', "content", url);
    setHeadAttribute('meta[name="twitter:title"]', "content", title);
    setHeadAttribute('meta[name="twitter:description"]', "content", description);

    let robots = document.head.querySelector('meta[name="robots"]');
    if (noindex && !robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex";
      document.head.appendChild(robots);
    } else if (!noindex && robots) {
      robots.remove();
    }
  }, [pathname, title, description, type, noindex]);
}

// Maps blog topic labels to tag color variants
const topicColors = {
  "Testing":      "sage",
  "Architecture": "lilac",
  "Tooling":      "rose",
  "Swift":        "lilac",
  "Xcode":        "rose",
  "CI/CD":        "rose",
  "iOS":          "sage"   // generic fallback
};

function topicColor(topic) {
  return topicColors[topic] ?? "sage";
}

// Sorts blog posts newest-first by publishedAt
function sortedPosts(posts) {
  return [...posts].sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
}

// Sorts talks newest-first by year
function sortedTalks(talkList) {
  return [...talkList].sort((a, b) => (b.year || 0) - (a.year || 0));
}

// Renders `[label](url)` markdown-style links inside otherwise-plain resume note text.
const noteLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
function renderNoteWithLinks(text) {
  const parts = [];
  let lastIndex = 0;
  for (const match of text.matchAll(noteLinkPattern)) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="inline-link interactive-focus"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/* ── Base components ────────────────────────────────────────────── */

// Uppercase text while preserving known proper-noun casings (e.g. "iOS" not "IOS")
const preservedCasings = ["iOS"];
function toUpperPreserved(str) {
  let result = str.toUpperCase();
  for (const word of preservedCasings) {
    result = result.split(word.toUpperCase()).join(word);
  }
  return result;
}

function Tag({ label, color = "sage" }) {
  return <span className={`tag tag-${color}`}>{toUpperPreserved(label)}</span>;
}

function ThemeToggle({ theme, onToggleTheme }) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? HiOutlineSun : HiOutlineMoon;
  return (
    <m.button
      type="button"
      onClick={onToggleTheme}
      className="theme-button interactive-focus"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={theme}
          className="inline-flex"
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </m.span>
      </AnimatePresence>
    </m.button>
  );
}

function SocialIconLink({ id, label, url }) {
  const Icon = socialIcons[id];
  const palette = socialPalette[id];
  if (!Icon || !url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="me noreferrer"
      aria-label={label}
      title={label}
      className="social-link interactive-focus"
      style={{
        "--social-color": palette?.color,
        "--social-color-dark": palette?.darkColor
      }}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </a>
  );
}

const navItems = siteCopy.navigation;

function NavLink({ to, label }) {
  const { pathname } = useLocation();
  const isActive = to === "/" ? pathname === "/" : to === "/blogs"
    ? pathname === "/blogs" || pathname.startsWith("/blog/") : pathname.startsWith(to);
  return (
    <Link to={to} className="nav-link interactive-focus" aria-current={isActive ? "page" : undefined}>
      {label}
      {isActive && <m.span layoutId="nav-indicator" className="nav-indicator" transition={{ type: "spring", stiffness: 450, damping: 35 }} />}
    </Link>
  );
}

function SiteHeader({ theme, onToggleTheme }) {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link to="/" className="brand interactive-focus" aria-label={`${profile.firstName}, home`}>
          <span className="brand-mark" aria-hidden="true">{profile.firstName.toLowerCase()}<span>.</span></span>
        </Link>
        <nav aria-label="Main" className="main-nav">
          {navItems.map(item => <NavLink key={item.to} {...item} />)}
        </nav>
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </header>
  );
}

function PostCard({ post }) {
  return (
    <article className="post-row">
      <Link to={`/blog/${post.slug}`} className="post-link interactive-focus" aria-labelledby={`post-title-${post.slug}`}>
        <div className="post-summary">
          <div className="post-meta">
            <Tag label={post.topic} color={topicColor(post.topic)} />
            {post.publishedAt && <time dateTime={new Date(post.publishedAt).toISOString()}>{postDateFormatter.format(new Date(post.publishedAt))}</time>}
          </div>
          <h3 id={`post-title-${post.slug}`}>{post.title}</h3>
          <p>{post.excerpt}</p>
        </div>
        <span className="row-arrow" aria-hidden="true"><HiOutlineArrowUpRight /></span>
      </Link>
    </article>
  );
}

// Shows the video thumbnail and only loads YouTube's player (several hundred kB
// of third-party script) once the visitor asks for it.
function YouTubeEmbed({ videoId, start, title, playing, onPlay }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (playing) iframeRef.current?.focus();
  }, [playing]);

  if (playing) {
    const params = new URLSearchParams({ autoplay: "1", rel: "0" });
    if (start) params.set("start", String(start));
    return (
      <iframe
        ref={iframeRef}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        className="absolute inset-0 w-full h-full border-0"
      />
    );
  }

  return (
    <button type="button" className="video-facade" onClick={onPlay} aria-label={`Play video: ${title}`}>
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        width="480"
        height="360"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <span className="video-facade-play" aria-hidden="true">
        <HiPlay className="h-7 w-7 translate-x-[2px]" />
      </span>
    </button>
  );
}

function talkAnchor(talk) {
  return `talk-${talk.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`;
}

function TalkCard({ talk }) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const hasEmbed = talk.youtube || talk.speakerDeckId;
  const youtubeWatchHref = talk.youtube
    ? `https://www.youtube.com/watch?v=${talk.youtube}${talk.youtubeStart ? `&t=${talk.youtubeStart}` : ""}`
    : null;
  return (
    <article id={talkAnchor(talk)} tabIndex={-1} className="surface-card talk-card overflow-hidden">
      {talk.youtube ? (
        <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
          <YouTubeEmbed
            videoId={talk.youtube}
            start={talk.youtubeStart}
            title={talk.title}
            playing={videoPlaying}
            onPlay={() => setVideoPlaying(true)}
          />
        </div>
      ) : talk.speakerDeckId ? (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://speakerdeck.com/player/${talk.speakerDeckId}`}
            title={talk.title}
            allow="fullscreen"
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
            style={{ background: "var(--surface-alt)" }}
          />
        </div>
      ) : null}
      <div className="p-5 sm:p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Tag label={talk.tag || "Talk"} color={talk.tagColor || "lilac"} />
          {talk.venue && (
            <span className="text-xs text-[var(--text-soft)] shrink-0">
              {talk.venue}{talk.year ? ` · ${talk.year}` : ""}
            </span>
          )}
        </div>
        <h3 className="font-display text-xl sm:text-2xl leading-tight text-[var(--text-strong)]">
          {talk.title}
        </h3>
        <p className="text-sm leading-7 text-[var(--text-muted)]">{talk.description}</p>
        <div className="flex flex-wrap gap-4 mt-1">
          {youtubeWatchHref && (
            <a
              href={youtubeWatchHref}
              target="_blank"
              rel="noreferrer"
              className="inline-link interactive-focus text-sm"
            >
              Watch on YouTube →
            </a>
          )}
          {talk.kodecoUrl && (
            <a
              href={talk.kodecoUrl}
              target="_blank"
              rel="noreferrer"
              className={`interactive-focus text-sm font-bold no-underline transition-colors duration-150 ${
                hasEmbed ? "text-[var(--text-muted)] hover:text-[var(--text-strong)]" : "inline-link"
              }`}
            >
              Watch on Kodeco →
            </a>
          )}
          {talk.url && (
            <a
              href={talk.url}
              target="_blank"
              rel="noreferrer"
              className={`interactive-focus text-sm font-bold no-underline transition-colors duration-150 ${
                hasEmbed ? "text-[var(--text-muted)] hover:text-[var(--text-strong)]" : "inline-link"
              }`}
            >
              View Slides →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Page footer ─────────────────────────────────────────────────── */

function PageFooter() {
  return (
    <footer className="page-footer">
      <div className="footer-invitation">
        <div>
          <p className="section-kicker">{siteCopy.footer.eyebrow}</p>
          <p className="footer-title">{siteCopy.footer.title}</p>
        </div>
        <a href={`mailto:${profile.email}`} className="hero-cta hero-cta-secondary interactive-focus">
          {siteCopy.footer.contactLabel}<HiOutlineArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <div className="footer-bottom">
        <div><p>© {new Date().getFullYear()} {profile.name}</p><p>{siteCopy.footer.note}</p></div>
        <div className="footer-socials" aria-label="Social profiles">
          {socials.map(social => <SocialIconLink key={social.id} {...social} />)}
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({ id, label, title, description, to, linkLabel }) {
  return (
    <div className="section-heading">
      <div>
        <p className="section-kicker">{label}</p>
        <h2 id={id}>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {to && <Link to={to} className="text-link interactive-focus">{linkLabel}<HiOutlineArrowUpRight aria-hidden="true" /></Link>}
    </div>
  );
}

function HomePage() {
  const posts = sortedPosts(blogData.posts);
  const talkList = sortedTalks(talks);
  const copy = siteCopy.home;
  usePageMeta(pageMeta["/"]);

  return (
    <main id="main-content" tabIndex={-1} className="site-shell home-page">
      <header className="home-hero">
        <p className="hero-eyebrow"><span className="status-dot" aria-hidden="true" />{copy.eyebrow}</p>
        <h1>{copy.headline}<br /><em>{copy.headlineAccent}</em></h1>
        <div className="hero-bottom">
          <p className="hero-introduction">{copy.introduction}</p>
          <div className="hero-actions">
            <Link to="/blogs" className="hero-cta hero-cta-primary interactive-focus">{copy.writingLabel}<HiOutlineArrowRight aria-hidden="true" /></Link>
            <a href={`mailto:${profile.email}`} className="text-link interactive-focus">{copy.contactLabel}<HiOutlineArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <div className="home-columns">
        <section className="writing-preview" aria-labelledby="home-writing-title">
          <div>
            <SectionHeading id="home-writing-title" label="Writing" title={copy.writingTitle} description={copy.writingDescription} to="/blogs" linkLabel={copy.allPosts} />
          </div>
          {posts.length ? posts.slice(0, 3).map(post => <PostCard key={post.id} post={post} />) : <p>{siteCopy.writing.emptyArchive}</p>}
        </section>
        <aside className="about-sidebar" aria-labelledby="about-title">
          <p className="section-kicker">Behind the work</p>
          <h2 id="about-title">{copy.aboutTitle}</h2>
          <p className="about-description">{copy.aboutDescription}</p>
          <Link to="/resume" className="text-link interactive-focus">{copy.aboutLink}<HiOutlineArrowUpRight aria-hidden="true" /></Link>
          <div className="current-work">
            <h3 className="section-kicker">{copy.currentTitle}</h3>
            {copy.current.map(item => {
              const content = <><span>{item.title}<HiOutlineArrowUpRight aria-hidden="true" /></span><p>{item.description}</p></>;
              return item.to
                ? <Link key={item.title} to={item.to} className="current-link interactive-focus">{content}</Link>
                : <a key={item.title} href={item.url} target="_blank" rel="noreferrer" className="current-link interactive-focus">{content}</a>;
            })}
          </div>
        </aside>
      </div>

      <section className="speaking-preview" aria-labelledby="home-speaking-title">
        <div><SectionHeading id="home-speaking-title" label="Speaking" title={copy.talksTitle} description={copy.talksDescription} to="/talks" linkLabel={copy.allTalks} /></div>
        {talkList.slice(0, 3).map(talk => (
          <Link key={talk.title} to={`/talks#${talkAnchor(talk)}`} className="talk-row interactive-focus">
            <span className="talk-year">{talk.year}</span><h3>{talk.title}</h3><span className="talk-venue">{talk.venue}</span><HiOutlineArrowUpRight aria-hidden="true" />
          </Link>
        ))}
      </section>
    </main>
  );
}

const subscribeHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function BlogsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydrated = useSyncExternalStore(subscribeHydration, getClientHydrationSnapshot, getServerHydrationSnapshot);
  const searchInputRef = useRef(null);
  const search = hydrated ? searchParams.get("q") ?? "" : "";
  const topic = hydrated ? searchParams.get("topic") ?? "" : "";
  const posts = sortedPosts(blogData.posts);
  const topics = [...new Set(posts.map(post => post.topic))];
  const normalizedSearch = search.toLocaleLowerCase("en-US").trim();
  const filteredPosts = posts.filter(post => (!topic || post.topic === topic) && `${post.title} ${post.excerpt} ${post.topic}`.toLocaleLowerCase("en-US").includes(normalizedSearch));
  const copy = siteCopy.writing;
  usePageMeta(pageMeta["/blogs"]);

  const updateFilter = (key, value) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true, preventScrollReset: true });
  };

  return (
    <main id="main-content" tabIndex={-1} className="site-shell archive-page">
      <header className="page-heading">
        <p className="section-kicker">{copy.eyebrow}</p>
        <h1>{copy.title}<span className="heading-period">.</span></h1>
        <p>{copy.description}</p>
      </header>
      <section aria-label="Articles" className="writing-archive">
        <div className="archive-controls">
          <div className="topic-filters" aria-label="Filter by topic">
            {["", ...topics].map(value => <button key={value} type="button" aria-pressed={topic === value} onClick={() => updateFilter("topic", value)} className="filter-button interactive-focus">{value || copy.allTopics}</button>)}
          </div>
          <label className="search-field">
            <HiOutlineMagnifyingGlass aria-hidden="true" />
            <span className="sr-only">{copy.searchLabel}</span>
            <input ref={searchInputRef} type="search" name="q" autoComplete="off" value={search} onChange={event => updateFilter("q", event.target.value)} placeholder={copy.searchPlaceholder} />
          </label>
        </div>
        <p className="archive-count" role="status">{filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}{topic ? ` in ${topic}` : ""}</p>
        <h2 className="sr-only">Articles</h2>
        {filteredPosts.length ? filteredPosts.map(post => <PostCard key={post.id} post={post} />) : (
          <div className="empty-state"><h3>{copy.emptyTitle}</h3><p>{copy.emptyDescription}</p><button type="button" onClick={() => { setSearchParams({}); searchInputRef.current?.focus(); }} className="hero-cta hero-cta-secondary interactive-focus">{copy.resetLabel}</button></div>
        )}
      </section>
    </main>
  );
}

function TalksListPage() {
  const talkList = sortedTalks(talks);
  const copy = siteCopy.speaking;
  usePageMeta(pageMeta["/talks"]);
  return (
    <main id="main-content" tabIndex={-1} className="site-shell archive-page">
      <header className="page-heading">
        <p className="section-kicker">{copy.eyebrow}</p>
        <h1>{copy.title}<span className="heading-period">.</span></h1>
        <p>{copy.description}</p>
      </header>
      <section className="talk-grid" aria-label="Conference talks">
        <h2 className="sr-only">Conference talks</h2>
        {talkList.map(talk => <TalkCard key={talk.title} talk={talk} />)}
      </section>
    </main>
  );
}

function ResumePage() {
  const [showAllOpenSource, setShowAllOpenSource] = useState(false);
  const openSourceProjectCount = openSourceGroups.reduce(
    (total, group) => total + group.projects.length,
    0
  );
  usePageMeta(pageMeta["/resume"]);

  return (
      <main id="main-content" tabIndex={-1} className="site-shell resume-page">
        <header className="page-heading resume-heading">
          <p className="section-kicker">{siteCopy.resume.eyebrow}</p>
          <h1
            className="font-display leading-none tracking-[-0.04em] text-[var(--text-strong)]"
            style={{ fontSize: "clamp(2.4rem, 11vw, 3.75rem)" }}
          >
            <span className="text-[var(--accent-lilac)]">Mani</span> Ramezan
          </h1>
          <p>{siteCopy.resume.description}</p>
          <nav className="resume-nav" aria-label="Resume sections">
            {siteCopy.resume.sections.map(section => <a key={section} href={`#${section.toLowerCase()}`} className="text-link interactive-focus">{section}<span aria-hidden="true">↓</span></a>)}
          </nav>
        </header>

        {/* Experience */}
        <section id="experience" className="resume-section py-10 border-b border-[var(--border)]">
          <h2 className="section-kicker mb-6">Experience</h2>
          {resumeExperience.map((job, i) => (
            <div
              key={i}
              className={`experience-entry py-5 ${i < resumeExperience.length - 1 ? "border-b border-[var(--border)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="font-display text-2xl leading-tight text-[var(--text-strong)]">{job.title}</h3>
                    {job.companyUrl ? (
                      <a
                        href={job.companyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-[var(--accent-sage)] hover:text-[var(--link-hover)] transition-colors duration-150 interactive-focus rounded-sm"
                      >
                        {job.company}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-[var(--accent-sage)]">{job.company}</span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {job.notes.map((note, ni) => (
                      <li key={ni} className="flex gap-2 text-base leading-7 text-[var(--text-muted)]">
                        <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
                        <span>{renderNoteWithLinks(note)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-[var(--text-soft)] whitespace-nowrap text-right shrink-0 pt-1">{job.period}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Community */}
        <section id="community" className="resume-section py-10 border-b border-[var(--border)]">
          <h2 className="section-kicker section-kicker-rose mb-6">Community</h2>
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-display text-lg text-[var(--text-strong)]">Kodeco</p>
                <span className="text-sm text-[var(--text-soft)]">Feb 2020 – Present</span>
              </div>
              <ul className="mt-2 space-y-1">
                {[
                  "Technical and article editor for iOS and AI tutorials and educational content.",
                  "Discord moderator, supporting the developer community on Apple-platform topics.",
                  "Bootcamp moderator for Becoming an iOS Developer and Introduction to Apple Intelligence."
                ].map((note, i) => (
                  <li key={i} className="flex gap-2 text-base leading-7 text-[var(--text-muted)]">
                    <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-display text-lg text-[var(--text-strong)]">RightOn Education</p>
                <span className="text-sm text-[var(--text-soft)]">Feb 2020 – Present</span>
              </div>
              <ul className="mt-2 space-y-1">
                {[
                  "Converted an existing proof of concept into a React Native MVP and designed its backend architecture on AWS.",
                  "Mentor the lead engineer on product and technical architecture, including web, backend, and agentic AI systems."
                ].map((note, i) => (
                  <li key={i} className="flex gap-2 text-base leading-7 text-[var(--text-muted)]">
                    <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-lg text-[var(--text-strong)]">Podcasts</p>
              <ul className="mt-2 space-y-1.5">
                {podcasts.map(podcast => (
                  <li key={podcast.url} className="flex gap-2 text-base leading-7 text-[var(--text-muted)]">
                    <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
                    <span>
                      <a
                        href={podcast.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-link interactive-focus"
                      >
                        {podcast.title}
                      </a>
                      {podcast.publisher ? ` · ${podcast.publisher}` : ""}
                      {podcast.year ? ` · ${podcast.year}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-lg text-[var(--text-strong)]">Open Source</p>
                <button
                  type="button"
                  className="resume-toggle-button interactive-focus"
                  aria-expanded={showAllOpenSource}
                  onClick={() => setShowAllOpenSource(isExpanded => !isExpanded)}
                >
                  {showAllOpenSource ? "Show fewer" : `Show all ${openSourceProjectCount} repos`}
                </button>
              </div>
              <ul className="mt-2 space-y-1.5">
                {openSourceGroups.map(group => (
                  <li key={group.id}>
                    <div className="flex gap-2 text-base leading-7 text-[var(--text-muted)]">
                      <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
                      <span>
                        <a
                          href={group.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link interactive-focus"
                        >
                          {group.name}
                        </a>
                        {" "}— {group.description}
                      </span>
                    </div>
                    {showAllOpenSource ? (
                      <ul className="mt-1 ml-6 space-y-1">
                        {group.projects.map(project => (
                          <li
                            key={project.name}
                            className="flex gap-2 text-[0.94rem] leading-7 text-[var(--text-soft)]"
                          >
                            <span className="shrink-0 select-none">·</span>
                            <span>
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-link interactive-focus"
                              >
                                {project.name}
                              </a>
                              {" "}— {project.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-lg text-[var(--text-strong)]">Conference Speaking &amp; Presentations</p>
              <p className="mt-1 text-base leading-7 text-[var(--text-muted)]">
                Presented at iOSoho and Kodeco on iOS architecture, modularization, testing, release automation, and Apple Intelligence.
              </p>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="resume-section py-10">
          <h2 className="section-kicker section-kicker-lilac mb-6">Skills</h2>
          <div className="space-y-5">
            {resumeSkillGroups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-[var(--text-soft)] mb-2 tracking-widest">{toUpperPreserved(group.label)}</p>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        </main>
  );
}

// Thin bar under the header that fills as the reader scrolls through a post.
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 });
  return <m.div className="reading-progress" style={{ scaleX }} aria-hidden="true" />;
}

const skeletonLineWidths = ["100%", "96%", "98%", "72%", "100%", "94%", "58%"];

function BlogPostPage() {
  const { slug } = useParams();
  const post = blogData.posts.find(entry => entry.slug === slug);
  const prerenderedPost = useContext(PrerenderedPostContext);
  const [contentHtml, setContentHtml] = useState(() => initialPostHtml(prerenderedPost, slug));
  const [loadFailed, setLoadFailed] = useState(false);
  const contentRef = useRef(null);
  const hasInitialContent = contentHtml !== null;
  const { headings, minutes } = articleDetails(contentHtml);
  usePageMeta(post ? postMeta(post) : notFoundMeta);

  useEffect(() => {
    if (!post || hasInitialContent) return;
    let active = true;
    loadPostHtml(post)
      .then(html => {
        if (active) setContentHtml(html);
      })
      // A failed chunk load usually means a deploy replaced the old assets; a reload fixes it.
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [post, hasInitialContent]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || contentHtml === null) return;

    const codeBlocks = [...root.querySelectorAll("pre")];
    const cleanup = [];

    for (const block of codeBlocks) {
      if (block.dataset.copyReady === "true") continue;

      // Medium posts use bare <pre> blocks; markdown wraps code in <pre><code>.
      // Read the text before the button is appended so "Copy" isn't copied with it.
      const codeText = (block.querySelector("code") ?? block).innerText;
      block.dataset.copyReady = "true";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy-button interactive-focus";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code sample");
      button.setAttribute("aria-live", "polite");
      let copyTimerId;

      const resetLabel = () => {
        window.clearTimeout(copyTimerId);
        copyTimerId = window.setTimeout(() => {
          button.textContent = "Copy";
          button.setAttribute("aria-label", "Copy code sample");
        }, 1500);
      };

      const handleClick = async () => {
        try {
          await navigator.clipboard.writeText(codeText);
          button.textContent = "Copied";
          button.setAttribute("aria-label", "Code copied");
          resetLabel();
        } catch {
          button.textContent = "Try again";
          button.setAttribute("aria-label", "Copy failed. Try copying again");
          resetLabel();
        }
      };

      button.addEventListener("click", handleClick);
      block.appendChild(button);

      cleanup.push(() => {
        window.clearTimeout(copyTimerId);
        button.removeEventListener("click", handleClick);
        button.remove();
        delete block.dataset.copyReady;
      });
    }

    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, [contentHtml]);

  if (!post) {
    return <NotFoundPage />;
  }

  return (
    <main id="main-content" tabIndex={-1} className="site-shell article-page">
      <ReadingProgress />
      <div className="article-back"><Link to="/blogs" className="text-link interactive-focus">← All writing</Link></div>
      <article>
        <header className="article-header">
          <Tag label={post.topic} color={topicColor(post.topic)} />
          <h1>{post.title}</h1>
          <div className="article-byline">
            <span>{profile.name}</span>
            {post.publishedAt && <time dateTime={new Date(post.publishedAt).toISOString()}>{postDateFormatter.format(new Date(post.publishedAt))}</time>}
            {minutes && <span>{minutes} min read</span>}
          </div>
        </header>
        <div className="article-layout">
          <div className="article-body">
            {headings.length > 1 && (
              <details className="article-toc">
                <summary>On this page</summary>
                <nav aria-label="Article sections">{headings.map(heading => <a key={heading.id} href={`#${heading.id}`} className="interactive-focus">{heading.title}</a>)}</nav>
              </details>
            )}
            {contentHtml !== null ? (
              <div ref={contentRef} data-post-slug={post.slug} className="blog-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            ) : loadFailed ? (
              <p role="alert">This post couldn’t be loaded. <a href={`/blog/${post.slug}`} className="inline-link interactive-focus">Reload the page</a> to try again.</p>
            ) : (
              <div className="flex flex-col gap-4" aria-busy="true" role="status">
                <span className="sr-only">Loading post…</span>
                {skeletonLineWidths.map((width, i) => <div key={i} className="skeleton" style={{ width }} aria-hidden="true" />)}
              </div>
            )}
          </div>
        </div>
      </article>
      <div className="article-end"><p>Thanks for reading.</p><Link to="/blogs" className="text-link interactive-focus">More writing<HiOutlineArrowRight aria-hidden="true" /></Link></div>
    </main>
  );
}

function NotFoundPage() {
  usePageMeta(notFoundMeta);
  return (
      <main id="main-content" tabIndex={-1} className="site-shell not-found-page">
        <div className="page-heading">
          <p className="section-kicker">Navigation</p>
          <h1 className="mt-4 font-display text-5xl leading-tight">Page not found</h1>
          <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
            The page you tried to open does not exist. You can return home or explore the writing archive.
          </p>
          <Link to="/" className="inline-link interactive-focus mt-6 inline-flex">
            Return Home
          </Link>
        </div>
      </main>
  );
}

/* ── Analytics ──────────────────────────────────────────────────── */

// posthog-js is ~90 kB gzipped, so it is only fetched when a key is configured
// and stays out of the initial bundle otherwise.
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
let posthogReady = null;
function loadPosthog() {
  if (!posthogKey) return Promise.resolve(null);
  if (!posthogReady) {
    posthogReady = import("posthog-js").then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: "https://us.i.posthog.com",
        // Only capture explicit pageview events — no clicks, forms, or inputs
        autocapture: false,
        capture_pageview: false,
        // No session recordings or heatmaps
        disable_session_recording: true,
        disable_heatmaps: true,
        // Store nothing in cookies or localStorage — memory only
        persistence: "memory",
        // Honour the browser's Do Not Track setting
        respect_dnt: true
      });
      return posthog;
    });
  }
  return posthogReady;
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    let active = true;
    loadPosthog().then(posthog => {
      if (active && posthog) {
        posthog.capture("$pageview", { $current_url: window.location.href });
      }
    });
    return () => {
      active = false;
    };
  }, [location.pathname]);
  return null;
}

/* ── Root app ────────────────────────────────────────────────────── */

function PageTransition({ children }) {
  return (
    <div className="page-transition">
      {children}
    </div>
  );
}

function Layout({ theme, onToggleTheme, children }) {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
        target.focus({ preventScroll: true });
      }
    } else if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
    previousPath.current = pathname;
  }, [pathname, hash]);

  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
      {children}
      <div className="site-shell"><PageFooter /></div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
      <Route path="/blogs" element={<PageTransition><BlogsListPage /></PageTransition>} />
      <Route path="/talks" element={<PageTransition><TalksListPage /></PageTransition>} />
      <Route path="/resume" element={<PageTransition><ResumePage /></PageTransition>} />
      <Route path="/blog/:slug" element={<PageTransition><BlogPostPage /></PageTransition>} />
      <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
    </Routes>
  );
}

// Everything inside the router. The browser wraps it in BrowserRouter (App below);
// src/entry-server.jsx wraps it in StaticRouter to prerender each route.
export function Site() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  // Follow the OS setting until the visitor picks a theme explicitly.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = event => {
      if (!readSavedTheme()) setTheme(event.matches ? "dark" : "light");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Reveals the new theme as a circle growing out of the toggle button, using the
  // View Transitions API where available; otherwise the theme just switches.
  const toggleTheme = event => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    saveTheme(nextTheme);
    const commit = () => flushSync(() => setTheme(nextTheme));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduceMotion) {
      commit();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    document.startViewTransition(commit).ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {
        // The browser skipped the transition; the theme has still been applied.
      });
  };

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <PageTracker />
        <Layout theme={theme} onToggleTheme={toggleTheme}>
          <AnimatedRoutes />
        </Layout>
      </MotionConfig>
    </LazyMotion>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  );
}
