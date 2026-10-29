import { notFound } from 'next/navigation'
import { PostList } from '@/components/PostList'
import { ContinueReading } from '@/components/ContinueReading'
import { TopPosts } from '@/components/TopPosts'
import { RecentComments } from '@/components/RecentComments'
import { StartHere } from '@/components/StartHere'
import { LOCALES, isLocale, t, hreflangAlternates, type Locale } from '@/lib/i18n'
import postIndex from '@/lib/post-index.json'
import { dedupePostsForLocale } from '@/lib/post-index'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml, PERSON_ID, WEBSITE_ID } from '@/lib/jsonld'

interface HomeProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params
  const subtitle = t(locale, 'home.subtitle')
  const homeTitle = `Younglin's CFD Blog — ${subtitle}`
  return {
    title: { absolute: homeTitle },
    description: subtitle,
    alternates: {
      canonical: `${SITE_URL}/${locale}/`,
      languages: hreflangAlternates(''),
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      title: homeTitle,
      description: subtitle,
    },
    twitter: {
      card: 'summary_large_image',
      title: homeTitle,
      description: subtitle,
    },
  }
}

// SSR로 보내는 첫 페이로드. 무한 스크롤 sentinel이 IntersectionObserver로
// PAGE_SIZE(10)씩 추가 로드하므로 첫 화면에 보이는 양만큼만 보내 LCP 개선.
const HOME_INITIAL_POSTS = 12

export default async function Home({ params }: HomeProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale

  const posts = dedupePostsForLocale(postIndex.items as any, loc)
    .map((post) => ({
      id: post.slug,
      title: post.title,
      date: post.date,
      description: post.description,
      tags: post.tags ?? [],
      readingTime: post.readingTime,
      url: loc === post.locale ? post.url : `/${loc}/posts/${post.slug}`,
      series: (post as any).series as string | undefined,
      seriesOrder: (post as any).seriesOrder as number | undefined,
      isDynamic: false as const,
    }))
  const initialPosts = posts.slice(0, HOME_INITIAL_POSTS)

  // CollectionPage — locale별 홈은 "글 목록"이지 별개의 WebSite가 아니다.
  // WebSite 노드는 [locale]/layout.tsx에 하나만 있고 여기서 그 @id를 참조한다.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/${loc}/#webpage`,
    url: `${SITE_URL}/${loc}/`,
    name: `Younglin's CFD Blog — ${t(loc, 'home.subtitle')}`,
    description: t(loc, 'home.subtitle'),
    inLanguage: loc,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <section className="mb-12">
        <h1 className="display" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.1rem)', fontWeight: 700, lineHeight: 1.2, color: 'var(--text)', margin: 0 }}>
          {t(loc, 'home.subtitle')}
        </h1>
      </section>

      <StartHere locale={loc} />

      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <TopPosts locale={loc} heading={t(loc, 'home.popular')} hint={t(loc, 'home.popularHint')} limit={5} days={7} />
        <RecentComments locale={loc} />
      </div>

      <ContinueReading
        posts={posts.map((p) => ({
          slug: p.id, title: p.title, url: p.url,
          series: p.series, seriesOrder: p.seriesOrder,
        }))}
      />

      <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>{t(loc, 'home.latest')}</h2>
      <PostList
        staticPosts={initialPosts}
        indexPath="/post-index.json"
      />
    </div>
  )
}
