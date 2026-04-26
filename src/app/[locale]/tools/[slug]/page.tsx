import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n'
import { CALCULATORS } from '@/lib/calculators'
import { ReynoldsCalculator } from '@/components/calculators/Reynolds'
import { MachCalculator } from '@/components/calculators/Mach'
import { BoundaryLayerCalculator } from '@/components/calculators/BoundaryLayer'
import { CFLCalculator } from '@/components/calculators/CFL'
import { KolmogorovCalculator } from '@/components/calculators/Kolmogorov'
import { NusseltCalculator } from '@/components/calculators/Nusselt'
import { PrandtlCalculator } from '@/components/calculators/Prandtl'
import { TurbulenceIntensityCalculator } from '@/components/calculators/TurbulenceIntensity'
import { SITE_URL } from '@/lib/site'

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
  return {
    title: c.title[locale] ?? c.title.en,
    description: c.desc[locale] ?? c.desc.en,
    alternates: {
      canonical: `${SITE_URL}/${locale}/tools/${slug}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/tools/${slug}`])),
    },
  }
}

const COMPONENTS: Record<string, () => React.ReactElement> = {
  reynolds: ReynoldsCalculator,
  mach: MachCalculator,
  'boundary-layer': BoundaryLayerCalculator,
  cfl: CFLCalculator,
  kolmogorov: KolmogorovCalculator,
  nusselt: NusseltCalculator,
  prandtl: PrandtlCalculator,
  'turbulence-intensity': TurbulenceIntensityCalculator,
}

export default async function CalculatorPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const meta = CALCULATORS.find((c) => c.slug === slug)
  if (!meta) notFound()
  const Component = COMPONENTS[slug]
  if (!Component) notFound()
  const loc = locale as Locale

  return (
    <div>
      <Link href={`/${loc}/tools`} className="mono mb-3 inline-block" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> cd ..
      </Link>
      <h1 className="display mb-2" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
        {meta.title[loc] ?? meta.title.en}
      </h1>
      <p className="mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        {meta.desc[loc] ?? meta.desc.en}
      </p>
      <p className="mb-6 mono text-sm" style={{ color: 'var(--text-faint)' }}>
        $ formula: <span style={{ color: 'var(--accent)' }}>{meta.formula}</span>
      </p>

      <Component />

      <div className="mt-8 flex flex-wrap gap-2">
        {meta.tags.map((tag) => (
          <Link key={tag} href={`/${loc}/tags/${encodeURIComponent(tag)}`} className="tag-pill-sm">
            {tag}
          </Link>
        ))}
      </div>
    </div>
  )
}
