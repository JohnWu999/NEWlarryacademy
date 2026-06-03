'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'

export default function RegisterPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
    marketingConsent: false,
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(value - 1, 0)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const handleSendCode = async () => {
    setError('')
    setNotice('')
    const email = formData.email.trim()

    if (!email) {
      setError(locale === 'zh' ? '请先输入邮箱地址' : 'Please enter your email first')
      return
    }

    setSendingCode(true)

    try {
      const response = await fetch('/api/auth/register-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || (locale === 'zh' ? '验证码发送失败' : 'Failed to send verification code'))
        if (response.status === 429) setCooldown(60)
        return
      }

      setNotice(data.message || (locale === 'zh' ? '验证码已发送，请查收邮箱。' : 'Verification code sent.'))
      setCooldown(60)
    } catch (error) {
      setError(locale === 'zh' ? '验证码发送失败，请稍后重试' : 'Failed to send code, please try again later')
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if (formData.password !== formData.confirmPassword) {
      setError(locale === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError(locale === 'zh' ? '密码至少需要8个字符' : 'Password must be at least 8 characters')
      return
    }

    if (!/^\d{6}$/.test(formData.verificationCode.trim())) {
      setError(locale === 'zh' ? '请输入6位邮箱验证码' : 'Please enter the 6-digit email code')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          verificationCode: formData.verificationCode,
          marketingConsent: formData.marketingConsent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || (locale === 'zh' ? '注册失败' : 'Registration failed'))
        return
      }

      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (loginResult?.error) {
        router.push('/login?registered=true')
        return
      }

      router.push('/courses')
      router.refresh()
    } catch (error) {
      setError(locale === 'zh' ? '注册失败，请稍后重试' : 'Registration failed, please try again later')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    })
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
            {locale === 'zh' ? '创建账户' : 'CREATE ACCOUNT'}
          </h1>
          <p className="text-gray-500 font-light">
            {locale === 'zh' ? '加入 Larry Academy 开始学习' : 'Join Larry Academy to start learning'}
          </p>
        </div>

        <div className="relative rounded-[40px] bg-white/[0.02] border border-white/[0.08] p-10 backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}
            {notice && (
              <div className="bg-cyan-400/10 border border-cyan-300/20 text-cyan-200 px-6 py-4 rounded-2xl text-sm font-medium">
                {notice}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {locale === 'zh' ? '姓名' : 'Full Name'}
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={locale === 'zh' ? '张三' : 'John Doe'}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-light"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {locale === 'zh' ? '邮箱地址' : 'Email Address'}
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-light"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {locale === 'zh' ? '邮箱验证码' : 'Email Code'}
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <input
                  name="verificationCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={formData.verificationCode}
                  onChange={handleChange}
                  required
                  placeholder="123456"
                  className="min-w-0 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-light"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || cooldown > 0}
                  className="whitespace-nowrap rounded-2xl border border-cyan-300/30 bg-cyan-300 px-5 py-4 text-sm font-black text-[#05131d] shadow-lg shadow-cyan-400/10 transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
                >
                  {sendingCode
                    ? (locale === 'zh' ? '发送中' : 'Sending')
                    : cooldown > 0
                      ? `${cooldown}s`
                      : (locale === 'zh' ? '获取验证码' : 'Get code')}
                </button>
              </div>
              <p className="mt-2 ml-1 text-xs text-gray-600">
                {locale === 'zh' ? '验证码 10 分钟内有效，请查看收件箱或垃圾邮件。' : 'The code expires in 10 minutes. Check inbox or spam.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {locale === 'zh' ? '密码' : 'Password'}
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-light"
              />
              <p className="mt-2 ml-1 text-xs text-gray-600">
                {locale === 'zh' ? '至少 8 个字符。' : 'At least 8 characters.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                {locale === 'zh' ? '确认密码' : 'Confirm Password'}
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-light"
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400">
              <input
                name="marketingConsent"
                type="checkbox"
                checked={formData.marketingConsent}
                onChange={handleChange}
                className="mt-1"
              />
              <span>
                {locale === 'zh' ? '接收课程上线、学习活动和优惠通知。' : 'Receive course launch, activity, and offer updates.'}
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-blue-600 text-white py-5 rounded-2xl text-xl font-black shadow-2xl shadow-blue-600/20 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? (locale === 'zh' ? '注册中...' : 'Registering...') : (locale === 'zh' ? '注册' : 'Register')}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-500 font-light">
              {locale === 'zh' ? '已有账户？' : 'Already have an account?'}{' '}
              <Link href="/login" className="text-blue-400 font-bold hover:underline">
                {locale === 'zh' ? '立即登录' : 'Login Now'}
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
