'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import Link from 'next/link'

export default function EvenBubbleBlastPage() {
  const { t, locale } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [gameOver, setGameOver] = useState(false)
  const [visitorCount, setVisitorCount] = useState(0)
  
  const gameRef = useRef({
    bubbles: [] as any[],
    particles: [] as any[],
    pointerTrail: [] as any[],
    isRunning: false,
    spawnTimer: 0,
    specialEventTimer: 0,
    specialEventActive: false,
    lastTime: 0,
    pointerActive: false,
    audioContext: null as AudioContext | null,
    audioCache: {} as Record<string, HTMLAudioElement>,
  })

  const COLORS = ['#ff6b6b', '#ff9f1c', '#6bcdfd', '#9b6bff', '#4ed1a1', '#f368e0', '#ff8fab']
  const ANIMALS = [
    { emoji: '🐱', color: '#ff9f1c', sound: 'cat', freq: 400 },
    { emoji: '🐶', color: '#6bcdfd', sound: 'dog', freq: 300 },
    { emoji: '🐵', color: '#ff8fab', sound: 'monkey', freq: 500 },
    { emoji: '🐼', color: '#4ed1a1', sound: 'cat', freq: 350 },
    { emoji: '🐧', color: '#9b6bff', sound: 'dog', freq: 450 },
    { emoji: '🦊', color: '#ff6b6b', sound: 'monkey', freq: 380 },
    { emoji: '🦄', color: '#f368e0', sound: 'cat', freq: 600 }
  ]

  useEffect(() => {
    const storageKey = 'larryAcademy_bubbleGame_totalPlays'
    const count = parseInt(localStorage.getItem(storageKey) || '0', 10)
    const newCount = count + 1
    localStorage.setItem(storageKey, newCount.toString())
    setVisitorCount(newCount)

    preloadSounds()

    gameRef.current.isRunning = true
    const animationId = requestAnimationFrame(gameLoop)

    return () => {
      gameRef.current.isRunning = false
      cancelAnimationFrame(animationId)
    }
  }, [])

  const preloadSounds = () => {
    const sounds = ['cat', 'dog', 'monkey']
    sounds.forEach(name => {
      const audio = new Audio(`/sounds/animals/${name}.wav`)
      audio.volume = 0.5
      gameRef.current.audioCache[name] = audio
    })
    const happy = new Audio('/sounds/happy.wav')
    happy.volume = 0.4
    gameRef.current.audioCache['happy'] = happy
  }

  const initAudio = () => {
    if (!gameRef.current.audioContext) {
      gameRef.current.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (gameRef.current.audioContext.state === 'suspended') {
      gameRef.current.audioContext.resume()
    }
  }

  const playSound = (freq = 300, duration = 0.15, type = 'pop', soundName?: string) => {
    initAudio()
    
    // 优先播放预加载的真实音效
    if (soundName && gameRef.current.audioCache[soundName]) {
      const audio = gameRef.current.audioCache[soundName].cloneNode() as HTMLAudioElement
      audio.play().catch(e => console.warn('Audio play failed', e))
      return
    }

    const ctx = gameRef.current.audioContext
    if (!ctx || ctx.state !== 'running') return
    
    const now = ctx.currentTime
    
    if (type === 'explosion') {
      // 原始爆炸音效模拟
      const bufferSize = ctx.sampleRate * 0.3
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 10)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(200, now)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.5, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + 0.3)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + duration)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + duration)
    }
  }

  const spawnBubble = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const radius = 36 + Math.random() * 22
    const x = radius + Math.random() * (canvas.width - radius * 2)
    const value = Math.floor(Math.random() * 49) + 2
    const isEven = value % 2 === 0
    
    const speedIncrease = Math.min(score * 0.15, 60)
    const speed = 85 + Math.random() * 45 + speedIncrease

    const rand = Math.random()
    let trajectory = 'straight'
    if (rand > 0.7) trajectory = ['wave', 'zigzag', 'spiral', 'curve'][Math.floor(Math.random() * 4)]
    else if (rand > 0.4) trajectory = Math.random() > 0.5 ? 'wave' : 'zigzag'

    let isSpecial = gameRef.current.specialEventActive
    let animal = isSpecial ? ANIMALS[Math.floor(Math.random() * ANIMALS.length)] : null

    gameRef.current.bubbles.push({
      x, y: -radius, radius, value, isEven,
      color: isSpecial ? animal?.color : COLORS[Math.floor(Math.random() * COLORS.length)],
      speed, startX: x, isSpecial, animal,
      trajectory, trajectoryTime: 0,
      points: isSpecial ? 50 : (trajectory !== 'straight' ? 20 : 10)
    })
  }

  const gameLoop = (time: number) => {
    if (!gameRef.current.isRunning || gameOver) return

    const dt = gameRef.current.lastTime ? time - gameRef.current.lastTime : 0
    gameRef.current.lastTime = time

    gameRef.current.spawnTimer += dt
    gameRef.current.specialEventTimer += dt

    if (gameRef.current.specialEventTimer >= 25000 && !gameRef.current.specialEventActive) {
      gameRef.current.specialEventActive = true
      setTimeout(() => { gameRef.current.specialEventActive = false }, 5000)
      gameRef.current.specialEventTimer = 0
    }

    const interval = Math.max(900, 1500 - Math.sqrt(score) * 15)
    if (gameRef.current.spawnTimer >= interval) {
      spawnBubble()
      gameRef.current.spawnTimer = 0
    }

    update(dt)
    draw()
    requestAnimationFrame(gameLoop)
  }

  const update = (dt: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    for (let i = gameRef.current.bubbles.length - 1; i >= 0; i--) {
      const b = gameRef.current.bubbles[i]
      b.trajectoryTime += dt
      const t = b.trajectoryTime / 1000
      let xOffset = 0
      
      switch (b.trajectory) {
        case 'wave': xOffset = Math.sin(t * 2) * 80; break
        case 'zigzag': xOffset = Math.sin(t * 3) * 100; break
        case 'spiral': xOffset = Math.sin(t * 4) * 60; break
        case 'curve': xOffset = Math.sin(t * 1.5) * 120; break
      }

      b.x = b.startX + xOffset
      b.y += b.speed * dt / 1000
      
      // 落地检测逻辑还原
      if (b.y + b.radius >= canvas.height - 10) {
        gameRef.current.bubbles.splice(i, 1)
        createParticles(b.x, b.y, b.color, true) // 落地产生粒子效果
        if (b.isEven) {
          handleLoseLife()
          playSound(150, 0.3, 'explosion') // 偶数落地播放爆炸声
        } else {
          playSound(0, 0, 'pop', 'happy') // 奇数落地播放开心音效
        }
      }
    }

    for (let i = gameRef.current.particles.length - 1; i >= 0; i--) {
      const p = gameRef.current.particles[i]
      p.life -= dt
      p.x += p.vx * dt / 1000
      p.y += p.vy * dt / 1000
      
      if (p.isFlame) {
        p.vy -= 20 * dt / 1000
        p.vx *= 0.99
        p.radius *= 0.998
      } else {
        p.vy += 18 * dt / 1000
      }
      
      if (p.life <= 0) gameRef.current.particles.splice(i, 1)
    }
  }

  const draw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, '#1e0c3d')
    grad.addColorStop(0.5, '#281763')
    grad.addColorStop(1, '#140a25')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 底部装饰线
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(0, canvas.height - 12, canvas.width, 12)

    gameRef.current.bubbles.forEach(b => {
      ctx.save()
      const bubbleGrad = ctx.createRadialGradient(b.x - b.radius/3, b.y - b.radius/3, b.radius/6, b.x, b.y, b.radius)
      bubbleGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
      bubbleGrad.addColorStop(0.4, b.color)
      bubbleGrad.addColorStop(1, 'rgba(0,0,0,0.45)')
      
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.fillStyle = bubbleGrad
      ctx.fill()
      ctx.strokeStyle = b.isSpecial ? b.color : 'rgba(255,255,255,0.55)'
      ctx.lineWidth = b.isSpecial ? 4 : 3
      if (b.isSpecial) ctx.setLineDash([6, 4])
      ctx.stroke()
      
      if (b.isSpecial && b.animal) {
        ctx.font = `${b.radius * 0.9}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(b.animal.emoji, b.x, b.y - b.radius * 0.25)
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.max(16, b.radius * 0.45)}px Arial`
        ctx.fillText(b.value.toString(), b.x, b.y + b.radius * 0.5)
      } else {
        ctx.fillStyle = '#fff'
        ctx.font = `${Math.max(22, b.radius * 0.75)}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(b.value.toString(), b.x, b.y)
      }
      ctx.restore()
    })

    gameRef.current.particles.forEach(p => {
      const alpha = Math.max(0, p.life / 680)
      ctx.globalAlpha = alpha
      if (p.isFlame || p.isPenalty) {
        ctx.shadowBlur = 15
        ctx.shadowColor = p.color
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.shadowBlur = 0
    })
    ctx.globalAlpha = 1
  }

  const handlePointer = (clientX: number, clientY: number) => {
    initAudio()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const y = (clientY - rect.top) * (canvas.height / rect.height)

    for (let i = gameRef.current.bubbles.length - 1; i >= 0; i--) {
      const b = gameRef.current.bubbles[i]
      const dist = Math.hypot(b.x - x, b.y - y)
      if (dist <= b.radius) {
        gameRef.current.bubbles.splice(i, 1)
        createParticles(b.x, b.y, b.color, !b.isEven)
        if (b.isEven) {
          setScore(s => s + b.points)
          if (b.isSpecial && b.animal) {
            playSound(0, 0, 'animal', b.animal.sound) // 播放真实动物音效
          } else {
            playSound(250 + Math.random() * 100)
          }
        } else {
          handleLoseLife()
          playSound(150, 0.3, 'explosion')
        }
        break
      }
    }
  }

  const createParticles = (x: number, y: number, color: string, isPenalty: boolean) => {
    const count = isPenalty ? 20 : 14
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (isPenalty ? 60 : 60) + Math.random() * (isPenalty ? 150 : 140)
      gameRef.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isPenalty ? 80 : 0),
        radius: isPenalty ? (5 + Math.random() * 6) : (3 + Math.random() * 4),
        color: isPenalty ? ['#ff4d6d', '#ff6b35', '#ff9500', '#ffd700'][Math.floor(Math.random() * 4)] : color,
        life: isPenalty ? 600 : 680,
        isPenalty,
        isFlame: isPenalty
      })
    }
  }

  const handleLoseLife = () => {
    setLives(l => {
      const newLives = Math.max(0, l - 1)
      if (newLives === 0) setGameOver(true)
      return newLives
    })
  }

  const restart = () => {
    setScore(0)
    setLives(5)
    setGameOver(false)
    gameRef.current.bubbles = []
    gameRef.current.particles = []
    gameRef.current.lastTime = 0
    requestAnimationFrame(gameLoop)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <Link href="/games" className="text-gray-500 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('common.back_to_games')}
          </Link>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">{locale === 'zh' ? '分数' : 'Score'}</div>
              <div className="text-3xl font-black text-blue-400">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">{locale === 'zh' ? '生命' : 'Lives'}</div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl transition-all duration-300 ${i < lives ? 'text-pink-500 scale-110' : 'text-white/10 scale-90'}`}>❤️</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative rounded-[40px] bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl overflow-hidden shadow-2xl shadow-blue-500/10">
          <canvas
            ref={canvasRef}
            width={844}
            height={475}
            className="w-full h-auto cursor-crosshair block"
            onPointerDown={(e) => handlePointer(e.clientX, e.clientY)}
          />

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-500">
              <div className="text-6xl mb-6 animate-bounce">🎮</div>
              <h2 className="text-5xl font-black mb-4 tracking-tighter text-white">{locale === 'zh' ? '游戏结束' : 'GAME OVER'}</h2>
              <p className="text-xl text-gray-400 mb-10">{locale === 'zh' ? '最终得分' : 'Final Score'}: <span className="text-blue-400 font-bold">{score}</span></p>
              <div className="flex gap-4">
                <button
                  onClick={restart}
                  className="px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/30"
                >
                  {locale === 'zh' ? '再玩一次' : 'Play Again'}
                </button>
                <Link
                  href="/games"
                  className="px-10 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold transition-all"
                >
                  {locale === 'zh' ? '退出' : 'Exit'}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              {locale === 'zh' ? '玩法说明' : 'How to Play'}
            </h3>
            <p className="text-gray-500 font-light leading-relaxed">
              {locale === 'zh' 
                ? '滑动手指或鼠标弹出所有能被 2 整除的偶数泡泡。滑错奇数或让偶数泡泡落地都会损失一颗爱心。' 
                : 'Swipe to pop all even bubbles (divisible by 2). Popping an odd bubble or letting an even bubble fall will cost you a life.'}
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-center">
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">{locale === 'zh' ? '全球游玩次数' : 'Global Plays'}</div>
              <div className="text-4xl font-black text-white">{visitorCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
