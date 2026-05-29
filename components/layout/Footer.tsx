'use client'

import { useLanguage } from '@/context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  
  return (
    <footer className="relative bg-[#050505] border-t border-white/5 pt-12 sm:pt-16 pb-8 sm:pb-10 px-4 sm:px-6 w-full max-w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">🎓</div>
              <span className="text-lg font-black tracking-tighter text-white uppercase">Larry Academy</span>
            </div>
            <p className="text-gray-500 font-light leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{t('footer.links')}</h4>
            <ul className="space-y-4">
              <li><a href="/subjects" className="text-gray-500 hover:text-blue-400 transition-colors font-light">{t('nav.courses')}</a></li>
              <li><a href="/tools" className="text-gray-500 hover:text-blue-400 transition-colors font-light">{t('nav.tools')}</a></li>
              <li><a href="/games" className="text-gray-500 hover:text-blue-400 transition-colors font-light">{t('nav.games')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{t('footer.about')}</h4>
            <ul className="space-y-4">
              <li><a href="/about" className="text-gray-500 hover:text-blue-400 transition-colors font-light">{t('nav.about')}</a></li>
              <li><a href="/about#charity" className="text-gray-500 hover:text-blue-400 transition-colors font-light">{t('home.charity.title')}</a></li>
              <li><a href="#" className="text-gray-500 hover:text-blue-400 transition-colors font-light">{t('footer.contact')}</a></li>
              <li><a href="#" className="text-gray-500 hover:text-blue-400 transition-colors font-light">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">{t('footer.contact')}</h4>
            <ul className="space-y-4">
              <li className="text-gray-500 font-light flex items-center gap-3">
                <span className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px]">📧</span>
                <a href="mailto:wularry999@gmail.com" className="hover:text-blue-400 transition-colors">
                  wularry999@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs font-light">
            &copy; {new Date().getFullYear()} Larry Academy. {t('footer.rights')}
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-white transition-colors"><span className="sr-only">WeChat</span>W</a>
            <a href="#" className="text-gray-600 hover:text-white transition-colors"><span className="sr-only">Weibo</span>W</a>
            <a href="#" className="text-gray-600 hover:text-white transition-colors"><span className="sr-only">Bilibili</span>B</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
