import { ImageResponse } from 'next/og'
import { LOCALES } from '@/lib/i18n'

export const dynamic = 'force-static'
export const alt = 'About'

const LOCALE_BADGE: Record<string, { label: string; color: string }> = {
  ko: { label: 'KO · 한국어', color: '#fbbf24' },
  en: { label: 'EN · English', color: '#34d399' },
  ja: { label: 'JA · 日本語', color: '#f87171' },
  zh: { label: 'ZH · 中文', color: '#a78bfa' },
  es: { label: 'ES · Español', color: '#22d3ee' },
}

const PAGE_TITLE: Record<string, string> = {
  ko: '소개', en: 'About', ja: '概要', zh: '关于', es: 'Acerca de',
}

const PAGE_DESC: Record<string, string> = {
  ko: 'CFD 연구자가 운영하는 기술 블로그',
  en: 'A CFD researcher\'s technical blog',
  ja: 'CFD研究者の技術ブログ',
  zh: 'CFD研究者的技术博客',
  es: 'Blog técnico de un investigador en CFD',
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
    FONT_CACHE[locale] = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null)
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
  const title = PAGE_TITLE[locale] ?? PAGE_TITLE.en
  const desc = PAGE_DESC[locale] ?? PAGE_DESC.en

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '80px', background: '#08111f', fontFamily: 'serif',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: badge.color }} />
        <div style={{ display: 'flex', position: 'absolute', top: '40px', right: '60px' }}>
          <span style={{
            fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: badge.color,
            padding: '5px 12px', borderRadius: '9999px',
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${badge.color}55`,
          }}>{badge.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '20px' }}>
          <span style={{ fontSize: '32px', color: badge.color, fontFamily: 'monospace' }}>$ whoami</span>
        </div>
        <div style={{ display: 'flex', fontSize: '88px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.03em', fontFamily: 'Noto Sans CJK, serif' }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: '24px', color: '#7a90a8', maxWidth: '900px', marginTop: '16px', fontFamily: 'Noto Sans CJK, serif' }}>
          {desc}
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
