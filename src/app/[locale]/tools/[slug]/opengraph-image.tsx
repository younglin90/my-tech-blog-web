import { ImageResponse } from 'next/og'
import { LOCALES, type Locale } from '@/lib/i18n'
import { CALCULATORS, CATEGORY_LABELS } from '@/lib/calculators'
import { OgFrame, ogFonts, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const dynamic = 'force-static'
export const alt = 'CFD calculator'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => CALCULATORS.map((c) => ({ locale, slug: c.slug })))
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const loc = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'en'
  const calc = CALCULATORS.find((c) => c.slug === slug)

  return new ImageResponse(
    (
      <OgFrame
        locale={loc}
        command="$ ./calc"
        title={calc?.title[loc] ?? slug}
        subtitle={calc?.desc[loc]}
        chips={calc ? [CATEGORY_LABELS[calc.category][loc], ...calc.tags.slice(0, 3)] : []}
        stat="cfdblog.cc/tools"
      />
    ),
    { ...size, fonts: await ogFonts(loc) }
  )
}
