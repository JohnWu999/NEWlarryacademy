'use client'

import { useLanguage } from '@/context/LanguageContext'
import Link from 'next/link'

export default function ToolsPage() {
  const { t } = useLanguage()
  
  const tools = [
    { id: 1, name: t('locale') === 'zh' ? '立方体模型' : 'Cube Model', description: t('locale') === 'zh' ? '展示立方体的各种属性：面、棱、顶点' : 'Show various properties of a cube: faces, edges, vertices', category: t('locale') === 'zh' ? '基础几何' : 'Basic Geometry', icon: '⬛', color: 'from-blue-500 to-cyan-500' },
    { id: 2, name: t('locale') === 'zh' ? '圆柱体模型' : 'Cylinder Model', description: t('locale') === 'zh' ? '理解圆柱体的结构和体积计算' : 'Understand the structure and volume calculation of a cylinder', category: t('locale') === 'zh' ? '基础几何' : 'Basic Geometry', icon: '🥫', color: 'from-purple-500 to-pink-500' },
    { id: 3, name: t('locale') === 'zh' ? '球体模型' : 'Sphere Model', description: t('locale') === 'zh' ? '探索球体的性质和表面积公式' : 'Explore the properties and surface area formula of a sphere', category: t('locale') === 'zh' ? '基础几何' : 'Basic Geometry', icon: '⚽', color: 'from-indigo-500 to-blue-500' },
    { id: 4, name: t('locale') === 'zh' ? '函数图像可视化' : 'Function Visualization', description: t('locale') === 'zh' ? '3D 打印的函数曲线，帮助理解函数性质' : '3D printed function curves to help understand function properties', category: t('locale') === 'zh' ? '代数' : 'Algebra', icon: '📈', color: 'from-emerald-500 to-teal-500' },
    { id: 5, name: t('locale') === 'zh' ? '分数可视化工具' : 'Fraction Tool', description: t('locale') === 'zh' ? '用实物模型理解分数的概念和运算' : 'Use physical models to understand fraction concepts and operations', category: t('locale') === 'zh' ? '基础数学' : 'Basic Math', icon: '🍕', color: 'from-orange-500 to-amber-500' },
    { id: 6, name: t('locale') === 'zh' ? '角度测量工具' : 'Angle Measurement', description: t('locale') === 'zh' ? '学习角度的概念和测量方法' : 'Learn angle concepts and measurement methods', category: t('locale') === 'zh' ? '几何' : 'Geometry', icon: '📐', color: 'from-rose-500 to-red-500' },
  ]

  return (
    <div className="relative min-h-dvh w-full max-w-full overflow-x-clip bg-[#050505] text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-24">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 uppercase px-1">
            {t('tools.title')}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto px-2">
            {t('tools.subtitle')}
          </p>
        </div>

        {/* Why 3D Section */}
        <div className="p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[40px] bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl mb-12 sm:mb-16 lg:mb-24">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8 sm:mb-12 text-center">{t('tools.why')}</h2>
          <div className="grid md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            {[
              { icon: '👁️', title: t('locale') === 'zh' ? '可视化学习' : 'Visual Learning', desc: t('locale') === 'zh' ? '将抽象概念转化为具体可见的模型' : 'Transform abstract concepts into concrete visible models' },
              { icon: '✋', title: t('locale') === 'zh' ? '触觉体验' : 'Tactile Experience', desc: t('locale') === 'zh' ? '通过触摸和操作加深理解和记忆' : 'Deepen understanding and memory through touch and manipulation' },
              { icon: '🎯', title: t('locale') === 'zh' ? '实践应用' : 'Practical Application', desc: t('locale') === 'zh' ? '在实际操作中理解数学原理' : 'Understand math principles in actual operation' }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-white">{item.title}</h3>
                <p className="text-gray-500 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="mb-12 sm:mb-16 lg:mb-24">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8 sm:mb-12 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-blue-500 rounded-full"></span>
            {t('locale') === 'zh' ? '可用工具库' : 'Available Tools'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="group p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-[32px] bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-4xl mb-8 shadow-2xl shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                  {tool.icon}
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                  {tool.category}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-gray-500 font-light leading-relaxed mb-8">
                  {tool.description}
                </p>
                <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all">
                  {t('locale') === 'zh' ? '查看详情' : 'View Details'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* How to Get Section */}
        <div className="relative p-6 sm:p-10 lg:p-12 rounded-2xl sm:rounded-[40px] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-white/10 overflow-hidden">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8 sm:mb-12 text-center">{t('tools.get')}</h2>
          <div className="grid md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            {[
              { icon: '🛍️', title: t('locale') === 'zh' ? '购买成品' : 'Buy Ready-made', desc: t('locale') === 'zh' ? '在我们的在线商店购买已经打印好的教具套装' : 'Purchase pre-printed teaching aid sets in our online store', link: '/shop', btn: t('home.hero.shop') },
              { icon: '📥', title: t('locale') === 'zh' ? '下载文件' : 'Download Files', desc: t('locale') === 'zh' ? '下载 3D 打印文件，使用自己的打印机制作' : 'Download 3D print files and make them with your own printer', link: '#', btn: t('locale') === 'zh' ? '浏览文件库' : 'Browse Files' },
              { icon: '🎓', title: t('locale') === 'zh' ? '课程配套' : 'Course Bundle', desc: t('locale') === 'zh' ? '部分付费课程会赠送配套的 3D 打印教具' : 'Some paid courses include matching 3D printed teaching aids', link: '/subjects', btn: t('locale') === 'zh' ? '查看课程' : 'View Courses' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-white">{item.title}</h3>
                <p className="text-gray-400 font-light mb-8">{item.desc}</p>
                <Link
                  href={item.link}
                  className="inline-block px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  {item.btn}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
