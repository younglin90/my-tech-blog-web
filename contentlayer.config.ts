import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import readingTime from 'reading-time'

const LOCALE_RE = /^(ko|en|ja|zh|es)\//
const extractLocale = (raw: string): string => raw.match(LOCALE_RE)?.[1] ?? 'ko'
const extractSlug = (raw: string): string => raw.replace(LOCALE_RE, '')

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
      resolve: (post) => readingTime(post.body.raw).text,
    },
    wordCount: {
      type: 'number',
      resolve: (post) => readingTime(post.body.raw).words,
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
