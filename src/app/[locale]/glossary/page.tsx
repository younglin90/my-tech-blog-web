import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import glossary from '@/lib/glossary.json'
import { GlossaryClient } from '@/components/GlossaryClient'
import { SITE_URL } from '@/lib/site'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  return {
    title: t(loc, 'glossary.title'),
    description: t(loc, 'glossary.description'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/glossary`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/glossary`])),
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

  return (
    <div>
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
