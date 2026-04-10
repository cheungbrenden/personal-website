---
title: 'Why I Chose Astro Over Next.js for My Personal Site'
pubDate: 2026-03-22
description: 'A practical comparison of two great frameworks and why shipping zero JavaScript by default was the right call for a content-focused site.'
tags: ['web', 'astro']
---

When I decided to rebuild my personal site, I had two strong contenders: **Next.js** and **Astro**. Both are excellent frameworks, but they optimize for fundamentally different things. Here's why I went with Astro.

## What I Needed

My personal site is content-first:

- Blog posts written in Markdown
- A projects showcase
- An experience page
- Static pages that load fast and rank well

I didn't need authentication, real-time data, API routes, or client-side state management. This immediately narrowed the decision.

## The Key Difference

**Next.js** is a React framework that can do static sites. **Astro** is a static site framework that can use React (or Vue, Svelte, etc.) when needed.

That distinction matters because it inverts the default. With Next.js, you start with a React runtime and opt out of JavaScript where you can. With Astro, you start with zero JavaScript and opt in only where you need interactivity.

For a blog, the zero-JS default is exactly right.

## Performance Comparison

I built a quick prototype in both frameworks with the same design. The Lighthouse scores:

| Metric | Next.js (SSG) | Astro |
|--------|---------------|-------|
| Performance | 94 | 100 |
| First Contentful Paint | 0.8s | 0.4s |
| Total Blocking Time | 120ms | 0ms |
| JS Bundle Size | 87kb | 0kb |

The Astro site ships literally zero JavaScript to the browser. Every page is pure HTML and CSS.

## Content Collections

Astro's content collections are genuinely great. You define a Zod schema for your frontmatter, and you get full type safety:

```typescript
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
  })
});
```

If a blog post has invalid frontmatter, you get a build-time error instead of a runtime crash. This is exactly the kind of guardrail I want for content.

## When I'd Still Use Next.js

Next.js is the better choice when you need:

- **Authentication** — NextAuth.js is excellent
- **API routes** — Server functions alongside your pages
- **Real-time features** — WebSocket connections, live data
- **Complex client-side state** — Shopping carts, dashboards, forms

For my portfolio site, none of these apply. If I were building a SaaS product, I'd reach for Next.js without hesitation.

## The Bottom Line

Choose the tool that matches your use case. For a content-focused personal site, Astro's zero-JS default, content collections, and build-time type safety make it the clear winner.
