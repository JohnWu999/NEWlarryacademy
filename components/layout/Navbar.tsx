'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function Navbar() {
  const { data: session } = useSession()
  const { locale, setLocale, t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.courses'), href: '/subjects' },
    { name: t('nav.tools'), href: '/tools' },
    { name: t('nav.games'), href: '/games' },
    { name: t('nav.shop'), href: '/shop' },
    { name: t('nav.about'), href: '/about' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#050505]/80 backdrop-blur-lg border-b border-white/10 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Left: Language Switcher & Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 min-w-0 shrink">
            {/* Language Switcher */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1">
              <button
                onClick={() => setLocale('zh')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  locale === 'zh' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                中
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  locale === 'en' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                EN
              </button>
            </div>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                🎓
              </div>
              <span className="text-xl font-black tracking-tighter text-white hidden sm:block">LARRY ACADEMY</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === link.href 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/wrongbook"
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {locale === 'zh' ? '错题本' : 'Wrongbook'}
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-full text-sm font-bold border border-red-500/20 transition-all"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-white border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#050505] border-b border-white/10 animate-in slide-in-from-top duration-300">
          <div className="px-4 py-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-xl text-base font-medium ${
                  pathname === link.href ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-white/10 flex flex-col space-y-3">
              {session ? (
                <>
                  <Link href="/wrongbook" className="px-4 py-3 text-gray-400" onClick={() => setMobileMenuOpen(false)}>{locale === 'zh' ? '错题本' : 'Wrongbook'}</Link>
                  <Link href="/profile" className="px-4 py-3 text-gray-400" onClick={() => setMobileMenuOpen(false)}>{t('nav.profile')}</Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left px-4 py-3 text-red-500 font-bold">{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-3 text-gray-400" onClick={() => setMobileMenuOpen(false)}>{t('nav.login')}</Link>
                  <Link href="/register" className="mx-4 py-3 bg-blue-600 text-white rounded-xl text-center font-bold" onClick={() => setMobileMenuOpen(false)}>{t('nav.register')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
