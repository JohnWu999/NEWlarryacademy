import Link from 'next/link'
import { getServerLocale } from '@/lib/server-i18n'

const copy = {
  zh: {
    title: '支付已提交',
    body: 'Stripe 确认成功后，课程权限会通过 webhook 自动开通。若页面刚返回时还没有权限，请稍等几秒后刷新。',
    profile: '查看我的学习',
    courses: '返回课程',
  },
  en: {
    title: 'Payment Submitted',
    body: 'After Stripe confirms the payment, course access will be granted automatically through the webhook. If access is not visible immediately, wait a few seconds and refresh.',
    profile: 'View My Learning',
    courses: 'Back to Courses',
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
          <Link href="/courses" className="rounded-2xl bg-white/10 px-6 py-3 font-bold text-white">
            {text.courses}
          </Link>
        </div>
      </div>
    </div>
  )
}
