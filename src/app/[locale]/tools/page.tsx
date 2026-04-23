import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n'
import { CALCULATORS } from '@/lib/calculators'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'CFD Tools',
    description: 'Quick CFD calculators — Reynolds, Mach, boundary layer, CFL.',
    alternates: {
      canonical: `https://tech-blog.dev/${locale}/tools`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `https://tech-blog.dev/${l}/tools`])),
    },
  }
}

export default async function ToolsIndex({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale

  return (
    <div>
      <div className="mono mb-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> ls tools/
      </div>
      <h1 className="display mb-2" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
        Tools
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        {CALCULATORS.length} CFD quick calculators · run in your browser, no signup.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {CALCULATORS.map((c) => (
          <Link
            key={c.slug}
            href={`/${loc}/tools/${c.slug}`}
            className="group block rounded-lg p-4 transition-colors duration-100"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2
              className="text-base font-semibold link-hover-accent"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              {c.title[loc] ?? c.title.en}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {c.desc[loc] ?? c.desc.en}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.tags.map((tag) => (
                <span key={tag} className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--bg)', color: 'var(--text-faint)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
