import Link from 'next/link'
import { getServerLocale } from '@/lib/server-i18n'

const copy = {
  zh: {
    title: '支付已提交',
    body: 'Stripe 确认成功后，订单会自动更新。课程将自动开通；实物商品会按订单中的颜色与收货信息安排制作和发货。',
    profile: '查看我的学习',
    courses: '继续浏览',
  },
  en: {
    title: 'Payment Submitted',
    body: 'After Stripe confirms payment, your order updates automatically. Course access is granted, while physical products move into production and shipping.',
    profile: 'View My Learning',
    courses: 'Keep browsing',
  },
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const locale = await getServerLocale()
  const text = copy[locale]

  return (
    <div className="min-h-dvh bg-[#050505] px-4 py-24 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-4xl">
          ✓
        </div>
        <h1 className="text-3xl font-black">{text.title}</h1>
        <p className="mt-4 text-gray-400">
          {text.body}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/profile" className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">
            {text.profile}
          </Link>
          <Link href="/shop" className="rounded-2xl bg-white/10 px-6 py-3 font-bold text-white">
            {text.courses}
          </Link>
        </div>
      </div>
    </div>
  )
}
