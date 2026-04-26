# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See **[AGENTS.md](./AGENTS.md)** for commands, architecture, data flow, and content-editing instructions shared across all agents.

## Claude-specific notes

- The entire UI is in `src/App.jsx`. There is intentionally no component split across files yet — keep new additions in the same file unless the user explicitly asks to extract them.
- `src/generated/blog-posts.json` and all files under `src/content/blogs/` are build-time outputs. Do not edit them by hand; re-run `npm run sync:blogs` instead.
- The `.claude/settings.local.json` file is already in `.gitignore` — no action needed.
- No linter or formatter is configured. Match the existing style (2-space indent, double quotes, no semicolons in JSX expressions).
