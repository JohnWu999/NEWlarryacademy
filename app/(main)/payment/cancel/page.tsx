import Link from 'next/link'
import { getServerLocale } from '@/lib/server-i18n'

const copy = {
  zh: {
    title: '支付未完成',
    body: '这次没有产生课程授权。你可以回到课程页重新开通，或先浏览公开免费课程。',
    courses: '返回课程',
    profile: '我的账户',
  },
  en: {
    title: 'Payment Not Completed',
    body: 'No course access was granted for this attempt. You can return to the course page to try again or browse free preview lessons first.',
    courses: 'Back to Courses',
    profile: 'My Account',
  },
}

export default async function PaymentCancelPage() {
  const locale = await getServerLocale()
  const text = copy[locale]

  return (
    <div className="min-h-dvh bg-[#050505] px-4 py-24 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-4xl">
          ×
        </div>
        <h1 className="text-3xl font-black">{text.title}</h1>
        <p className="mt-4 text-gray-400">
          {text.body}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/courses" className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">
            {text.courses}
          </Link>
          <Link href="/profile" className="rounded-2xl bg-white/10 px-6 py-3 font-bold text-white">
            {text.profile}
          </Link>
        </div>
      </div>
    </div>
  )
}
