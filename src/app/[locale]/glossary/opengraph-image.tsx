import { ImageResponse } from 'next/og'
import { LOCALES, t, type Locale } from '@/lib/i18n'
import glossary from '@/lib/glossary.json'
import { OgFrame, ogFonts, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const dynamic = 'force-static'
export const alt = 'CFD glossary'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const loc = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'en'
  const terms = Object.keys(glossary as Record<string, unknown>)

  return new ImageResponse(
    (
      <OgFrame
        locale={loc}
        command="$ man cfd"
        title={t(loc, 'glossary.title')}
        subtitle={t(loc, 'glossary.description')}
        chips={terms.slice(0, 10)}
        stat={`${terms.length} terms`}
      />
    ),
    { ...size, fonts: await ogFonts(loc) }
  )
}
