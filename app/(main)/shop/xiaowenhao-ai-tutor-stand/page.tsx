import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductPurchaseForm from './ProductPurchaseForm'
import {
  ensureCurrentWeeklyStock,
  XIAOWENHAO_STAND_ONLY_PRODUCT_ID,
  XIAOWENHAO_WITH_CAMERA_PRODUCT_ID,
} from '@/lib/shop'

export const dynamic = 'force-dynamic'

export default async function XiaowenhaoProductPage() {
  const [standOnly, withCamera] = await Promise.all([
    ensureCurrentWeeklyStock(XIAOWENHAO_STAND_ONLY_PRODUCT_ID),
    ensureCurrentWeeklyStock(XIAOWENHAO_WITH_CAMERA_PRODUCT_ID),
  ])
  if (!standOnly?.published || !withCamera?.published) notFound()
  return (
    <div className="min-h-dvh bg-[#070913] pb-24 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link href="/shop" className="inline-flex items-center gap-2 py-5 text-sm font-bold text-white/50 transition hover:text-white">
          <span aria-hidden="true">←</span> 返回 3D 模型
        </Link>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <section className="lg:sticky lg:top-24">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#171a3d] shadow-2xl shadow-violet-950/30">
              <Image
                src={standOnly.imageUrl || '/products/xiaowenhao-ai-tutor-stand-2.png'}
                alt="小问号 AI Tutor 支架 2.0 宣传图"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-bold text-white/60">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-4">高度升级</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-4">炫彩款</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-2 py-4">Design by 睿哥</div>
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 sm:p-9 lg:p-11">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                小问号支架 · 2.0 版本
              </span>
              <div className="flex flex-wrap justify-end gap-2 text-xs font-black">
                <span className={`rounded-full px-4 py-2 ${withCamera.stock > 0 ? 'bg-emerald-400/10 text-emerald-200' : 'bg-rose-400/10 text-rose-200'}`}>带摄像头：{withCamera.stock} 个</span>
                <span className={`rounded-full px-4 py-2 ${standOnly.stock > 0 ? 'bg-emerald-400/10 text-emerald-200' : 'bg-rose-400/10 text-rose-200'}`}>不带摄像头：{standOnly.stock} 个</span>
              </div>
            </div>

            <h1 className="mt-7 text-4xl font-black leading-tight sm:text-5xl">小问号 AI Tutor 支架 2.0 · 炫彩款</h1>
            <p className="mt-5 text-base leading-8 text-white/60">升级高度的炫彩桌面 AI 学习支架，提供带摄像头与不带摄像头两种型号；两个型号分别计算库存。</p>
            <blockquote className="mt-6 border-l-2 border-violet-300 pl-5 text-lg font-bold text-white/85">
              让每个问号，成为感叹号。
            </blockquote>

            <div className="mt-8 flex items-end justify-between border-y border-white/10 py-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Price</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-4xl font-black">¥99 / ¥169</p>
                  <p className="text-sm font-bold text-amber-200">+ ¥18 顺丰运费</p>
                </div>
                <p className="mt-2 text-sm font-black text-white/70">不带摄像头 ¥117 · 带摄像头 ¥187（含运费）</p>
              </div>
              <p className="max-w-[14rem] text-right text-xs leading-5 text-white/40">带摄像头与不带摄像头型号分别管理库存。</p>
            </div>

            <ProductPurchaseForm
              standOnly={{ productId: standOnly.id, stock: standOnly.stock }}
              withCamera={{ productId: withCamera.id, stock: withCamera.stock }}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
