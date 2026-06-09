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

function rawLessonTitle(title = '') {
  return String(title)
    .replace(/^IB MYP G6 Math\s+\d+:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const titleRules = [
  [/toolkit/i, 'Math Toolkit'],
  [/place value|powers of ten/i, 'Place Value'],
  [/prime|factors|multiples/i, 'Prime Factors'],
  [/absolute value/i, 'Absolute Value'],
  [/adding and subtracting integers/i, 'Integer Moves'],
  [/multiplying and dividing integers/i, 'Integer Products'],
  [/rational numbers on the number line/i, 'Rational Numbers'],
  [/rational number operations/i, 'Rational Operations'],
  [/ratios/i, 'Ratios'],
  [/unit rates/i, 'Unit Rates'],
  [/proportional/i, 'Proportions'],
  [/percent/i, 'Percent'],
  [/fraction, decimal, percent/i, 'Number Forms'],
  [/scale|similarity/i, 'Scale Models'],
  [/financial|budget|profit/i, 'Money Models'],
  [/choosing the right model/i, 'Model Choice'],
  [/variables|expressions/i, 'Expressions'],
  [/like terms|distributive/i, 'Distributive Property'],
  [/equations as balance/i, 'Balance Equations'],
  [/two-step equations/i, 'Two-Step Equations'],
  [/inequalities/i, 'Inequalities'],
  [/patterns|sequences/i, 'Patterns'],
  [/coordinate/i, 'Coordinate Plane'],
  [/linear relationships/i, 'Linear Relationships'],
  [/angles|lines/i, 'Angles'],
  [/triangles|quadrilaterals/i, 'Polygons'],
  [/composite figures/i, 'Composite Area'],
  [/circles|pi/i, 'Circles'],
  [/nets|surface area/i, 'Surface Area'],
  [/volume/i, 'Volume'],
  [/samples|bias/i, 'Samples & Bias'],
  [/mean|median|outliers/i, 'Mean & Median'],
  [/data displays/i, 'Data Displays'],
  [/sample spaces|expected outcomes/i, 'Probability'],
  [/simulations/i, 'Simulations'],
  [/translations/i, 'Translations'],
  [/reflections/i, 'Reflections'],
  [/rotations|tessellations/i, 'Rotations'],
  [/data to decision/i, 'Data Decisions'],
  [/capstone/i, 'Capstone Project'],
]

function coverTitle(title) {
  const raw = rawLessonTitle(title)
  const match = titleRules.find(([pattern]) => pattern.test(raw))
  if (match) return match[1]
  return raw.split(/,|:| and /i)[0].slice(0, 22)
}

function splitTitle(text) {
  const words = String(text).split(/\s+/)
  if (text.length <= 14) return [text]
  const lines = []
  let line = ''
  for (const word of words) {
    if (`${line} ${word}`.trim().length > 15 && line) {
      lines.push(line)
      line = word
    } else {
      line = `${line} ${word}`.trim()
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 2)
}

const palettes = [
  { bg: '#06111f', surface: '#0f2742', accent: '#38bdf8', warm: '#f8d66d', ink: '#eaf6ff' },
  { bg: '#0b1020', surface: '#241547', accent: '#8b5cf6', warm: '#5eead4', ink: '#f4f0ff' },
  { bg: '#071712', surface: '#123225', accent: '#34d399', warm: '#93c5fd', ink: '#effdf7' },
  { bg: '#151007', surface: '#35220b', accent: '#f59e0b', warm: '#60a5fa', ink: '#fff7e8' },
  { bg: '#160a16', surface: '#3a173e', accent: '#f472b6', warm: '#fde68a', ink: '#fff0fb' },
]

function motifType(title) {
  const t = rawLessonTitle(title).toLowerCase()
  if (t.includes('coordinate') || t.includes('linear') || t.includes('graph') || t.includes('relationship')) return 'graph'
  if (t.includes('angle') || t.includes('triangle') || t.includes('quadrilateral') || t.includes('polygon')) return 'geometry'
  if (t.includes('circle') || t.includes('probability') || t.includes('sample space')) return 'circle'
  if (t.includes('area') || t.includes('volume') || t.includes('surface') || t.includes('prism') || t.includes('net')) return 'solid'
  if (t.includes('data') || t.includes('statistic') || t.includes('mean') || t.includes('median') || t.includes('bias')) return 'data'
  if (t.includes('ratio') || t.includes('rate') || t.includes('percent') || t.includes('proportion') || t.includes('scale')) return 'ratio'
  if (t.includes('integer') || t.includes('rational') || t.includes('absolute') || t.includes('number line')) return 'number-line'
  if (t.includes('equation') || t.includes('expression') || t.includes('variable') || t.includes('inequal') || t.includes('distributive')) return 'algebra'
  if (t.includes('translation') || t.includes('reflection') || t.includes('rotation') || t.includes('tessellation')) return 'transform'
  return 'model'
}

function motifSvg(type, palette) {
  const common = `stroke-linecap="round" stroke-linejoin="round"`
  if (type === 'graph') {
    return `<g ${common} fill="none">
      <path d="M548 392 H884 M548 392 V118" stroke="${palette.ink}" stroke-width="7" opacity="0.62"/>
      <path d="M572 350 C636 302 674 315 728 242 S824 176 876 132" stroke="${palette.accent}" stroke-width="13"/>
      <circle cx="728" cy="242" r="15" fill="${palette.warm}"/>
      <circle cx="824" cy="176" r="12" fill="${palette.ink}"/>
    </g>`
  }
  if (type === 'geometry') {
    return `<g ${common} fill="none">
      <polygon points="600,388 722,126 868,388" stroke="${palette.accent}" stroke-width="14"/>
      <path d="M600 388 A96 96 0 0 1 654 300" stroke="${palette.warm}" stroke-width="12"/>
      <line x1="722" y1="126" x2="722" y2="388" stroke="${palette.ink}" stroke-width="5" opacity="0.42"/>
    </g>`
  }
  if (type === 'circle') {
    return `<g fill="none">
      <circle cx="716" cy="260" r="138" stroke="${palette.accent}" stroke-width="14"/>
      <path d="M716 260 L846 210 A138 138 0 0 1 804 368 Z" fill="${palette.warm}" opacity="0.86"/>
      <path d="M578 260 H854" stroke="${palette.ink}" stroke-width="5" opacity="0.45"/>
      <circle cx="716" cy="260" r="8" fill="${palette.ink}"/>
    </g>`
  }
  if (type === 'solid') {
    return `<g ${common}>
      <polygon points="626,158 788,100 888,168 724,230" fill="${palette.surface}" stroke="${palette.accent}" stroke-width="11"/>
      <polygon points="724,230 888,168 888,356 724,422" fill="${palette.surface}" stroke="${palette.warm}" stroke-width="11"/>
      <polygon points="626,158 724,230 724,422 626,340" fill="${palette.surface}" stroke="${palette.ink}" stroke-width="6" opacity="0.74"/>
    </g>`
  }
  if (type === 'data') {
    return `<g ${common}>
      <path d="M558 390 H884" stroke="${palette.ink}" stroke-width="7" opacity="0.55"/>
      ${[108, 168, 132, 214, 154].map((h, i) => `<rect x="${602 + i * 54}" y="${390 - h}" width="30" height="${h}" rx="12" fill="${i % 2 ? palette.warm : palette.accent}"/>`).join('')}
      <path d="M574 168 C636 210 690 116 752 168 S842 244 888 152" fill="none" stroke="${palette.ink}" stroke-width="8" opacity="0.45"/>
    </g>`
  }
  if (type === 'ratio') {
    return `<g ${common}>
      <rect x="584" y="164" width="108" height="218" rx="28" fill="${palette.accent}" opacity="0.92"/>
      <rect x="728" y="104" width="108" height="278" rx="28" fill="${palette.warm}" opacity="0.92"/>
      <path d="M584 414 H836" stroke="${palette.ink}" stroke-width="7" opacity="0.45"/>
      <circle cx="644" cy="132" r="18" fill="${palette.ink}" opacity="0.72"/>
      <circle cx="788" cy="74" r="18" fill="${palette.ink}" opacity="0.72"/>
    </g>`
  }
  if (type === 'number-line') {
    return `<g ${common} font-family="Inter, Arial, sans-serif">
      <path d="M548 282 H876" stroke="${palette.ink}" stroke-width="9" opacity="0.7"/>
      ${[-2, -1, 0, 1, 2].map((n, i) => `<g><line x1="${594 + i * 62}" y1="244" x2="${594 + i * 62}" y2="320" stroke="${i === 2 ? palette.accent : palette.warm}" stroke-width="8"/><text x="${594 + i * 62}" y="370" text-anchor="middle" fill="${palette.ink}" font-size="30" font-weight="900">${n}</text></g>`).join('')}
      <path d="M594 206 C646 132 734 132 786 206" fill="none" stroke="${palette.accent}" stroke-width="11"/>
    </g>`
  }
  if (type === 'algebra') {
    return `<g ${common}>
      <rect x="562" y="160" width="302" height="190" rx="38" fill="${palette.surface}" stroke="${palette.accent}" stroke-width="10"/>
      <path d="M624 256 H802 M713 196 V316" stroke="${palette.ink}" stroke-width="12"/>
      <circle cx="824" cy="190" r="22" fill="${palette.warm}"/>
      <circle cx="606" cy="334" r="18" fill="${palette.accent}"/>
    </g>`
  }
  if (type === 'transform') {
    return `<g ${common} fill="none">
      <polygon points="608,160 724,102 840,160 840,320 724,390 608,320" stroke="${palette.accent}" stroke-width="11"/>
      <polygon points="672,208 754,166 812,226 730,268" stroke="${palette.warm}" stroke-width="9" opacity="0.9"/>
      <path d="M584 412 C680 472 808 456 888 368" stroke="${palette.ink}" stroke-width="7" opacity="0.45"/>
    </g>`
  }
  return `<g ${common} fill="none">
    <path d="M608 118 L836 190 L780 398 L552 398 L496 190 Z" fill="${palette.surface}" stroke="${palette.accent}" stroke-width="12"/>
    <circle cx="666" cy="264" r="74" stroke="${palette.warm}" stroke-width="10"/>
    <path d="M616 264 H716 M666 214 V314" stroke="${palette.ink}" stroke-width="10"/>
  </g>`
}

function lessonCover(lesson, index) {
  const palette = palettes[(index - 1) % palettes.length]
  const title = coverTitle(lesson.title)
  const lines = splitTitle(title)
  const type = motifType(lesson.title)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <radialGradient id="glow" cx="78%" cy="30%" r="60%">
      <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.48"/>
      <stop offset="0.46" stop-color="${palette.accent}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${palette.bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="base" x1="0" x2="1">
      <stop offset="0" stop-color="${palette.bg}"/>
      <stop offset="1" stop-color="#05070a"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" rx="40" fill="url(#base)"/>
  <rect width="960" height="540" rx="40" fill="url(#glow)"/>
  <g opacity="0.11" stroke="${palette.ink}" stroke-width="1">
    ${Array.from({ length: 8 }, (_, i) => `<line x1="${522 + i * 54}" y1="72" x2="${522 + i * 54}" y2="456"/>`).join('')}
    ${Array.from({ length: 6 }, (_, i) => `<line x1="496" y1="${104 + i * 58}" x2="894" y2="${104 + i * 58}"/>`).join('')}
  </g>
  ${motifSvg(type, palette)}
  <g font-family="Inter, Arial, sans-serif">
    ${lines.map((line, lineIndex) => `<text x="72" y="${240 + lineIndex * 76}" fill="${palette.ink}" font-size="72" font-weight="950" letter-spacing="-1">${escapeXml(line)}</text>`).join('')}
    <rect x="76" y="${292 + (lines.length - 1) * 76}" width="136" height="8" rx="4" fill="${palette.accent}"/>
  </g>
</svg>`
}

function courseCover() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="IB MYP G6 Mathematics">
  <defs>
    <radialGradient id="a" cx="74%" cy="34%" r="58%"><stop offset="0" stop-color="#38bdf8" stop-opacity="0.52"/><stop offset="0.46" stop-color="#8b5cf6" stop-opacity="0.18"/><stop offset="1" stop-color="#050505" stop-opacity="0"/></radialGradient>
    <linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#06111f"/><stop offset="1" stop-color="#050505"/></linearGradient>
  </defs>
  <rect width="1200" height="675" rx="48" fill="url(#b)"/>
  <rect width="1200" height="675" rx="48" fill="url(#a)"/>
  <g opacity="0.1" stroke="#eaf6ff">${Array.from({ length: 10 }, (_, i) => `<line x1="${620 + i * 54}" y1="100" x2="${620 + i * 54}" y2="560"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<line x1="590" y1="${128 + i * 62}" x2="1100" y2="${128 + i * 62}"/>`).join('')}</g>
  <g fill="none" stroke-linejoin="round">
    <polygon points="720,174 930,104 1042,184 830,262" fill="#102842" stroke="#38bdf8" stroke-width="11"/>
    <polygon points="830,262 1042,184 1042,420 830,502" fill="#0b1b2d" stroke="#f8d66d" stroke-width="11"/>
    <polygon points="720,174 830,262 830,502 720,398" fill="#122a43" stroke="#eaf6ff" stroke-width="6" opacity="0.82"/>
    <circle cx="822" cy="340" r="90" stroke="#38bdf8" stroke-width="10"/>
    <path d="M772 340 H872 M822 290 V390" stroke="#f8d66d" stroke-width="12" stroke-linecap="round"/>
  </g>
  <g font-family="Inter, Arial, sans-serif">
    <text x="86" y="280" fill="white" font-size="106" font-weight="950" letter-spacing="-2">IB MYP G6</text>
    <text x="86" y="388" fill="white" font-size="106" font-weight="950" letter-spacing="-2">Mathematics</text>
    <rect x="92" y="452" width="168" height="10" rx="5" fill="#38bdf8"/>
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
  console.log(`Wrote ${course.lessons.length} simplified lesson covers to ${outputDir}`)
  console.log(`Wrote ${courseCoverPath}`)
}

main()
