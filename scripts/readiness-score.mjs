#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']
const checks = []

function addCheck(name, run) {
  try {
    run()
    checks.push({ name, pass: true })
  } catch (error) {
    checks.push({ name, pass: false, detail: error?.message ?? String(error) })
  }
}

addCheck('i18n dictionaries expose identical keys', () => {
  const keysByLocale = Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      Object.keys(JSON.parse(readFileSync(`src/i18n/${locale}.json`, 'utf8'))).sort(),
    ])
  )
  const baseline = keysByLocale.ko.join('\n')
  for (const locale of LOCALES) {
    if (keysByLocale[locale].join('\n') !== baseline) throw new Error(`${locale} dictionary key mismatch`)
  }
})

addCheck('every locale has the same post filenames', () => {
  const postsByLocale = Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      readdirSync(`src/content/posts/${locale}`).filter((file) => file.endsWith('.mdx')).sort(),
    ])
  )
  const baseline = postsByLocale.ko.join('\n')
  for (const locale of LOCALES) {
    if (postsByLocale[locale].join('\n') !== baseline) throw new Error(`${locale} post set differs from ko`)
  }
})

addCheck('post frontmatter has no computed locale or slug fields', () => {
  for (const locale of LOCALES) {
    for (const file of readdirSync(`src/content/posts/${locale}`).filter((entry) => entry.endsWith('.mdx'))) {
      const source = readFileSync(`src/content/posts/${locale}/${file}`, 'utf8')
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1]
      if (frontmatter && /^locale:|^slug:/m.test(frontmatter)) throw new Error(`${locale}/${file}`)
    }
  }
})

addCheck('calculator metadata and component registry match', () => {
  const metadata = readFileSync('src/lib/calculators.ts', 'utf8')
  const registry = readFileSync('src/components/calculators/index.ts', 'utf8')
  const slugs = [...metadata.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1])
  const registryBody = registry.slice(registry.indexOf('export const CALCULATOR_COMPONENTS'))
  const keys = []
  for (const line of registryBody.split('\n')) {
    const match = line.match(/^\s*(?:'([^']+)'|([A-Za-z_$][\w$]*))\s*:/)
    if (match) keys.push(match[1] || match[2])
  }
  const missing = slugs.filter((slug) => !keys.includes(slug))
  const extra = keys.filter((key) => !slugs.includes(key))
  if (missing.length || extra.length) throw new Error(`missing=${missing.join(',')} extra=${extra.join(',')}`)
})

addCheck('python post-generation tests pass', () => {
  execFileSync('python3', ['-m', 'pytest', 'tests/', '-q'], { stdio: 'ignore' })
})

const score = checks.filter((check) => check.pass).length
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ readiness_score: score, total: checks.length, checks }))
} else {
  for (const check of checks) {
    console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` :: ${check.detail}` : ''}`)
  }
  console.log(score)
}
