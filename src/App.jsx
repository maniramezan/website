import { useEffect, useState } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";
import {
  HiOutlineMoon,
  HiOutlineSun,
} from "react-icons/hi2";
import {
  SiBluesky,
  SiGithub,
  SiLinkedin,
  SiMastodon,
  SiSpeakerdeck,
  SiX
} from "react-icons/si";
import { BrowserRouter, Link, Route, Routes, useParams } from "react-router-dom";
import blogData from "./generated/blog-posts.json";
import { highlights, openSourceProjects, profile, socials, talks } from "./data/profile";


marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
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
  linkedin: SiLinkedin,
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
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(themeStorageKey);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function SectionTitle({ eyebrow, title, body }) {
  return (
    <div className="max-w-3xl">
      <p className="section-kicker">{eyebrow}</p>
      <h2 className="balanced-title mt-4 font-display text-4xl leading-tight text-[var(--text-strong)] sm:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)] sm:text-lg">
          {body}
        </p>
      ) : null}
    </div>
  );
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

function SocialIconLink({ id, label, url }) {
  const Icon = socialIcons[id];
  const palette = socialPalette[id];
  if (!Icon || !url) {
    return null;
  }

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
        "--social-border-dark": palette?.darkBorder ?? palette?.border
      }}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </a>
  );
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SiteHeader({ theme, onToggleTheme, compact = false }) {
  return (
    <header className={compact ? "pt-6" : "pt-6 sm:pt-8"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="interactive-focus inline-block rounded-md">
            <p className="font-display text-5xl leading-none tracking-[-0.04em] text-[var(--text-strong)] sm:text-6xl">
              {profile.name}
            </p>
          </Link>
          <p className="mt-3 text-sm font-medium text-[var(--text-muted)]">{profile.role}</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          {!compact ? (
            <nav
              aria-label="Sections"
              className="flex flex-wrap items-center justify-end gap-2 text-sm text-[var(--text-muted)]"
            >
              {[
                ["about", "About"],
                ["blog", "Writing"],
                ["projects", "Open Source"],
                ["talks", "Talks"],
                ["contact", "Contact"]
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="nav-link interactive-focus"
                >
                  {label}
                </button>
              ))}
            </nav>
          ) : (
            <Link to="/" className="nav-link interactive-focus inline-flex">
              Back Home
            </Link>
          )}

          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}

function HomePage({ theme, onToggleTheme }) {
  const posts = blogData.posts;

  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="mx-auto max-w-6xl px-6 pb-24 sm:px-8 lg:px-10">
        <SiteHeader theme={theme} onToggleTheme={onToggleTheme} />

        <main id="main-content" className="pt-12">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-start">
            <div className="max-w-3xl">
              <h1 className="balanced-title font-display text-5xl leading-[0.96] text-[var(--text-strong)] sm:text-7xl">
                Reliable iOS work, practical writing, and talks grounded in real teams.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-muted)] sm:text-[1.2rem]">
                {profile.summary} I care about software that reads clearly, ships cleanly, and
                keeps working once the launch energy is gone.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {socials.map((social) => (
                  <SocialIconLink
                    key={`hero-${social.id}`}
                    id={social.id}
                    label={social.label}
                    url={social.url}
                  />
                ))}
              </div>
            </div>

            <aside className="surface-card rounded-[28px] p-6 sm:p-7">
              <p className="section-kicker">Current Focus</p>
              <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">{profile.shortBio}</p>
              <ul className="mt-6 space-y-4">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-[var(--text-muted)]">
                    <span aria-hidden className="mt-2 h-2 w-2 rounded-full bg-[var(--accent-sage)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          <section id="about" className="section-anchor mt-20">
            <SectionTitle
              eyebrow="About"
              title="I work on mobile products that need to stay clear, dependable, and maintainable."
              body="Most of my work sits around Apple platforms, testing, architecture, and the day-to-day engineering habits that make teams faster without making systems harder to live with."
            />
          </section>

          <section id="blog" className="section-anchor mt-20">
            <SectionTitle
              eyebrow="Writing"
              title="Posts on testing, architecture, and shipping software well."
              body="Long-form notes from production work, conference material, and engineering habits that scale better than short-term fixes."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="surface-card content-card rounded-[26px] p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <p className="tag tag-sage">{post.topic}</p>
                    {post.publishedAt ? (
                      <p className="text-[var(--text-soft)]">
                        {postDateFormatter.format(new Date(post.publishedAt))}
                      </p>
                    ) : null}
                  </div>

                  <h3 className="mt-5 font-display text-3xl leading-tight text-[var(--text-strong)]">
                    {post.title}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">{post.excerpt}</p>

                  <Link to={`/blog/${post.slug}`} className="inline-link interactive-focus mt-6 inline-flex">
                    Read Post
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section id="projects" className="section-anchor mt-20">
            <SectionTitle
              eyebrow="Open Source"
              title="Projects I use, publish, and keep maintained."
              body="Small, practical tools. The goal is less ceremony, less repeated boilerplate, and better defaults for everyday engineering work."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {openSourceProjects.map((project) => (
                <article
                  key={project.url}
                  className="surface-card content-card rounded-[26px] p-6 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <p className="tag tag-lilac">{project.language}</p>
                    <p className="tag tag-rose">{project.stars} stars</p>
                  </div>

                  <h3 className="mt-5 font-display text-3xl leading-tight text-[var(--text-strong)]">
                    {project.name}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                    {project.description}
                  </p>

                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-link interactive-focus mt-6 inline-flex"
                  >
                    View Repository
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="talks" className="section-anchor mt-20">
            <SectionTitle
              eyebrow="Talks"
              title="Recent presentations on Xcode, testing, and modular delivery."
              body="Slides and talks centered on workflows teams can actually adopt, not just demo-stage ideas."
            />

            <div className="mt-8 space-y-4">
              {talks.map((talk) => (
                <article key={talk.url} className="surface-card content-card rounded-[24px] p-6 sm:p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-display text-3xl leading-tight text-[var(--text-strong)]">
                        {talk.title}
                      </h3>
                      <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
                        {talk.description}
                      </p>
                    </div>

                    <a
                      href={talk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-link interactive-focus shrink-0"
                    >
                      Open Deck
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="contact" className="section-anchor mt-20">
            <div className="surface-card rounded-[30px] p-8 sm:p-10">
              <p className="section-kicker">Contact</p>
              <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="max-w-3xl">
                  <h2 className="font-display text-4xl leading-tight text-[var(--text-strong)] sm:text-5xl">
                    If you&apos;re working on iOS architecture, testing, or developer tooling, let&apos;s talk.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-[var(--text-muted)] sm:text-lg">
                    Reach out for collaboration, speaking, or engineering consulting. The site stays
                    intentionally simple, so the fastest route is one of the profiles below.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {socials.map((social) => (
                    <SocialIconLink
                      key={`contact-${social.id}`}
                      id={social.id}
                      label={social.label}
                      url={social.url}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function BlogPostPage({ theme, onToggleTheme }) {
  const { slug } = useParams();
  const post = blogData.posts.find((entry) => entry.slug === slug);
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
    return () => {
      document.title = profile.name;
    };
  }, [post]);

  useEffect(() => {
    async function loadContent() {
      if (!post) return;
      if (post.contentType === "html") {
        const loader = getHtmlModule(slug);
        if (loader) {
          const raw = await loader();
          setContentHtml(raw);
        }
      } else {
        const loader = getMarkdownModule(slug);
        if (loader) {
          const raw = await loader();
          setContentHtml(marked.parse(raw));
        }
      }
    }
    loadContent();
  }, [slug, post]);

  if (!post || contentHtml === null) {
    return (
      <div className="min-h-screen text-[var(--text-strong)]">
        <div className="mx-auto max-w-5xl px-6 pb-16 sm:px-8 lg:px-10">
          <SiteHeader theme={theme} onToggleTheme={onToggleTheme} compact />
          <main id="main-content" className="pt-14">
            <div className="surface-card rounded-[28px] p-8 sm:p-10">
              {post ? (
                <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">Loading...</p>
              ) : (
                <>
                  <p className="section-kicker">Writing</p>
                  <h1 className="mt-4 font-display text-5xl leading-tight">Post not found</h1>
                  <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                    The requested article is missing or the slug no longer matches the generated content.
                  </p>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="mx-auto max-w-5xl px-6 pb-20 sm:px-8 lg:px-10">
        <SiteHeader theme={theme} onToggleTheme={onToggleTheme} compact />

        <main id="main-content" className="pt-12">
          <article>
            <p className="section-kicker">{post.topic}</p>
            <h1 className="balanced-title mt-4 font-display text-5xl leading-[0.96] text-[var(--text-strong)] sm:text-6xl">
              {post.title}
            </h1>
            {post.publishedAt ? (
              <p className="mt-5 text-sm text-[var(--text-soft)]">
                {postDateFormatter.format(new Date(post.publishedAt))}
              </p>
            ) : null}

            <div
              className="blog-content surface-card mt-10 rounded-[30px] p-7 sm:p-10"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </article>
        </main>
      </div>
    </div>
  );
}

function NotFoundPage({ theme, onToggleTheme }) {
  return (
    <div className="min-h-screen text-[var(--text-strong)]">
      <div className="mx-auto max-w-5xl px-6 pb-16 sm:px-8 lg:px-10">
        <SiteHeader theme={theme} onToggleTheme={onToggleTheme} compact />
        <main id="main-content" className="pt-14">
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
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(themeStorageKey, theme);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", theme === "dark" ? "#181316" : "#f6f1ec");
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage theme={theme} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/blog/:slug"
          element={
            <BlogPostPage
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          }
        />
        <Route
          path="*"
          element={
            <NotFoundPage
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
