'use client'

import { FormEvent, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Color = 'blue' | 'purple' | 'yellow'

const colors: Array<{ id: Color; label: string; swatch: string; ring: string }> = [
  { id: 'blue', label: '蓝色', swatch: 'bg-[#4f8cff]', ring: 'peer-checked:ring-[#78a8ff]' },
  { id: 'purple', label: '紫色', swatch: 'bg-[#9b6cff]', ring: 'peer-checked:ring-[#b698ff]' },
  { id: 'yellow', label: '黄色', swatch: 'bg-[#f3c84c]', ring: 'peer-checked:ring-[#ffe184]' },
]

const fieldClass = 'mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10'

export default function ProductPurchaseForm({
  productId,
  price,
  initialStock,
  callbackUrl = '/shop/xiaowenhao-ai-tutor-stand',
  colorSelection = true,
}: {
  productId: string
  price: number
  initialStock: number
  callbackUrl?: string
  colorSelection?: boolean
}) {
  const { status } = useSession()
  const router = useRouter()
  const [color, setColor] = useState<Color>('blue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
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
          items: [{ type: 'product', id: productId, quantity: 1, ...(colorSelection ? { color } : {}) }],
          paymentMethod: 'stripe',
          shipping: {
            recipientName: data.get('recipientName'),
            phone: data.get('phone'),
            country: data.get('country'),
            region: data.get('region'),
            city: data.get('city'),
            addressLine1: data.get('addressLine1'),
            addressLine2: data.get('addressLine2') || undefined,
            postalCode: data.get('postalCode') || undefined,
          },
        }),
      })

      const result = await response.json().catch(() => null)
      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
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
    <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
      {colorSelection && <fieldset>
        <legend className="text-sm font-black">1. 选择颜色</legend>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {colors.map((option) => (
            <label key={option.id} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={option.id}
                checked={color === option.id}
                onChange={() => setColor(option.id)}
                className="peer sr-only"
              />
              <span className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black text-white/65 ring-0 transition hover:bg-white/[0.06] peer-checked:border-white/30 peer-checked:bg-white/[0.09] peer-checked:text-white peer-checked:ring-2 ${option.ring}`}>
                <span className={`h-8 w-8 rounded-full border-2 border-white/35 shadow-lg ${option.swatch}`} />
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>}

      <fieldset>
        <legend className="text-sm font-black">{colorSelection ? '2' : '1'}. 收货信息</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-white/55">
            收货人姓名 *
            <input name="recipientName" autoComplete="name" required maxLength={80} className={fieldClass} placeholder="请输入姓名" />
          </label>
          <label className="text-xs font-bold text-white/55">
            电话号码 *
            <input name="phone" type="tel" autoComplete="tel" required maxLength={30} className={fieldClass} placeholder="含国家或地区代码" />
          </label>
          <label className="text-xs font-bold text-white/55">
            国家 / 地区 *
            <input name="country" autoComplete="country-name" required defaultValue="中国" maxLength={60} className={fieldClass} />
          </label>
          <label className="text-xs font-bold text-white/55">
            省 / 州 *
            <input name="region" autoComplete="address-level1" required maxLength={80} className={fieldClass} placeholder="广东省" />
          </label>
          <label className="text-xs font-bold text-white/55">
            城市 *
            <input name="city" autoComplete="address-level2" required maxLength={80} className={fieldClass} placeholder="深圳市" />
          </label>
          <label className="text-xs font-bold text-white/55">
            邮政编码
            <input name="postalCode" autoComplete="postal-code" maxLength={20} className={fieldClass} placeholder="可选" />
          </label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">
            详细地址 *
            <input name="addressLine1" autoComplete="address-line1" required maxLength={180} className={fieldClass} placeholder="街道、门牌号、小区和楼层" />
          </label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">
            地址补充
            <input name="addressLine2" autoComplete="address-line2" maxLength={180} className={fieldClass} placeholder="公司、学校或其他说明（可选）" />
          </label>
        </div>
      </fieldset>

      <section className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-5">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-lg" aria-hidden="true">⌁</span>
          <div>
            <h2 className="text-sm font-black text-emerald-100">{colorSelection ? '3' : '2'}. 安全付款</h2>
            <p className="mt-2 text-xs leading-6 text-white/50">
              下一步将进入 Stripe 托管支付页，可选择微信支付或银行卡。Larry Academy 不会接触或保存您的完整卡号与安全码。
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
              <span className="rounded-full bg-[#07c160]/15 px-3 py-1.5 text-[#8af0af]">微信支付 WeChat Pay</span>
              <span className="rounded-full bg-blue-400/10 px-3 py-1.5 text-blue-200">银行卡 Card</span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || initialStock < 1 || status === 'loading'}
        className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-7 text-base font-black text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {initialStock < 1
          ? '本周已售罄'
          : loading
            ? '正在创建安全订单…'
            : status === 'unauthenticated'
              ? '登录后购买'
              : `前往安全支付 · ¥${(price + 8).toFixed(0)}`}
      </button>
      <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3 text-xs font-bold text-white/45">
        <span>商品 ¥{price.toFixed(0)} + 运费 ¥8</span>
        <span className="text-white">合计 ¥{(price + 8).toFixed(0)}</span>
      </div>
      <p className="text-center text-[11px] leading-5 text-white/30">运费为固定 ¥8。提交即表示您确认{colorSelection ? '颜色与' : ''}收货信息无误。付款会话保留库存 30 分钟。</p>
    </form>
  )
}
