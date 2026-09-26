// Markdown rendering for local posts, split out of App.jsx so that marked and
// highlight.js land in their own chunk. App.jsx dynamically imports this module
// when a /blog/:slug route actually resolves to a markdown post, keeping both
// libraries out of the initial bundle.
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import objectivec from "highlight.js/lib/languages/objectivec";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// Core-only build: every language used across the repo's posts is registered
// explicitly, so the full highlight.js bundle never ships. Token colours come from
// the .hljs-* rules in index.css, which follow the site's light/dark palette.
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

marked.use(markedHighlight({
  langPrefix: "hljs language-",
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  }
}));

export function renderMarkdown(source) {
  return marked.parse(source);
}
