'use client'

import { FormEvent, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const fieldClass = 'mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-200/60 focus:ring-2 focus:ring-amber-200/10'

export default function ProductPurchaseForm({ productId, stock }: { productId: string; stock: number }) {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=%2Fshop%2Fwalking-in-ages')
      return
    }
    setLoading(true)
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ type: 'product', id: productId, quantity: 1 }],
          paymentMethod: 'stripe',
          shipping: {
            deliveryMethod: 'free',
            recipientName: data.get('recipientName'),
            phone: data.get('phone'),
            country: data.get('country'),
            region: data.get('region'),
            city: data.get('city'),
            addressLine1: data.get('addressLine1'),
            addressLine2: data.get('addressLine2') || undefined,
            postalCode: data.get('postalCode') || undefined,
            customerNote: data.get('customerNote') || undefined,
          },
        }),
      })
      const result = await response.json().catch(() => null)
      if (response.status === 401) {
        router.push('/login?callbackUrl=%2Fshop%2Fwalking-in-ages')
        return
      }
      if (!response.ok || !result?.paymentUrl) {
        setError(result?.error || '暂时无法进入支付，请稍后重试。')
        return
      }
      window.location.href = result.paymentUrl
    } catch {
      setError('网络连接失败，请检查后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-8 space-y-7" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-emerald-200/15 bg-emerald-200/[0.06] p-5">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-sm font-black text-emerald-100">1. 配送方式</h2><p className="mt-1 text-xs font-bold text-white/45">《七岁行欧洲》全国包邮</p></div>
          <div className="text-right"><p className="text-base font-black">快递配送</p><p className="text-xl font-black text-emerald-200">运费 ¥0</p></div>
        </div>
      </section>
      <fieldset>
        <legend className="text-sm font-black">2. 收货信息</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-white/55">收货人姓名 *<input name="recipientName" autoComplete="name" required maxLength={80} className={fieldClass} placeholder="请输入姓名" /></label>
          <label className="text-xs font-bold text-white/55">电话号码 *<input name="phone" type="tel" autoComplete="tel" required maxLength={30} className={fieldClass} placeholder="含国家或地区代码" /></label>
          <label className="text-xs font-bold text-white/55">国家 / 地区 *<input name="country" autoComplete="country-name" required defaultValue="中国" maxLength={60} className={fieldClass} /></label>
          <label className="text-xs font-bold text-white/55">省 / 州 *<input name="region" autoComplete="address-level1" required maxLength={80} className={fieldClass} placeholder="广东省" /></label>
          <label className="text-xs font-bold text-white/55">城市 *<input name="city" autoComplete="address-level2" required maxLength={80} className={fieldClass} placeholder="深圳市" /></label>
          <label className="text-xs font-bold text-white/55">邮政编码<input name="postalCode" autoComplete="postal-code" maxLength={20} className={fieldClass} placeholder="可选" /></label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">详细地址 *<input name="addressLine1" autoComplete="address-line1" required maxLength={180} className={fieldClass} placeholder="街道、门牌号、小区和楼层" /></label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">地址补充<input name="addressLine2" autoComplete="address-line2" maxLength={180} className={fieldClass} placeholder="公司、学校或其他说明（可选）" /></label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">订单留言 / 特别要求<textarea name="customerNote" maxLength={500} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="需要我们留意的事项（可选）" /></label>
        </div>
      </fieldset>
      <section className="rounded-2xl border border-blue-200/15 bg-blue-200/[0.06] p-5"><h2 className="text-sm font-black text-blue-100">3. 安全付款</h2><p className="mt-2 text-xs leading-6 text-white/50">下一步进入 Stripe 托管支付页，可选择微信支付或银行卡。付款后订单会进入 Larry Academy 后台发货流程。</p></section>
      {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</p>}
      <button type="submit" disabled={loading || stock < 1 || status === 'loading'} className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-amber-100 px-7 text-base font-black text-[#102b4f] shadow-xl transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45">
        {stock < 1 ? '暂时售罄' : loading ? '正在创建安全订单…' : status === 'unauthenticated' ? '登录后购买' : '前往安全支付 · ¥55'}
      </button>
      <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-xs font-bold text-white/50"><span>《七岁行欧洲》 ¥55 + 运费 ¥0</span><span className="text-base font-black text-white">合计 ¥55</span></div>
    </form>
  )
}
