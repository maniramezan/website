const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Switch HashRouter to BrowserRouter
content = content.replace('HashRouter', 'BrowserRouter');
content = content.replace('<HashRouter>', '<BrowserRouter>');
content = content.replace('</HashRouter>', '</BrowserRouter>');

// 2. Add imports for highlight.js and marked-highlight
const imports = `import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";`;

content = content.replace('import { marked } from "marked";', `import { marked } from "marked";\n${imports}`);

// 3. Configure marked
const markedConfig = `
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));`;

content = content.replace('const markdownModules', `${markedConfig}\n\nconst markdownModules`);

// 4. Change eager: true to eager: false or remove it
content = content.replace(/eager: true/g, 'eager: false');

// 5. Remove Object.fromEntries for markdownBySlug and htmlBySlug
// Replace with getter functions
const getters = `
const getMarkdownModule = (slug) => {
  const path = Object.keys(markdownModules).find(p => p.endsWith(\`\${slug}.md\`));
  return path ? markdownModules[path] : null;
};

const getHtmlModule = (slug) => {
  const path = Object.keys(htmlModules).find(p => p.endsWith(\`\${slug}.html\`));
  return path ? htmlModules[path] : null;
};
`;

content = content.replace(/const markdownBySlug = Object\.fromEntries\([\s\S]*?\);/, '');
content = content.replace(/const htmlBySlug = Object\.fromEntries\([\s\S]*?\);/, getters);

// 6. Rewrite BlogPostPage
const blogPostPageRegex = /function BlogPostPage\(\{\s*theme,\s*onToggleTheme\s*\}\)\s*\{[\s\S]*?function NotFoundPage/m;

const newBlogPostPage = `function BlogPostPage({ theme, onToggleTheme }) {
  const { slug } = useParams();
  const post = blogData.posts.find((entry) => entry.slug === slug);
  const [contentHtml, setContentHtml] = useState(null);

  useEffect(() => {
    if (post) {
      document.title = \`\${post.title} | \${profile.name}\`;
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

function NotFoundPage`;

content = content.replace(blogPostPageRegex, newBlogPostPage);

fs.writeFileSync('src/App.jsx', content);
console.log('Done rewriting App.jsx');
