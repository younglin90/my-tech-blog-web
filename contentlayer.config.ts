import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import readingTime from 'reading-time'
import { seoDescription } from './scripts/lib/clean-body.mjs'

const LOCALE_RE = /^(ko|en|ja|zh|es)\//
const extractLocale = (raw: string): string => raw.match(LOCALE_RE)?.[1] ?? 'ko'
const extractSlug = (raw: string): string => raw.replace(LOCALE_RE, '')

// locale-aware reading time / wordCount
// - en/es: 단어 기반 (200 wpm, reading-time 기본)
// - ko/ja/zh (CJK): 문자 기반 (500 cpm — 한국어 신문 평균 ~500~600 자/분)
// 코드블록·MDX import·수식은 제외해 본문 분량만 측정.
const CJK_GLOBAL = /[぀-ゟ゠-ヿ㐀-䶿一-鿿가-힯]/g

function stripForCount(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')                  // fenced code
    .replace(/^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm, ' ')  // import lines
    .replace(/<[A-Z][A-Za-z0-9]*[^>]*\/>/g, ' ')      // self-closing JSX
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')              // open/close JSX tags
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')                // block math
    .replace(/\$[^$\n]+\$/g, ' ')                     // inline math
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')            // images
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')             // links
    .replace(/[#*_`>~|=-]+/g, ' ')                    // markdown punctuation
}

function localeAwareReadingTime(raw: string, locale: string): { text: string; words: number; minutes: number } {
  const stripped = stripForCount(raw)
  const isCJK = locale === 'ko' || locale === 'ja' || locale === 'zh'
  if (!isCJK) {
    const r = readingTime(stripped)
    return { text: r.text, words: r.words, minutes: r.minutes }
  }
  const cjkChars = (stripped.match(CJK_GLOBAL) || []).length
  // 비-CJK 단어도 일부 합산 (1 단어 ≈ 2.5 chars 환산)
  const nonCjk = stripped.replace(CJK_GLOBAL, ' ').split(/\s+/).filter(Boolean).length
  const charEquiv = cjkChars + nonCjk * 2.5
  const minutes = Math.max(1, Math.round(charEquiv / 500))
  // 'words' 자리에는 추정 분량(문자수)을 넣음 (audit 호환)
  return { text: `${minutes} min read`, words: Math.round(charEquiv), minutes }
}

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    description: { type: 'string', required: true },
    draft: { type: 'boolean', default: false },
    tags: { type: 'list', of: { type: 'string' } },
    series: { type: 'string' },             // 시리즈 slug (예: "riemann", "compressible-multiphase")
    seriesOrder: { type: 'number' },        // 시리즈 내 순번 (1부터)
    updated: { type: 'date', required: false },  // 최종 수정 날짜 (있으면 sitemap lastmod / JSON-LD dateModified 갱신)
    // 이 글의 답을 한 문장으로. description(검색 스니펫)과 달리 본문 상단에 노출된다.
    // 반드시 optional — required로 두면 기존 645개 문서가 한꺼번에 resolution 실패한다.
    takeaway: { type: 'string', required: false },
  },
  // locale·slug는 폴더(ko/en/...)와 파일명에서 자동 추출.
  // frontmatter에 명시적으로 적어도 contentlayer가 fields에 정의 안 했으면 무시되므로 안전.
  computedFields: {
    locale: {
      type: 'string',
      resolve: (post) => extractLocale(post._raw.flattenedPath),
    },
    slug: {
      type: 'string',
      resolve: (post) => extractSlug(post._raw.flattenedPath),
    },
    url: {
      type: 'string',
      resolve: (post) =>
        `/${extractLocale(post._raw.flattenedPath)}/posts/${extractSlug(post._raw.flattenedPath)}`,
    },
    readingTime: {
      type: 'string',
      resolve: (post) =>
        localeAwareReadingTime(post.body.raw, extractLocale(post._raw.flattenedPath)).text,
    },
    wordCount: {
      type: 'number',
      resolve: (post) =>
        localeAwareReadingTime(post.body.raw, extractLocale(post._raw.flattenedPath)).words,
    },
    // 검색 스니펫용 설명. frontmatter description은 중앙값이 ko 41자로 SERP 예산의
    // 절반밖에 못 쓴다. 모자라면 본문 첫 문장들을 온전한 문장 단위로 이어 붙이고,
    // 넘치면 문장 단위로만 줄인다. 645개 MDX를 손으로 다시 쓰지 않아도 되도록 빌드 시 계산.
    seoDescription: {
      type: 'string',
      resolve: (post) =>
        seoDescription(post.description, post.body.raw, extractLocale(post._raw.flattenedPath)),
    },
  },
}))

export default makeSource({
  contentDirPath: 'src/content/posts',
  documentTypes: [Post],
  mdx: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      [rehypePrettyCode, { theme: { dark: 'github-dark', light: 'github-light' }, keepBackground: false }],
      rehypeKatex,
    ],
  },
})
