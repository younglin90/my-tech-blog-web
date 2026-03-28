'use client'

import { useMDXComponent } from 'next-contentlayer2/hooks'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CodeBlock } from '@/components/CodeBlock'
import { NumericalDungeon } from '@/components/NumericalDungeon'
import { MachArchitect } from '@/components/MachArchitect'
import { VelocityField, StreamLine, NumericalScheme, PressureContour, BoundaryCondition } from '@/components/viz'

const displayStyle = { fontFamily: 'var(--font-display)' }

function Callout({ type = 'note', title, children }: { type?: 'note' | 'tip' | 'warning' | 'caution'; title?: string; children: React.ReactNode }) {
  const icons = { note: 'ℹ', tip: '💡', warning: '⚠', caution: '🚨' }
  const defaultTitles = { note: 'Note', tip: 'Tip', warning: 'Warning', caution: 'Caution' }
  return (
    <div className={`callout callout-${type}`}>
      <span className="callout-icon" aria-hidden="true">{icons[type]}</span>
      <div className="callout-content">
        <div className="callout-title">{title ?? defaultTitles[type]}</div>
        {children}
      </div>
    </div>
  )
}

function slugify(children: React.ReactNode): string {
  const text = [children]
    .flat(Infinity as 1)
    .filter((c): c is string => typeof c === 'string')
    .join('')
  return text
    .toLowerCase()
    .replace(/[^\w\uAC00-\uD7A3\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function AnchorLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard.writeText(url).catch(() => {})
    window.location.hash = id
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [id])

  return (
    <span className="relative inline-block">
      <a
        href={`#${id}`}
        onClick={handleClick}
        className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875em' }}
        aria-label={`Copy link to section: ${id}`}
        tabIndex={-1}
      >
        #
      </a>
      {copied && (
        <span
          className="absolute -top-7 left-2 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
          style={{ background: 'var(--accent)', color: '#08111f', pointerEvents: 'none' }}
        >
          Copied!
        </span>
      )}
    </span>
  )
}

const components = {
  h1: ({ children, ...props }: any) => {
    const id = slugify(children)
    return (
      <h1 id={id} className="group mt-2 scroll-m-20 text-4xl font-bold tracking-tight" style={displayStyle} {...props}>
        {children}<AnchorLink id={id} />
      </h1>
    )
  },
  h2: ({ children, ...props }: any) => {
    const id = slugify(children)
    return (
      <h2 id={id} className="group mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0" style={{ ...displayStyle, borderColor: 'var(--border)' }} {...props}>
        {children}<AnchorLink id={id} />
      </h2>
    )
  },
  h3: ({ children, ...props }: any) => {
    const id = slugify(children)
    return (
      <h3 id={id} className="group mt-8 scroll-m-20 text-2xl font-semibold tracking-tight" style={displayStyle} {...props}>
        {children}<AnchorLink id={id} />
      </h3>
    )
  },
  h4: ({ children, ...props }: any) => {
    const id = slugify(children)
    return (
      <h4 id={id} className="group mt-6 scroll-m-20 text-xl font-semibold tracking-tight" style={displayStyle} {...props}>
        {children}<AnchorLink id={id} />
      </h4>
    )
  },
  p: (props: any) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
  ),
  a: ({ href, children, ...props }: any) => {
    const isExternal = typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'))
    return (
      <Link
        href={href ?? '#'}
        className="font-medium underline underline-offset-4 transition-opacity hover:opacity-75 inline-flex items-center gap-0.5"
        style={{ color: 'var(--accent)' }}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
        {isExternal && (
          <svg className="inline h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 10L10 2M10 2H5M10 2v5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </Link>
    )
  },
  ul: (props: any) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
  ),
  ol: (props: any) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="relative mt-6 pl-6 italic"
      style={{ borderLeft: '3px solid var(--accent)', color: 'var(--text-muted)' }}
      {...props}
    >
      <span
        className="absolute -left-1 -top-2 select-none text-4xl leading-none"
        style={{ color: 'var(--accent)', opacity: 0.25, fontFamily: 'var(--font-display)' }}
        aria-hidden="true"
      >
        &ldquo;
      </span>
      {children}
    </blockquote>
  ),
  table: (props: any) => (
    <div className="my-6 w-full overflow-x-auto rounded-md" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th
      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider [&[align=center]]:text-center [&[align=right]]:text-right"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
      {...props}
    />
  ),
  td: (props: any) => (
    <td
      className="px-4 py-2.5 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
      {...props}
    />
  ),
  hr: (props: any) => (
    <hr className="my-8" style={{ borderColor: 'var(--border)' }} {...props} />
  ),
  pre: (props: any) => <CodeBlock {...props} />,
  img: (props: any) => (
    <Image
      className="rounded-md"
      width={720}
      height={405}
      alt={props.alt ?? ''}
      {...props}
    />
  ),
  figure: (props: any) => (
    <figure className="my-8" {...props} />
  ),
  figcaption: (props: any) => (
    <figcaption
      className="mt-2 text-center text-xs italic"
      style={{ color: 'var(--text-muted)' }}
      {...props}
    />
  ),
  NumericalDungeon,
  MachArchitect,
  VelocityField,
  StreamLine,
  NumericalScheme,
  PressureContour,
  BoundaryCondition,
  Callout,
  Note: (props: any) => <Callout type="note" {...props} />,
  Tip: (props: any) => <Callout type="tip" {...props} />,
  Warning: (props: any) => <Callout type="warning" {...props} />,
  Caution: (props: any) => <Callout type="caution" {...props} />,
}

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)

  return (
    <div className="mdx prose prose-zinc dark:prose-invert max-w-none">
      <Component components={components} />
    </div>
  )
}
