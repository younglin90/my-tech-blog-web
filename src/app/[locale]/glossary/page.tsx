import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n'
import glossary from '@/lib/glossary.json'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Glossary',
    description: 'CFD terms with quick definitions.',
    alternates: {
      canonical: `https://tech-blog.dev/${locale}/glossary`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `https://tech-blog.dev/${l}/glossary`])),
    },
  }
}

interface Entry {
  ko: string
  en: string
  wiki?: string
}

export default async function Glossary({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const entries = Object.entries(glossary as Record<string, Entry>)
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div>
      <div className="mono mb-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> man cfd-glossary
      </div>
      <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
        Glossary
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        {entries.length} CFD terms · quick reference.
      </p>

      <dl className="space-y-5">
        {entries.map(([term, def]) => {
          const definition = (loc === 'ko' ? def.ko : def.en) || def.en || def.ko
          return (
            <div key={term} id={term.toLowerCase()} className="rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <dt className="flex items-baseline gap-3">
                <span className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
                  {term}
                </span>
                {def.wiki && (
                  <a
                    href={def.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-[10px] underline underline-offset-2"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    wiki ↗
                  </a>
                )}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {definition}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
