import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale } from '@/lib/i18n'
import vizManifest from '@/lib/viz-manifest.json'
import { SITE_URL } from '@/lib/site'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Visualizations',
    description: 'Interactive CFD visualizations across all posts.',
    alternates: {
      canonical: `${SITE_URL}/${locale}/viz`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/viz`])),
    },
  }
}

interface VizItem {
  component: string
  type: string
  postSlug: string
  postTitle: string
  postUrl: string
  file?: string
}

export default async function VizGallery({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const items = vizManifest as VizItem[]
  const total = items.length
  const customCount = items.filter((i) => i.type === 'custom' || i.type === 'custom-orphan').length

  // 컴포넌트 타입별 그룹
  const grouped: Record<string, VizItem[]> = {}
  for (const it of items) {
    const key = it.type === 'pre-built' ? `pre-built · ${it.component}` : `custom · ${it.component}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(it)
  }

  return (
    <div>
      <div className="mono mb-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> ls viz/
      </div>
      <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
        Visualizations
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        {total} interactive viz · {customCount} custom + {total - customCount} pre-built
      </p>

      {Object.entries(grouped).map(([key, list]) => {
        const isCustom = key.startsWith('custom')
        const componentName = key.split('·')[1].trim()
        return (
          <section key={key} className="mb-8">
            <div className="mb-3 flex items-baseline gap-2">
              <span
                className="mono rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                style={{
                  background: isCustom ? 'var(--accent-glow)' : 'var(--surface)',
                  color: isCustom ? 'var(--accent)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {isCustom ? 'custom' : 'pre-built'}
              </span>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                {componentName}
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                ({list.length} use{list.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((it, i) => (
                it.postUrl ? (
                  <Link
                    key={`${it.component}-${i}`}
                    href={`/${locale}${it.postUrl}`}
                    className="group block rounded-md p-3 transition-colors duration-100"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-sm font-medium link-hover-accent line-clamp-2" style={{ color: 'var(--text)' }}>
                      {it.postTitle}
                    </p>
                    {it.file && (
                      <p className="mono mt-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {it.file}
                      </p>
                    )}
                  </Link>
                ) : (
                  <div
                    key={`${it.component}-${i}`}
                    className="rounded-md p-3 opacity-60"
                    style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>orphan: {it.postTitle}</p>
                    {it.file && (
                      <p className="mono mt-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>{it.file}</p>
                    )}
                  </div>
                )
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
