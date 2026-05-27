import Link from 'next/link'

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  return (
    <div className="min-h-dvh bg-[#050505] px-4 py-24 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-4xl">
          ✓
        </div>
        <h1 className="text-3xl font-black">支付已提交</h1>
        <p className="mt-4 text-gray-400">
          Stripe 确认成功后，课程权限会通过 webhook 自动开通。若页面刚返回时还没有权限，请稍等几秒后刷新。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/profile" className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">
            查看我的学习
          </Link>
          <Link href="/courses" className="rounded-2xl bg-white/10 px-6 py-3 font-bold text-white">
            返回课程
          </Link>
        </div>
      </div>
    </div>
  )
}
