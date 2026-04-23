import { Locale } from '@/lib/i18n'

export interface PostIndexItem {
  slug: string
  locale: Locale
  title: string
  date: string
  description: string
  tags: string[]
  draft: boolean
  url: string
  readingTime: string
}

interface PostIndexPayload {
  meta: { generatedAt: string; count: number }
  items: PostIndexItem[]
}

let cachedPromise: Promise<PostIndexPayload> | null = null

export function loadPostIndexClient(path = '/post-index.json'): Promise<PostIndexPayload> {
  if (!cachedPromise) {
    cachedPromise = fetch(path, { cache: 'force-cache' }).then(async (res) => {
      if (!res.ok) throw new Error(`post-index fetch failed: ${res.status}`)
      return res.json() as Promise<PostIndexPayload>
    })
  }
  return cachedPromise
}

export function dedupePostsForLocale(items: PostIndexItem[], locale: Locale): PostIndexItem[] {
  const bySlug = new Map<string, PostIndexItem>()
  items.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (locale !== 'ko') {
    items.filter((p) => !p.draft && p.locale === locale).forEach((p) => bySlug.set(p.slug, p))
  }
  return Array.from(bySlug.values()).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
