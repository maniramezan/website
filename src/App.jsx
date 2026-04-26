import { useEffect, useState } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";
import {
  HiOutlineBars3,
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
  profile,
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

const getMarkdownModule = (slug) => {
  const path = Object.keys(markdownModules).find(p => p.endsWith(`${slug}.md`));
  return path ? markdownModules[path] : null;
};

const getHtmlModule = (slug) => {
  const path = Object.keys(htmlModules).find(p => p.endsWith(`${slug}.html`));
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
    <button
      type="button"
      onClick={onToggleTheme}
      className="theme-button interactive-focus"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}

function SocialIconLink({ id, label, url, small = false, tiny = false }) {
  const Icon = socialIcons[id];
  const palette = socialPalette[id];
  if (!Icon || !url) return null;
  const sizeStyle = tiny ? { width: "1.4rem", height: "1.4rem" } : small ? { width: "2rem", height: "2rem" } : {};
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

function SiteHeader({ theme, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)]" style={navBg}>
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
              <Link to="/" className="nav-link interactive-focus">Home</Link>
              <Link to="/blogs" className="nav-link interactive-focus">Blogs</Link>
              <Link to="/talks" className="nav-link interactive-focus">Talks</Link>
              <Link to="/resume" className="nav-link interactive-focus">Resume</Link>
            </nav>
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center border border-[var(--border)] rounded-full bg-[var(--surface)] text-[var(--text-strong)] w-[2.8rem] h-[2.8rem] cursor-pointer ml-1 transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)] interactive-focus"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen
                ? <HiOutlineXMark className="h-[18px] w-[18px]" aria-hidden="true" />
                : <HiOutlineBars3 className="h-[18px] w-[18px]" aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />
          {/* Menu panel */}
          <div
            id="mobile-menu"
            className="fixed top-[60px] inset-x-0 z-40 sm:hidden border-b border-[var(--border)]"
            style={navBg}
          >
            <nav aria-label="Mobile" className="mx-auto max-w-3xl px-5 py-3 flex flex-col">
              <Link to="/" className="nav-link interactive-focus text-base py-3" onClick={closeMenu}>Home</Link>
              <Link to="/blogs" className="nav-link interactive-focus text-base py-3" onClick={closeMenu}>Blogs</Link>
              <Link to="/talks" className="nav-link interactive-focus text-base py-3" onClick={closeMenu}>Talks</Link>
              <Link to="/resume" className="nav-link interactive-focus text-base py-3" onClick={closeMenu}>Resume</Link>
            </nav>
            <div className="mx-auto max-w-3xl px-5 pb-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
              {navSocialIds.map(id => {
                const s = socials.find(x => x.id === id);
                return s ? <SocialIconLink key={id} id={id} label={s.label} url={s.url} small /> : null;
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ── Card components ─────────────────────────────────────────────── */

function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="surface-card content-card rounded-[24px] p-5 sm:p-6 flex flex-col gap-3 cursor-pointer no-underline interactive-focus"
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
      <span className="inline-link mt-1 inline-flex text-sm">Read post →</span>
    </Link>
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
    <article className="surface-card content-card rounded-[24px] overflow-hidden">
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
    </article>
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

function HomePage({ theme, onToggleTheme }) {
  const posts = sortedPosts(blogData.posts);
  const talkList = sortedTalks(talks);
  const PREVIEW = 3;

  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />

      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        {/* Hero */}
        <header className="pt-12 sm:pt-16 pb-14 sm:pb-16">
          <h1
            className="font-display leading-none tracking-[-0.04em] text-[var(--text-strong)]"
            style={{ fontSize: "clamp(2.4rem, 11vw, 3.75rem)" }}
          >
            <span className="text-[var(--accent-lilac)]">Mani</span> Ramezan
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)]">{profile.subtitle}</p>
        </header>

        {/* About */}
        <section id="about" className="section-anchor pb-14">
          <h2 className="section-kicker" style={{ color: "var(--accent-rose)" }}>About</h2>
          <div className="mt-5 space-y-4 max-w-2xl">
            <p className="text-base leading-8 text-[var(--text-muted)]">
              Staff iOS Engineer with 12+ years building mobile applications at LinkedIn and Amazon.
              I drive technical initiatives across multiple teams, integrate AI-assisted development
              tools into daily workflow, and focus on developer experience improvements.
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
        </section>

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
            {posts.slice(0, PREVIEW).map(post => (
              <PostCard key={post.id} post={post} />
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
            {talkList.slice(0, PREVIEW).map(talk => (
              <TalkCard key={talk.url} talk={talk} />
            ))}
          </div>
        </section>

        <PageFooter showSocials />
      </main>
    </div>
  );
}

function BlogsListPage({ theme, onToggleTheme }) {
  const posts = sortedPosts(blogData.posts);
  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        <header className="pt-12 sm:pt-16 pb-10">
          <p className="section-kicker">Writing</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl leading-tight text-[var(--text-strong)]">
            All posts
          </h1>
        </header>
        <div className="flex flex-col gap-3 pb-14">
          <h2 className="sr-only">List of posts</h2>
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
        <PageFooter />
      </main>
    </div>
  );
}

function TalksListPage({ theme, onToggleTheme }) {
  const talkList = sortedTalks(talks);
  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pb-20">
        <header className="pt-12 sm:pt-16 pb-10">
          <p className="section-kicker" style={{ color: "var(--accent-lilac)" }}>Speaking</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl leading-tight text-[var(--text-strong)]">
            All talks
          </h1>
        </header>
        <div className="flex flex-col gap-3 pb-14">
          <h2 className="sr-only">List of talks</h2>
          {talkList.map(talk => <TalkCard key={talk.url} talk={talk} />)}
        </div>
        <PageFooter />
      </main>
    </div>
  );
}

function ResumePage({ theme, onToggleTheme }) {
  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
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
        <section className="py-10 border-b border-[var(--border)]">
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
                    <span className="text-sm font-semibold text-[var(--accent-sage)]">{job.company}</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {job.notes.map((note, ni) => (
                      <li key={ni} className="flex gap-2 text-sm leading-7 text-[var(--text-muted)]">
                        <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-[var(--text-soft)] whitespace-nowrap text-right shrink-0 pt-1">{job.period}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section className="py-10 border-b border-[var(--border)]">
          <h2 className="section-kicker mb-6" style={{ color: "var(--accent-lilac)" }}>Skills</h2>
          <div className="space-y-5">
            {resumeSkillGroups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-[var(--text-soft)] mb-2 tracking-widest">{toUpperPreserved(group.label)}</p>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:text-[var(--text-strong)] transition-colors duration-150"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Community */}
        <section className="py-10">
          <h2 className="section-kicker mb-6" style={{ color: "var(--accent-rose)" }}>Community</h2>
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-display text-lg text-[var(--text-strong)]">Kodeco</p>
                <span className="text-sm text-[var(--text-soft)]">Feb 2020 – Present</span>
              </div>
              <ul className="mt-2 space-y-1">
                {[
                  "Tech editor on multiple published tutorials.",
                  "Discord moderator helping with overall questions and Apple-specific topics.",
                  "Mentoring and running bootcamps on Becoming iOS Developer and Introduction to Apple Intelligence."
                ].map((note, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-7 text-[var(--text-muted)]">
                    <span className="shrink-0 text-[var(--text-soft)] select-none">–</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-lg text-[var(--text-strong)]">Open Source</p>
              <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
                <a
                  href="https://github.com/maniramezan/UserDefaultMacro"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-link interactive-focus"
                >
                  UserDefaultMacro
                </a>
                {" "}— Swift macros that reduce boilerplate when working with UserDefaults-backed storage on Apple platforms.
              </p>
            </div>
            <div>
              <p className="font-display text-lg text-[var(--text-strong)]">Conference Speaking</p>
              <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
                Speaker at iOSoho and Kodeco on modularization, testing, release management, and Apple Intelligence.
              </p>
            </div>
          </div>
        </section>

        <PageFooter />
      </main>
    </div>
  );
}

function BlogPostPage({ theme, onToggleTheme }) {
  const { slug } = useParams();
  const post = blogData.posts.find(entry => entry.slug === slug);
  const [contentHtml, setContentHtml] = useState(null);

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
        const loader = getHtmlModule(slug);
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
        const loader = getMarkdownModule(slug);
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

  if (!post || contentHtml === null) {
    return (
      <div className="min-h-screen text-[var(--text-strong)]">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
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
    </div>
  );
}

function NotFoundPage({ theme, onToggleTheme }) {
  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />
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
    </div>
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
    <BrowserRouter>
      <PageTracker />
      <Routes>
        <Route path="/" element={<HomePage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/blogs" element={<BlogsListPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/talks" element={<TalksListPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/resume" element={<ResumePage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/blog/:slug" element={<BlogPostPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="*" element={<NotFoundPage theme={theme} onToggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}
