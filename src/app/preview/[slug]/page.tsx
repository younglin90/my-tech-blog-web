import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { PreviewContent } from '@/components/PreviewContent'

interface PreviewProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  // Preview includes ALL posts, even drafts
  return allPosts.map((post) => ({
    slug: post._raw.flattenedPath,
  }))
}

export default async function PreviewPage({ params }: PreviewProps) {
  const resolvedParams = await params
  const post = allPosts.find((p) => p._raw.flattenedPath === resolvedParams.slug)

  if (!post) {
    notFound()
  }

  return <PreviewContent post={post} />
}
