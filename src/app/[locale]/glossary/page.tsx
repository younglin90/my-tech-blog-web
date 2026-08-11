import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import glossary from '@/lib/glossary.json'
import { GlossaryClient } from '@/components/GlossaryClient'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml, WEBSITE_ID } from '@/lib/jsonld'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  const title = t(loc, 'glossary.title')
  const description = t(loc, 'glossary.description')
  const url = `${SITE_URL}/${locale}/glossary`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/glossary`])),
        'x-default': `${SITE_URL}/en/glossary`,
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

interface Entry {
  ko: string
  en: string
  wiki?: string
  posts?: Array<{ slug: string; title: string; date: string; count: number }>
}

export default async function Glossary({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const entries = Object.entries(glossary as Record<string, Entry>)
    .sort(([a], [b]) => a.localeCompare(b))
  const linked = entries.filter(([, entry]) => entry.posts && entry.posts.length > 0).length

  // 74개 용어를 DefinedTermSet으로 선언한다. 용어별 페이지를 따로 파지 않고도
  // (대부분 backlink가 0~1개라 얇은 페이지가 된다) 이 페이지 하나가 용어집으로 인식된다.
  const glossaryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${SITE_URL}/${loc}/glossary/#termset`,
    name: t(loc, 'glossary.title'),
    description: t(loc, 'glossary.description'),
    url: `${SITE_URL}/${loc}/glossary/`,
    inLanguage: loc,
    isPartOf: { '@id': WEBSITE_ID },
    hasDefinedTerm: entries.map(([term, entry]) => ({
      '@type': 'DefinedTerm',
      '@id': `${SITE_URL}/${loc}/glossary/#${encodeURIComponent(term)}`,
      name: term,
      // glossary.json은 ko/en 정의만 갖고 있다 — 나머지 locale은 en으로 폴백
      description: loc === 'ko' ? (entry as Entry).ko : (entry as Entry).en,
      inDefinedTermSet: { '@id': `${SITE_URL}/${loc}/glossary/#termset` },
      ...((entry as Entry).wiki ? { sameAs: (entry as Entry).wiki } : {}),
    })),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(glossaryJsonLd) }} />
      <div className="mono mb-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> man cfd-glossary
      </div>
      <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
        {t(loc, 'glossary.title')}
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        {t(loc, 'glossary.subtitle', { terms: String(entries.length), linked: String(linked) })}
      </p>

      <GlossaryClient entries={entries} locale={loc} total={entries.length} />
    </div>
  )
}
