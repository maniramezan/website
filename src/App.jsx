import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/core";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import objectivec from "highlight.js/lib/languages/objectivec";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark-dimmed.css";

hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("objectivec", objectivec);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("xml", xml);
import {
  HiOutlineArrowRight,
  HiOutlineBars3,
  HiOutlineEnvelope,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineXMark,
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
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import posthog from "posthog-js";
import blogData from "./generated/blog-posts.json";

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
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
  respect_dnt: true,
});
import {
  podcasts,
  profile,
  openSourceProjects,
  resumeEducation,
  resumeExperience,
  resumeSkillGroups,
  socials,
  talks
} from "./data/profile";

marked.use(markedHighlight({
  langPrefix: "hljs language-",
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  }
}));

const markdownModules = import.meta.glob([
  "./content/blogs/**/*.md",
  "!./content/blogs/**/_*.md"
], {
  query: "?raw",
  import: "default",
  eager: false
});

const htmlModules = import.meta.glob("./content/blogs/*.html", {
  query: "?raw",
  import: "default",
  eager: false
});

const getMarkdownModule = (contentFile) => {
  const path = Object.keys(markdownModules).find((p) => p.endsWith(contentFile));
  return path ? markdownModules[path] : null;
};

const getHtmlModule = (contentFile) => {
  const path = Object.keys(htmlModules).find(p => p.endsWith(contentFile));
  return path ? htmlModules[path] : null;
};

const socialIcons = {
  linkedin: FaLinkedin,
  github: SiGithub,
  twitter: SiX,
  bluesky: SiBluesky,
  mastodon: SiMastodon,
  speakerDeck: SiSpeakerdeck
};

const socialPalette = {
  linkedin: {
    color: "#0A66C2",
    background: "rgba(10, 102, 194, 0.12)",
    border: "rgba(10, 102, 194, 0.24)"
  },
  github: {
    color: "#24292F",
    background: "rgba(36, 41, 47, 0.1)",
    border: "rgba(36, 41, 47, 0.2)",
    darkColor: "#F0F6FC",
    darkBackground: "rgba(240, 246, 252, 0.08)",
    darkBorder: "rgba(240, 246, 252, 0.18)"
  },
  twitter: {
    color: "#111111",
    background: "rgba(17, 17, 17, 0.08)",
    border: "rgba(17, 17, 17, 0.18)",
    darkColor: "#F5F5F5",
    darkBackground: "rgba(245, 245, 245, 0.08)",
    darkBorder: "rgba(245, 245, 245, 0.18)"
  },
  bluesky: {
    color: "#1185FE",
    background: "rgba(17, 133, 254, 0.12)",
    border: "rgba(17, 133, 254, 0.24)"
  },
  mastodon: {
    color: "#6364FF",
    background: "rgba(99, 100, 255, 0.12)",
    border: "rgba(99, 100, 255, 0.24)"
  },
  speakerDeck: {
    color: "#05998B",
    background: "rgba(5, 153, 139, 0.12)",
    border: "rgba(5, 153, 139, 0.24)"
  }
};

const themeStorageKey = "mani-theme";
const postDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric"
});

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(themeStorageKey);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
  return (
    <motion.span
      className={`tag tag-${color}`}
      whileHover={{ scale: 1.06, y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {toUpperPreserved(label)}
    </motion.span>
  );
}

// Fades/slides content in the moment it scrolls into view, once.
function Reveal({ children, delay = 0, className, as: Component = motion.div, y = 22, ...rest }) {
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
    <motion.button
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
        <motion.span
          key={theme}
          className="inline-flex"
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </motion.button>
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
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="social-link interactive-focus"
      style={{
        "--social-color": palette?.color,
        "--social-bg": palette?.background,
        "--social-border": palette?.border,
        "--social-color-dark": palette?.darkColor ?? palette?.color,
        "--social-bg-dark": palette?.darkBackground ?? palette?.background,
        "--social-border-dark": palette?.darkBorder ?? palette?.border,
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

// Slow-drifting gradient blobs behind the hero — purely decorative, ignored by prefers-reduced-motion via MotionConfig.
function AmbientOrbs() {
  return (
    <div className="ambient-orbs" aria-hidden="true">
      <motion.div
        className="ambient-orb ambient-orb-rose"
        animate={{ x: [0, 24, -12, 0], y: [0, -18, 14, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="ambient-orb ambient-orb-lilac"
        animate={{ x: [0, -20, 16, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="ambient-orb ambient-orb-sage"
        animate={{ x: [0, 16, -18, 0], y: [0, -14, 18, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

const navItems = [
  { to: "/", label: "Home" },
  { to: "/blogs", label: "Blogs" },
  { to: "/talks", label: "Talks" },
  { to: "/resume", label: "Resume" }
];

function NavLink({ to, label, onClick, className = "" }) {
  const location = useLocation();
  const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link interactive-focus relative ${className}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="relative z-10">{label}</span>
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-full bg-[var(--surface-strong)] border border-[var(--border-strong)]"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </Link>
  );
}

function SiteHeader({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef(null);
  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

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
              onClick={closeMenu}
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
            <motion.button
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
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 sm:hidden"
              onClick={closeMenu}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            {/* Menu panel */}
            <motion.div
              id="mobile-menu"
              className="fixed top-[60px] inset-x-0 z-40 sm:hidden border-b border-[var(--border)] overflow-hidden"
              style={navBg}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <nav aria-label="Mobile" className="mx-auto max-w-3xl px-5 py-3 flex flex-col">
                {navItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="nav-link interactive-focus text-base py-3"
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mx-auto max-w-3xl px-5 pb-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                {navSocialIds.map(id => {
                  const s = socials.find(x => x.id === id);
                  return s ? <SocialIconLink key={id} id={id} label={s.label} url={s.url} small /> : null;
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Card components ─────────────────────────────────────────────── */

function PostCard({ post }) {
  return (
    <motion.div
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
    </motion.div>
  );
}

function TalkCard({ talk }) {
  const hasEmbed = talk.youtube || talk.speakerDeckId;
  const youtubeEmbedSrc = talk.youtube
    ? `https://www.youtube.com/embed/${talk.youtube}${talk.youtubeStart ? `?start=${talk.youtubeStart}` : ""}`
    : null;
  const youtubeWatchHref = talk.youtube
    ? `https://www.youtube.com/watch?v=${talk.youtube}${talk.youtubeStart ? `&t=${talk.youtubeStart}` : ""}`
    : null;
  return (
    <motion.article
      className="surface-card content-card rounded-[24px] overflow-hidden"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
    >
      {youtubeEmbedSrc ? (
        <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={youtubeEmbedSrc}
            title={talk.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : talk.speakerDeckId ? (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://speakerdeck.com/player/${talk.speakerDeckId}`}
            title={talk.title}
            allow="fullscreen"
            allowFullScreen
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
    </motion.article>
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

  return (
      <main id="main-content" className="relative mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        <AmbientOrbs />

        {/* Hero */}
        <motion.header
          className="relative pt-14 sm:pt-20 pb-16 sm:pb-20"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.p
            variants={fadeUp}
            className="section-kicker mb-4"
            style={{ color: "var(--accent-rose)" }}
          >
            {profile.role} · {profile.location}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-display leading-[0.95] tracking-[-0.045em] text-[var(--text-strong)]"
            style={{ fontSize: "clamp(2.8rem, 12vw, 4.75rem)" }}
          >
            <span className="text-[var(--accent-lilac)]">Mani</span> Ramezan
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-xl text-base sm:text-lg leading-8 text-[var(--text-muted)]">
            {profile.shortBio}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
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
          </motion.div>
        </motion.header>

        {/* About */}
        <Reveal as={motion.section} id="about" className="section-anchor pb-14" y={16}>
          <h2 className="section-kicker" style={{ color: "var(--accent-rose)" }}>About</h2>
          <div className="mt-5 space-y-4 max-w-2xl">
            <p className="text-base leading-8 text-[var(--text-muted)]">
              Independent iOS engineer and founder of Arjang Consulting, with 12+ years building iOS
              products, including staff-level roles at LinkedIn and Amazon. I focus on architecture,
              testing, and developer experience.
            </p>
            <p className="text-base leading-8 text-[var(--text-muted)]">
              Outside of work I write about engineering patterns I&apos;ve found genuinely useful —
              practical techniques that make day-to-day iOS development less painful. I also speak
              at iOS conferences about testing, architecture, and Xcode tooling.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[["sage","Swift"],["sage","iOS"],["lilac","Architecture"],["sage","Testing"],["rose","CI/CD"]].map(([color, label]) => (
              <Tag key={label} label={label} color={color} />
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
            <h2 className="section-kicker" style={{ color: "var(--accent-lilac)" }}>Talks</h2>
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
  return (
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        <header className="pt-12 sm:pt-16 pb-10">
          <p className="section-kicker" style={{ color: "var(--accent-lilac)" }}>Speaking</p>
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
  const visibleOpenSourceProjects = showAllOpenSource
    ? openSourceProjects
    : openSourceProjects.slice(0, 4);
  const hiddenOpenSourceCount = openSourceProjects.length - visibleOpenSourceProjects.length;

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
        <Reveal as={motion.section} className="py-10 border-b border-[var(--border)]" y={16}>
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
        <Reveal as={motion.section} className="py-10 border-b border-[var(--border)]" y={16}>
          <h2 className="section-kicker mb-6" style={{ color: "var(--accent-rose)" }}>Community</h2>
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-display text-lg text-[var(--text-strong)]">Kodeco</p>
                <span className="text-sm text-[var(--text-soft)]">Feb 2020 – Feb 2026</span>
              </div>
              <ul className="mt-2 space-y-1">
                {[
                  "Tech editor on multiple published tutorials.",
                  "Discord moderator helping with overall questions and Apple-specific topics.",
                  "Mentoring and running bootcamps on Becoming iOS Developer and Introduction to Apple Intelligence."
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
                  {showAllOpenSource ? "Show fewer" : `Show all ${openSourceProjects.length}`}
                </button>
              </div>
              <ul className="mt-2 space-y-1.5">
                {visibleOpenSourceProjects.map(project => (
                  <li key={project.name} className="flex gap-2 text-base leading-7 text-[var(--text-muted)]">
                    <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
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
              {!showAllOpenSource && hiddenOpenSourceCount > 0 ? (
                <p className="mt-2 text-sm text-[var(--text-soft)]">
                  {hiddenOpenSourceCount} more open-source projects hidden to keep the resume compact.
                </p>
              ) : null}
            </div>
            <div>
              <p className="font-display text-lg text-[var(--text-strong)]">Conference Speaking</p>
              <p className="mt-1 text-base leading-7 text-[var(--text-muted)]">
                Speaker at iOSoho and Kodeco on modularization, testing, release management, and Apple Intelligence.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Skills */}
        <Reveal as={motion.section} className="py-10" y={16}>
          <h2 className="section-kicker mb-6" style={{ color: "var(--accent-lilac)" }}>Skills</h2>
          <div className="space-y-5">
            {resumeSkillGroups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-[var(--text-soft)] mb-2 tracking-widest">{toUpperPreserved(group.label)}</p>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:text-[var(--text-strong)] transition-colors duration-150 cursor-default"
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

function BlogPostPage() {
  const { slug } = useParams();
  const post = blogData.posts.find(entry => entry.slug === slug);
  const [contentHtml, setContentHtml] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | ${profile.name}`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", post.excerpt);
    } else {
      document.title = "Post Not Found";
    }
    return () => { document.title = profile.name; };
  }, [post]);

  useEffect(() => {
    async function loadContent() {
      if (!post) return;
      if (post.contentType === "html") {
        const loader = getHtmlModule(post.contentFile);
        if (loader) {
          const raw = await loader();
          const accessibleHtml = raw
            .replace(/<h[2-6]/g, "<h2")
            .replace(/<\/h[2-6]>/g, "</h2>")
            .replace(/<pre>/g, '<pre tabindex="0">')
            .replace(/<pre /g, '<pre tabindex="0" ');
          setContentHtml(accessibleHtml);
        }
      } else {
        const loader = getMarkdownModule(post.contentFile);
        if (loader) {
          const raw = await loader();
          const accessibleHtml = marked.parse(raw)
            .replace(/<pre>/g, '<pre tabindex="0">')
            .replace(/<pre /g, '<pre tabindex="0" ');
          setContentHtml(accessibleHtml);
        }
      }
    }
    loadContent();
  }, [slug, post]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || contentHtml === null) return;

    const codeBlocks = [...root.querySelectorAll("pre")];
    const cleanup = [];

    for (const block of codeBlocks) {
      if (block.dataset.copyReady === "true") continue;

      const code = block.querySelector("code");
      if (!code) continue;

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
          await navigator.clipboard.writeText(code.innerText);
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

  if (!post || contentHtml === null) {
    return (
        <main id="main-content" className="mx-auto max-w-[660px] px-5 sm:px-8 pb-16 pt-12">
          {post ? (
            <p className="text-base leading-8 text-[var(--text-muted)]">Loading…</p>
          ) : (
            <>
              <p className="section-kicker">Writing</p>
              <h1 className="mt-4 font-display text-5xl leading-tight">Post not found</h1>
              <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                The requested article is missing or the slug no longer matches the generated content.
              </p>
            </>
          )}
        </main>
    );
  }

  return (
      <main id="main-content" className="mx-auto max-w-[660px] px-5 sm:px-8 pb-20">
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
          <div
            ref={contentRef}
            className="blog-content mt-12 pb-20"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
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

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [location.pathname]);
  return null;
}

/* ── Root app ────────────────────────────────────────────────────── */

// Fades/slides the page content on route change; exit is driven by AnimatePresence in AnimatedRoutes.
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
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
  return (
    <AnimatePresence mode="wait" initial={false}>
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

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", theme === "dark" ? "#181a1f" : "#f6f1ec");
    }
  }, [theme]);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <PageTracker />
        <Layout theme={theme} onToggleTheme={toggleTheme}>
          <AnimatedRoutes />
        </Layout>
      </BrowserRouter>
    </MotionConfig>
  );
}
