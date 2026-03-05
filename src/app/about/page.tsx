import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'About this blog and its author',
}

export default function AboutPage() {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <h1>About</h1>
      <p>
        Compressible multiphase flow CFD 수치해석을 연구하고 있습니다.
        이 블로그에서는 압축성 다상유동, 수치 기법, 그리고 CFD 전반에 대한
        이야기를 다룹니다.
      </p>
      <h2>Research Interests</h2>
      <ul>
        <li>Compressible multiphase flow simulation</li>
        <li>Riemann solvers (HLLC, Roe, AUSM+)</li>
        <li>Interface capturing methods (VOF, Level Set, Diffuse Interface)</li>
        <li>High-order finite volume / discontinuous Galerkin methods</li>
        <li>Shock-interface interaction problems</li>
      </ul>
      <h2>Tech Stack</h2>
      <ul>
        <li>Next.js 16 (App Router, Static Export)</li>
        <li>Contentlayer (Type-safe MDX)</li>
        <li>Tailwind CSS 4 + KaTeX (LaTeX rendering)</li>
        <li>rehype-pretty-code (Syntax highlighting)</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Feel free to reach out via{' '}
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>.
      </p>
    </div>
  )
}
