---
title: "Post Title"
slug: "post-title"
publishedAt: "2026-06-18"
topic: "Tooling"
tags:
  - Swift
  - iOS
excerpt: "One or two sentences that preview the post in cards and metadata."
published: false
publishVersion: "authored"
reviewStatus: "pending"
canonicalUrl: ""
---

# Post Title

Start with the problem, why it matters, and what the reader will get.

## Context

Explain the setup briefly.

## Example

```swift
struct Example {
  let message = "Hello"
}
```

![Helpful screenshot alt text](/blog-images/example.png)

## Notes For Review

- `publishVersion: "authored"` publishes your original version.
- Change to `publishVersion: "reviewed"` after an AI-proofread file exists at `src/content/blogs/reviewed/<same-file-name>.md`.
- `published: false` keeps drafts off the live site.
- Put blog images in `public/blog-images/` and reference them as `/blog-images/<file-name>`.
