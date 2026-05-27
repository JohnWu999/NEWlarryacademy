'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  featured: boolean
}

export default function ShopPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
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
    fetchProducts()
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

        {loading ? (
          <div className="py-24 text-center text-blue-400">{t('common.loading')}</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]">
                <div className="relative aspect-video bg-gradient-to-br from-indigo-500/20 to-blue-500/10 p-6">
                  {product.featured && (
                    <span className="absolute left-5 top-5 rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">
                      Featured
                    </span>
                  )}
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">{product.category}</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{product.name}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="line-clamp-3 min-h-20 text-sm leading-7 text-gray-400">{product.description}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black text-white">¥{product.price}</div>
                      <div className="text-xs text-gray-500">库存 {product.stock}</div>
                    </div>
                    <button className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white/70">
                      即将开放购买
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-24 lg:py-32 px-4 bg-white/[0.02] rounded-2xl sm:rounded-[40px] border border-dashed border-white/10">
            <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 opacity-20">🛍️</div>
            <h3 className="text-2xl font-bold text-gray-400">{t('common.no_content')}</h3>
            <p className="text-gray-600 mt-2">学习工具和课程周边会在这里逐步上线。</p>
            <Link href="/courses" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">
              先去看课程
            </Link>
          </div>
        )}

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
