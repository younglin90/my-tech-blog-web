import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import curation from './featured-cfd.json'

export function FeaturedCfd({ locale }: { locale: Locale }) {
  const copy = curation.locales[locale]
  return (
    <section aria-labelledby="featured-cfd-title" className="mb-12">
      <h2 id="featured-cfd-title" className="display text-2xl font-semibold" style={{ color: 'var(--text)' }}>
        {copy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {copy.intro}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {curation.slugs.map((slug, index) => {
          const [title, detail] = copy.entries[index]
          return (
            <li key={slug}>
              <Link href={`/${locale}/posts/${slug}/`} prefetch={false}
                className="group block h-full rounded-xl border p-4 hover:[border-color:var(--accent)]"
                style={{ borderColor: 'var(--border-soft)' }}>
                <h3 className="text-base font-semibold group-hover:[color:var(--accent)]" style={{ color: 'var(--text)' }}>
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{detail}</p>
              </Link>
            </li>
          )
        })}
      </ul>
      <Link href={`/${locale}/about/#editorial-practice`} prefetch={false}
        className="mt-4 inline-block text-sm underline underline-offset-4" style={{ color: 'var(--accent)' }}>
        {copy.about}
      </Link>
    </section>
  )
}
