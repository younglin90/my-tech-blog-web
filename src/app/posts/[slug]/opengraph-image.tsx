import { ImageResponse } from 'next/og'
import { allPosts } from 'contentlayer/generated'

export const dynamic = 'force-static'
export const alt = 'CFD.Lab post'

export function generateStaticParams() {
  return allPosts
    .filter((p) => !p.draft)
    .map((p) => ({ slug: p._raw.flattenedPath }))
}
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = allPosts.find((p) => p._raw.flattenedPath === slug)
  const title = post?.title ?? 'CFD.Lab'
  const description = post?.description ?? 'CFD 엔지니어를 위한 기술 저널'
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
        {/* Accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#22d3ee' }} />

        {/* Logo */}
        <div style={{ position: 'absolute', top: '48px', left: '60px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>CFD</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#22d3ee' }}>.</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>Lab</span>
        </div>

        {/* Tags */}
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
                  color: '#22d3ee',
                  background: 'rgba(34,211,238,0.12)',
                  border: '1px solid rgba(34,211,238,0.25)',
                  fontFamily: 'monospace',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
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

        {/* Description */}
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
