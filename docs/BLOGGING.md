# Blogging Workflow

## Source Of Truth

- Your original writing lives in `src/content/blogs/authored/`
- AI-reviewed versions live in `src/content/blogs/reviewed/`
- The authored version is the source of truth

## Publish Selection

Each authored post controls what gets published through frontmatter:

```yaml
publishVersion: "authored"
```

Change it to:

```yaml
publishVersion: "reviewed"
```

only after a matching file exists in `src/content/blogs/reviewed/`.

If `publishVersion` is set to `reviewed` but no reviewed file exists, the site safely falls back to the authored version.

## Draft Control

Use this in frontmatter to keep a post off the site:

```yaml
published: false
```

Set it to `true` when the post should appear publicly.

## Suggested Workflow

1. Copy `src/content/blogs/authored/_template.md`
2. Write the first draft in `src/content/blogs/authored/<slug>.md`
3. Keep `publishVersion: "authored"` while writing
4. When ready for review, use one of the AI prompts in `docs/`
5. Save the AI-reviewed version to `src/content/blogs/reviewed/<slug>.md`
6. Compare the authored and reviewed versions
7. If the reviewed version feels right, change `publishVersion` to `reviewed`
8. Run `npm run sync:blogs`
9. Preview locally with `npm run dev`

## Which Prompt To Use

- Use `docs/blog-ai-proofread-prompt.md` for light proofreading
- Use `docs/blog-ai-polish-prompt.md` for a stronger editorial pass

## Writing Guardrails

- Keep the authored version genuinely yours
- Use AI to improve clarity, not to invent experiences or opinions
- Preserve code examples unless you explicitly want technical edits
- Prefer small, reviewable edits over large rewrites

## Images

- Put images in `public/blog-images/`
- Reference them with absolute paths like `/blog-images/my-diagram.png`
