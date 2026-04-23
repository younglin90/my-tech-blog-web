import { ImageResponse } from 'next/og'
import { allPosts } from 'contentlayer/generated'
import { LOCALES } from '@/lib/i18n'

export const dynamic = 'force-static'
export const alt = "Younglin's CFD Blog post"

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
  const description = post?.description ?? 'Field notes from a CFD researcher'
  const tags = post?.tags?.slice(0, 3) ?? []

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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#fbbf24' }} />

        <div style={{ position: 'absolute', top: '48px', left: '60px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace' }}>$_</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Younglin</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#fbbf24', letterSpacing: '-0.02em' }}>&apos;s</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>CFD Blog</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#7a90a8', marginLeft: 8, fontFamily: 'monospace' }}>{locale}</span>
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
                  color: '#fbbf24',
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.25)',
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
          }}
        >
          {description}
        </div>
      </div>
    ),
    { ...size }
  )
}
