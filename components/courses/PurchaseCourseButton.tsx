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
        className="w-full rounded-2xl bg-white px-6 py-4 text-base font-black text-black transition hover:bg-blue-100 disabled:opacity-60"
      >
        {loading
          ? (locale === 'zh' ? '正在创建订单...' : 'Creating checkout...')
          : `${locale === 'zh' ? '开通课程权限' : 'Unlock Course Access'} · $${price} USD`}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  )
}
