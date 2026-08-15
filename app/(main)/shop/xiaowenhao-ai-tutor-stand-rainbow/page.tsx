import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductPurchaseForm from '../xiaowenhao-ai-tutor-stand/ProductPurchaseForm'
import { ensureCurrentWeeklyStock, XIAOWENHAO_RAINBOW_PRODUCT_ID, xiaowenhaoProductWeeklyCapacity } from '@/lib/shop'

export const dynamic = 'force-dynamic'

export default async function XiaowenhaoRainbowProductPage() {
  const product = await ensureCurrentWeeklyStock(XIAOWENHAO_RAINBOW_PRODUCT_ID)
  if (!product || !product.published) notFound()
  const weeklyCapacity = xiaowenhaoProductWeeklyCapacity(XIAOWENHAO_RAINBOW_PRODUCT_ID)

  return (
    <div className="min-h-dvh bg-[#070913] pb-24 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link href="/shop" className="inline-flex items-center gap-2 py-5 text-sm font-bold text-white/50 transition hover:text-white">
          <span aria-hidden="true">←</span> 返回 3D 模型
        </Link>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <section className="lg:sticky lg:top-24">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-white/10 bg-white shadow-2xl shadow-cyan-950/30">
              <Image
                src={product.imageUrl || '/products/xiaowenhao-ai-tutor-stand-rainbow.png'}
                alt="小问号 AI Tutor 支架炫彩款"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-bold text-white/60">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-4">炫彩渐变</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-4">一体成型</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-4">Design by 睿哥</div>
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 sm:p-9 lg:p-11">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">
                Color Edition · 炫彩款
              </span>
              <span className={`rounded-full px-4 py-2 text-sm font-black ${product.stock > 0 ? 'bg-emerald-400/10 text-emerald-200' : 'bg-rose-400/10 text-rose-200'}`}>
                {product.stock > 0 ? `本周剩余 ${product.stock} / ${weeklyCapacity}` : '本周已售罄'}
              </span>
            </div>

            <h1 className="mt-7 text-4xl font-black leading-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-5 text-base leading-8 text-white/60">{product.description}</p>
            <blockquote className="mt-6 border-l-2 border-cyan-300 pl-5 text-lg font-bold text-white/85">
              每一道渐变，都是独一无二的学习色彩。
            </blockquote>

            <div className="mt-8 flex items-end justify-between border-y border-white/10 py-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Price</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-4xl font-black">¥{product.price.toFixed(0)}</p>
                  <p className="text-sm font-bold text-amber-200">+ ¥8 运费</p>
                </div>
                <p className="mt-2 text-sm font-black text-white/70">合计 ¥{(product.price + 8).toFixed(0)}</p>
              </div>
              <p className="max-w-[14rem] text-right text-xs leading-5 text-white/40">炫彩材料自然渐变，每个成品的色彩分布会略有不同。</p>
            </div>

            <ProductPurchaseForm
              productId={product.id}
              price={product.price}
              initialStock={product.stock}
              callbackUrl="/shop/xiaowenhao-ai-tutor-stand-rainbow"
              colorSelection={false}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
