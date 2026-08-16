'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type InventoryProduct = {
  name: string
  weeklyLimit: number
  stock: number
}

const inputClass = 'h-11 w-28 border border-white/15 bg-black/35 px-3 text-lg font-black tabular-nums text-white outline-none focus:border-cyan-300/55'

export default function InventorySettings({
  regular,
  rainbow,
}: {
  regular: InventoryProduct
  rainbow: InventoryProduct
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function saveInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    const data = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularWeeklyLimit: Number(data.get('regularWeeklyLimit')),
          rainbowWeeklyLimit: Number(data.get('rainbowWeeklyLimit')),
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setError(result?.error || '库存保存失败')
        return
      }
      setMessage(`库存已保存：常规款每周 ${result.regular.weeklyLimit} 个，炫彩款每周 ${result.rainbow.weeklyLimit} 个。`)
      startTransition(() => router.refresh())
    } catch {
      setError('网络连接失败，库存没有保存')
    } finally {
      setSaving(false)
    }
  }

  const products = [
    { key: 'regularWeeklyLimit', product: regular },
    { key: 'rainbowWeeklyLimit', product: rainbow },
  ] as const

  return (
    <form onSubmit={saveInventory} className="border border-white/10 bg-white/[0.035]">
      <div className="grid md:grid-cols-2">
        {products.map(({ key, product }, index) => (
          <div key={key} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${index ? 'border-t border-white/10 md:border-l md:border-t-0' : ''}`}>
            <div>
              <div className="font-black">{product.name}</div>
              <div className="mt-1 text-xs font-bold text-white/45">当前可售：{product.stock} 个</div>
            </div>
            <label className="flex items-center gap-3 text-xs font-black text-white/60">
              每周总库存
              <input
                type="number"
                name={key}
                min="0"
                max="10000"
                step="1"
                required
                defaultValue={product.weeklyLimit}
                className={inputClass}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="text-xs font-bold">
          {error ? <span className="text-rose-300">{error}</span> : null}
          {message ? <span className="text-emerald-300">{message}</span> : null}
          {!error && !message ? <span className="text-white/40">当前可售会自动扣除本周已付款和付款中的订单。</span> : null}
        </div>
        <button
          type="submit"
          disabled={saving || isPending}
          className="h-11 shrink-0 bg-cyan-300 px-5 text-sm font-black text-black transition hover:bg-cyan-200 disabled:opacity-50"
        >
          {saving || isPending ? '保存中' : '保存库存'}
        </button>
      </div>
    </form>
  )
}
