import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'CFD 연구자가 운영하는 기술 블로그 — 압축성 다상유동, 수치 기법, OpenFOAM 튜토리얼을 다룹니다.',
  alternates: { canonical: 'https://tech-blog.dev/about' },
}

export default function AboutPage() {
  return (
    <div className="max-w-none">
      <h1
        className="mb-4 text-4xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
      >
        About
      </h1>
      <p className="mb-12 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Compressible multiphase flow CFD 수치해석을 연구하고 있습니다.
        이 블로그에서는 압축성 다상유동, 수치 기법, 그리고 CFD 전반에 대한
        이야기를 다룹니다. 포스트는 Claude Code가 매일 자동 생성하며, 검토 후 배포됩니다.
      </p>

      <section className="mb-10">
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Research Interests
        </h2>
        <ul className="space-y-2">
          {[
            'Compressible multiphase flow simulation',
            'Riemann solvers — HLLC, Roe, AUSM+',
            'Interface capturing methods — VOF, Level Set, Diffuse Interface',
            'High-order finite volume / discontinuous Galerkin methods',
            'Shock–interface interaction problems',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Tech Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            'Next.js 16',
            'Contentlayer',
            'Tailwind CSS 4',
            'KaTeX',
            'rehype-pretty-code',
            'Cloudflare Pages',
          ].map((tech) => (
            <span
              key={tech}
              className="rounded px-2.5 py-1 text-xs font-medium"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Contact
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Feel free to reach out via{' '}
          <a
            href="https://github.com/younglin90"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 transition-opacity hover:opacity-75"
            style={{ color: 'var(--accent)' }}
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </div>
  )
}
