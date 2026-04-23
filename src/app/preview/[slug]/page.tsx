import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { PreviewContent } from '@/components/PreviewContent'

interface PreviewProps {
  params: Promise<{ slug: string }>
}

// Preview는 ko 포스트만(관리자 미리보기). slug는 ko/ prefix 없는 형태.
export async function generateStaticParams() {
  return allPosts
    .filter((p) => p.locale === 'ko')
    .map((p) => ({ slug: p.slug }))
}

export default async function PreviewPage({ params }: PreviewProps) {
  const { slug } = await params
  const post = allPosts.find((p) => p.locale === 'ko' && p.slug === slug)
  if (!post) notFound()
  return <PreviewContent post={post} />
}
