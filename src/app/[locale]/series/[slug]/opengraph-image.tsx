import { ImageResponse } from 'next/og'
import { LOCALES, t, type Locale } from '@/lib/i18n'
import { listAllSeries, getSeries } from '@/lib/series'
import { titleFromSlug } from '@/lib/jsonld'
import { OgFrame, ogFonts, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const dynamic = 'force-static'
export const alt = 'Article series'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  const slugs = new Set<string>()
  for (const loc of LOCALES) listAllSeries(loc).forEach((s) => slugs.add(s.slug))
  if (slugs.size === 0) return LOCALES.map((locale) => ({ locale, slug: '_placeholder' }))
  return LOCALES.flatMap((locale) => Array.from(slugs).map((slug) => ({ locale, slug })))
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const loc = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'en'
  const series = getSeries(loc, slug)

  return new ImageResponse(
    (
      <OgFrame
        locale={loc}
        command="$ cat series/"
        title={titleFromSlug(slug)}
        subtitle={t(loc, 'series.parts', { count: String(series?.count ?? 0) })}
        chips={(series?.posts ?? []).slice(0, 4).map((p, i) => `${i + 1}. ${p.title.slice(0, 28)}`)}
        stat="cfdblog.cc/series"
      />
    ),
    { ...size, fonts: await ogFonts(loc) }
  )
}
