import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-dvh bg-[#050505] px-4 py-24 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-4xl">
          ×
        </div>
        <h1 className="text-3xl font-black">支付未完成</h1>
        <p className="mt-4 text-gray-400">
          这次没有产生课程授权。你可以回到课程页重新开通，或先浏览公开免费课程。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/courses" className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">
            返回课程
          </Link>
          <Link href="/profile" className="rounded-2xl bg-white/10 px-6 py-3 font-bold text-white">
            我的账户
          </Link>
        </div>
      </div>
    </div>
  )
}
