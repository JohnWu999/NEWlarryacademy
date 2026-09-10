import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductPurchaseForm from './ProductPurchaseForm'
import { ensureWalkingInAgesBook } from '@/lib/shop'

export const dynamic = 'force-dynamic'

const stops = ['巴黎 Paris', '罗马 Rome', '梵蒂冈 Vatican City', '米兰 Milan', '伊斯坦布尔 Istanbul']

export default async function WalkingInAgesPage() {
  const book = await ensureWalkingInAgesBook()
  if (!book.published) notFound()
  return (
    <div className="min-h-dvh bg-[#0a1d35] pb-24 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link href="/shop" className="inline-flex items-center gap-2 py-5 text-sm font-bold text-white/55 transition hover:text-white"><span aria-hidden="true">←</span> 返回我的产品</Link>
        <div className="overflow-hidden rounded-[2.5rem] border border-amber-100/15 bg-[radial-gradient(circle_at_85%_5%,rgba(212,174,94,0.2),transparent_30%),linear-gradient(145deg,#173c68,#0b203b_65%)] shadow-2xl shadow-black/30">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="relative min-h-[28rem] lg:min-h-[46rem]">
              <Image src={book.imageUrl || '/about/larry-book.jpg'} alt="Larry 的书《七岁行欧洲》" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 53vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b203b]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#173c68]/85" />
            </section>
            <section className="relative flex flex-col justify-center p-7 sm:p-10 lg:-ml-16 lg:p-14">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200">A young explorer&apos;s tour of European heritage</p>
              <h1 className="mt-5 text-5xl font-black leading-none sm:text-7xl">七岁<br />行欧洲</h1>
              <p className="mt-4 text-xl font-black text-blue-100">Walking in Ages</p>
              <blockquote className="mt-7 border-l-2 border-amber-200 pl-5 text-lg font-bold leading-8 text-white/90">世界不只是在地图上，也在一个孩子的问题里。</blockquote>
              <p className="mt-7 text-base leading-8 text-white/65">从六岁开始，Larry 跟随家人行走欧洲。他把城市、博物馆、教堂、画作和历史人物，写成一段真诚又充满好奇心的旅程。这不是成人替孩子解释欧洲，而是一个孩子亲自告诉我们：他看见了什么，又为什么想继续追问。</p>
              <div className="mt-8 flex flex-wrap gap-2">{stops.map((stop) => <span key={stop} className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white/70">{stop}</span>)}</div>
              <div className="mt-9 flex items-end justify-between border-y border-white/12 py-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Price</p><p className="mt-1 text-5xl font-black">¥55</p><p className="mt-2 text-sm font-black text-emerald-200">全国包邮 · 运费 ¥0</p></div><p className="text-right text-sm font-black text-emerald-200">现货 {book.stock} 本</p></div>
            </section>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <section className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-9">
            <div><p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Why this book matters</p><h2 className="mt-3 text-3xl font-black">这是一本书，也是 Larry Academy 的起点。</h2></div>
            <p className="text-base leading-8 text-white/60">在行走中观察，在问题中学习，再把自己的理解写下来。这本书所记录的，正是 Larry Academy 后来一直坚持的学习方式。</p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"><div className="rounded-2xl bg-white/[0.04] p-4"><p className="font-black">孩子的真实视角</p><p className="mt-2 text-sm leading-6 text-white/45">保留孩子的惊讶、疑问和判断。</p></div><div className="rounded-2xl bg-white/[0.04] p-4"><p className="font-black">跨学科的欧洲之旅</p><p className="mt-2 text-sm leading-6 text-white/45">历史、艺术、建筑与城市在旅程中自然连接。</p></div><div className="rounded-2xl bg-white/[0.04] p-4"><p className="font-black">适合亲子共读</p><p className="mt-2 text-sm leading-6 text-white/45">让一次阅读成为下一次出发的开始。</p></div></div>
            <Link href="/about" className="inline-flex text-sm font-black text-blue-200 hover:text-white">阅读 Larry 的完整故事 →</Link>
          </section>
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Order your copy</p><h2 className="mt-3 text-3xl font-black">把这段旅程带回家</h2><p className="mt-3 text-sm leading-7 text-white/50">填写收货信息后进入安全支付。付款成功后，订单会与小问号支架一样进入后台发货流程。</p><ProductPurchaseForm productId={book.id} stock={book.stock} /></section>
        </div>
      </div>
    </div>
  )
}
