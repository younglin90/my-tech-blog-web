import { useMDXComponent } from 'next-contentlayer2/hooks'
import Link from 'next/link'
import Image from 'next/image'
import { NumericalDungeon } from '@/components/NumericalDungeon'
import { MachArchitect } from '@/components/MachArchitect'
import { VelocityField, StreamLine, NumericalScheme, PressureContour, BoundaryCondition } from '@/components/viz'

const displayStyle = { fontFamily: 'var(--font-display)' }

const components = {
  h1: (props: any) => (
    <h1 className="mt-2 scroll-m-20 text-4xl font-bold tracking-tight" style={displayStyle} {...props} />
  ),
  h2: (props: any) => (
    <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0" style={{ ...displayStyle, borderColor: 'var(--border)' }} {...props} />
  ),
  h3: (props: any) => (
    <h3 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight" style={displayStyle} {...props} />
  ),
  h4: (props: any) => (
    <h4 className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight" style={displayStyle} {...props} />
  ),
  p: (props: any) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
  ),
  a: (props: any) => (
    <Link
      className="font-medium underline underline-offset-4 transition-opacity hover:opacity-75"
      style={{ color: 'var(--accent)' }}
      {...props}
    />
  ),
  ul: (props: any) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
  ),
  ol: (props: any) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="mt-6 pl-6 italic" style={{ borderLeft: '3px solid var(--accent)', color: 'var(--text-muted)', opacity: 0.9 }} {...props} />
  ),
  table: (props: any) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="border border-zinc-200 px-4 py-2 text-left font-bold dark:border-zinc-700 [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),
  td: (props: any) => (
    <td className="border border-zinc-200 px-4 py-2 text-left dark:border-zinc-700 [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),
  hr: (props: any) => (
    <hr className="my-8 border-zinc-200 dark:border-zinc-800" {...props} />
  ),
  img: (props: any) => (
    <Image
      className="rounded-md"
      width={720}
      height={405}
      alt={props.alt ?? ''}
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
