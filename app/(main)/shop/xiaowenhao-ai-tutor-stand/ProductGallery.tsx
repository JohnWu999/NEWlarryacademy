'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const styles = [
  { src: '/products/xiaowenhao-ai-tutor-stand-2.png', label: '冰川蓝' },
  { src: '/products/xiaowenhao-ai-tutor-stand-2-style-02.png', label: '霓虹粉蓝' },
  { src: '/products/xiaowenhao-midnight-blue-black.png', label: '星夜蓝黑' },
  { src: '/products/xiaowenhao-dream-purple.png', label: '幻境炫紫' },
  { src: '/products/xiaowenhao-rose-sky.png', label: '晨曦玫红天蓝' },
  { src: '/products/xiaowenhao-lava-red-black.png', label: '熔岩红黑' },
]

export default function ProductGallery() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive((value) => (value + 1) % styles.length), 3600)
    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <div onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="group relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1022] shadow-2xl shadow-violet-950/40">
        {styles.map((style, index) => (
          <Image key={style.src} src={style.src} alt={`小问号 AI Tutor 支架 2.0 ${style.label}`} fill priority={index === 0} sizes="(max-width: 1024px) 100vw, 42vw" className={`object-cover transition-[opacity,transform,filter] duration-[1400ms] ease-out motion-reduce:transition-none ${active === index ? 'scale-100 opacity-100 blur-0' : 'pointer-events-none scale-[1.07] opacity-0 blur-sm'}`} />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/[0.04]" />
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:animate-[gallery-shine_1.8s_ease-in-out] motion-reduce:hidden" />
        <div className="absolute bottom-5 left-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">Color preference</p>
          <p className="mt-1 text-xl font-black text-white">{styles[active].label}</p>
        </div>
        <span className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] font-black text-white/65 backdrop-blur-xl">{active + 1} / {styles.length}</span>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-2" aria-label="选择展示颜色">
        {styles.map((style, index) => (
          <button key={style.src} type="button" onClick={() => { setActive(index); setPaused(true) }} className={`relative aspect-square overflow-hidden rounded-xl border transition ${active === index ? 'border-fuchsia-300 ring-2 ring-fuchsia-300/25' : 'border-white/10 opacity-60 hover:opacity-100'}`} aria-label={`查看${style.label}`} aria-pressed={active === index}>
            <Image src={style.src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
      <style jsx global>{`@keyframes gallery-shine { 0% { transform: translateX(0) skewX(-12deg); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateX(650%) skewX(-12deg); opacity: 0; } }`}</style>
    </div>
  )
}
