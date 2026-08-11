import type { ReactElement } from 'react'

// OG 카드 공통 부품. tags/about/home/post의 기존 카드와 같은 톤을 유지하면서
// tools/series/glossary/viz 네 라우트가 같은 코드를 네 번 복사하지 않게 한다.
// (DESIGN.md: 배경 #08111f, locale별 accent)

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

export const LOCALE_BADGE: Record<string, { label: string; color: string }> = {
  ko: { label: 'KO · 한국어', color: '#fbbf24' },
  en: { label: 'EN · English', color: '#34d399' },
  ja: { label: 'JA · 日本語', color: '#f87171' },
  zh: { label: 'ZH · 中文', color: '#a78bfa' },
  es: { label: 'ES · Español', color: '#22d3ee' },
}

const FONT_URLS: Record<string, string> = {
  ko: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.woff',
  ja: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.woff',
  zh: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-700-normal.woff',
}
const FONT_CACHE: Record<string, Promise<ArrayBuffer | null>> = {}

/** CJK 글리프가 tofu로 깨지지 않도록 locale별 웹폰트를 한 번만 받아 캐시한다. */
export async function ogFonts(locale: string) {
  const url = FONT_URLS[locale]
  if (!url) return undefined
  if (!FONT_CACHE[locale]) {
    FONT_CACHE[locale] = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null)
  }
  const data = await FONT_CACHE[locale]
  if (!data) return undefined
  return [{ name: 'Noto Sans CJK', data, style: 'normal' as const, weight: 700 as const }]
}

interface FrameProps {
  locale: string
  /** 터미널 프롬프트 줄 — 예: `$ ls tools/` */
  command: string
  title: string
  subtitle?: string
  /** 하단 칩 목록 (태그·카테고리 등) */
  chips?: string[]
  /** 우하단 통계 — 예: `97 calculators` */
  stat?: string
}

export function OgFrame({ locale, command, title, subtitle, chips = [], stat }: FrameProps): ReactElement {
  const badge = LOCALE_BADGE[locale] ?? LOCALE_BADGE.en
  const titleSize = title.length > 46 ? 54 : title.length > 28 ? 68 : 84

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#08111f',
        fontFamily: 'serif',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: badge.color }} />
      <div style={{ display: 'flex', position: 'absolute', top: '40px', right: '60px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'monospace',
            color: badge.color,
            padding: '5px 12px',
            borderRadius: '9999px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${badge.color}55`,
          }}
        >
          {badge.label}
        </span>
      </div>

      <div style={{ display: 'flex', marginBottom: '18px' }}>
        <span style={{ fontSize: '30px', color: badge.color, fontFamily: 'monospace' }}>{command}</span>
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: `${titleSize}px`,
          fontWeight: 700,
          color: '#f1f5f9',
          letterSpacing: '-0.03em',
          lineHeight: 1.12,
          fontFamily: 'Noto Sans CJK, serif',
          marginBottom: subtitle ? '18px' : '30px',
          maxWidth: '1000px',
        }}
      >
        {title}
      </div>

      {subtitle && (
        <div
          style={{
            display: 'flex',
            fontSize: '26px',
            color: '#94a3b8',
            lineHeight: 1.4,
            fontFamily: 'Noto Sans CJK, serif',
            marginBottom: '28px',
            maxWidth: '960px',
          }}
        >
          {subtitle}
        </div>
      )}

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', maxWidth: '1000px' }}>
          {chips.map((c) => (
            <span
              key={c}
              style={{
                fontSize: '20px',
                fontFamily: 'monospace',
                color: badge.color,
                padding: '6px 14px',
                borderRadius: '8px',
                background: `${badge.color}1f`,
                border: `1px solid ${badge.color}40`,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {stat && (
        <div style={{ display: 'flex', position: 'absolute', bottom: '44px', right: '60px' }}>
          <span style={{ fontSize: '20px', fontFamily: 'monospace', color: '#475569' }}>{stat}</span>
        </div>
      )}
    </div>
  )
}

/**
 * 자기 opengraph-image 파일이 없는 라우트가 쓸 폴백 카드(= locale 홈 카드).
 *
 * Next.js는 자식이 openGraph를 지정하면 부모 layout의 openGraph를 통째로 덮어쓴다.
 * 따라서 layout에 images를 넣어도 상속되지 않는다 — 필요한 라우트가 직접 넣어야 한다.
 */
export function ogFallbackImages(siteUrl: string, locale: string) {
  return [{ url: `${siteUrl}/${locale}/opengraph-image`, width: 1200, height: 630 }]
}
