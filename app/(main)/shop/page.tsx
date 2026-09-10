import Image from 'next/image'
import Link from 'next/link'
import {
  ensureCurrentWeeklyStock,
  ensureWalkingInAgesBook,
  XIAOWENHAO_STAND_ONLY_PRODUCT_ID,
  XIAOWENHAO_WITH_CAMERA_PRODUCT_ID,
} from '@/lib/shop'
import { getServerLocale } from '@/lib/server-i18n'

export const dynamic = 'force-dynamic'

const legacyProducts = [
  {
    name: '小问号 AI Tutor 支架 1.0',
    image: '/products/xiaowenhao-ai-tutor-stand.png',
    description: '小问号支架的第一代经典设计，现已停止销售。',
    descriptionEn: 'The original first-generation Xiaowenhao stand, now retired from sale.',
  },
  {
    name: '小问号 AI Tutor 支架 1.0 · 炫彩款',
    image: '/products/xiaowenhao-ai-tutor-stand-rainbow.png',
    description: '第一代炫彩特别款，现作为设计历程保留展示。',
    descriptionEn: 'The first-generation rainbow edition, preserved as part of the design story.',
  },
]

export default async function ShopPage() {
  const [locale, standOnly, withCamera, book] = await Promise.all([
    getServerLocale(),
    ensureCurrentWeeklyStock(XIAOWENHAO_STAND_ONLY_PRODUCT_ID),
    ensureCurrentWeeklyStock(XIAOWENHAO_WITH_CAMERA_PRODUCT_ID),
    ensureWalkingInAgesBook(),
  ])

  const zh = locale === 'zh'
  const product = standOnly
  const hasStock = Boolean((standOnly?.stock ?? 0) > 0 || (withCamera?.stock ?? 0) > 0)
  return (
    <div className="min-h-dvh bg-[#070913] pb-24 pt-28 text-white">
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_85%_10%,rgba(96,82,255,0.2),transparent_36%),linear-gradient(145deg,#11152d,#080a13_65%)] px-6 py-12 sm:px-10 lg:px-14">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">Larry Academy · My Product</p>
          <div className="mt-5 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
                {zh ? '我的产品，我的探索。' : 'My product. My explorations.'}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
                {zh
                  ? '从七岁写下的欧洲故事，到为 AI 学习桌设计的实物工具：这里收藏 Larry 把好奇心变成作品的过程。'
                  : 'From a Europe story written at seven to physical tools for an AI learning desk, this is where Larry turns curiosity into things you can hold.'}
              </p>
            </div>
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 px-6 py-4 text-amber-100">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Books · Learning tools</p>
              <p className="mt-1 text-xl font-black sm:text-2xl">
                {zh
                  ? '学生亲手创造的作品'
                  : 'Made by a young creator'}
              </p>
            </div>
          </div>
        </div>

        {book ? (
          <article className="relative mt-10 grid overflow-hidden rounded-[2.5rem] border border-amber-200/15 bg-[#102b4f] shadow-2xl shadow-blue-950/40 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative min-h-[24rem] overflow-hidden lg:min-h-[36rem]">
              <Image src={book.imageUrl || '/about/larry-book.jpg'} alt="《七岁行欧洲》 Walking in Ages" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 54vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102b4f] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#102b4f]" />
              <span className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-xl">Larry&apos;s first book</span>
            </div>
            <div className="relative flex flex-col justify-center p-7 sm:p-10 lg:-ml-12 lg:p-14">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-200">Walking in Ages</p>
              <h2 className="mt-4 text-4xl font-black sm:text-6xl">七岁行欧洲</h2>
              <p className="mt-3 text-lg font-bold text-blue-100">{zh ? '一个七岁孩子眼中的欧洲，一段从行走开始的学习。' : 'Europe through the eyes of a seven-year-old—and a learning journey that began by walking.'}</p>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/65">{book.description}</p>
              <div className="mt-8 flex items-end justify-between border-t border-white/12 pt-7">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{zh ? '新书价格' : 'Book price'}</p><p className="mt-1 text-4xl font-black">¥55 <span className="text-base text-emerald-200">{zh ? '包邮' : 'free shipping'}</span></p></div>
                <p className="text-sm font-black text-emerald-200">{zh ? `现货 ${book.stock} 本` : `${book.stock} in stock`}</p>
              </div>
              <Link href="/shop/walking-in-ages" className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-amber-100 px-7 text-base font-black text-[#102b4f] transition hover:-translate-y-0.5 hover:bg-white">
                {zh ? '走进 Larry 的七岁欧洲 →' : "Enter Larry's Europe story →"}
              </Link>
            </div>
          </article>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {legacyProducts.map((legacy) => (
            <article key={legacy.name} className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] opacity-75 sm:grid-cols-[0.75fr_1.25fr]">
              <div className="relative aspect-square min-h-56 overflow-hidden bg-[#14162b] grayscale-[35%]">
                <Image
                  src={legacy.image}
                  alt={legacy.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 24vw"
                />
                <div className="absolute inset-0 bg-black/15" />
                <div className="absolute left-4 top-4 rounded-full border border-rose-200/30 bg-rose-500/80 px-4 py-2 text-sm font-black text-white shadow-lg backdrop-blur-xl">
                  {zh ? '绝版' : 'Discontinued'}
                </div>
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">Archive · 1.0</p>
                <h2 className="mt-3 text-2xl font-black text-white/75">{legacy.name}</h2>
                <p className="mt-3 text-sm leading-6 text-white/40">{zh ? legacy.description : legacy.descriptionEn}</p>
                <div className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white/35">
                  {zh ? '绝版 · 不再销售' : 'Discontinued · Not for sale'}
                </div>
              </div>
            </article>
          ))}
        </div>

        {product ? (
          <article className="mt-10 grid overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-violet-950/30 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative grid grid-cols-2 gap-px self-center overflow-hidden bg-white/10">
              {[
                { src: product.imageUrl || '/products/xiaowenhao-ai-tutor-stand-2.png', label: 'Style 01' },
                { src: '/products/xiaowenhao-ai-tutor-stand-2-style-02.png', label: 'Style 02' },
              ].map((style, index) => (
                <div key={style.src} className="relative aspect-[4/5] overflow-hidden bg-[#171a3d]">
                  <Image
                    src={style.src}
                    alt={`小问号 AI Tutor 支架 2.0 炫彩款 ${style.label}`}
                    fill
                    priority={index === 0}
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 23vw"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[11px] font-black backdrop-blur-xl">{style.label}</span>
                </div>
              ))}
              <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-sm font-bold backdrop-blur-xl">
                2.0 · {zh ? '全新升级' : 'Upgraded'}
              </div>
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-300">Xiaowenhao AI Tutor</p>
              <h2 className="mt-4 text-3xl font-black sm:text-5xl">小问号 AI Tutor 支架 2.0 · 炫彩款</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">升级高度的炫彩桌面 AI 学习支架，提供配备 500 万像素自动对焦摄像头与不带摄像头两种型号，两个型号分别管理库存。</p>
              <p className="mt-4 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.07] px-5 py-3 text-sm font-bold leading-6 text-fuchsia-100">
                {zh
                  ? '随机盲盒发货：每一种 Style 都很精美，收到哪一种，都是一份惊喜。'
                  : 'Mystery style shipment: every finish is beautiful, and whichever one arrives is a delightful surprise.'}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {['500 万像素自动对焦摄像头可选', '解决原来的高度问题', '炫彩款', '顺丰配送'].map((label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/75">
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-white/45">{zh ? '产品价格' : 'Price'}</p>
                  <p className="mt-1 text-4xl font-black">¥99 / ¥199 <span className="text-sm text-amber-200">+ ¥18 顺丰运费</span></p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-white/45">{zh ? '本周剩余' : 'Remaining this week'}</p>
                  <div className="mt-2 space-y-1 text-sm font-black">
                    <p className={withCamera && withCamera.stock > 0 ? 'text-emerald-300' : 'text-amber-300'}>{zh ? '带摄像头' : 'With camera'}：{withCamera?.stock ?? 0}</p>
                    <p className={standOnly.stock > 0 ? 'text-emerald-300' : 'text-amber-300'}>{zh ? '不带摄像头' : 'Stand only'}：{standOnly.stock}</p>
                  </div>
                </div>
              </div>

              <Link
                href="/shop/xiaowenhao-ai-tutor-stand"
                className={`mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl px-7 text-base font-black transition ${
                  hasStock
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 hover:brightness-110'
                    : 'pointer-events-none bg-white/10 text-white/35'
                }`}
              >
                {hasStock ? (zh ? '选择型号并购买' : 'Choose a model & buy') : (zh ? '本周已售罄' : 'Sold out this week')}
              </Link>
            </div>
          </article>
        ) : (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-white/60">商品即将上线。</div>
        )}

      </section>
    </div>
  )
}
