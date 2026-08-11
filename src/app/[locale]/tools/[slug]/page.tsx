import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, SITE_NAMES, type Locale } from '@/lib/i18n'
import { CALCULATORS, getCategoryLabel } from '@/lib/calculators'
import { CALCULATOR_COMPONENTS } from '@/components/calculators'
import { ToolFormula } from '@/components/ToolFormula'
import { ToolInsightPanel } from '@/components/ToolInsightPanel'
import { ToolViewTracker } from '@/components/ToolViewTracker'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml, PERSON_ID, ORG_ID, WEBSITE_ID } from '@/lib/jsonld'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) => CALCULATORS.map((c) => ({ locale, slug: c.slug })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const c = CALCULATORS.find((x) => x.slug === slug)
  if (!c) return {}
  const loc = isLocale(locale) ? locale : 'en'
  const title = c.title[loc] ?? c.title.en
  const description = c.desc[loc] ?? c.desc.en
  const url = `${SITE_URL}/${locale}/tools/${slug}`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/tools/${slug}`])),
        'x-default': `${SITE_URL}/en/tools/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Younglin's CFD Blog",
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CalculatorPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const meta = CALCULATORS.find((c) => c.slug === slug)
  if (!meta) notFound()
  const Component = CALCULATOR_COMPONENTS[slug]
  if (!Component) notFound()
  const loc = locale as Locale
  const categoryTools = CALCULATORS.filter((tool) => tool.category === meta.category)
  const categoryLabel = getCategoryLabel(meta.category, loc)
  const categoryIndex = categoryTools.findIndex((tool) => tool.slug === meta.slug)
  const previousInCategory = categoryIndex > 0 ? categoryTools[categoryIndex - 1] : null
  const nextInCategory = categoryIndex >= 0 && categoryIndex < categoryTools.length - 1 ? categoryTools[categoryIndex + 1] : null
  const related = CALCULATORS
    .filter((tool) => tool.slug !== meta.slug)
    .map((tool) => {
      const sameCategory = tool.category === meta.category ? 3 : 0
      const sharedTags = tool.tags.filter((tag) => meta.tags.includes(tag)).length
      return { tool, score: sameCategory + sharedTags }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
  const toolUrl = `${SITE_URL}/${loc}/tools/${meta.slug}/`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${toolUrl}#app`,
    name: meta.title[loc] ?? meta.title.en,
    description: meta.desc[loc] ?? meta.desc.en,
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: getCategoryLabel(meta.category, loc),
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    url: toolUrl,
    inLanguage: loc,
    keywords: meta.tags.join(', '),
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    author: { '@id': PERSON_ID },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  // BreadcrumbList는 최상위 노드여야 Google이 브레드크럼 리치 결과로 인식한다.
  // 예전에는 WebApplication의 breadcrumb 속성 안에 중첩돼 있었고 사이트 루트도 빠져 있었다.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAMES[loc], item: `${SITE_URL}/${loc}/` },
      { '@type': 'ListItem', position: 2, name: t(loc, 'nav.tools'), item: `${SITE_URL}/${loc}/tools/` },
      { '@type': 'ListItem', position: 3, name: meta.title[loc] ?? meta.title.en, item: toolUrl },
    ],
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd) }} />
      <ToolViewTracker slug={meta.slug} />
      <Link href={`/${loc}/tools`} className="mono mb-3 inline-block" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> cd ..
      </Link>
      <div className="grid gap-6 xl:grid-cols-[1fr,280px]">
        <div>
          <h1 className="display mb-2" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            {meta.title[loc] ?? meta.title.en}
          </h1>
          <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {meta.desc[loc] ?? meta.desc.en}
          </p>
          <ToolInsightPanel meta={meta} locale={loc} categoryLabel={categoryLabel} />
          <ToolFormula formula={meta.formula} label={t(loc, 'tools.formula')} />

          <Component />

          <div className="mt-8 flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <Link key={tag} href={`/${loc}/tools?q=${encodeURIComponent(tag)}`} className="tag-pill-sm">
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          {(previousInCategory || nextInCategory) && (
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="mb-3 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                {t(loc, 'tools.continueCategory')}
              </div>
              <div className="space-y-2">
                {previousInCategory && (
                  <Link
                    href={`/${loc}/tools/${previousInCategory.slug}`}
                    className="block rounded-lg px-3 py-2 transition-colors"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      {t(loc, 'post.previous')}
                    </div>
                    <div className="mt-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {previousInCategory.title[loc] ?? previousInCategory.title.en}
                    </div>
                  </Link>
                )}
                {nextInCategory && (
                  <Link
                    href={`/${loc}/tools/${nextInCategory.slug}`}
                    className="block rounded-lg px-3 py-2 transition-colors"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      {t(loc, 'post.next')}
                    </div>
                    <div className="mt-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {nextInCategory.title[loc] ?? nextInCategory.title.en}
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{t(loc, 'tools.category')}</div>
            <div className="mt-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
              {categoryLabel}
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {t(loc, 'tools.categoryCount', { count: String(categoryTools.length) })}
            </div>
            <div className="mt-4 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{t(loc, 'tools.runtime')}</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {t(loc, 'tools.runtimeBody')}
            </div>
            <div className="mt-4 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{t(loc, 'tools.bestFor')}</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {t(loc, 'tools.bestForBody')}
            </div>
          </div>

          {categoryTools.length > 1 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="mb-3 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                {t(loc, 'tools.moreInCategory')}
              </div>
              <div className="space-y-2">
                {categoryTools.map((tool) => {
                  const active = tool.slug === meta.slug
                  return (
                    <Link
                      key={tool.slug}
                      href={`/${loc}/tools/${tool.slug}`}
                      className="block rounded-lg px-3 py-2 transition-colors"
                      style={{
                        background: active ? 'var(--accent-glow)' : 'var(--bg)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                      aria-current={active ? 'page' : undefined}
                    >
                      <div className="text-sm font-medium" style={{ color: active ? 'var(--accent)' : 'var(--text)' }}>
                        {tool.title[loc] ?? tool.title.en}
                      </div>
                      {!active && (
                        <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {tool.desc[loc] ?? tool.desc.en}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="mb-3 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                {t(loc, 'tools.related')}
              </div>
              <div className="space-y-2">
                {related.map(({ tool }) => (
                  <Link
                    key={tool.slug}
                    href={`/${loc}/tools/${tool.slug}`}
                    className="block rounded-lg px-3 py-2 transition-colors"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {tool.title[loc] ?? tool.title.en}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {tool.desc[loc] ?? tool.desc.en}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
