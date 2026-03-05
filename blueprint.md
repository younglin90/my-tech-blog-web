# Tech Blog Project Blueprint

## Project Overview
A high-performance, SEO-optimized static tech blog built with Next.js 16 (App Router), Contentlayer2, and Tailwind CSS 4.

## Features
1. **Type-Safe MDX:** Contentlayer manages schemas and generates TypeScript types.
2. **LaTeX Rendering:** Integrated `remark-math` and `rehype-katex`.
3. **Admin Preview:** Draft posts are hidden from the main site but accessible via `/preview/[slug]` with a client-side password.
4. **Command Palette:** CMD+K search powered by `framer-motion` and client-side fuzzy search.
5. **SSG Mode:** Fully static export enabled (`output: 'export'`).

## Implementation Details
- **Contentlayer:** `contentlayer.config.ts` defines the `Post` document type and MDX plugins.
- **Search:** `src/components/Search.tsx` uses `framer-motion` for a modern modal experience.
- **MDX Components:** `src/components/MDX.tsx` maps Markdown elements to styled React components.
- **Admin Security:** `src/components/PreviewContent.tsx` implements a simple password check for draft posts on the client side.

## Current State
- [x] App Router Migration
- [x] Contentlayer & LaTeX Integration
- [x] CMD+K Search Functionality
- [x] Admin Preview Logic
- [x] Successful Build & SSG Export
