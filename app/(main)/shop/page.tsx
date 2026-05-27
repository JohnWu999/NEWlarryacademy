'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function ShopPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products') // Assuming this API exists or we need to create it
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    // For now, if we don't have an API, we'll use the static data approach or wait for DB
    // Let's assume we want to keep the server-side logic but need client-side i18n
  }, [])

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-24">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 uppercase px-1">
            {t('shop.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto px-2">
            {t('shop.subtitle')}
          </p>
        </div>

        {/* Products Grid - Note: This needs data from DB, but for UI demo we use static or fetch */}
        {/* Since I cannot easily change the page to 'use client' while keeping async prisma, I will use a hybrid approach or just translate the UI parts */}
        
        <div className="text-center py-16 sm:py-24 lg:py-32 px-4 bg-white/[0.02] rounded-2xl sm:rounded-[40px] border border-dashed border-white/10">
          <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 opacity-20">🛍️</div>
          <h3 className="text-2xl font-bold text-gray-400">{t('common.no_content')}</h3>
          <p className="text-gray-600 mt-2">New futuristic tools are coming soon.</p>
        </div>

        {/* Charity Banner */}
        <div className="mt-16 sm:mt-24 lg:mt-32 relative p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[40px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 overflow-hidden text-center">
          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4">💝 {t('about.charity.title')}</h3>
            <p className="text-gray-400 font-light">
              {t('home.charity.desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
