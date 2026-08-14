'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type ShippingInfo = {
  recipientName?: string
  phone?: string
  country?: string
  region?: string
  city?: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
}

type ProductOrder = {
  id: string
  createdAtLabel: string
  amountLabel: string
  status: string
  paymentMethod: string | null
  shippingStatus: string
  trackingNumber: string | null
  shippedAtLabel: string | null
  customerName: string
  customerEmail: string
  itemsLabel: string
  productColor: 'blue' | 'purple' | 'yellow' | null
  shipping: ShippingInfo | null
}

const productColorStyles = {
  blue: { text: 'text-blue-300', badge: 'border-blue-300/30 bg-blue-300/10 text-blue-200', label: '蓝色' },
  purple: { text: 'text-violet-300', badge: 'border-violet-300/30 bg-violet-300/10 text-violet-200', label: '紫色' },
  yellow: { text: 'text-amber-300', badge: 'border-amber-300/30 bg-amber-300/10 text-amber-200', label: '黄色' },
} as const

function addressLine(shipping: ShippingInfo | null) {
  if (!shipping) return '未填写'
  return [
    shipping.country,
    shipping.region,
    shipping.city,
    shipping.addressLine1,
    shipping.addressLine2,
    shipping.postalCode,
  ].filter(Boolean).join(' ')
}

export default function ProductOrdersTable({ orders }: { orders: ProductOrder[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  async function saveShipment(orderId: string, formData: FormData) {
    setPendingId(orderId)
    setError('')
    setSuccess('')
    const shipped = formData.get('shipped') === 'on'
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipped,
          trackingNumber: String(formData.get('trackingNumber') || '').trim(),
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setError(result?.error || '保存订单发货信息失败')
        return
      }
      setSuccess(result?.notificationSent
        ? '发货信息已保存，通知邮件已发送给收货人。'
        : '发货信息已保存。')
      startTransition(() => router.refresh())
    } catch {
      setError('网络连接失败，订单发货信息没有保存')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div>
      {error ? (
        <div className="mb-3 border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-3 border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-bold text-emerald-100">{success}</div>
      ) : null}
      <div className="overflow-x-auto border border-white/10">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.14em] text-white/44">
            <tr>
              <th className="px-4 py-3">下单时间</th>
              <th className="px-4 py-3">客户</th>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">收货信息</th>
              <th className="px-4 py-3">订单状态</th>
              <th className="px-4 py-3">发货</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {orders.length ? orders.map((order) => {
              const shipped = order.shippingStatus === 'shipped'
              const saving = pendingId === order.id || isPending
              const colorStyle = order.productColor ? productColorStyles[order.productColor] : null
              return (
                <tr key={order.id} className={shipped ? 'bg-emerald-300/[0.025]' : undefined}>
                  <td className="px-4 py-4 align-top text-xs font-bold text-white/45">
                    <div>{order.createdAtLabel}</div>
                    <div className="mt-1 max-w-[11rem] truncate text-white/25">{order.id}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-bold">{order.customerName}</div>
                    <div className="text-xs text-white/42">{order.customerEmail}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className={`font-black ${colorStyle?.text || 'text-white'}`}>{order.itemsLabel}</div>
                    {colorStyle ? (
                      <span className={`mt-2 inline-flex border px-2 py-1 text-[11px] font-black ${colorStyle.badge}`}>
                        {colorStyle.label}
                      </span>
                    ) : null}
                    <div className="mt-1 text-xs font-black text-emerald-300">{order.amountLabel}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-bold">{order.shipping?.recipientName || '未填写姓名'}</div>
                    <div className="mt-1 text-xs text-white/55">{order.shipping?.phone || '未填写电话'}</div>
                    <div className="mt-1 max-w-[25rem] text-xs leading-5 text-white/42">{addressLine(order.shipping)}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-black">{order.status}</div>
                    <div className="mt-1 text-xs text-white/42">{order.paymentMethod || 'payment'}</div>
                    {order.shippedAtLabel ? (
                      <div className="mt-2 text-xs font-bold text-emerald-200">已发货 {order.shippedAtLabel}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <form
                      className="flex min-w-[18rem] items-center gap-3"
                      action={(formData) => saveShipment(order.id, formData)}
                    >
                      <label className="flex shrink-0 items-center gap-2 text-xs font-black text-white/70">
                        <input
                          type="checkbox"
                          name="shipped"
                          defaultChecked={shipped}
                          className="h-4 w-4 accent-emerald-400"
                          aria-label="标记为已发货"
                        />
                        已发货
                      </label>
                      <input
                        name="trackingNumber"
                        defaultValue={order.trackingNumber || ''}
                        placeholder="输入物流单号"
                        required
                        className="h-10 min-w-0 flex-1 border border-white/10 bg-black/30 px-3 text-xs font-bold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45"
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="h-10 shrink-0 bg-white px-3 text-xs font-black text-black transition hover:bg-cyan-100 disabled:opacity-50"
                      >
                        {saving ? '保存中' : '保存'}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            }) : (
              <tr><td className="px-4 py-6 text-white/45" colSpan={6}>暂时没有待处理的 AI Tutor 支架订单。</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
