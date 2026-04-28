import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import vizManifest from '@/lib/viz-manifest.json'
import { SITE_URL } from '@/lib/site'
import { VizGalleryClient } from '@/components/VizGalleryClient'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  return {
    title: t(loc, 'viz.title'),
    description: t(loc, 'viz.subtitle'),
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
  return <VizGalleryClient locale={locale as Locale} items={vizManifest as VizItem[]} />
}
