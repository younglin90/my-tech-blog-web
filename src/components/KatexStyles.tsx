/**
 * KaTeX 스타일시트를 실제로 수식을 렌더하는 페이지에만 붙인다.
 *
 * 예전에는 루트 layout에서 무조건 <link>를 넣어, 수식이 하나도 없는 홈·태그·시리즈·
 * 용어집·시각화 페이지까지 23.7KB짜리 렌더 블로킹 스타일시트를 기다렸다.
 *
 * React 19는 `precedence`가 붙은 <link rel="stylesheet">를 <head>로 끌어올리고
 * 같은 href는 한 번만 넣는다. 그래서 한 페이지에서 MDX와 ToolFormula가 동시에
 * 이걸 렌더해도 태그는 하나만 나간다.
 */
export function KatexStyles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = { rel: 'stylesheet', href: '/katex/katex.min.css', precedence: 'default' } as any
  return <link {...props} />
}
