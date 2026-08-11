/**
 * scripts/lib/clean-body.mjs — MDX 본문에서 산문만 남기는 정제기 + SERP 설명 생성
 *
 * contentlayer.config.ts의 stripForCount와 목적이 다르다. 저쪽은 글자 수만 세면 되니
 * `[#*_\`>~|=-]+` 를 통째로 공백 치환하는데, 그러면 문장 안의 하이픈과 문장부호까지
 * 부서져 사람이 읽을 문장으로 못 쓴다. 여기서는 문장을 살려야 하므로 별도 모듈로 둔다.
 */

// CJK는 문장 끝 구두점 뒤에 공백을 두지 않는다. 라틴 문자처럼 `\s+`를 요구하면
// 일본어·중국어 단락이 통째로 한 문장으로 잡혀 문장 단위 조립이 아예 동작하지 않는다.
const SENTENCE_END = /(?<=[。！？])\s*|(?<=[.!?])\s+/

/** 프론트매터·코드·수식·JSX를 걷어내고 산문 단락만 남긴다. */
export function cleanBody(raw) {
  return raw
    .replace(/^---\n[\s\S]*?\n---\n/, '')       // frontmatter
    .replace(/```[\s\S]*?```/g, '\n')            // fenced code
    .replace(/^\s*\$\$[\s\S]*?\$\$\s*$/gm, '\n') // block math
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')           // 남은 block math
    .replace(/\$[^$\n]+\$/g, ' ')                // inline math
    .replace(/^import\s+.*$/gm, '')              // MDX import
    .replace(/<[^>]+>/g, ' ')                    // JSX/HTML 태그
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')       // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')     // 링크 → 링크 텍스트만
    .replace(/^\|.*\|\s*$/gm, '')                // 표 행
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, '')       // 헤딩 (통째로 버린다)
    .replace(/^\s{0,3}[-*+>]\s+/gm, '')          // 목록·인용 마커
    .replace(/\*\*([^*]+)\*\*/g, '$1')           // bold
    .replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, '$1')// italic
    .replace(/`([^`\n]+)`/g, '$1')               // inline code
    .replace(/[ \t]+/g, ' ')
    // 인라인 수식을 걷어내면 「速度場 ，」처럼 CJK 구두점 앞에 공백이 남는다
    .replace(/\s+([，、。！？：；」』）])/g, '$1')
    .replace(/([（「『])\s+/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** 정제된 본문에서 온전한 문장만 순서대로 꺼낸다. */
export function sentences(clean) {
  return clean
    .split(/\n/)
    .flatMap((line) => line.split(SENTENCE_END))
    .map((s) => s.trim())
    .filter((s) => s.length >= 12 && /[.!?。！？]$/.test(s))
}

// SERP 스니펫 예산. Google은 픽셀 폭으로 자르므로 정확한 값은 없지만,
// CJK는 글자당 폭이 약 2배라 라틴 문자 기준의 절반쯤에서 잘린다.
const BUDGET = { ko: 80, ja: 80, zh: 80, en: 155, es: 155 }

/**
 * frontmatter description을 SERP 예산에 맞춰 양방향으로 조정한다.
 *  - 짧으면: 본문 첫 문장들을 온전한 문장 단위로 이어 붙인다.
 *  - 길면:  예산 안에 들어오는 마지막 온전한 문장까지만 남긴다.
 * 어느 쪽도 문장을 중간에서 자르지 않는다.
 */
export function seoDescription(description, raw, locale) {
  const budget = BUDGET[locale] ?? BUDGET.en
  const desc = (description ?? '').trim()

  if (desc.length > budget) {
    // 온전한 문장 단위로만 줄인다. 한 문장짜리가 예산을 넘으면 그대로 둔다 —
    // 여기서 잘라봐야 Google이 어차피 자르고, 우리가 자르면 단어 중간이 잘려 의미만 깨진다.
    const parts = desc.split(SENTENCE_END)
    if (parts.length < 2) return desc
    let out = ''
    for (const p of parts) {
      const next = out ? `${out} ${p}` : p
      if (next.length > budget) break
      out = next
    }
    return out || desc
  }

  let out = desc
  const norm = (s) => s.replace(/\s+/g, '')
  // 일본어·중국어는 문장 사이를 붙여 쓴다. 한국어는 마침표 뒤에 공백을 둔다.
  const gap = locale === 'ja' || locale === 'zh' ? '' : ' '
  for (const s of sentences(cleanBody(raw))) {
    // 본문 첫 문장이 description과 사실상 같은 경우가 있다 — 중복 노출 방지
    if (norm(out).includes(norm(s)) || norm(s).includes(norm(out))) continue
    const next = out ? `${out}${gap}${s}` : s
    if (next.length > budget) break
    // 두세 글자 붙이자고 문장을 늘리지는 않는다
    if (next.length - out.length < 10) continue
    out = next
  }
  return out
}
