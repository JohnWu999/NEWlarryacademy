import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const coursePath = path.join(projectRoot, 'data/ib-myp-g6-course.json')
const outputDir = path.join(projectRoot, 'public/lesson-covers/ib-myp-g6')
const courseCoverPath = path.join(projectRoot, 'public/course-covers/ib-g6-myp-cover.svg')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function shortTitle(title = '') {
  return String(title)
    .replace(/^IB MYP G6 Math\s+\d+:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitLines(text, max = 25, limit = 3) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max && line) {
      lines.push(line)
      line = word
    } else {
      line = `${line} ${word}`.trim()
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, limit)
}

const palettes = [
  { bg: '#07111f', glow: '#38bdf8', accent: '#f8d66d', soft: '#102842' },
  { bg: '#0b1020', glow: '#a78bfa', accent: '#5eead4', soft: '#241547' },
  { bg: '#071712', glow: '#34d399', accent: '#93c5fd', soft: '#123225' },
  { bg: '#151007', glow: '#f59e0b', accent: '#60a5fa', soft: '#35220b' },
]

function motifFor(title, palette, index) {
  const t = title.toLowerCase()
  if (t.includes('coordinate') || t.includes('linear') || t.includes('graph')) {
    return `<g stroke="${palette.accent}" stroke-width="2" opacity="0.9">
      ${Array.from({ length: 8 }, (_, i) => `<line x1="${440 + i * 44}" y1="70" x2="${440 + i * 44}" y2="300"/>`).join('')}
      ${Array.from({ length: 6 }, (_, i) => `<line x1="424" y1="${82 + i * 38}" x2="760" y2="${82 + i * 38}"/>`).join('')}
      <path d="M440 272 C500 230 552 232 604 176 S706 104 758 92" fill="none" stroke="${palette.glow}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="604" cy="176" r="10" fill="${palette.accent}"/>
    </g>`
  }
  if (t.includes('angle') || t.includes('triangle') || t.includes('quadrilateral') || t.includes('geometry')) {
    return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="494,282 620,82 742,282" stroke="${palette.glow}" stroke-width="8"/>
      <path d="M494 282 A70 70 0 0 1 533 220" stroke="${palette.accent}" stroke-width="7"/>
      <line x1="620" y1="82" x2="620" y2="282" stroke="white" stroke-width="3" opacity="0.45"/>
    </g>`
  }
  if (t.includes('circle') || t.includes('probability')) {
    return `<g fill="none">
      <circle cx="620" cy="188" r="112" stroke="${palette.glow}" stroke-width="8"/>
      <path d="M620 188 L718 134 A112 112 0 0 1 704 262 Z" fill="${palette.accent}" opacity="0.8"/>
      <circle cx="620" cy="188" r="5" fill="white"/>
      <path d="M508 188 H732" stroke="white" stroke-width="3" opacity="0.4"/>
    </g>`
  }
  if (t.includes('integer') || t.includes('rational') || t.includes('number line') || t.includes('rate') || t.includes('percent')) {
    return `<g stroke-linecap="round" font-family="Inter, Arial, sans-serif">
      <line x1="432" y1="206" x2="758" y2="206" stroke="white" stroke-width="5" opacity="0.6"/>
      ${[-2, -1, 0, 1, 2].map((n, i) => `<g><line x1="${472 + i * 64}" y1="184" x2="${472 + i * 64}" y2="228" stroke="${i === 2 ? palette.glow : palette.accent}" stroke-width="5"/><text x="${472 + i * 64}" y="260" text-anchor="middle" fill="white" font-size="24" font-weight="900">${n}</text></g>`).join('')}
      <path d="M472 158 C520 112 588 112 636 158" fill="none" stroke="${palette.glow}" stroke-width="7"/>
    </g>`
  }
  if (t.includes('area') || t.includes('volume') || t.includes('surface') || t.includes('prism') || t.includes('net')) {
    return `<g fill="none" stroke-linejoin="round">
      <polygon points="512,118 668,76 746,142 590,190" fill="${palette.soft}" stroke="${palette.glow}" stroke-width="6"/>
      <polygon points="590,190 746,142 746,268 590,316" fill="${palette.soft}" stroke="${palette.accent}" stroke-width="6"/>
      <polygon points="512,118 590,190 590,316 512,236" fill="${palette.soft}" stroke="white" stroke-width="3" opacity="0.8"/>
    </g>`
  }
  if (t.includes('data') || t.includes('statistic') || t.includes('mean') || t.includes('median')) {
    return `<g stroke-linecap="round">
      <line x1="452" y1="286" x2="758" y2="286" stroke="white" stroke-width="5" opacity="0.55"/>
      ${[86, 132, 68, 154, 110].map((h, i) => `<rect x="${490 + i * 48}" y="${286 - h}" width="24" height="${h}" rx="8" fill="${i % 2 ? palette.accent : palette.glow}"/>`).join('')}
      <path d="M470 134 C536 188 596 100 662 158 S730 210 770 140" fill="none" stroke="white" stroke-width="5" opacity="0.45"/>
    </g>`
  }
  return `<g fill="none" stroke-linejoin="round">
    <path d="M540 92 L720 152 L676 286 L490 286 L444 152 Z" fill="${palette.soft}" stroke="${palette.glow}" stroke-width="7"/>
    <circle cx="582" cy="194" r="58" stroke="${palette.accent}" stroke-width="6"/>
    <path d="M548 194 H616 M582 160 V228" stroke="white" stroke-width="6" stroke-linecap="round"/>
    <text x="704" y="116" fill="${palette.accent}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">${String(index).padStart(2, '0')}</text>
  </g>`
}

function lessonCover(lesson, index) {
  const palette = palettes[(index - 1) % palettes.length]
  const title = shortTitle(lesson.title)
  const lines = splitLines(title)
  const branch = lesson.description?.split('.')?.[0] || 'MYP mathematical thinking'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <radialGradient id="glow${index}" cx="74%" cy="26%" r="58%">
      <stop offset="0" stop-color="${palette.glow}" stop-opacity="0.56"/>
      <stop offset="0.45" stop-color="${palette.glow}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="${palette.bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade${index}" x1="0" x2="1">
      <stop offset="0" stop-color="${palette.bg}"/>
      <stop offset="1" stop-color="#050505"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" rx="40" fill="url(#shade${index})"/>
  <rect width="960" height="540" rx="40" fill="url(#glow${index})"/>
  <g opacity="0.14" stroke="white" stroke-width="1">
    ${Array.from({ length: 11 }, (_, i) => `<line x1="${80 + i * 76}" y1="68" x2="${80 + i * 76}" y2="472"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="76" y1="${86 + i * 62}" x2="884" y2="${86 + i * 62}"/>`).join('')}
  </g>
  ${motifFor(title, palette, index)}
  <g font-family="Inter, Arial, sans-serif">
    <text x="72" y="96" fill="${palette.accent}" font-size="20" font-weight="900" letter-spacing="8">IB MYP G6 MATH</text>
    <text x="72" y="148" fill="white" font-size="34" font-weight="900">Lesson ${index}</text>
    ${lines.map((line, lineIndex) => `<text x="72" y="${238 + lineIndex * 58}" fill="white" font-size="52" font-weight="950">${escapeXml(line)}</text>`).join('')}
    <rect x="72" y="438" width="112" height="6" rx="3" fill="${palette.glow}"/>
    <text x="72" y="486" fill="rgba(255,255,255,0.72)" font-size="22" font-weight="800">${escapeXml(branch)}</text>
  </g>
</svg>`
}

function courseCover(course) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="IB MYP G6 Math">
  <defs>
    <radialGradient id="a" cx="72%" cy="32%" r="52%"><stop offset="0" stop-color="#38bdf8" stop-opacity="0.55"/><stop offset="0.48" stop-color="#8b5cf6" stop-opacity="0.22"/><stop offset="1" stop-color="#050505" stop-opacity="0"/></radialGradient>
    <linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#07111f"/><stop offset="1" stop-color="#050505"/></linearGradient>
  </defs>
  <rect width="1200" height="675" rx="48" fill="url(#b)"/>
  <rect width="1200" height="675" rx="48" fill="url(#a)"/>
  <g opacity="0.13" stroke="white">${Array.from({ length: 12 }, (_, i) => `<line x1="${105 + i * 82}" y1="92" x2="${105 + i * 82}" y2="585"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<line x1="92" y1="${118 + i * 70}" x2="1100" y2="${118 + i * 70}"/>`).join('')}</g>
  <g fill="none" stroke-linejoin="round">
    <polygon points="730,178 936,106 1040,190 834,266" fill="#102842" stroke="#38bdf8" stroke-width="8"/>
    <polygon points="834,266 1040,190 1040,410 834,490" fill="#0b1b2d" stroke="#f8d66d" stroke-width="8"/>
    <polygon points="730,178 834,266 834,490 730,394" fill="#122a43" stroke="white" stroke-width="4" opacity="0.85"/>
    <circle cx="826" cy="338" r="82" stroke="#38bdf8" stroke-width="7"/>
    <path d="M782 338 H870 M826 294 V382" stroke="#f8d66d" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g font-family="Inter, Arial, sans-serif">
    <text x="86" y="122" fill="#7dd3fc" font-size="22" font-weight="900" letter-spacing="9">IB BIG MATH</text>
    <text x="86" y="255" fill="white" font-size="92" font-weight="950">IB MYP G6</text>
    <text x="86" y="350" fill="white" font-size="92" font-weight="950">Mathematics</text>
    <text x="90" y="430" fill="rgba(255,255,255,0.72)" font-size="30" font-weight="800">40 lessons · 800 practice questions · core MYP foundation</text>
    <rect x="90" y="482" width="154" height="8" rx="4" fill="#38bdf8"/>
    <text x="90" y="548" fill="rgba(255,255,255,0.82)" font-size="26" font-weight="850">${escapeXml(course.description.split('.')[0])}</text>
  </g>
</svg>`
}

function main() {
  const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'))
  ensureDir(outputDir)
  ensureDir(path.dirname(courseCoverPath))
  course.lessons.forEach((lesson, index) => {
    const file = path.join(outputDir, `lesson-${String(index + 1).padStart(2, '0')}.svg`)
    fs.writeFileSync(file, lessonCover(lesson, index + 1), 'utf8')
  })
  fs.writeFileSync(courseCoverPath, courseCover(course), 'utf8')
  console.log(`Wrote ${course.lessons.length} lesson covers to ${outputDir}`)
  console.log(`Wrote ${courseCoverPath}`)
}

main()
