import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-zinc-200 dark:text-zinc-800">404</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Page not found
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Back to Home
      </Link>
    </div>
  )
}
