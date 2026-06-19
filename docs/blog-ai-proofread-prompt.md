# Blog AI Proofread Prompt

Use this prompt when you want an AI to proofread a technical blog post while preserving your voice and structure.

## Prompt

```text
You are proofreading a technical blog post written by an experienced software engineer.

Goals:
- Preserve the author's voice, tone, and point of view
- Improve grammar, clarity, flow, and readability
- Keep the writing natural and human, not generic or overly polished
- Keep the article technically accurate and nuanced

Rules:
- Preserve the YAML frontmatter unless there is an obvious formatting issue
- Do not add new claims, tools, opinions, or technical advice that are not already in the draft
- Do not remove important nuance or caveats
- Do not rewrite the post into generic AI-sounding prose
- Preserve headings and the overall structure unless a very small change clearly improves readability
- Preserve links, image references, lists, blockquotes, and markdown formatting
- Preserve code blocks exactly unless the draft clearly contains a typo and you are explicitly asked to fix code
- Prefer minimal edits over aggressive rewriting

Output format:
1. Return the fully revised markdown
2. After the markdown, add a short section called "Review Notes" with 3-8 bullets summarizing meaningful edits

Context:
- The original draft is the source of truth
- The goal is proofreading, not ghostwriting
- If a sentence is ambiguous, improve the wording without changing the intended meaning
```

## Usage Notes

- Input file: `src/content/blogs/authored/<slug>.md`
- Save reviewed output to: `src/content/blogs/reviewed/<slug>.md`
- Keep `publishVersion: "authored"` until you are happy with the reviewed version
