import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { PostList } from '@/components/PostList'

export default function Home() {
  const posts = allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
    .map((post) => ({
      id: post.slug,
      title: post.title,
      date: post.date,
      description: post.description,
      tags: post.tags ?? [],
      readingTime: post.readingTime,
      url: post.url,
      isDynamic: false as const,
    }))

  return <PostList staticPosts={posts} />
}
