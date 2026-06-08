'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

type TemplateId = 'starship' | 'geometry' | 'coaster' | 'circuit' | 'fraction' | 'molecule'
type DragKind = 'none' | 'ship' | 'geometry' | 'coaster' | 'chip' | 'blade' | 'atom'

type Template = {
  id: TemplateId
  titleZh: string
  titleEn: string
  subject: string
  verbZh: string
  verbEn: string
  accent: string
  wash: string
}

type Objective = {
  promptZh: string
  promptEn: string
  target: number
  a?: number
  b?: number
  den?: number
  num?: number
  current?: number
}

type Pod = {
  x: number
  y: number
  vx: number
  vy: number
  value: number
  good: boolean
  radius: number
}

type Chip = {
  id: number
  r: number
  x: number
  y: number
  homeX: number
  homeY: number
}

type Atom = {
  id: number
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

type Sim = {
  id: TemplateId
  round: number
  level: number
  score: number
  streak: number
  objective: Objective
  messageZh: string
  messageEn: string
  messageTimer: number
  drag: DragKind
  dragId: number
  mouse: { x: number; y: number; down: boolean }
  keys: Set<string>
  particles: Particle[]
  pods: Pod[]
  spawnTimer: number
  ship: { x: number; y: number; tx: number; ty: number; boost: number }
  geometry: { w: number; h: number; built: number; settled: boolean }
  coaster: { handleX: number; handleY: number; cartT: number; flash: number }
  circuit: { chips: Chip[]; socketR: number | null; pulse: number }
  fraction: { angle: number; sliced: number; spin: number }
  molecule: { atoms: Atom[]; requiredBonds: number; stableTimer: number }
}

type Hud = {
  score: number
  streak: number
  level: number
  promptZh: string
  promptEn: string
  messageZh: string
  messageEn: string
}

const width = 920
const height = 520

const templates: Template[] = [
  {
    id: 'starship',
    titleZh: '星际算力战舰',
    titleEn: 'Starship Compute',
    subject: 'Arithmetic',
    verbZh: '操控飞船拦截正确能量球',
    verbEn: 'Pilot into the correct energy pod',
    accent: '#38bdf8',
    wash: 'from-sky-500/25 via-indigo-500/15 to-[#07111f]',
  },
  {
    id: 'geometry',
    titleZh: '几何建城',
    titleEn: 'Geometry City',
    subject: 'Geometry',
    verbZh: '拖拽建筑角点做出目标面积',
    verbEn: 'Drag the building corner to match area',
    accent: '#f59e0b',
    wash: 'from-amber-400/25 via-teal-500/10 to-[#10120a]',
  },
  {
    id: 'coaster',
    titleZh: '函数过山车',
    titleEn: 'Function Coaster',
    subject: 'Functions',
    verbZh: '拖动控制点让轨道穿过光门',
    verbEn: 'Drag the control point through the gate',
    accent: '#fb7185',
    wash: 'from-rose-500/25 via-violet-500/15 to-[#160914]',
  },
  {
    id: 'circuit',
    titleZh: '电路黑客',
    titleEn: 'Circuit Hacker',
    subject: 'Science',
    verbZh: '拖入正确电阻点亮电路',
    verbEn: 'Drag the right resistor into the socket',
    accent: '#22c55e',
    wash: 'from-emerald-400/25 via-cyan-500/10 to-[#06130f]',
  },
  {
    id: 'fraction',
    titleZh: '分数切割场',
    titleEn: 'Fraction Slicer',
    subject: 'Fractions',
    verbZh: '旋转切割刀切出目标分数',
    verbEn: 'Rotate the cutter to the target fraction',
    accent: '#a78bfa',
    wash: 'from-violet-500/25 via-fuchsia-500/10 to-[#10091b]',
  },
  {
    id: 'molecule',
    titleZh: '分子实验室',
    titleEn: 'Molecule Lab',
    subject: 'Chemistry',
    verbZh: '拖拽原子靠近形成目标成键数',
    verbEn: 'Drag atoms close to form target bonds',
    accent: '#2dd4bf',
    wash: 'from-teal-400/25 via-blue-500/10 to-[#061217]',
  },
]

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by)
}

function makeObjective(id: TemplateId, level: number, round: number): Objective {
  if (id === 'starship') {
    const a = 3 + ((round + level) % 8)
    const b = 2 + ((round * 2 + level) % 9)
    return {
      promptZh: `拦截 ${a} x ${b} 的能量球`,
      promptEn: `Intercept the pod for ${a} x ${b}`,
      target: a * b,
      a,
      b,
    }
  }

  if (id === 'geometry') {
    const target = [18, 24, 30, 36, 42, 48, 54, 60][round % 8]
    return {
      promptZh: `拖出面积 ${target} 的建筑`,
      promptEn: `Build a rectangle with area ${target}`,
      target,
    }
  }

  if (id === 'coaster') {
    const target = 145 + ((round * 53 + level * 29) % 210)
    return {
      promptZh: `调整轨道穿过高度 ${target} 的光门`,
      promptEn: `Shape the track through the gate at height ${target}`,
      target,
    }
  }

  if (id === 'circuit') {
    const current = [2, 3, 4, 5][round % 4]
    const r = [3, 4, 5, 6, 7, 8][(round + level) % 6]
    return {
      promptZh: `电流 ${current}A，拖入电阻让电压变成 ${current * r}V`,
      promptEn: `${current}A current. Drag resistance for ${current * r}V`,
      target: current * r,
      current,
    }
  }

  if (id === 'fraction') {
    const pairs = [
      [1, 4],
      [1, 3],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 5],
      [4, 5],
    ]
    const [num, den] = pairs[round % pairs.length]
    return {
      promptZh: `旋转刀片切出 ${num}/${den}`,
      promptEn: `Rotate the blade to cut ${num}/${den}`,
      target: (num / den) * Math.PI * 2,
      num,
      den,
    }
  }

  const requiredBonds = [2, 3, 4, 5][round % 4]
  return {
    promptZh: `拖拽原子，形成 ${requiredBonds} 条稳定键`,
    promptEn: `Drag atoms to create ${requiredBonds} stable bonds`,
    target: requiredBonds,
  }
}

function makeChips(objective: Objective): Chip[] {
  const current = objective.current ?? 2
  const correct = objective.target / current
  const values = Array.from(new Set([correct, correct + 1, Math.max(1, correct - 1), correct + 3])).slice(0, 4)
  return values.map((r, index) => ({
    id: index,
    r,
    x: 140 + index * 140,
    y: 420,
    homeX: 140 + index * 140,
    homeY: 420,
  }))
}

function makeAtoms(requiredBonds: number): Atom[] {
  const atoms: Atom[] = [
    { id: 0, label: 'O', x: 460, y: 255, vx: 0, vy: 0, radius: 36, color: '#2dd4bf' },
    { id: 1, label: 'H', x: 255, y: 190, vx: 18, vy: -10, radius: 24, color: '#bae6fd' },
    { id: 2, label: 'H', x: 690, y: 190, vx: -16, vy: 14, radius: 24, color: '#bae6fd' },
    { id: 3, label: 'C', x: 255, y: 370, vx: 14, vy: 16, radius: 30, color: '#fef3c7' },
    { id: 4, label: 'N', x: 690, y: 370, vx: -18, vy: -12, radius: 30, color: '#c4b5fd' },
  ]
  return atoms.slice(0, Math.min(5, requiredBonds + 2))
}

function makeSim(id: TemplateId, level = 1): Sim {
  const objective = makeObjective(id, level, 0)
  return {
    id,
    round: 0,
    level,
    score: 0,
    streak: 0,
    objective,
    messageZh: '',
    messageEn: '',
    messageTimer: 0,
    drag: 'none',
    dragId: -1,
    mouse: { x: width / 2, y: height / 2, down: false },
    keys: new Set(),
    particles: [],
    pods: [],
    spawnTimer: 0,
    ship: { x: 150, y: 260, tx: 150, ty: 260, boost: 0 },
    geometry: { w: 4, h: 5, built: 0, settled: false },
    coaster: { handleX: 455, handleY: 150, cartT: 0, flash: 0 },
    circuit: { chips: makeChips(objective), socketR: null, pulse: 0 },
    fraction: { angle: Math.PI / 2, sliced: 0, spin: 0 },
    molecule: { atoms: makeAtoms(objective.target), requiredBonds: objective.target, stableTimer: 0 },
  }
}

function useArcadeAudio() {
  const contextRef = useRef<AudioContext | null>(null)

  const getContext = () => {
    if (typeof window === 'undefined') return null
    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    contextRef.current ??= new (audioWindow.AudioContext || audioWindow.webkitAudioContext || AudioContext)()
    if (contextRef.current.state === 'suspended') {
      void contextRef.current.resume()
    }
    return contextRef.current
  }

  const tone = useCallback((notes: number[], type: OscillatorType, gainValue: number) => {
    const ctx = getContext()
    if (!ctx) return
    notes.forEach((note, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = note
      const start = ctx.currentTime + index * 0.055
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.25)
    })
  }, [])

  const success = useCallback(() => tone([392, 523, 659, 784], 'triangle', 0.12), [tone])
  const missTone = useCallback(() => tone([196, 146], 'sawtooth', 0.055), [tone])
  const move = useCallback(() => tone([330, 440], 'sine', 0.045), [tone])

  return useMemo(() => ({ success, miss: missTone, move }), [success, missTone, move])
}

function makeHud(sim: Sim): Hud {
  return {
    score: sim.score,
    streak: sim.streak,
    level: sim.level,
    promptZh: sim.objective.promptZh,
    promptEn: sim.objective.promptEn,
    messageZh: sim.messageZh,
    messageEn: sim.messageEn,
  }
}

function addBurst(sim: Sim, x: number, y: number, color: string) {
  for (let i = 0; i < 18; i += 1) {
    const angle = rand(0, Math.PI * 2)
    const speed = rand(70, 220)
    sim.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.35, 0.75),
      color,
    })
  }
}

function advance(sim: Sim, zh: string, en: string, color: string, audio: ReturnType<typeof useArcadeAudio>) {
  sim.score += 120 + sim.streak * 25
  sim.streak += 1
  sim.round += 1
  sim.level = 1 + Math.floor(sim.round / 4)
  sim.objective = makeObjective(sim.id, sim.level, sim.round)
  sim.messageZh = zh
  sim.messageEn = en
  sim.messageTimer = 1.4
  sim.geometry.settled = false
  sim.circuit.socketR = null
  sim.circuit.chips = makeChips(sim.objective)
  sim.fraction.sliced = 0
  sim.molecule.requiredBonds = sim.objective.target
  sim.molecule.atoms = makeAtoms(sim.molecule.requiredBonds)
  sim.molecule.stableTimer = 0
  addBurst(sim, sim.mouse.x, sim.mouse.y, color)
  audio.success()
}

function miss(sim: Sim, zh: string, en: string, audio: ReturnType<typeof useArcadeAudio>) {
  sim.streak = 0
  sim.messageZh = zh
  sim.messageEn = en
  sim.messageTimer = 1.1
  audio.miss()
}

function spawnPods(sim: Sim) {
  const a = sim.objective.a ?? 4
  const target = sim.objective.target
  const values = [target, target + a, Math.max(1, target - a), target + sim.level + 3]
  const value = values[Math.floor(Math.random() * values.length)]
  sim.pods.push({
    x: width + 40,
    y: rand(86, height - 86),
    vx: -rand(130, 190) - sim.level * 8,
    vy: rand(-18, 18),
    value,
    good: value === target,
    radius: 30,
  })
}

function getCoasterPoint(sim: Sim, t: number) {
  const p0 = { x: 80, y: 400 }
  const p1 = { x: sim.coaster.handleX, y: sim.coaster.handleY }
  const p2 = { x: 840, y: 250 }
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y
  return { x, y }
}

function getBondCount(atoms: Atom[]) {
  let bonds = 0
  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      if (dist(atoms[i].x, atoms[i].y, atoms[j].x, atoms[j].y) < atoms[i].radius + atoms[j].radius + 20) {
        bonds += 1
      }
    }
  }
  return bonds
}

function updateSim(sim: Sim, dt: number, audio: ReturnType<typeof useArcadeAudio>) {
  if (sim.messageTimer > 0) {
    sim.messageTimer -= dt
    if (sim.messageTimer <= 0) {
      sim.messageZh = ''
      sim.messageEn = ''
    }
  }

  sim.particles = sim.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      vy: particle.vy + 180 * dt,
      life: particle.life - dt,
    }))
    .filter((particle) => particle.life > 0)

  if (sim.id === 'starship') {
    const speed = 280
    if (sim.keys.has('ArrowUp') || sim.keys.has('w')) sim.ship.ty -= speed * dt
    if (sim.keys.has('ArrowDown') || sim.keys.has('s')) sim.ship.ty += speed * dt
    if (sim.keys.has('ArrowLeft') || sim.keys.has('a')) sim.ship.tx -= speed * dt
    if (sim.keys.has('ArrowRight') || sim.keys.has('d')) sim.ship.tx += speed * dt
    sim.ship.tx = clamp(sim.ship.tx, 46, width - 80)
    sim.ship.ty = clamp(sim.ship.ty, 70, height - 70)
    sim.ship.x += (sim.ship.tx - sim.ship.x) * Math.min(1, dt * 10)
    sim.ship.y += (sim.ship.ty - sim.ship.y) * Math.min(1, dt * 10)
    sim.spawnTimer -= dt
    if (sim.spawnTimer <= 0 || sim.pods.length < 3) {
      spawnPods(sim)
      sim.spawnTimer = rand(0.7, 1.05)
    }
    sim.pods = sim.pods.filter((pod) => {
      pod.x += pod.vx * dt
      pod.y += pod.vy * dt
      pod.y = clamp(pod.y, 70, height - 70)
      if (dist(sim.ship.x + 24, sim.ship.y, pod.x, pod.y) < pod.radius + 30) {
        if (pod.good) {
          sim.mouse.x = pod.x
          sim.mouse.y = pod.y
          advance(sim, '命中正确能量球', 'Correct pod intercepted', '#38bdf8', audio)
          sim.pods = []
        } else {
          miss(sim, '撞到了错误能量球', 'Wrong pod hit', audio)
          addBurst(sim, pod.x, pod.y, '#fb7185')
        }
        return false
      }
      return pod.x > -60
    })
  }

  if (sim.id === 'geometry') {
    const area = sim.geometry.w * sim.geometry.h
    if (area === sim.objective.target && !sim.geometry.settled) {
      sim.geometry.settled = true
      sim.geometry.built += 1
      sim.mouse.x = 520
      sim.mouse.y = 260
      advance(sim, '建筑面积匹配，城市扩建完成', 'Area matched. City block built', '#f59e0b', audio)
    }
    if (area !== sim.objective.target) {
      sim.geometry.settled = false
    }
  }

  if (sim.id === 'coaster') {
    sim.coaster.cartT += dt * (0.18 + sim.level * 0.015)
    if (sim.coaster.cartT > 1) sim.coaster.cartT = 0
    const gateT = 0.76
    const p = getCoasterPoint(sim, gateT)
    const nearGate = Math.abs(sim.coaster.cartT - gateT) < 0.015
    const targetY = sim.objective.target
    if (nearGate) {
      if (Math.abs(p.y - targetY) < 18) {
        sim.mouse.x = p.x
        sim.mouse.y = p.y
        sim.coaster.cartT = 0
        advance(sim, '轨道穿过目标光门', 'Track crossed the target gate', '#fb7185', audio)
      } else {
        sim.coaster.flash = 0.4
        miss(sim, '轨道高度偏离光门', 'Track missed the gate height', audio)
      }
    }
    sim.coaster.flash = Math.max(0, sim.coaster.flash - dt)
  }

  if (sim.id === 'circuit') {
    sim.circuit.pulse += dt
  }

  if (sim.id === 'fraction') {
    sim.fraction.spin += dt * 0.7
  }

  if (sim.id === 'molecule') {
    for (const atom of sim.molecule.atoms) {
      if (sim.drag === 'atom' && sim.dragId === atom.id) continue
      atom.x += atom.vx * dt
      atom.y += atom.vy * dt
      if (atom.x < 120 || atom.x > width - 120) atom.vx *= -1
      if (atom.y < 105 || atom.y > height - 80) atom.vy *= -1
      atom.x = clamp(atom.x, 95, width - 95)
      atom.y = clamp(atom.y, 88, height - 70)
    }
    const bonds = getBondCount(sim.molecule.atoms)
    if (bonds === sim.molecule.requiredBonds) {
      sim.molecule.stableTimer += dt
      if (sim.molecule.stableTimer > 0.55) {
        sim.mouse.x = width / 2
        sim.mouse.y = height / 2
        advance(sim, '分子结构稳定', 'Molecular structure stabilized', '#2dd4bf', audio)
      }
    } else {
      sim.molecule.stableTimer = 0
    }
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, template: Template) {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#050816')
  gradient.addColorStop(0.55, '#111827')
  gradient.addColorStop(1, '#030712')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.18
  ctx.strokeStyle = template.accent
  for (let x = 0; x < width; x += 46) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 46) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawTextPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = '700 18px system-ui, -apple-system, sans-serif'
  const metrics = ctx.measureText(text)
  ctx.fillStyle = 'rgba(0,0,0,.42)'
  ctx.strokeStyle = 'rgba(255,255,255,.14)'
  ctx.lineWidth = 1
  roundRect(ctx, x, y, metrics.width + 30, 42, 16)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = color
  ctx.fillText(text, x + 15, y + 27)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawStarship(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  drawTextPill(ctx, `${sim.objective.a} x ${sim.objective.b}`, 34, 30, '#e0f2fe')
  for (const pod of sim.pods) {
    const glow = ctx.createRadialGradient(pod.x, pod.y, 4, pod.x, pod.y, pod.radius + 18)
    glow.addColorStop(0, pod.good ? '#bae6fd' : '#fecdd3')
    glow.addColorStop(1, pod.good ? 'rgba(56,189,248,.08)' : 'rgba(251,113,133,.08)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(pod.x, pod.y, pod.radius + 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pod.good ? '#38bdf8' : '#fb7185'
    ctx.beginPath()
    ctx.arc(pod.x, pod.y, pod.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#020617'
    ctx.font = '900 22px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(pod.value), pod.x, pod.y + 8)
  }

  ctx.save()
  ctx.translate(sim.ship.x, sim.ship.y)
  ctx.fillStyle = template.accent
  ctx.shadowBlur = 28
  ctx.shadowColor = template.accent
  ctx.beginPath()
  ctx.moveTo(52, 0)
  ctx.lineTo(-28, -30)
  ctx.lineTo(-12, 0)
  ctx.lineTo(-28, 30)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#e0f2fe'
  ctx.beginPath()
  ctx.arc(6, 0, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.textAlign = 'left'
}

function drawGeometry(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const cell = 24
  const left = 180
  const bottom = 425
  const w = sim.geometry.w
  const h = sim.geometry.h
  ctx.fillStyle = 'rgba(245,158,11,.12)'
  ctx.fillRect(left, bottom - h * cell, w * cell, h * cell)
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 3
  ctx.strokeRect(left, bottom - h * cell, w * cell, h * cell)
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(255,255,255,.22)'
  for (let i = 1; i < w; i += 1) {
    ctx.beginPath()
    ctx.moveTo(left + i * cell, bottom - h * cell)
    ctx.lineTo(left + i * cell, bottom)
    ctx.stroke()
  }
  for (let i = 1; i < h; i += 1) {
    ctx.beginPath()
    ctx.moveTo(left, bottom - i * cell)
    ctx.lineTo(left + w * cell, bottom - i * cell)
    ctx.stroke()
  }
  ctx.fillStyle = '#fff7ed'
  ctx.font = '900 26px system-ui, sans-serif'
  ctx.fillText(`${w} x ${h} = ${w * h}`, left, bottom + 40)

  const hx = left + w * cell
  const hy = bottom - h * cell
  ctx.fillStyle = template.accent
  ctx.beginPath()
  ctx.arc(hx, hy, 14, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,.08)'
  for (let i = 0; i < sim.geometry.built; i += 1) {
    const x = 590 + i * 44
    const bh = 70 + (i % 4) * 24
    ctx.fillRect(x, bottom - bh, 30, bh)
    ctx.fillStyle = 'rgba(245,158,11,.7)'
    ctx.fillRect(x + 6, bottom - bh + 10, 6, 9)
    ctx.fillRect(x + 18, bottom - bh + 28, 6, 9)
    ctx.fillStyle = 'rgba(255,255,255,.08)'
  }
  drawTextPill(ctx, `Target area ${sim.objective.target}`, 34, 30, '#fef3c7')
}

function drawCoaster(ctx: CanvasRenderingContext2D, sim: Sim) {
  const targetY = sim.objective.target
  ctx.strokeStyle = sim.coaster.flash > 0 ? '#fb7185' : 'rgba(255,255,255,.22)'
  ctx.lineWidth = 3
  ctx.setLineDash([8, 10])
  ctx.beginPath()
  ctx.moveTo(650, targetY)
  ctx.lineTo(860, targetY)
  ctx.stroke()
  ctx.setLineDash([])
  drawTextPill(ctx, `Gate y=${targetY}`, 650, targetY - 62, '#fecdd3')

  ctx.strokeStyle = '#fb7185'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(80, 400)
  ctx.quadraticCurveTo(sim.coaster.handleX, sim.coaster.handleY, 840, 250)
  ctx.stroke()

  ctx.fillStyle = '#fff1f2'
  ctx.beginPath()
  ctx.arc(sim.coaster.handleX, sim.coaster.handleY, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sim.coaster.handleX, sim.coaster.handleY)
  ctx.lineTo(80, 400)
  ctx.moveTo(sim.coaster.handleX, sim.coaster.handleY)
  ctx.lineTo(840, 250)
  ctx.stroke()

  const cart = getCoasterPoint(sim, sim.coaster.cartT)
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, cart.x - 22, cart.y - 16, 44, 32, 10)
  ctx.fill()
  ctx.fillStyle = '#fb7185'
  ctx.beginPath()
  ctx.arc(cart.x - 12, cart.y + 17, 6, 0, Math.PI * 2)
  ctx.arc(cart.x + 12, cart.y + 17, 6, 0, Math.PI * 2)
  ctx.fill()
}

function drawCircuit(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  const socket = { x: 460, y: 230 }
  const isLit = sim.circuit.socketR !== null && (sim.objective.current ?? 2) * sim.circuit.socketR === sim.objective.target
  ctx.strokeStyle = isLit ? '#86efac' : 'rgba(255,255,255,.2)'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(120, 230)
  ctx.lineTo(300, 230)
  ctx.moveTo(520, 230)
  ctx.lineTo(780, 230)
  ctx.moveTo(780, 230)
  ctx.lineTo(780, 340)
  ctx.lineTo(120, 340)
  ctx.lineTo(120, 230)
  ctx.stroke()
  ctx.fillStyle = isLit ? '#86efac' : 'rgba(255,255,255,.12)'
  ctx.beginPath()
  ctx.arc(780, 230, 34 + Math.sin(sim.circuit.pulse * 6) * 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#052e16'
  ctx.font = '900 20px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('V', 780, 237)

  ctx.strokeStyle = template.accent
  ctx.lineWidth = 3
  ctx.fillStyle = 'rgba(34,197,94,.16)'
  roundRect(ctx, socket.x - 70, socket.y - 42, 140, 84, 18)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#dcfce7'
  ctx.font = '900 18px system-ui, sans-serif'
  ctx.fillText(sim.circuit.socketR ? `${sim.circuit.socketR} ohm` : 'SOCKET', socket.x, socket.y + 7)
  ctx.textAlign = 'left'

  for (const chip of sim.circuit.chips) {
    ctx.fillStyle = '#ecfdf5'
    roundRect(ctx, chip.x - 44, chip.y - 30, 88, 60, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(34,197,94,.85)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#052e16'
    ctx.font = '900 19px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${chip.r} ohm`, chip.x, chip.y + 7)
  }
  ctx.textAlign = 'left'
  drawTextPill(ctx, `${sim.objective.current}A -> ${sim.objective.target}V`, 34, 30, '#dcfce7')
}

function drawFraction(ctx: CanvasRenderingContext2D, sim: Sim) {
  const cx = width / 2
  const cy = 265
  const radius = 150
  const target = sim.objective.target
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(sim.fraction.spin * 0.12)
  ctx.fillStyle = 'rgba(167,139,250,.18)'
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.22)'
  ctx.lineWidth = 2
  const den = sim.objective.den ?? 4
  for (let i = 0; i < den; i += 1) {
    const angle = (i / den) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(167,139,250,.58)'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, radius, 0, target)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(sim.fraction.angle) * 190, cy + Math.sin(sim.fraction.angle) * 190)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx + Math.cos(sim.fraction.angle) * 190, cy + Math.sin(sim.fraction.angle) * 190, 14, 0, Math.PI * 2)
  ctx.fill()
  drawTextPill(ctx, `${sim.objective.num}/${sim.objective.den}`, 34, 30, '#ede9fe')
}

function drawMolecule(ctx: CanvasRenderingContext2D, sim: Sim) {
  const atoms = sim.molecule.atoms
  ctx.lineWidth = 7
  for (let i = 0; i < atoms.length; i += 1) {
    for (let j = i + 1; j < atoms.length; j += 1) {
      const near = dist(atoms[i].x, atoms[i].y, atoms[j].x, atoms[j].y) < atoms[i].radius + atoms[j].radius + 20
      if (!near) continue
      ctx.strokeStyle = 'rgba(45,212,191,.7)'
      ctx.beginPath()
      ctx.moveTo(atoms[i].x, atoms[i].y)
      ctx.lineTo(atoms[j].x, atoms[j].y)
      ctx.stroke()
    }
  }

  for (const atom of atoms) {
    ctx.fillStyle = atom.color
    ctx.shadowColor = atom.color
    ctx.shadowBlur = 24
    ctx.beginPath()
    ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#082f2e'
    ctx.font = '900 20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(atom.label, atom.x, atom.y + 7)
  }
  ctx.textAlign = 'left'
  drawTextPill(ctx, `Bonds ${getBondCount(atoms)} / ${sim.molecule.requiredBonds}`, 34, 30, '#ccfbf1')
}

function drawParticles(ctx: CanvasRenderingContext2D, sim: Sim) {
  for (const p of sim.particles) {
    ctx.globalAlpha = clamp(p.life, 0, 1)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawSim(ctx: CanvasRenderingContext2D, sim: Sim, template: Template) {
  drawBackground(ctx, template)
  if (sim.id === 'starship') drawStarship(ctx, sim, template)
  if (sim.id === 'geometry') drawGeometry(ctx, sim, template)
  if (sim.id === 'coaster') drawCoaster(ctx, sim)
  if (sim.id === 'circuit') drawCircuit(ctx, sim, template)
  if (sim.id === 'fraction') drawFraction(ctx, sim)
  if (sim.id === 'molecule') drawMolecule(ctx, sim)
  drawParticles(ctx, sim)
}

function getPointer(canvas: HTMLCanvasElement, event: PointerEvent | React.PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  }
}

export default function LearningGameShowcase() {
  const { locale } = useLanguage()
  const audio = useArcadeAudio()
  const [activeId, setActiveId] = useState<TemplateId>('starship')
  const activeTemplate = useMemo(() => templates.find((template) => template.id === activeId) ?? templates[0], [activeId])
  const simRef = useRef<Sim>(makeSim('starship'))
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [hud, setHud] = useState<Hud>(makeHud(simRef.current))

  const reset = useCallback((id = activeId) => {
    simRef.current = makeSim(id)
    setHud(makeHud(simRef.current))
    audio.move()
  }, [activeId, audio])

  useEffect(() => {
    reset(activeId)
  }, [activeId, reset])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      simRef.current.keys.add(event.key)
      if (event.key === ' ' && simRef.current.id === 'fraction') {
        event.preventDefault()
        sliceFraction()
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      simRef.current.keys.delete(event.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    let hudTimer = 0
    const loop = (time: number) => {
      const dt = Math.min(0.035, (time - last) / 1000)
      last = time
      updateSim(simRef.current, dt, audio)
      drawSim(ctx, simRef.current, activeTemplate)
      hudTimer += dt
      if (hudTimer > 0.12) {
        setHud(makeHud(simRef.current))
        hudTimer = 0
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activeTemplate, audio])

  const beginDrag = (x: number, y: number) => {
    const sim = simRef.current
    sim.mouse = { x, y, down: true }
    if (sim.id === 'starship' && dist(x, y, sim.ship.x, sim.ship.y) < 90) {
      sim.drag = 'ship'
      sim.ship.tx = x
      sim.ship.ty = y
      return
    }
    if (sim.id === 'geometry') {
      const hx = 180 + sim.geometry.w * 24
      const hy = 425 - sim.geometry.h * 24
      if (dist(x, y, hx, hy) < 36) sim.drag = 'geometry'
      return
    }
    if (sim.id === 'coaster' && dist(x, y, sim.coaster.handleX, sim.coaster.handleY) < 44) {
      sim.drag = 'coaster'
      return
    }
    if (sim.id === 'circuit') {
      const chip = sim.circuit.chips.find((item) => Math.abs(x - item.x) < 52 && Math.abs(y - item.y) < 40)
      if (chip) {
        sim.drag = 'chip'
        sim.dragId = chip.id
      }
      return
    }
    if (sim.id === 'fraction' && dist(x, y, width / 2, 265) < 220) {
      sim.drag = 'blade'
      return
    }
    if (sim.id === 'molecule') {
      const atom = sim.molecule.atoms.find((item) => dist(x, y, item.x, item.y) < item.radius + 18)
      if (atom) {
        sim.drag = 'atom'
        sim.dragId = atom.id
      }
    }
  }

  const moveDrag = (x: number, y: number) => {
    const sim = simRef.current
    sim.mouse.x = x
    sim.mouse.y = y
    if (sim.id === 'starship' && (sim.drag === 'ship' || sim.mouse.down)) {
      sim.ship.tx = clamp(x, 46, width - 80)
      sim.ship.ty = clamp(y, 70, height - 70)
    }
    if (sim.drag === 'geometry') {
      sim.geometry.w = clamp(Math.round((x - 180) / 24), 1, 16)
      sim.geometry.h = clamp(Math.round((425 - y) / 24), 1, 12)
    }
    if (sim.drag === 'coaster') {
      sim.coaster.handleX = clamp(x, 180, 700)
      sim.coaster.handleY = clamp(y, 80, 420)
    }
    if (sim.drag === 'chip') {
      const chip = sim.circuit.chips.find((item) => item.id === sim.dragId)
      if (chip) {
        chip.x = x
        chip.y = y
      }
    }
    if (sim.drag === 'blade') {
      sim.fraction.angle = Math.atan2(y - 265, x - width / 2)
      if (sim.fraction.angle < 0) sim.fraction.angle += Math.PI * 2
    }
    if (sim.drag === 'atom') {
      const atom = sim.molecule.atoms.find((item) => item.id === sim.dragId)
      if (atom) {
        atom.x = clamp(x, 80, width - 80)
        atom.y = clamp(y, 82, height - 65)
        atom.vx *= 0.82
        atom.vy *= 0.82
      }
    }
  }

  const endDrag = () => {
    const sim = simRef.current
    if (sim.drag === 'chip') {
      const chip = sim.circuit.chips.find((item) => item.id === sim.dragId)
      if (chip) {
        const socketHit = Math.abs(chip.x - 460) < 78 && Math.abs(chip.y - 230) < 58
        if (socketHit) {
          sim.circuit.socketR = chip.r
          chip.x = chip.homeX
          chip.y = chip.homeY
          const voltage = (sim.objective.current ?? 2) * chip.r
          if (voltage === sim.objective.target) {
            sim.mouse.x = 460
            sim.mouse.y = 230
            advance(sim, '电路点亮，欧姆定律匹配', 'Circuit lit. Ohm law matched', '#22c55e', audio)
          } else {
            miss(sim, `${voltage}V 不是目标电压`, `${voltage}V is not the target voltage`, audio)
          }
        } else {
          chip.x = chip.homeX
          chip.y = chip.homeY
        }
      }
    }
    sim.mouse.down = false
    sim.drag = 'none'
    sim.dragId = -1
    setHud(makeHud(sim))
  }

  const sliceFraction = useCallback(() => {
    const sim = simRef.current
    if (sim.id !== 'fraction') return
    const target = sim.objective.target
    const raw = Math.abs(sim.fraction.angle - target)
    const diff = Math.min(raw, Math.PI * 2 - raw)
    sim.mouse.x = width / 2 + Math.cos(sim.fraction.angle) * 180
    sim.mouse.y = 265 + Math.sin(sim.fraction.angle) * 180
    if (diff < 0.18) {
      sim.fraction.sliced += 1
      advance(sim, '切割角度命中目标分数', 'Slice angle matched the fraction', '#a78bfa', audio)
    } else {
      miss(sim, '切割角度还不够接近目标分数', 'Blade angle is not close enough', audio)
    }
    setHud(makeHud(sim))
  }, [audio])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const point = getPointer(canvas, event)
    canvas.setPointerCapture(event.pointerId)
    beginDrag(point.x, point.y)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const point = getPointer(canvas, event)
    moveDrag(point.x, point.y)
  }

  const handlePointerUp = () => {
    endDrag()
  }

  return (
    <section className="relative">
      <div className="mb-8 grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-5">
          <div className="border-b border-white/10 pb-5">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-white/45">Larry Academy Lab</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {locale === 'zh' ? '真正可操控的学习游戏' : 'Playable Learning Games'}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">
              {locale === 'zh'
                ? '这版把数学和科学概念放进移动、拖拽、连线、切割和碰撞动作里。学生要操作物体完成任务，不是只点选答案。'
                : 'Concepts now live inside movement, dragging, wiring, slicing, and collision. Students operate the world instead of just choosing answers.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {templates.map((template) => {
              const selected = template.id === activeId
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setActiveId(template.id)
                    audio.move()
                  }}
                  className={`min-h-32 rounded-2xl border p-4 text-left transition ${
                    selected ? 'border-white/45 bg-white text-black shadow-2xl shadow-white/10' : 'border-white/10 bg-white/[0.035] text-white hover:border-white/25 hover:bg-white/[0.07]'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: selected ? '#111' : template.accent }}>
                    {template.subject}
                  </span>
                  <span className="mt-3 block text-base font-black leading-tight">
                    {locale === 'zh' ? template.titleZh : template.titleEn}
                  </span>
                  <span className={`mt-2 block text-xs leading-5 ${selected ? 'text-black/58' : 'text-white/45'}`}>
                    {locale === 'zh' ? template.verbZh : template.verbEn}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${activeTemplate.wash} p-4 shadow-2xl shadow-black/25`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{activeTemplate.subject}</p>
              <h3 className="mt-1 text-2xl font-black text-white">{locale === 'zh' ? activeTemplate.titleZh : activeTemplate.titleEn}</h3>
            </div>
            <button
              onClick={() => reset(activeId)}
              className="rounded-xl bg-white px-4 py-3 text-sm font-black text-black transition hover:scale-[1.02] active:scale-[0.98]"
            >
              {locale === 'zh' ? '重开' : 'Reset'}
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="block aspect-[920/520] w-full touch-none rounded-xl border border-white/10 bg-black shadow-inner"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
            {locale === 'zh' ? '当前任务' : 'Current Mission'}
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {locale === 'zh' ? hud.promptZh : hud.promptEn}
          </div>
          {hud.messageZh && (
            <div className="mt-3 text-sm font-bold" style={{ color: activeTemplate.accent }}>
              {locale === 'zh' ? hud.messageZh : hud.messageEn}
            </div>
          )}
        </div>
        {[
          [locale === 'zh' ? '分数' : 'Score', hud.score],
          [locale === 'zh' ? '连击' : 'Streak', hud.streak],
          [locale === 'zh' ? '等级' : 'Level', hud.level],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-3xl font-black text-white">{value}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white/42">{label}</div>
          </div>
        ))}
      </div>

      {activeId === 'fraction' && (
        <button
          onClick={sliceFraction}
          className="mt-4 rounded-2xl px-6 py-4 text-base font-black text-black transition hover:scale-[1.01] active:scale-[0.98]"
          style={{ backgroundColor: activeTemplate.accent }}
        >
          {locale === 'zh' ? '执行切割' : 'Slice'}
        </button>
      )}
    </section>
  )
}
