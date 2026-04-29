import fs from 'node:fs'

const indexSource = fs.readFileSync('src/components/calculators/index.ts', 'utf8')
const importMap = new Map()
for (const match of indexSource.matchAll(/import\s+\{([\s\S]*?)\}\s+from '@\/components\/calculators\/([^']+)'/g)) {
  for (const name of match[1].split(',').map((item) => item.trim()).filter(Boolean)) {
    importMap.set(name, `${match[2]}.tsx`)
  }
}

const objectSource = indexSource.match(/export const CALCULATOR_COMPONENTS:[\s\S]*?= \{([\s\S]*?)\n\}/)?.[1] ?? ''
let mappedTools = 0
let visualRichTools = 0
for (const line of objectSource.split('\n')) {
  const match = line.match(/^\s*(?:['"]([^'"]+)['"]|([A-Za-z_$][\w$-]*))\s*:\s*([A-Za-z_$][\w$]*)/)
  if (!match) continue
  mappedTools += 1
  const componentName = match[3]
  const file = importMap.get(componentName)
  const source = file && fs.existsSync(`src/components/calculators/${file}`)
    ? fs.readFileSync(`src/components/calculators/${file}`, 'utf8')
    : ''
  if (/(<svg|<canvas|requestAnimationFrame|<animate\b|linearGradient|viewBox=|radialGradient|polyline|path d=|meter|progress)/.test(source)) {
    visualRichTools += 1
  }
}

const tools = [...fs.readFileSync('src/lib/calculators.ts', 'utf8').matchAll(/slug:\s*['"]([^'"]+)['"]/g)].length
console.log(tools + visualRichTools)
