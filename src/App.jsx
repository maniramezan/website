import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import {
  HiOutlineArrowRight,
  HiOutlineBars3,
  HiOutlineEnvelope,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineXMark,
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
import { BrowserRouter, Link, Route, Routes, useLocation, useParams } from "react-router-dom";
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

// Both Medium HTML and marked output need focusable <pre> blocks so code blocks
// can be scrolled by keyboard.
const withPreTabIndex = html => html
  .replace(/<pre>/g, '<pre tabindex="0">')
  .replace(/<pre /g, '<pre tabindex="0" ');

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
    return withPreTabIndex(accessibleHtml);
  }
  const [{ renderMarkdown }, raw] = await Promise.all([loadMarkdownModule(), loader()]);
  return withPreTabIndex(renderMarkdown(raw));
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
const themeColors = { light: "#f6f1ec", dark: "#1c1719" };
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

// Fades/slides content in the moment it scrolls into view, once.
function Reveal({ children, delay = 0, className, as: Component = m.div, y = 22, ...rest }) {
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Component>
  );
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

function SocialIconLink({ id, label, url, small = false, tiny = false }) {
  const Icon = socialIcons[id];
  const palette = socialPalette[id];
  if (!Icon || !url) return null;
  const sizeStyle = tiny ? { width: "1.5rem", height: "1.5rem" } : small ? { width: "2rem", height: "2rem" } : {};
  const iconClass = tiny ? "h-2.5 w-2.5" : small ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";
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
        "--social-color-dark": palette?.darkColor,
        ...sizeStyle
      }}
    >
      <Icon className={iconClass} aria-hidden="true" />
    </a>
  );
}

// Social icons shown in the nav (main platforms only to avoid crowding)
const navSocialIds = ["linkedin", "github", "speakerDeck", "twitter", "bluesky", "mastodon"];

/* ── Shared nav ─────────────────────────────────────────────────── */

const navBg = {
  background: "var(--nav-bg)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)"
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
};

// Slow-drifting gradient blobs behind the hero — purely decorative. The drift is a
// CSS animation (compositor-only) that the reduced-motion rule in index.css stops.
function AmbientOrbs() {
  return (
    <div className="ambient-orbs" aria-hidden="true">
      <div className="ambient-orb ambient-orb-rose" />
      <div className="ambient-orb ambient-orb-lilac" />
      <div className="ambient-orb ambient-orb-sage" />
    </div>
  );
}

const navItems = [
  { to: "/", label: "Home" },
  { to: "/blogs", label: "Blogs" },
  { to: "/talks", label: "Talks" },
  { to: "/resume", label: "Resume" }
];

function useIsActiveRoute(to) {
  const { pathname } = useLocation();
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

function NavLink({ to, label }) {
  const isActive = useIsActiveRoute(to);
  return (
    <Link
      to={to}
      className="nav-link interactive-focus relative"
      aria-current={isActive ? "page" : undefined}
    >
      <span className="relative z-10">{label}</span>
      {isActive && (
        <m.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-full bg-[var(--surface-strong)] border border-[var(--border-strong)]"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </Link>
  );
}

function MobileNavLink({ to, label }) {
  const isActive = useIsActiveRoute(to);
  return (
    <Link
      to={to}
      className="nav-link nav-link-mobile interactive-focus text-base py-3"
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function SiteHeader({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef(null);
  const { pathname } = useLocation();

  // Dismissing the menu (Escape, backdrop) returns focus to the button that opened it.
  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  // Any navigation — a menu link, the logo, or browser back/forward — closes the menu.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b transition-shadow duration-300"
        style={{
          ...navBg,
          borderColor: "var(--border)",
          boxShadow: scrolled ? "0 8px 30px -14px var(--border-strong)" : "none"
        }}
      >
        <div className="mx-auto max-w-3xl px-5 sm:px-8 flex items-center justify-between h-[60px]">
          {/* Left: name + social icons below */}
          <div className="flex flex-col justify-center min-w-0">
            <Link
              to="/"
              className="font-display text-base sm:text-lg tracking-[-0.03em] text-[var(--text-strong)] hover:text-[var(--accent-lilac)] transition-colors duration-150 shrink-0 interactive-focus rounded-sm leading-tight"
            >
              {profile.name}
            </Link>
            <div className="flex items-center gap-0.5 mt-1">
              {navSocialIds.map(id => {
                const s = socials.find(x => x.id === id);
                return s ? <SocialIconLink key={id} id={id} label={s.label} url={s.url} tiny /> : null;
              })}
            </div>
          </div>

          {/* Right: desktop nav links + theme toggle + mobile hamburger */}
          <div className="flex items-center gap-0.5 shrink-0">
            <nav aria-label="Main" className="hidden sm:flex items-center gap-0.5">
              {navItems.map(item => <NavLink key={item.to} {...item} />)}
            </nav>
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
            <m.button
              ref={menuButtonRef}
              type="button"
              className="sm:hidden inline-flex items-center justify-center border border-[var(--border)] rounded-full bg-[var(--surface)] text-[var(--text-strong)] w-[2.8rem] h-[2.8rem] cursor-pointer ml-1 transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] interactive-focus"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(o => !o)}
              whileTap={{ scale: 0.92 }}
            >
              {menuOpen
                ? <HiOutlineXMark className="h-[18px] w-[18px]" aria-hidden="true" />
                : <HiOutlineBars3 className="h-[18px] w-[18px]" aria-hidden="true" />
              }
            </m.button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <m.div
              className="fixed inset-0 z-40 sm:hidden"
              onClick={closeMenu}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            {/* Menu panel */}
            <m.div
              id="mobile-menu"
              className="fixed top-[60px] inset-x-0 z-40 sm:hidden border-b border-[var(--border)] overflow-hidden"
              style={navBg}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <nav aria-label="Mobile" className="mx-auto max-w-3xl px-5 py-3 flex flex-col">
                {navItems.map(item => <MobileNavLink key={item.to} {...item} />)}
              </nav>
              <div className="mx-auto max-w-3xl px-5 pb-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                {navSocialIds.map(id => {
                  const s = socials.find(x => x.id === id);
                  return s ? <SocialIconLink key={id} id={id} label={s.label} url={s.url} small /> : null;
                })}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Card components ─────────────────────────────────────────────── */

function PostCard({ post }) {
  return (
    <m.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
    >
      <Link
        to={`/blog/${post.slug}`}
        className="surface-card content-card rounded-[24px] p-5 sm:p-6 flex flex-col gap-3 cursor-pointer no-underline interactive-focus group"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className={`tag tag-${topicColor(post.topic)}`}>{post.topic}</p>
          {post.publishedAt ? (
            <p className="text-[var(--text-soft)] text-xs">
              {postDateFormatter.format(new Date(post.publishedAt))}
            </p>
          ) : null}
        </div>
        <h3 className="font-display text-xl sm:text-2xl leading-tight text-[var(--text-strong)]">
          {post.title}
        </h3>
        <p className="text-sm leading-7 text-[var(--text-muted)]">{post.excerpt}</p>
        <span className="inline-link mt-1 inline-flex items-center gap-1 text-sm">
          Read post
          <HiOutlineArrowRight
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </Link>
    </m.div>
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

function TalkCard({ talk }) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const hasEmbed = talk.youtube || talk.speakerDeckId;
  const youtubeWatchHref = talk.youtube
    ? `https://www.youtube.com/watch?v=${talk.youtube}${talk.youtubeStart ? `&t=${talk.youtubeStart}` : ""}`
    : null;
  // Pointer events stop at an iframe's edge, so a lifted card would drop the moment the
  // cursor moved onto a live embed. Only lift while no iframe is on the card.
  const hasLiveIframe = videoPlaying || (!talk.youtube && talk.speakerDeckId);
  return (
    <m.article
      className="surface-card content-card rounded-[24px] overflow-hidden"
      whileHover={hasLiveIframe ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
    >
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
    </m.article>
  );
}

/* ── Page footer ─────────────────────────────────────────────────── */

function PageFooter({ showSocials = false }) {
  return (
    <footer className="border-t border-[var(--border)] pt-8 pb-2 flex items-center justify-between flex-wrap gap-3">
      <span className="text-sm text-[var(--text-soft)]">
        © {new Date().getFullYear()} {profile.name}
      </span>
      {showSocials && (
        <div className="flex items-center gap-1.5">
          {socials.map(s => (
            <SocialIconLink key={s.id} id={s.id} label={s.label} url={s.url} small />
          ))}
        </div>
      )}
    </footer>
  );
}

/* ── Pages ───────────────────────────────────────────────────────── */

function HomePage() {
  const posts = sortedPosts(blogData.posts);
  const talkList = sortedTalks(talks);
  const PREVIEW = 3;
  usePageMeta(pageMeta["/"]);

  return (
      <main id="main-content" className="relative mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        <AmbientOrbs />

        {/* Hero */}
        <m.header
          className="relative pt-14 sm:pt-20 pb-16 sm:pb-20"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          <m.p variants={fadeUp} className="section-kicker section-kicker-rose mb-4">
            {profile.role} · {profile.location}
          </m.p>
          <m.h1
            variants={fadeUp}
            className="font-display leading-[0.95] tracking-[-0.045em] text-[var(--text-strong)]"
            style={{ fontSize: "clamp(2.8rem, 12vw, 4.75rem)" }}
          >
            <span className="text-[var(--accent-lilac)]">Mani</span> Ramezan
          </m.h1>
          <m.p variants={fadeUp} className="mt-4 max-w-xl text-base sm:text-lg leading-8 text-[var(--text-muted)]">
            {profile.shortBio}
          </m.p>
          <m.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/blogs" className="hero-cta hero-cta-primary interactive-focus">
              Read my writing
              <HiOutlineArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/resume" className="hero-cta hero-cta-secondary interactive-focus">
              View resume
            </Link>
            <a
              href={`mailto:${profile.email}`}
              className="hero-cta hero-cta-secondary interactive-focus"
            >
              <HiOutlineEnvelope className="h-4 w-4" aria-hidden="true" />
              Get in touch
            </a>
          </m.div>
        </m.header>

        {/* About */}
        <Reveal as={m.section} id="about" className="section-anchor pb-14" y={16}>
          <h2 className="section-kicker section-kicker-rose">About</h2>
          <div className="mt-5 space-y-4 max-w-2xl">
            <p className="text-base leading-8 text-[var(--text-muted)]">
              Staff-level iOS engineer with 12+ years building mobile products at companies
              including LinkedIn and Amazon, and now leading a mobile team at Capital One. I focus on
              architecture, developer tooling, test automation, and AI-assisted development.
            </p>
            <p className="text-base leading-8 text-[var(--text-muted)]">
              Outside of work I write about engineering patterns I&apos;ve found genuinely useful —
              practical techniques that make day-to-day iOS development less painful. I also speak
              at iOS conferences about testing, architecture, and Xcode tooling.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Swift", "iOS", "Architecture", "Testing", "CI/CD"].map(label => (
              <Tag key={label} label={label} color={topicColor(label)} />
            ))}
          </div>
          {/* Social icons — shown here on mobile since nav hides them */}
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:hidden">
            {socials.map(s => (
              <SocialIconLink key={s.id} id={s.id} label={s.label} url={s.url} small />
            ))}
          </div>
        </Reveal>

        <div className="border-t border-[var(--border)] mb-14" />

        {/* Blogs preview */}
        <section id="blogs" className="section-anchor pb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-kicker">Blogs</h2>
            <Link to="/blogs" className="interactive-focus text-sm font-bold text-[var(--text-muted)] hover:text-[var(--link)] transition-colors duration-150 rounded-sm">
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {posts.slice(0, PREVIEW).map((post, i) => (
              <Reveal key={post.id} delay={Math.min(i, 4) * 0.07}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        </section>

        <div className="border-t border-[var(--border)] mb-14" />

        {/* Talks preview */}
        <section id="talks" className="section-anchor pb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-kicker section-kicker-lilac">Talks</h2>
            <Link to="/talks" className="interactive-focus text-sm font-bold text-[var(--text-muted)] hover:text-[var(--link)] transition-colors duration-150 rounded-sm">
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {talkList.slice(0, PREVIEW).map((talk, i) => (
              <Reveal key={talk.url} delay={Math.min(i, 4) * 0.07}>
                <TalkCard talk={talk} />
              </Reveal>
            ))}
          </div>
        </section>

        <PageFooter showSocials />
      </main>
  );
}

function BlogsListPage() {
  const posts = sortedPosts(blogData.posts);
  usePageMeta(pageMeta["/blogs"]);
  return (
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        <header className="pt-12 sm:pt-16 pb-10">
          <p className="section-kicker">Writing</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl leading-tight text-[var(--text-strong)]">
            All posts
          </h1>
        </header>
        <div className="flex flex-col gap-3 pb-14">
          <h2 className="sr-only">List of posts</h2>
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={Math.min(i, 6) * 0.05}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
        <PageFooter />
      </main>
  );
}

function TalksListPage() {
  const talkList = sortedTalks(talks);
  usePageMeta(pageMeta["/talks"]);
  return (
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        <header className="pt-12 sm:pt-16 pb-10">
          <p className="section-kicker section-kicker-lilac">Speaking</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl leading-tight text-[var(--text-strong)]">
            All talks
          </h1>
        </header>
        <div className="flex flex-col gap-3 pb-14">
          <h2 className="sr-only">List of talks</h2>
          {talkList.map((talk, i) => (
            <Reveal key={talk.url} delay={Math.min(i, 6) * 0.05}>
              <TalkCard talk={talk} />
            </Reveal>
          ))}
        </div>
        <PageFooter />
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
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        {/* Resume header */}
        <header className="pt-12 sm:pt-16 pb-8 border-b border-[var(--border)]">
          <h1
            className="font-display leading-none tracking-[-0.04em] text-[var(--text-strong)]"
            style={{ fontSize: "clamp(2.4rem, 11vw, 3.75rem)" }}
          >
            <span className="text-[var(--accent-lilac)]">Mani</span> Ramezan
          </h1>
        </header>

        {/* Experience */}
        <Reveal as={m.section} className="py-10 border-b border-[var(--border)]" y={16}>
          <h2 className="section-kicker mb-6">Experience</h2>
          {resumeExperience.map((job, i) => (
            <div
              key={i}
              className={`py-5 ${i < resumeExperience.length - 1 ? "border-b border-[var(--border)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-display text-lg leading-tight text-[var(--text-strong)]">{job.title}</span>
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
        </Reveal>

        {/* Community */}
        <Reveal as={m.section} className="py-10 border-b border-[var(--border)]" y={16}>
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
        </Reveal>

        {/* Skills */}
        <Reveal as={m.section} className="py-10" y={16}>
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
        </Reveal>

        <PageFooter />
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
      let copyTimerId;

      const resetLabel = () => {
        window.clearTimeout(copyTimerId);
        copyTimerId = window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1500);
      };

      const handleClick = async () => {
        try {
          await navigator.clipboard.writeText(codeText);
          button.textContent = "Copied";
          resetLabel();
        } catch {
          button.textContent = "Failed";
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
    return (
        <main id="main-content" className="mx-auto max-w-[660px] px-5 sm:px-8 pb-16 pt-12">
          <p className="section-kicker">Writing</p>
          <h1 className="mt-4 font-display text-5xl leading-tight">Post not found</h1>
          <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
            The requested article is missing or the slug no longer matches the generated content.
          </p>
        </main>
    );
  }

  return (
      <main id="main-content" className="mx-auto max-w-[660px] px-5 sm:px-8 pb-20">
        <ReadingProgress />
        <article>
          {/* Post header */}
          <header className="pt-12 sm:pt-14 pb-12 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Tag label={post.topic} color={topicColor(post.topic)} />
              {post.publishedAt && (
                <span className="text-sm text-[var(--text-soft)]">
                  {postDateFormatter.format(new Date(post.publishedAt))}
                </span>
              )}
            </div>
            <h1
              className="font-display tracking-[-0.035em] leading-[1.1] text-[var(--text-strong)]"
              style={{ fontSize: "clamp(1.9rem, 5vw, 2.8rem)", textWrap: "pretty" }}
            >
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-5 text-lg leading-[1.8] text-[var(--text-muted)] max-w-[540px]">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Prose content */}
          {contentHtml !== null ? (
            <div
              ref={contentRef}
              data-post-slug={post.slug}
              className="blog-content mt-12 pb-20"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : loadFailed ? (
            <p className="mt-12 pb-20 text-base leading-8 text-[var(--text-muted)]">
              This post couldn&apos;t be loaded.{" "}
              <a href={`/blog/${post.slug}`} className="inline-link interactive-focus">
                Reload the page
              </a>{" "}
              to try again.
            </p>
          ) : (
            <div className="mt-12 pb-20 flex flex-col gap-4" aria-busy="true">
              <span className="sr-only">Loading post…</span>
              {skeletonLineWidths.map((width, i) => (
                <div key={i} className="skeleton h-4" style={{ width }} aria-hidden="true" />
              ))}
            </div>
          )}
        </article>

        {/* Post footer */}
        <div className="border-t border-[var(--border)] pt-8 pb-12 flex items-center justify-between flex-wrap gap-3">
          <Link
            to="/blogs"
            className="inline-flex items-center text-sm font-semibold text-[var(--link)] border border-[var(--border)] rounded-full bg-[var(--surface)] px-4 py-2 transition-colors duration-150 hover:text-[var(--link-hover)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] interactive-focus"
          >
            ← All posts
          </Link>
          <span className="text-sm text-[var(--text-soft)]">
            © {new Date().getFullYear()} {profile.name}
          </span>
        </div>
      </main>
  );
}

function NotFoundPage() {
  usePageMeta(notFoundMeta);
  return (
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-16 pt-12">
        <div className="surface-card rounded-[28px] p-8 sm:p-10">
          <p className="section-kicker">Navigation</p>
          <h1 className="mt-4 font-display text-5xl leading-tight">Page not found</h1>
          <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
            The page you tried to open does not exist.
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

// Fades/slides the page content on route change; exit is driven by AnimatePresence in AnimatedRoutes.
function PageTransition({ children }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </m.div>
  );
}

// Header/nav stay mounted across route changes so the active-tab pill can animate
// between links instead of resetting (and re-entering from its layout default) on every navigation.
function Layout({ theme, onToggleTheme, children }) {
  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
      {children}
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  // Reset scroll once the old page has exited, so the new page never opens mid-scroll.
  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0, behavior: "instant" })}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/blogs" element={<PageTransition><BlogsListPage /></PageTransition>} />
        <Route path="/talks" element={<PageTransition><TalksListPage /></PageTransition>} />
        <Route path="/resume" element={<PageTransition><ResumePage /></PageTransition>} />
        <Route path="/blog/:slug" element={<PageTransition><BlogPostPage /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
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
