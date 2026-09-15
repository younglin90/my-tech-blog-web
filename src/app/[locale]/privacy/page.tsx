import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, SITE_NAMES, hreflangAlternates, isLocale, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

interface PrivacyProps {
  params: Promise<{ locale: string }>
}

type Copy = {
  eyebrow: string
  title: string
  description: string
  updated: string
  summary: string
  sections: Array<{ title: string; body: string[]; items?: string[] }>
  choicesTitle: string
  choices: Array<{ label: string; href: string }>
  contact: string
  back: string
}

const COPY: Record<Locale, Copy> = {
  ko: {
    eyebrow: 'PRIVACY & COOKIES',
    title: '개인정보 및 쿠키 안내',
    description: 'cfdblog.cc의 분석, 로컬 저장, Google 광고와 쿠키 사용 및 이용자 선택권을 설명합니다.',
    updated: '시행일 · 2026년 9월 15일',
    summary: '이 블로그는 읽기 기능에 필요한 정보만 최소한으로 다룹니다. 계정을 만들지 않으며, 브라우저에 저장되는 읽기 기록은 원칙적으로 기기 밖으로 보내지 않습니다. 광고가 게재되면 Google과 광고 파트너가 아래와 같이 쿠키 또는 유사 기술을 사용할 수 있습니다.',
    sections: [
      {
        title: '1. 어떤 정보를 다루나요',
        body: ['페이지 열람 시 호스팅·보안 제공자는 서비스 제공과 악성 트래픽 방지를 위해 IP 주소, 요청 시각, 브라우저 정보 같은 표준 요청 데이터를 일시적으로 처리할 수 있습니다.'],
        items: [
          'Umami 분석: 페이지, 유입 경로, 브라우저·운영체제·기기 유형, 대략적인 국가, 클릭·스크롤 같은 이벤트를 익명 통계로 집계합니다. 추적 코드 자체는 쿠키를 사용하지 않으며 개인을 식별하거나 다른 사이트를 가로질러 추적하지 않습니다.',
          '브라우저 저장: 언어 쿠키와 테마, 북마크, 읽던 위치, 읽음 표시, 글자 크기, 피드백을 이 브라우저에 저장합니다. 이 값은 사이트 기능을 위한 것이며 브라우저의 사이트 데이터 삭제 기능으로 지울 수 있습니다.',
          '선택 기능: 뉴스레터를 신청하면 입력한 이메일이 Buttondown으로 전송됩니다. 댓글을 사용하면 GitHub·giscus의 정책이 적용됩니다. 후원 버튼을 누르면 선택한 외부 결제 서비스로 이동하며 이 사이트는 카드·계좌 정보를 직접 받지 않습니다.',
        ],
      },
      {
        title: '2. Google 광고와 쿠키',
        body: [
          '제3자 제공업체(예: Google)는 이 사이트 또는 다른 사이트의 이전 방문을 바탕으로 광고를 게재하기 위해 쿠키를 사용할 수 있습니다. Google의 광고 쿠키는 Google과 파트너가 관심사 기반 광고를 제공하도록 할 수 있습니다.',
          '광고 요청 과정에서 쿠키, 로컬 저장소, IP 주소 또는 기타 식별자가 광고 제공·측정·빈도 제한·부정행위 방지에 사용될 수 있습니다. 관련 지역에서는 Google 인증 동의 메시지에서 동의, 거부 또는 옵션 관리를 선택할 수 있으며 선택에 따라 개인 맞춤 또는 제한된 광고가 제공될 수 있습니다.',
        ],
      },
      {
        title: '3. 이용 목적과 공유',
        body: ['정보는 사이트 제공, 읽기 편의 저장, 익명 이용 통계, 오류·보안 대응, 이용자가 요청한 구독·댓글·후원 처리, 그리고 동의 또는 관련 법령이 허용하는 광고 제공에 사용됩니다. 필요한 범위에서 Cloudflare, Umami, Google, Buttondown, GitHub/giscus 및 이용자가 선택한 결제 서비스가 각자의 정책에 따라 정보를 처리할 수 있습니다. 개인정보를 판매하지 않습니다.'],
      },
      {
        title: '4. 보관과 안전',
        body: ['브라우저 저장 정보는 이용자가 삭제할 때까지 해당 기기에 남습니다. 외부 서비스의 보관 기간은 각 제공자의 정책을 따릅니다. 합리적인 보호조치를 사용하지만 인터넷 전송이나 저장의 절대적인 안전을 보장할 수는 없습니다.'],
      },
      {
        title: '5. 이용자의 선택',
        body: ['Google 광고 설정에서 개인 맞춤 광고를 끌 수 있고, 동의 메시지가 표시되는 지역에서는 “동의하지 않음” 또는 “옵션 관리”를 선택할 수 있습니다. 브라우저 설정에서 쿠키·사이트 데이터를 차단하거나 삭제할 수도 있습니다. 다만 일부 읽기 편의 기능이 초기화될 수 있습니다.'],
      },
      {
        title: '6. 아동, 변경 및 문의',
        body: ['이 사이트는 아동을 대상으로 설계되지 않았으며 아동의 개인정보를 의도적으로 수집하지 않습니다. 서비스나 법적 요구가 바뀌면 이 페이지를 갱신하고 시행일을 수정합니다. 개인정보 관련 문의는 아래 GitHub 프로필을 통해 보내주세요. 이 안내는 일반 정보이며 개별 법률 자문이 아닙니다.'],
      },
    ],
    choicesTitle: '설정과 제공자 정책',
    choices: [],
    contact: '문의 · GitHub @younglin90',
    back: '블로그로 돌아가기',
  },
  en: {
    eyebrow: 'PRIVACY & COOKIES',
    title: 'Privacy and cookie notice',
    description: 'How cfdblog.cc uses analytics, local storage, Google advertising and cookies, and the choices available to visitors.',
    updated: 'Effective · September 15, 2026',
    summary: 'This blog handles only the minimum information needed for its reading features. It does not require an account, and reading data stored in your browser normally stays on your device. If ads are served, Google and its advertising partners may use cookies or similar technologies as described below.',
    sections: [
      {
        title: '1. Information handled',
        body: ['When a page is requested, hosting and security providers may temporarily process standard request data such as IP address, request time and browser details to deliver the site and prevent abusive traffic.'],
        items: [
          'Umami analytics aggregates anonymous statistics about pages, referrers, browser, operating system, device type, approximate country, and events such as clicks or scroll depth. Its tracking code does not use cookies, identify individuals, or track visitors across websites.',
          'Browser storage keeps your language preference, theme, bookmarks, reading position, read status, font size and feedback on this device. You can remove these values by clearing this site’s browser data.',
          'Optional features: subscribing sends the email you enter to Buttondown. Comments are governed by GitHub and giscus policies. Support links open an external payment service selected by you; this site does not directly receive card or bank details.',
        ],
      },
      {
        title: '2. Google advertising and cookies',
        body: [
          'Third-party vendors, including Google, may use cookies to serve ads based on a visitor’s prior visits to this or other websites. Google’s advertising cookies enable Google and its partners to serve interest-based ads.',
          'During an ad request, cookies, local storage, IP addresses or other identifiers may be used for ad delivery, measurement, frequency capping and fraud prevention. In applicable regions, Google’s certified consent message lets you consent, reject or manage options; personalized or limited ads may be served according to that choice.',
        ],
      },
      {
        title: '3. Purposes and sharing',
        body: ['Information is used to deliver the site, remember reading preferences, produce anonymous usage statistics, address errors and security, provide requested subscriptions, comments or support, and serve advertising where consent or applicable law permits. Cloudflare, Umami, Google, Buttondown, GitHub/giscus and a payment service you choose may process information under their own policies where needed. Personal information is not sold.'],
      },
      {
        title: '4. Retention and security',
        body: ['Browser-stored information remains on that device until you remove it. External services set their own retention periods. Reasonable safeguards are used, but no internet transmission or storage system can be guaranteed completely secure.'],
      },
      {
        title: '5. Your choices',
        body: ['You can disable personalized advertising in Google Ads Settings. Where a consent message is shown, choose “Do not consent” or “Manage options.” You can also block or delete cookies and site data in your browser; doing so may reset reading preferences.'],
      },
      {
        title: '6. Children, changes and contact',
        body: ['This site is not designed for children and does not knowingly collect children’s personal information. This notice and its effective date will be updated when services or legal requirements change. Send privacy questions through the GitHub profile below. This notice is general information, not individual legal advice.'],
      },
    ],
    choicesTitle: 'Controls and provider policies',
    choices: [],
    contact: 'Contact · GitHub @younglin90',
    back: 'Back to the blog',
  },
  ja: {
    eyebrow: 'PRIVACY & COOKIES',
    title: 'プライバシーとCookieについて',
    description: 'cfdblog.ccにおけるアクセス解析、ローカル保存、Google広告とCookie、利用者の選択肢について説明します。',
    updated: '施行日 · 2026年9月15日',
    summary: 'このブログは閲覧機能に必要な最小限の情報だけを扱います。アカウント登録は不要で、ブラウザに保存される読書データは原則として端末外へ送信されません。広告が配信される場合、Googleと広告パートナーは以下のとおりCookie等を使用することがあります。',
    sections: [
      { title: '1. 取り扱う情報', body: ['ページの配信と不正アクセス対策のため、ホスティング・セキュリティ事業者がIPアドレス、リクエスト時刻、ブラウザ情報などの標準的な通信データを一時的に処理することがあります。'], items: ['Umamiはページ、参照元、ブラウザ、OS、端末種別、おおよその国、クリックやスクロール等を匿名統計として集計します。トラッキングコードはCookieを使わず、個人の識別やサイト横断追跡を行いません。', '言語、テーマ、ブックマーク、読書位置、既読状態、文字サイズ、フィードバックはこのブラウザに保存され、サイトデータの削除で消去できます。', '任意機能では、購読時のメールアドレスがButtondownへ送信されます。コメントにはGitHub・giscusの規約が適用され、支援リンクは外部決済サービスを開きます。本サイトはカード・口座情報を直接受け取りません。'] },
      { title: '2. Google広告とCookie', body: ['Googleを含む第三者配信事業者は、このサイトや他サイトへの過去のアクセスに基づく広告配信のためCookieを使用することがあります。Googleの広告Cookieにより、Googleとそのパートナーが興味関心に基づく広告を表示できます。', '広告配信、測定、表示回数制限、不正防止のため、Cookie、ローカルストレージ、IPアドレス等が使われることがあります。対象地域ではGoogle認定の同意メッセージから同意、拒否、オプション管理を選べます。'] },
      { title: '3. 利用目的と共有', body: ['サイト配信、閲覧設定の保存、匿名利用統計、障害・セキュリティ対応、依頼された購読・コメント・支援、同意または法令で認められた広告配信に使用します。必要な範囲でCloudflare、Umami、Google、Buttondown、GitHub/giscus、選択した決済サービスが各社の方針に従って処理します。個人情報は販売しません。'] },
      { title: '4. 保存期間と安全性', body: ['ブラウザ保存情報は利用者が削除するまで端末に残ります。外部サービスの保存期間は各社の方針に従います。合理的な保護措置を講じますが、通信・保存の完全な安全を保証することはできません。'] },
      { title: '5. 利用者の選択', body: ['Google広告設定でパーソナライズ広告を無効にできます。同意メッセージでは「同意しない」または「オプションを管理」を選べます。ブラウザでCookieやサイトデータを削除すると閲覧設定も初期化される場合があります。'] },
      { title: '6. 児童、変更、問い合わせ', body: ['本サイトは児童向けではなく、児童の個人情報を意図的に収集しません。サービスや法的要件の変更時は本ページと施行日を更新します。問い合わせは下記GitHubプロフィールへお送りください。本案内は一般情報であり個別の法律助言ではありません。'] },
    ],
    choicesTitle: '設定と提供者のポリシー', choices: [], contact: '問い合わせ · GitHub @younglin90', back: 'ブログに戻る',
  },
  zh: {
    eyebrow: 'PRIVACY & COOKIES',
    title: '隐私与 Cookie 声明',
    description: '说明 cfdblog.cc 如何使用分析、浏览器本地存储、Google 广告与 Cookie，以及访问者可用的控制选项。',
    updated: '生效日期 · 2026年9月15日',
    summary: '本站只处理阅读功能所需的最低限度信息，不要求注册账户；保存在浏览器中的阅读数据通常不会离开你的设备。广告投放后，Google 及其广告合作伙伴可能按下述方式使用 Cookie 或类似技术。',
    sections: [
      { title: '1. 处理的信息', body: ['为提供网站并防止恶意流量，托管与安全服务商可能暂时处理 IP 地址、请求时间、浏览器信息等标准请求数据。'], items: ['Umami 以匿名统计形式汇总页面、来源、浏览器、操作系统、设备类型、大致国家及点击、滚动等事件。其跟踪代码不使用 Cookie，不识别个人，也不跨网站跟踪。', '语言、主题、书签、阅读位置、已读状态、字号和反馈保存在当前浏览器中，可通过清除本站数据删除。', '可选功能：订阅时输入的邮箱会发送至 Buttondown；评论受 GitHub 与 giscus 政策约束；支持按钮会打开你选择的外部支付服务，本站不直接接收银行卡或账户信息。'] },
      { title: '2. Google 广告与 Cookie', body: ['包括 Google 在内的第三方供应商可能使用 Cookie，根据访问者此前访问本站或其他网站的情况投放广告。Google 广告 Cookie 可让 Google 及其合作伙伴提供基于兴趣的广告。', '广告请求中可能使用 Cookie、本地存储、IP 地址或其他标识符进行投放、衡量、频次控制和反欺诈。在适用地区，可通过 Google 认证的同意消息选择同意、拒绝或管理选项。'] },
      { title: '3. 用途与共享', body: ['信息用于网站提供、阅读偏好保存、匿名使用统计、错误与安全处理、用户请求的订阅/评论/支持，以及在获得同意或法律允许时投放广告。必要时，Cloudflare、Umami、Google、Buttondown、GitHub/giscus 及你选择的支付服务会依据各自政策处理信息。本站不出售个人信息。'] },
      { title: '4. 保存与安全', body: ['浏览器中的信息会保留到你自行删除；外部服务的保存期限以各自政策为准。本站采取合理保护措施，但无法保证互联网传输或存储绝对安全。'] },
      { title: '5. 你的选择', body: ['你可在 Google 广告设置中关闭个性化广告；看到同意消息时可选择“不同意”或“管理选项”。也可在浏览器中阻止或删除 Cookie 与站点数据，但阅读偏好可能被重置。'] },
      { title: '6. 儿童、更新与联系', body: ['本站并非面向儿童，也不会故意收集儿童个人信息。服务或法律要求变化时会更新本声明及生效日期。隐私问题请通过下方 GitHub 主页联系。本声明仅为一般信息，不构成个别法律意见。'] },
    ],
    choicesTitle: '设置与服务商政策', choices: [], contact: '联系 · GitHub @younglin90', back: '返回博客',
  },
  es: {
    eyebrow: 'PRIVACY & COOKIES',
    title: 'Aviso de privacidad y cookies',
    description: 'Cómo usa cfdblog.cc la analítica, el almacenamiento local, la publicidad de Google y las cookies, y qué opciones tiene el visitante.',
    updated: 'Vigente desde · 15 de septiembre de 2026',
    summary: 'Este blog trata solo la información mínima necesaria para sus funciones de lectura. No exige una cuenta y los datos de lectura guardados en el navegador normalmente permanecen en el dispositivo. Si se publican anuncios, Google y sus socios publicitarios pueden usar cookies o tecnologías similares como se explica a continuación.',
    sections: [
      { title: '1. Información tratada', body: ['Al solicitar una página, los proveedores de alojamiento y seguridad pueden tratar temporalmente datos estándar —dirección IP, hora de solicitud y navegador— para servir el sitio y prevenir tráfico abusivo.'], items: ['Umami agrega estadísticas anónimas sobre páginas, referentes, navegador, sistema operativo, dispositivo, país aproximado y eventos como clics o desplazamiento. Su código no usa cookies, identifica personas ni rastrea entre sitios.', 'El idioma, tema, marcadores, posición de lectura, estado leído, tamaño de letra y feedback se guardan en este navegador. Puedes borrarlos eliminando los datos del sitio.', 'Funciones opcionales: al suscribirte, el correo introducido se envía a Buttondown. Los comentarios se rigen por GitHub y giscus. Los enlaces de apoyo abren un servicio de pago externo elegido por ti; este sitio no recibe directamente datos de tarjeta o cuenta.'] },
      { title: '2. Publicidad de Google y cookies', body: ['Terceros, incluido Google, pueden usar cookies para mostrar anuncios basados en visitas anteriores a este u otros sitios. Las cookies publicitarias de Google permiten a Google y sus socios ofrecer anuncios basados en intereses.', 'Durante una solicitud publicitaria pueden usarse cookies, almacenamiento local, direcciones IP u otros identificadores para entrega, medición, limitación de frecuencia y prevención del fraude. En las regiones aplicables, el mensaje de consentimiento certificado de Google permite consentir, rechazar o administrar opciones.'] },
      { title: '3. Finalidades y cesión', body: ['La información se usa para prestar el sitio, recordar preferencias, elaborar estadísticas anónimas, responder a errores y seguridad, ofrecer suscripciones, comentarios o apoyos solicitados y servir publicidad cuando el consentimiento o la ley lo permitan. Cloudflare, Umami, Google, Buttondown, GitHub/giscus y el servicio de pago elegido pueden tratar información bajo sus propias políticas cuando sea necesario. No se vende información personal.'] },
      { title: '4. Conservación y seguridad', body: ['La información del navegador permanece en ese dispositivo hasta que la elimines. Los servicios externos fijan sus propios plazos. Se aplican medidas razonables, pero ningún sistema de transmisión o almacenamiento por Internet es completamente seguro.'] },
      { title: '5. Tus opciones', body: ['Puedes desactivar la publicidad personalizada en Configuración de anuncios de Google. Cuando aparezca el mensaje de consentimiento, elige “No consentir” o “Administrar opciones”. También puedes bloquear o eliminar cookies y datos del sitio en el navegador; esto puede restablecer tus preferencias.'] },
      { title: '6. Menores, cambios y contacto', body: ['El sitio no está diseñado para menores ni recopila deliberadamente sus datos personales. Este aviso y su fecha se actualizarán si cambian los servicios o requisitos legales. Envía consultas mediante el perfil de GitHub indicado abajo. Es información general, no asesoramiento jurídico individual.'] },
    ],
    choicesTitle: 'Controles y políticas de proveedores', choices: [], contact: 'Contacto · GitHub @younglin90', back: 'Volver al blog',
  },
}

const PROVIDER_LINKS: Array<{ label: Record<Locale, string>; href: string }> = [
  {
    label: { ko: 'Google 광고 설정', en: 'Google Ads Settings', ja: 'Google 広告設定', zh: 'Google 广告设置', es: 'Configuración de anuncios de Google' },
    href: 'https://adssettings.google.com/',
  },
  {
    label: { ko: 'Google이 파트너 사이트의 데이터를 사용하는 방식', en: 'How Google uses data from partner sites', ja: 'Googleによるパートナーサイトのデータ利用', zh: 'Google 如何使用合作伙伴网站的数据', es: 'Cómo usa Google los datos de sitios asociados' },
    href: 'https://policies.google.com/technologies/partner-sites',
  },
  {
    label: { ko: 'Google 개인정보처리방침', en: 'Google Privacy Policy', ja: 'Google プライバシーポリシー', zh: 'Google 隐私权政策', es: 'Política de Privacidad de Google' },
    href: 'https://policies.google.com/privacy',
  },
  {
    label: { ko: 'Umami 개인정보 안내', en: 'Umami privacy information', ja: 'Umami プライバシー情報', zh: 'Umami 隐私说明', es: 'Información de privacidad de Umami' },
    href: 'https://umami.is/privacy',
  },
  {
    label: { ko: 'Cloudflare 개인정보처리방침', en: 'Cloudflare Privacy Policy', ja: 'Cloudflare プライバシーポリシー', zh: 'Cloudflare 隐私政策', es: 'Política de Privacidad de Cloudflare' },
    href: 'https://www.cloudflare.com/privacypolicy/',
  },
]

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: PrivacyProps): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  const copy = COPY[loc]
  const url = `${SITE_URL}/${loc}/privacy/`
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url, languages: hreflangAlternates('/privacy') },
    openGraph: { title: copy.title, description: copy.description, url, siteName: SITE_NAMES[loc], type: 'website' },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description },
  }
}

export default async function PrivacyPage({ params }: PrivacyProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const copy = COPY[loc]

  return (
    <article className="py-6">
      <div className="mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
        {copy.eyebrow}
      </div>
      <h1 className="display mt-2 text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text)' }}>
        {copy.title}
      </h1>
      <p className="mono mt-3 text-[11px]" style={{ color: 'var(--text-faint)' }}>{copy.updated}</p>

      <div
        className="mt-7 rounded-xl p-5 text-sm leading-7"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        {copy.summary}
      </div>

      <div className="mt-10 space-y-10">
        {copy.sections.map((section) => (
          <section key={section.title}>
            <h2 className="display text-xl font-semibold" style={{ color: 'var(--text)' }}>{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7" style={{ color: 'var(--text-muted)' }}>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items && (
                <ul className="space-y-2 pl-5">
                  {section.items.map((item) => <li key={item} className="list-disc pl-1">{item}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>{copy.choicesTitle}</h2>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {PROVIDER_LINKS.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 link-hover-text-accent" style={{ color: 'var(--text-muted)' }}>
              {item.label[loc]} ↗
            </a>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <a href="https://github.com/younglin90" target="_blank" rel="noopener noreferrer" className="text-xs link-hover-text-accent" style={{ color: 'var(--text-muted)' }}>{copy.contact} ↗</a>
        <Link href={`/${loc}`} className="inline-flex min-h-11 items-center text-xs font-medium" style={{ color: 'var(--accent)' }}>← {copy.back}</Link>
      </div>
    </article>
  )
}
