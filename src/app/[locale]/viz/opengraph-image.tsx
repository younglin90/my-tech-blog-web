import { ImageResponse } from 'next/og'
import { LOCALES, t, type Locale } from '@/lib/i18n'
import vizManifest from '@/lib/viz-manifest.json'
import { OgFrame, ogFonts, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const dynamic = 'force-static'
export const alt = 'Interactive CFD visualizations'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const loc = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'en'
  const entries = vizManifest as unknown as Array<{ component?: string }>
  const names = entries.map((v) => v?.component).filter(Boolean) as string[]

  return new ImageResponse(
    (
      <OgFrame
        locale={loc}
        command="$ ./render"
        title={t(loc, 'viz.title')}
        subtitle={t(loc, 'viz.subtitle')}
        chips={names.slice(0, 8)}
        stat={`${names.length} interactive`}
      />
    ),
    { ...size, fonts: await ogFonts(loc) }
  )
}
