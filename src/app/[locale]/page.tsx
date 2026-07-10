import { notFound } from 'next/navigation'
import { PostList } from '@/components/PostList'
import { QuoteHero } from '@/components/QuoteHero'
import { ContinueReading } from '@/components/ContinueReading'
import { TopPosts } from '@/components/TopPosts'
import { DAY_META, getDayLabel } from '@/lib/day-meta'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import postIndex from '@/lib/post-index.json'
import { dedupePostsForLocale } from '@/lib/post-index'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

interface HomeProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params
  return {
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}`])),
    },
  }
}

const DAY_ORDER: Array<keyof typeof DAY_META> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Younglin's CFD Blog",
    description: t(loc, 'home.subtitle'),
    url: `${SITE_URL}/${loc}`,
    inLanguage: loc,
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <QuoteHero />

      <div
        className="reveal reveal-1 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 rounded-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <span
          className="mono"
          style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.2em', fontWeight: 600 }}
        >
          {t(loc, 'home.weekly')}
        </span>
        {DAY_ORDER.map((k) => {
          const m = DAY_META[k]
          return (
            <span key={k} className="inline-flex items-center gap-1.5" style={{ fontSize: 12 }}>
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: m.colorVar }}
              />
              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>
                {m.short}
              </span>
              <span style={{ color: 'var(--text)' }}>{getDayLabel(k, loc)}</span>
            </span>
          )
        })}
      </div>

      <div className="reveal reveal-2">
        <ContinueReading
          posts={posts.map((p) => ({
            slug: p.id, title: p.title, url: p.url,
            series: p.series, seriesOrder: p.seriesOrder,
          }))}
        />
      </div>

      <div className="reveal reveal-3">
        <TopPosts locale={loc} heading={t(loc, 'about.topPosts')} limit={5} days={7} />
      </div>

      <PostList
        staticPosts={initialPosts}
        initialTotalCount={posts.length}
        indexPath="/post-index.json"
      />
    </div>
  )
}
