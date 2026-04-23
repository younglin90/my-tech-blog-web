import { ImageResponse } from 'next/og'
import { allPosts } from 'contentlayer/generated'
import { LOCALES } from '@/lib/i18n'

export const dynamic = 'force-static'
export const alt = "Younglin's CFD Blog post"

// CJK 글리프 (한국어/일본어/중국어) 렌더링용 폰트.
// @vercel/og(satori)는 기본 폰트로 CJK를 그릴 수 없어 'tofu'(□)가 표시됨.
// Google Fonts CDN에서 변형 wght 폰트 binary를 한 번만 fetch하여 모듈 캐시.
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

const LOCALE_BADGE: Record<string, { label: string; color: string }> = {
  ko: { label: 'KO · 한국어', color: '#fbbf24' },
  en: { label: 'EN · English', color: '#34d399' },
  ja: { label: 'JA · 日本語', color: '#f87171' },
  zh: { label: 'ZH · 中文', color: '#a78bfa' },
  es: { label: 'ES · Español', color: '#22d3ee' },
}

const FALLBACK_DESC: Record<string, string> = {
  ko: 'CFD 연구자의 작업 노트',
  en: 'Field notes from a CFD researcher',
  ja: 'CFD研究者の作業ノート',
  zh: 'CFD研究者的工作笔记',
  es: 'Notas de campo de un investigador en CFD',
}

export function generateStaticParams() {
  const slugs = Array.from(new Set(allPosts.filter((p) => !p.draft).map((p) => p.slug)))
  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const post =
    allPosts.find((p) => p.locale === locale && p.slug === slug) ??
    allPosts.find((p) => p.locale === 'ko' && p.slug === slug)
  const title = post?.title ?? "Younglin's CFD Blog"
  const description = post?.description ?? FALLBACK_DESC[locale] ?? FALLBACK_DESC.en
  const tags = post?.tags?.slice(0, 3) ?? []
  const badge = LOCALE_BADGE[locale] ?? LOCALE_BADGE.en

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px',
          background: '#08111f',
          fontFamily: 'serif',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: badge.color }} />

        <div style={{ position: 'absolute', top: '48px', left: '60px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: badge.color, fontFamily: 'monospace' }}>$_</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Younglin</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: badge.color, letterSpacing: '-0.02em' }}>&apos;s</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>CFD Blog</span>
        </div>

        <div style={{ position: 'absolute', top: '54px', right: '60px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 600, fontFamily: 'monospace', color: badge.color,
            padding: '4px 10px', borderRadius: '9999px',
            background: 'rgba(0,0,0,0.3)', border: `1px solid ${badge.color}55`,
          }}>{badge.label}</span>
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: badge.color,
                  background: `${badge.color}1f`,
                  border: `1px solid ${badge.color}40`,
                  fontFamily: 'monospace',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            fontSize: title.length > 50 ? '44px' : '52px',
            fontWeight: 700,
            color: '#f1f5f9',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '16px',
            maxWidth: '1000px',
            fontFamily: 'Noto Sans CJK, serif',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: '20px',
            color: '#7a90a8',
            lineHeight: 1.5,
            maxWidth: '900px',
            fontFamily: 'Noto Sans CJK, serif',
          }}
        >
          {description}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await (async () => {
        const data = await loadFont(locale)
        if (!data) return undefined
        return [
          { name: 'Noto Sans CJK', data, style: 'normal' as const, weight: 700 as const },
        ]
      })(),
    }
  )
}
