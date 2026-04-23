import { LOCALES } from '@/lib/i18n'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!(LOCALES as readonly string[]).includes(locale)) notFound()
  return <>{children}</>
}
