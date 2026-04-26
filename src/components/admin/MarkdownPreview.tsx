'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// admin 페이지에서 next/dynamic 으로 import — KaTeX/remark 번들이
// 미리보기 토글을 누른 시점에만 로드되도록 분리.
export default function MarkdownPreview({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  )
}
