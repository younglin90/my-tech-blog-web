import type { Locale } from '@/lib/i18n'
import { titleFromSlug } from '@/lib/jsonld'
import { SERIES } from '@/lib/series-rules.mjs'

const BY_SLUG = new Map(SERIES.map((s) => [s.slug, s]))

export function seriesTitle(slug: string, locale: Locale): string {
  return (BY_SLUG.get(slug)?.title as Record<Locale, string> | undefined)?.[locale] ?? titleFromSlug(slug)
}

export function seriesDescription(slug: string, locale: Locale): string {
  return (BY_SLUG.get(slug)?.description as Record<Locale, string> | undefined)?.[locale] ?? ''
}
