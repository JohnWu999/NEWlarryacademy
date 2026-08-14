import Image from 'next/image'
import Link from 'next/link'
import { ensureCurrentWeeklyStock, XIAOWENHAO_PRODUCT_ID, xiaowenhaoWeeklyCapacity } from '@/lib/shop'
import { getServerLocale } from '@/lib/server-i18n'

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
  const [locale, product] = await Promise.all([
    getServerLocale(),
    ensureCurrentWeeklyStock(XIAOWENHAO_PRODUCT_ID),
  ])

  const zh = locale === 'zh'
  const weeklyCapacity = xiaowenhaoWeeklyCapacity()

  return (
    <div className="min-h-dvh bg-[#070913] pb-24 pt-28 text-white">
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_85%_10%,rgba(96,82,255,0.2),transparent_36%),linear-gradient(145deg,#11152d,#080a13_65%)] px-6 py-12 sm:px-10 lg:px-14">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">Larry Academy · 3D Models</p>
          <div className="mt-5 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
                {zh ? '把好奇心，放在桌面上。' : 'Put curiosity on the desk.'}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
                {zh
                  ? 'Larry Academy 的学生创造型 3D 产品。每一件都从真实学习场景出发，小批量制作。'
                  : 'Student-created 3D products from Larry Academy, designed for real learning moments and made in small weekly batches.'}
              </p>
            </div>
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 px-6 py-4 text-amber-100">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Weekly drop</p>
              <p className="mt-1 text-2xl font-black">{zh ? '每周仅做 10 个' : 'Only 10 made weekly'}</p>
            </div>
          </div>
        </div>

        {product ? (
          <article className="mt-10 grid overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-violet-950/30 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative aspect-[4/5] min-h-[30rem] overflow-hidden bg-[#171a3d]">
              <Image
                src={product.imageUrl || '/products/xiaowenhao-ai-tutor-stand.png'}
                alt="小问号 AI Tutor 支架产品图"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
              <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-sm font-bold backdrop-blur-xl">
                No. 001 · {zh ? '首发产品' : 'First release'}
              </div>
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-300">Xiaowenhao AI Tutor</p>
              <h2 className="mt-4 text-3xl font-black sm:text-5xl">{product.name}</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">{product.description}</p>

              <div className="mt-8 flex flex-wrap gap-2">
                {['螺旋曲线设计', '一体成型', '稳固圆底座', '三种颜色'].map((label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white/75">
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-white/45">{zh ? '产品价格' : 'Price'}</p>
                  <p className="mt-1 text-4xl font-black">¥{product.price.toFixed(0)} <span className="text-sm text-white/35">+ ¥8 运费</span></p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-white/45">{zh ? '本周剩余' : 'Remaining this week'}</p>
                  <p className={`mt-1 text-3xl font-black ${product.stock > 3 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {product.stock} <span className="text-sm text-white/40">/ {weeklyCapacity}</span>
                  </p>
                </div>
              </div>

              <Link
                href="/shop/xiaowenhao-ai-tutor-stand"
                className={`mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl px-7 text-base font-black transition ${
                  product.stock > 0
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 hover:brightness-110'
                    : 'pointer-events-none bg-white/10 text-white/35'
                }`}
              >
                {product.stock > 0 ? (zh ? '选择颜色并购买' : 'Choose a color & buy') : (zh ? '本周已售罄' : 'Sold out this week')}
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
