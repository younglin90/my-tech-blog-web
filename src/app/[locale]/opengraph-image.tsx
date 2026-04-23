import { ImageResponse } from 'next/og'
import { LOCALES } from '@/lib/i18n'

export const dynamic = 'force-static'
export const alt = "Younglin's CFD Blog"

const LOCALE_BADGE: Record<string, { label: string; color: string }> = {
  ko: { label: 'KO · 한국어', color: '#fbbf24' },
  en: { label: 'EN · English', color: '#34d399' },
  ja: { label: 'JA · 日本語', color: '#f87171' },
  zh: { label: 'ZH · 中文', color: '#a78bfa' },
  es: { label: 'ES · Español', color: '#22d3ee' },
}

const HERO_TITLE: Record<string, string> = {
  ko: "영린's CFD Blog",
  en: "Younglin's CFD Blog",
  ja: "Younglin's CFD Blog",
  zh: "Younglin's CFD Blog",
  es: "Younglin's CFD Blog",
}

const HERO_TAGLINE: Record<string, string> = {
  ko: '압축성 다상유동 CFD 연구자의 작업 노트',
  en: 'Field notes from a compressible multiphase CFD researcher',
  ja: '圧縮性多相流CFD研究者の作業ノート',
  zh: '可压缩多相流CFD研究者的工作笔记',
  es: 'Notas de campo de un investigador en CFD multifase compresible',
}

const FONT_URLS: Record<string, string> = {
  ko: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.woff',
  ja: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.woff',
  zh: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-700-normal.woff',
}
const FONT_CACHE: Record<string, Promise<ArrayBuffer | null>> = {}
async function loadFont(locale: string): Promise<ArrayBuffer | null> {
  const url = FONT_URLS[locale]
  if (!url) return null
  if (!FONT_CACHE[locale]) {
    FONT_CACHE[locale] = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null)
  }
  return FONT_CACHE[locale]
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const badge = LOCALE_BADGE[locale] ?? LOCALE_BADGE.en
  const title = HERO_TITLE[locale] ?? HERO_TITLE.en
  const tagline = HERO_TAGLINE[locale] ?? HERO_TAGLINE.en

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px',
          background: '#08111f',
          fontFamily: 'serif',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: badge.color }} />
        <div style={{ position: 'absolute', top: '40px', right: '60px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: badge.color,
            padding: '5px 12px', borderRadius: '9999px',
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${badge.color}55`,
          }}>{badge.label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '24px' }}>
          <span style={{ fontSize: '40px', color: badge.color, fontFamily: 'monospace' }}>$_</span>
          <span style={{ fontSize: '64px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em', fontFamily: 'Noto Sans CJK, serif' }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', fontSize: '24px', color: '#7a90a8', maxWidth: '900px', lineHeight: 1.5, fontFamily: 'Noto Sans CJK, serif' }}>
          {tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await (async () => {
        const data = await loadFont(locale)
        if (!data) return undefined
        return [{ name: 'Noto Sans CJK', data, style: 'normal' as const, weight: 700 as const }]
      })(),
    }
  )
}
