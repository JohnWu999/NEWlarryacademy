'use client'

import { FormEvent, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type StandModel = 'stand-only' | 'with-camera'
type StandColor = 'neon-pink-blue' | 'midnight-blue-black' | 'dream-purple' | 'lava-red-black'

const colors: Array<{ id: StandColor; label: string; swatch: string }> = [
  { id: 'neon-pink-blue', label: '霓虹粉蓝', swatch: 'from-fuchsia-400 via-pink-400 to-cyan-400' },
  { id: 'midnight-blue-black', label: '星夜蓝黑', swatch: 'from-blue-500 via-slate-900 to-black' },
  { id: 'dream-purple', label: '幻境炫紫', swatch: 'from-violet-300 via-violet-600 to-indigo-950' },
  { id: 'lava-red-black', label: '熔岩红黑', swatch: 'from-orange-500 via-red-600 to-black' },
]

const models: Array<{ id: StandModel; label: string; price: number; note: string }> = [
  { id: 'with-camera', label: '带摄像头', price: 199, note: '含 500 万像素摄像头' },
  { id: 'stand-only', label: '不带摄像头', price: 99, note: '仅含小问号支架 2.0' },
]

const shippingFee = 18
const fieldClass = 'mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10'

export default function ProductPurchaseForm({
  standOnly,
  withCamera,
}: {
  standOnly: { productId: string; stock: number }
  withCamera: { productId: string; stock: number }
}) {
  const { status } = useSession()
  const router = useRouter()
  const [model, setModel] = useState<StandModel>(withCamera.stock > 0 ? 'with-camera' : 'stand-only')
  const [color, setColor] = useState<StandColor>('neon-pink-blue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const modelInventory = {
    'stand-only': standOnly,
    'with-camera': withCamera,
  }
  const selectedModel = models.find((option) => option.id === model) ?? models[0]
  const selectedInventory = modelInventory[selectedModel.id]
  const total = selectedModel.price + shippingFee

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=%2Fshop%2Fxiaowenhao-ai-tutor-stand')
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
          items: [{ type: 'product', id: selectedInventory.productId, quantity: 1, model, color }],
          paymentMethod: 'stripe',
          shipping: {
            deliveryMethod: 'sf',
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
        router.push('/login?callbackUrl=%2Fshop%2Fxiaowenhao-ai-tutor-stand')
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
      <fieldset>
        <legend className="text-sm font-black">1. 选择型号</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {models.map((option) => (
            <label key={option.id} className="cursor-pointer">
              <input
                type="radio"
                name="model"
                value={option.id}
                checked={model === option.id}
                onChange={() => setModel(option.id)}
                disabled={modelInventory[option.id].stock < 1}
                className="peer sr-only"
              />
              <span className="flex min-h-28 flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 transition hover:bg-white/[0.06] peer-checked:border-cyan-300/60 peer-checked:bg-cyan-300/10 peer-checked:ring-2 peer-checked:ring-cyan-300/25 peer-disabled:cursor-not-allowed peer-disabled:opacity-45">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-black text-white">{option.label}</span>
                  <span className="text-2xl font-black text-cyan-200">¥{option.price}</span>
                </span>
                <span className="mt-2 text-xs font-bold text-white/45">{option.note}</span>
                <span className="mt-1 text-xs font-black text-amber-200">+ ¥18 顺丰运费</span>
                <span className={`mt-2 text-xs font-black ${modelInventory[option.id].stock > 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                  {modelInventory[option.id].stock > 0 ? `剩余 ${modelInventory[option.id].stock} 个` : '本型号已售罄'}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black">2. 选择颜色偏好</legend>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex min-h-20 cursor-not-allowed items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-3 opacity-45" aria-label="冰川蓝暂时缺货">
            <span className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-sky-200 via-cyan-400 to-blue-700 grayscale-[35%]" />
            <span>
              <span className="block text-xs font-black leading-5 text-white">冰川蓝</span>
              <span className="block text-[10px] font-bold text-white/60">暂时缺货</span>
            </span>
          </div>
          {colors.map((option) => (
            <label key={option.id} className="cursor-pointer">
              <input type="radio" name="color" value={option.id} checked={color === option.id} onChange={() => setColor(option.id)} className="peer sr-only" />
              <span className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 transition hover:bg-white/[0.06] peer-checked:border-fuchsia-300/70 peer-checked:bg-fuchsia-300/10 peer-checked:ring-2 peer-checked:ring-fuchsia-300/20">
                <span className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-br ${option.swatch} shadow-lg`} />
                <span className="text-xs font-black leading-5 text-white">{option.label}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/[0.07] px-4 py-3 text-xs font-bold leading-6 text-fuchsia-100">我们会优先按您选择的颜色制作。炫彩耗材在每次 3D 打印中的色彩过渡与纹理都自然不同，因此实物不会与示意图完全一致，每一件都是独一无二的。</p>
      </fieldset>

      <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black text-amber-100">3. 配送方式</h2>
            <p className="mt-1 text-xs font-bold text-white/45">本产品统一使用顺丰配送</p>
          </div>
          <div className="text-right">
            <p className="text-base font-black text-white">顺丰</p>
            <p className="text-xl font-black text-amber-200">运费 ¥18</p>
          </div>
        </div>
      </section>

      <fieldset>
        <legend className="text-sm font-black">4. 收货信息</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-white/55">收货人姓名 *<input name="recipientName" autoComplete="name" required maxLength={80} className={fieldClass} placeholder="请输入姓名" /></label>
          <label className="text-xs font-bold text-white/55">电话号码 *<input name="phone" type="tel" autoComplete="tel" required maxLength={30} className={fieldClass} placeholder="含国家或地区代码" /></label>
          <label className="text-xs font-bold text-white/55">国家 / 地区 *<input name="country" autoComplete="country-name" required defaultValue="中国" maxLength={60} className={fieldClass} /></label>
          <label className="text-xs font-bold text-white/55">省 / 州 *<input name="region" autoComplete="address-level1" required maxLength={80} className={fieldClass} placeholder="广东省" /></label>
          <label className="text-xs font-bold text-white/55">城市 *<input name="city" autoComplete="address-level2" required maxLength={80} className={fieldClass} placeholder="深圳市" /></label>
          <label className="text-xs font-bold text-white/55">邮政编码<input name="postalCode" autoComplete="postal-code" maxLength={20} className={fieldClass} placeholder="可选" /></label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">详细地址 *<input name="addressLine1" autoComplete="address-line1" required maxLength={180} className={fieldClass} placeholder="街道、门牌号、小区和楼层" /></label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">地址补充<input name="addressLine2" autoComplete="address-line2" maxLength={180} className={fieldClass} placeholder="公司、学校或其他说明（可选）" /></label>
          <label className="text-xs font-bold text-white/55 sm:col-span-2">订单留言 / 特别要求<textarea name="customerNote" maxLength={500} rows={4} className={`${fieldClass} h-auto py-3`} placeholder="例如颜色倾向、送礼说明或其他需要我们留意的事项（可选）" /></label>
        </div>
      </fieldset>

      <section className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-5">
        <h2 className="text-sm font-black text-emerald-100">5. 安全付款</h2>
        <p className="mt-2 text-xs leading-6 text-white/50">下一步进入 Stripe 托管支付页，可选择微信支付或银行卡。Larry Academy 不会接触或保存您的完整卡号与安全码。</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
          <span className="rounded-full bg-[#07c160]/15 px-3 py-1.5 text-[#8af0af]">微信支付 WeChat Pay</span>
          <span className="rounded-full bg-blue-400/10 px-3 py-1.5 text-blue-200">银行卡 Card</span>
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</p>}

      <button
        type="submit"
        disabled={loading || selectedInventory.stock < 1 || status === 'loading'}
        className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-7 text-base font-black text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {selectedInventory.stock < 1 ? '本型号已售罄' : loading ? '正在创建安全订单…' : status === 'unauthenticated' ? '登录后购买' : `前往安全支付 · ¥${total}`}
      </button>
      <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3 text-xs font-bold text-white/50">
        <span>{selectedModel.label} ¥{selectedModel.price} + 顺丰运费 ¥18</span>
        <span className="text-base font-black text-white">合计 ¥{total}</span>
      </div>
      <p className="text-center text-[11px] leading-5 text-white/30">本产品统一为炫彩款；¥18 明确为顺丰运费。提交即表示您确认型号与收货信息无误。付款会话保留库存 30 分钟。</p>
    </form>
  )
}
