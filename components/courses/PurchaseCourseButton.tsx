'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function PurchaseCourseButton({
  courseId,
  price,
}: {
  courseId: string
  price: number
}) {
  const router = useRouter()
  const { locale } = useLanguage()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePurchase() {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/courses/${courseId}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'stripe',
          items: [{ type: 'course', id: courseId }],
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.paymentUrl) {
        setError(data.error || (locale === 'zh' ? '暂时无法创建支付订单' : 'Unable to create checkout right now'))
        return
      }

      window.location.href = data.paymentUrl
    } catch {
      setError(locale === 'zh' ? '支付服务暂时不可用，请稍后再试' : 'Payment service is temporarily unavailable. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePurchase}
        disabled={loading}
        className="group relative w-full overflow-hidden rounded-[1.65rem] border border-cyan-200/50 bg-[linear-gradient(135deg,#ffffff_0%,#eaf7ff_42%,#baf7ff_100%)] px-5 py-4 text-left text-black shadow-[0_18px_42px_rgba(34,211,238,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-white hover:shadow-[0_24px_60px_rgba(34,211,238,0.34)] disabled:cursor-wait disabled:opacity-70 sm:px-6"
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(255,255,255,0.95),transparent_30%),linear-gradient(100deg,transparent,rgba(255,255,255,0.65),transparent)] opacity-80 transition duration-500 group-hover:translate-x-8" />
        <span className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="mb-1 inline-flex rounded-full bg-black/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100 shadow-lg shadow-cyan-500/20">
              Full Access
            </span>
            <span className="block text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              {loading
                ? (locale === 'zh' ? '正在进入安全支付...' : 'Opening Secure Checkout...')
                : (locale === 'zh' ? '解锁完整学习通行证' : 'Unlock Full Access Pass')}
            </span>
            <span className="mt-1 block text-sm font-bold text-slate-700">
              {locale === 'zh'
                ? '全部课节、练习与奖励体系一次开启'
                : 'All lessons, practice, and rewards unlocked'}
            </span>
          </span>
          {!loading && (
            <span className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-black px-4 py-3 text-lg font-black text-white shadow-xl shadow-black/20">
              ${price} USD
            </span>
          )}
        </span>
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  )
}
