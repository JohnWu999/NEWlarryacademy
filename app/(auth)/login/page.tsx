'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

export default function LoginPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(locale === 'zh' ? '邮箱或密码错误' : 'Invalid email or password')
      } else {
        router.push('/profile')
        router.refresh()
      }
    } catch (error) {
      setError(locale === 'zh' ? '登录失败，请稍后重试' : 'Login failed, please try again later')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white flex items-center justify-center px-4 sm:px-6">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-md w-full z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-3 group mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
              🎓
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">LARRY ACADEMY</span>
          </Link>
          <h1 className="text-4xl font-black mb-2 tracking-tight">
            {locale === 'zh' ? '欢迎回来' : 'WELCOME BACK'}
          </h1>
          <p className="text-gray-500 font-light">
            {locale === 'zh' ? '登录到 Larry Academy' : 'Login to Larry Academy'}
          </p>
        </div>

        <div className="relative rounded-[40px] bg-white/[0.02] border border-white/[0.08] p-10 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {locale === 'zh' ? '邮箱地址' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-light"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {locale === 'zh' ? '密码' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-light"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-blue-600 text-white py-5 rounded-2xl text-xl font-black shadow-2xl shadow-blue-600/20 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? (locale === 'zh' ? '登录中...' : 'Logging in...') : (locale === 'zh' ? '登录' : 'Login')}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-500 font-light">
              {locale === 'zh' ? '还没有账户？' : "Don't have an account?"}{' '}
              <Link href="/register" className="text-blue-400 font-bold hover:underline">
                {locale === 'zh' ? '立即注册' : 'Register Now'}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-light">
            ← {locale === 'zh' ? '返回首页' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  )
}
