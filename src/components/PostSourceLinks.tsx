import { GITHUB_REPO_URL } from '@/lib/site'
import { t, type Locale } from '@/lib/i18n'

interface Props {
  locale: Locale
  slug: string
}

// 포스트 하단에 GitHub 소스 보기 / 편집 링크 노출.
// 작가 본인은 한 클릭으로 오타 수정 PR을 열 수 있고, 외부 독자에겐
// 콘텐츠가 오픈소스라는 신뢰 시그널.
export function PostSourceLinks({ locale, slug }: Props) {
  const filePath = `src/content/posts/${locale}/${slug}.mdx`
  const blob = `${GITHUB_REPO_URL}/blob/main/${filePath}`
  const edit = `${GITHUB_REPO_URL}/edit/main/${filePath}`
  return (
    <div
      className="mono mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
      style={{ color: 'var(--text-faint)' }}
    >
      <span aria-hidden>↳</span>
      <a
        href={blob}
        target="_blank"
        rel="noopener noreferrer"
        className="link-hover-accent"
        style={{ color: 'var(--text-muted)' }}
      >
        {t(locale, 'post.viewSource')} ↗
      </a>
      <span aria-hidden style={{ opacity: 0.5 }}>·</span>
      <a
        href={edit}
        target="_blank"
        rel="noopener noreferrer"
        className="link-hover-accent"
        style={{ color: 'var(--text-muted)' }}
      >
        {t(locale, 'post.editOnGitHub')} ↗
      </a>
    </div>
  )
}
