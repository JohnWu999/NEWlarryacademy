import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sourceRoot = '/Users/johnwu/Documents/自动视频剪辑项目/output/IB_MYP_G6_Math'
const bankPath = path.join(sourceRoot, 'IB_MYP_G6_Math_40_Lesson_Exercise_Bank.json')
const courseOutputPath = path.join(projectRoot, 'data/ib-myp-g6-course.json')
const bankCopyPath = path.join(projectRoot, 'data/ib-myp-g6-exercise-bank.json')
const visualRoot = path.join(projectRoot, 'public/practice-visuals/ib-myp-g6')

const visualTypes = new Set([
  'algebra_tiles',
  'angle_diagram',
  'area_model',
  'balance_scale',
  'bar_model',
  'circle_diagram',
  'composite_area',
  'coordinate_grid',
  'cylinder',
  'dot_plot',
  'double_number_line',
  'fraction_bar',
  'hundred_grid',
  'net',
  'number_line',
  'prism',
  'quadrilateral_diagram',
  'rotation_diagram',
  'stacked_fraction',
  'symmetry_diagram',
  'tape_diagram',
  'tessellation',
  'triangle_diagram',
])

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function cleanText(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .trim()
}

function slugify(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 56)
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalize(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\times/g, 'x')
    .replace(/\\div/g, '÷')
    .replace(/[.$]/g, '')
    .replace(/,/g, '')
}

function extractNumbers(value = '') {
  return String(value)
    .match(/-?\d[\d,]*(?:\.\d+)?%?/g)
    ?.map((item) => item.replace(/,/g, ''))
    .slice(0, 8) || []
}

function tokenize(value = '') {
  return normalize(value)
    .replace(/[^a-z0-9/%.-]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1)
}

function pickChoiceAnswer(exercise) {
  const choices = (exercise.choices || []).map(cleanText).filter(Boolean)
  if (!choices.length) return cleanText(exercise.answer)

  const index = exercise.grading?.correct_choice_index
  if (Number.isInteger(index) && choices[index]) return choices[index]

  const answer = cleanText(exercise.answer)
  const normalizedAnswer = normalize(answer)
  const exact = choices.find((choice) => normalize(choice) === normalizedAnswer)
  if (exact) return exact

  const contained = choices.find((choice) => {
    const normalizedChoice = normalize(choice)
    return normalizedAnswer.includes(normalizedChoice) || normalizedChoice.includes(normalizedAnswer)
  })
  if (contained) return contained

  const answerTokens = new Set(tokenize(answer))
  let best = choices[0]
  let bestScore = -1
  for (const choice of choices) {
    const choiceTokens = tokenize(choice)
    const hits = choiceTokens.filter((token) => answerTokens.has(token)).length
    const score = hits / Math.max(1, Math.max(choiceTokens.length, answerTokens.size))
    if (score > bestScore) {
      best = choice
      bestScore = score
    }
  }

  return best
}

function keywordsFromExercise(exercise) {
  const source = [
    ...(exercise.grading?.required_concepts || []),
    ...(exercise.tags || []),
    cleanText(exercise.answer),
  ].join(' ')
  const stop = new Set(['possible', 'answers', 'answer', 'using', 'with', 'from', 'that', 'this', 'into', 'only', 'show', 'shows', 'because'])
  const keywords = []
  for (const token of tokenize(source)) {
    if (token.length < 3 || stop.has(token) || keywords.includes(token)) continue
    keywords.push(token)
    if (keywords.length >= 8) break
  }
  return keywords
}

function encourage(value = '') {
  const text = cleanText(value || 'Rebuild the model and try the next step.')
  if (/^(good effort|great work|nice|keep going|almost|you are close)\b/i.test(text)) return text
  return `Good effort. ${text.replace(/^[A-Z]/, (letter) => letter.toLowerCase())}`
}

function questionType(exercise) {
  if (exercise.type === 'select_one') return 'multiple-choice'
  if (exercise.type === 'numeric') return 'numeric-input'
  if (exercise.type === 'short_answer') {
    const answer = normalize(exercise.answer)
    if (/^-?\d+(\.\d+)?(%|\/\d+)?$/.test(answer)) return 'fill-blank'
    return 'open-response'
  }
  return 'open-response'
}

function pointValue(difficulty = 1) {
  if (difficulty >= 5) return 9
  if (difficulty >= 4) return 8
  if (difficulty >= 3) return 7
  if (difficulty >= 2) return 6
  return 5
}

function penaltyValue(difficulty = 1) {
  return Math.min(3, Math.max(1, Math.ceil(difficulty / 2)))
}

function splitTitle(text, max = 36) {
  const words = cleanText(text).split(' ')
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
  return lines.slice(0, 2)
}

function svgShell(title, body, accent = '#0f766e') {
  const titleLines = splitTitle(title)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="360" viewBox="0 0 760 360" role="img" aria-label="${escapeXml(title)}">
  <rect width="760" height="360" rx="28" fill="#fffdf8"/>
  <rect x="18" y="18" width="724" height="324" rx="24" fill="#f8fafc" stroke="#e5dccd" stroke-width="3"/>
  <g font-family="Inter, Arial, sans-serif">
    ${titleLines.map((line, index) => `<text x="44" y="${52 + index * 28}" fill="#111827" font-size="24" font-weight="800">${escapeXml(line)}</text>`).join('')}
    <rect x="44" y="98" width="120" height="6" rx="3" fill="${accent}"/>
  </g>
  ${body}
</svg>`
}

function numberLineSvg(exercise) {
  const nums = extractNumbers(exercise.prompt)
  const labels = nums.length ? nums.slice(0, 5) : ['-4', '0', '3']
  const marks = labels.map((label, index) => {
    const x = 110 + index * Math.min(130, 540 / Math.max(1, labels.length - 1))
    return `<line x1="${x}" y1="212" x2="${x}" y2="236" stroke="#111827" stroke-width="4"/>
      <circle cx="${x}" cy="212" r="11" fill="${index % 2 ? '#0f766e' : '#2563eb'}"/>
      <text x="${x}" y="272" text-anchor="middle" font-size="24" font-weight="800" fill="#374151">${escapeXml(label)}</text>`
  }).join('')
  return svgShell('Number line model', `<g font-family="Inter, Arial, sans-serif">
    <line x1="84" y1="212" x2="680" y2="212" stroke="#111827" stroke-width="5"/>
    ${marks}
    <path d="M110 174 H300" stroke="#2563eb" stroke-width="5" fill="none" marker-end="url(#arrow)"/>
    <path d="M320 154 H560" stroke="#0f766e" stroke-width="5" fill="none" marker-end="url(#arrow2)"/>
    <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#2563eb"/></marker><marker id="arrow2" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#0f766e"/></marker></defs>
  </g>`, '#2563eb')
}

function coordinateSvg(exercise) {
  const points = extractNumbers(exercise.prompt).slice(0, 6)
  const labels = points.length >= 2 ? points : ['2', '3', '-1', '4']
  const dots = []
  for (let i = 0; i < labels.length; i += 2) {
    const xVal = Number(labels[i]) || i
    const yVal = Number(labels[i + 1]) || i + 1
    const x = 380 + xVal * 28
    const y = 212 - yVal * 22
    dots.push(`<circle cx="${x}" cy="${y}" r="12" fill="${i % 4 ? '#0f766e' : '#dc2626'}" stroke="#111827" stroke-width="3"/>
      <text x="${x + 18}" y="${y - 14}" font-size="18" font-weight="800" fill="#111827">(${escapeXml(xVal)}, ${escapeXml(yVal)})</text>`)
  }
  return svgShell('Coordinate grid', `<g font-family="Inter, Arial, sans-serif">
    ${Array.from({ length: 11 }, (_, i) => `<line x1="${100 + i * 56}" y1="128" x2="${100 + i * 56}" y2="300" stroke="#e5e7eb" stroke-width="2"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="100" y1="${128 + i * 28}" x2="660" y2="${128 + i * 28}" stroke="#e5e7eb" stroke-width="2"/>`).join('')}
    <line x1="100" y1="212" x2="660" y2="212" stroke="#111827" stroke-width="4"/>
    <line x1="380" y1="128" x2="380" y2="300" stroke="#111827" stroke-width="4"/>
    <text x="668" y="218" font-size="20" font-weight="800" fill="#111827">x</text>
    <text x="388" y="124" font-size="20" font-weight="800" fill="#111827">y</text>
    ${dots.join('')}
  </g>`, '#0f766e')
}

function fractionSvg(exercise) {
  const pieces = 8
  return svgShell('Fraction visual model', `<g font-family="Inter, Arial, sans-serif">
    ${Array.from({ length: pieces }, (_, i) => `<rect x="${118 + i * 62}" y="154" width="58" height="70" rx="8" fill="${i < 3 ? '#dbeafe' : '#fff'}" stroke="#2563eb" stroke-width="3"/>`).join('')}
    ${Array.from({ length: pieces }, (_, i) => `<rect x="${118 + i * 62}" y="246" width="58" height="54" rx="8" fill="${i < 5 ? '#dcfce7' : '#fff'}" stroke="#0f766e" stroke-width="3"/>`).join('')}
    <text x="382" y="138" text-anchor="middle" font-size="22" font-weight="800" fill="#2563eb">same-size pieces</text>
    <text x="382" y="332" text-anchor="middle" font-size="22" font-weight="800" fill="#0f766e">combine or compare the shaded parts</text>
  </g>`, '#2563eb')
}

function areaSvg(exercise) {
  const nums = extractNumbers(exercise.prompt)
  const a = nums[0] || 'length'
  const b = nums[1] || 'width'
  return svgShell('Area and shape model', `<g font-family="Inter, Arial, sans-serif">
    <rect x="150" y="145" width="250" height="128" fill="#dbeafe" stroke="#2563eb" stroke-width="5"/>
    <rect x="400" y="145" width="130" height="128" fill="#dcfce7" stroke="#0f766e" stroke-width="5"/>
    <text x="275" y="132" text-anchor="middle" font-size="22" font-weight="800" fill="#2563eb">${escapeXml(a)}</text>
    <text x="465" y="132" text-anchor="middle" font-size="22" font-weight="800" fill="#0f766e">${escapeXml(b)}</text>
    <text x="340" y="306" text-anchor="middle" font-size="24" font-weight="800" fill="#111827">split complex shapes into rectangles</text>
  </g>`, '#2563eb')
}

function balanceSvg(exercise) {
  return svgShell('Equation balance', `<g font-family="Inter, Arial, sans-serif">
    <line x1="380" y1="130" x2="380" y2="285" stroke="#111827" stroke-width="6"/>
    <line x1="190" y1="168" x2="570" y2="168" stroke="#111827" stroke-width="6"/>
    <path d="M218 168 L160 260 H276z" fill="#dbeafe" stroke="#2563eb" stroke-width="4"/>
    <path d="M542 168 L484 260 H600z" fill="#dcfce7" stroke="#0f766e" stroke-width="4"/>
    <text x="218" y="238" text-anchor="middle" font-size="30" font-weight="900" fill="#2563eb">x</text>
    <text x="542" y="238" text-anchor="middle" font-size="30" font-weight="900" fill="#0f766e">value</text>
    <text x="380" y="318" text-anchor="middle" font-size="22" font-weight="800" fill="#111827">do the same operation to both sides</text>
  </g>`, '#0f766e')
}

function geometrySvg(exercise) {
  const visual = exercise.recommended_visual || ''
  if (visual.includes('circle') || visual.includes('cylinder')) {
    return svgShell('Circle geometry', `<g font-family="Inter, Arial, sans-serif">
      <circle cx="330" cy="210" r="84" fill="#fef3c7" stroke="#d97706" stroke-width="5"/>
      <line x1="330" y1="210" x2="414" y2="210" stroke="#dc2626" stroke-width="5"/>
      <path d="M246 210 A84 84 0 1 0 414 210" fill="none" stroke="#2563eb" stroke-width="5"/>
      <text x="375" y="198" font-size="21" font-weight="800" fill="#dc2626">radius</text>
      <text x="330" y="322" text-anchor="middle" font-size="22" font-weight="800" fill="#111827">separate radius, diameter, circumference, and area</text>
    </g>`, '#d97706')
  }
  if (visual.includes('angle') || visual.includes('rotation')) {
    return svgShell('Angle model', `<g font-family="Inter, Arial, sans-serif">
      <line x1="230" y1="255" x2="540" y2="255" stroke="#111827" stroke-width="6"/>
      <line x1="230" y1="255" x2="466" y2="136" stroke="#111827" stroke-width="6"/>
      <path d="M292 255 A62 62 0 0 1 286 227" fill="none" stroke="#dc2626" stroke-width="7"/>
      <text x="330" y="222" font-size="26" font-weight="900" fill="#dc2626">angle</text>
      <text x="384" y="312" text-anchor="middle" font-size="22" font-weight="800" fill="#111827">measure the turn between two rays</text>
    </g>`, '#dc2626')
  }
  return svgShell('Geometry model', `<g font-family="Inter, Arial, sans-serif">
    <polygon points="190,270 340,128 520,270" fill="#dbeafe" stroke="#2563eb" stroke-width="5"/>
    <line x1="340" y1="128" x2="340" y2="270" stroke="#dc2626" stroke-width="4" stroke-dasharray="10 8"/>
    <text x="354" y="208" font-size="22" font-weight="900" fill="#dc2626">height</text>
    <text x="355" y="315" text-anchor="middle" font-size="22" font-weight="800" fill="#111827">label dimensions before choosing a formula</text>
  </g>`, '#2563eb')
}

function dataSvg(exercise) {
  return svgShell('Data display', `<g font-family="Inter, Arial, sans-serif">
    <line x1="150" y1="286" x2="620" y2="286" stroke="#111827" stroke-width="5"/>
    <line x1="150" y1="130" x2="150" y2="286" stroke="#111827" stroke-width="5"/>
    ${[52, 84, 120, 68, 106].map((height, index) => `<rect x="${205 + index * 76}" y="${286 - height}" width="42" height="${height}" fill="${index % 2 ? '#dcfce7' : '#dbeafe'}" stroke="${index % 2 ? '#0f766e' : '#2563eb'}" stroke-width="4"/>`).join('')}
    <text x="382" y="324" text-anchor="middle" font-size="22" font-weight="800" fill="#111827">read the scale, then compare the values</text>
  </g>`, '#7c3aed')
}

function solidSvg(exercise) {
  return svgShell('3D measurement model', `<g font-family="Inter, Arial, sans-serif">
    <polygon points="250,158 430,158 510,218 330,218" fill="#e0f2fe" stroke="#2563eb" stroke-width="4"/>
    <polygon points="330,218 510,218 510,294 330,294" fill="#bfdbfe" stroke="#2563eb" stroke-width="4"/>
    <polygon points="250,158 330,218 330,294 250,232" fill="#dbeafe" stroke="#2563eb" stroke-width="4"/>
    <text x="380" y="136" text-anchor="middle" font-size="22" font-weight="800" fill="#111827">length × width × height</text>
    <text x="380" y="326" text-anchor="middle" font-size="22" font-weight="800" fill="#111827">volume counts unit cubes inside</text>
  </g>`, '#2563eb')
}

function makeSvg(exercise) {
  const visual = exercise.recommended_visual || ''
  if (visual.includes('number_line') || visual.includes('double_number_line')) return numberLineSvg(exercise)
  if (visual.includes('coordinate')) return coordinateSvg(exercise)
  if (visual.includes('fraction') || visual.includes('hundred_grid')) return fractionSvg(exercise)
  if (visual.includes('area') || visual.includes('tape') || visual.includes('bar_model')) return areaSvg(exercise)
  if (visual.includes('balance') || visual.includes('algebra')) return balanceSvg(exercise)
  if (visual.includes('dot_plot')) return dataSvg(exercise)
  if (visual.includes('prism') || visual.includes('net') || visual.includes('cylinder')) return solidSvg(exercise)
  if (visual.includes('diagram') || visual.includes('symmetry') || visual.includes('tessellation')) return geometrySvg(exercise)
  return null
}

function convertExercise(exercise) {
  const type = questionType(exercise)
  const difficulty = Number(exercise.difficulty || 1)
  const points = pointValue(difficulty)
  const keywords = keywordsFromExercise(exercise)
  const base = {
    id: exercise.id,
    type,
    prompt: cleanText(exercise.prompt),
    choices: [],
    answer: cleanText(exercise.answer),
    alternativeAnswers: (exercise.grading?.accepted_answers || []).map(cleanText).filter(Boolean),
    acceptableKeywords: keywords,
    points,
    penalty: penaltyValue(difficulty),
    hint: encourage(exercise.student_feedback || exercise.explanation || 'Rebuild the model and try the next step.'),
    explanation: encourage(exercise.explanation || exercise.student_feedback || 'Look for the structure first, then try again.'),
    visual: exercise.recommended_visual || '',
    inputPlaceholder: type === 'open-response' ? 'Write one precise sentence using the math words in the problem.' : 'Type your answer',
    grading: {
      mode: exercise.grading?.mode || 'auto_assisted',
      validator: exercise.grading?.validator || 'keyword_match',
      accepted_answers: (exercise.grading?.accepted_answers || []).map(cleanText).filter(Boolean),
      required_concepts: keywords,
      tolerance: exercise.grading?.tolerance ?? 0.0001,
      show_answer_on_wrong: false,
      show_answer_after_mastery: true,
    },
    sourceType: exercise.type,
    stage: exercise.stage,
    difficulty,
    tags: exercise.tags || [],
    encouragement: {
      correct: 'Great work. You used the structure, not just a guess.',
      incorrect: encourage(exercise.student_feedback || exercise.explanation || 'Use the hint to rebuild the model and try the next question.'),
    },
  }

  if (type === 'multiple-choice') {
    const choices = (exercise.choices || []).map(cleanText).filter(Boolean)
    base.choices = choices
    base.answer = pickChoiceAnswer(exercise)
    base.alternativeAnswers = Array.from(new Set([base.answer, cleanText(exercise.answer), ...base.alternativeAnswers])).filter(Boolean)
  }

  if (type === 'numeric-input') {
    base.choices = []
    base.tolerance = exercise.grading?.tolerance ?? 0.0001
    base.inputPlaceholder = 'Type the number'
  }

  if (type === 'fill-blank') {
    base.choices = []
    base.inputPlaceholder = 'Type the missing value or term'
  }

  if (type === 'open-response') {
    base.choices = []
    base.answerPreview = 'Use the hint to revise your explanation, then compare after mastery.'
  }

  return base
}

function manifestDuration(episode) {
  const ep = String(episode).padStart(2, '0')
  const manifestPath = path.join(sourceRoot, `ib_myp_g6_ep${ep}`, `ib_myp_g6_ep${ep}_manifest.json`)
  if (!fs.existsSync(manifestPath)) return 600
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  return Math.max(300, Math.round(Number(manifest.duration_gate?.estimated_total_sec_before_tts || manifest.total_duration_seconds || 600)))
}

function convertLesson(lesson) {
  const ep = String(lesson.episode).padStart(2, '0')
  const lessonId = `lesson-ib-myp-g6-${ep}-${slugify(lesson.title)}`
  const questions = lesson.exercises.map(convertExercise)

  for (const question of questions) {
    const original = lesson.exercises.find((item) => item.id === question.id)
    if (!original?.recommended_visual || !visualTypes.has(original.recommended_visual)) continue
    const svg = makeSvg(original)
    if (!svg) continue
    const fileName = `${question.id.toLowerCase()}.svg`
    const filePath = path.join(visualRoot, fileName)
    fs.writeFileSync(filePath, svg)
    question.visualAsset = `/practice-visuals/ib-myp-g6/${fileName}`
    question.visualCaption = cleanText(`${original.recommended_visual.replace(/_/g, ' ')} for ${lesson.title}`)
  }

  const maxScore = questions.reduce((sum, question) => sum + Number(question.points || 0), 0)
  return {
    id: lessonId,
    title: `IB MYP G6 Math ${lesson.episode}: ${cleanText(lesson.title)}`,
    description: `${cleanText(lesson.branch)}. Practice focuses on visible models, precise reasoning, and MYP-level application.`,
    order: lesson.episode,
    duration: manifestDuration(lesson.episode),
    gradeLevel: 'G6',
    difficulty: lesson.episode <= 12 ? 'Medium' : lesson.episode <= 30 ? 'Hard' : 'Hard',
    videoProvider: 'tencent-vod',
    isPreview: lesson.episode <= 3,
    hasPractice: true,
    hasGame: false,
    rewardsPoints: maxScore,
    rewardsGems: 2,
    videoFileName: `IB_MYP_G6_Ep${ep}.mp4`,
    practice: {
      title: `Lesson ${lesson.episode} Mastery Quest`,
      maxScore,
      passingScore: Math.ceil(maxScore * 0.75),
      rewards: { gemsOnPass: 1, gemsOnPerfect: 2, streakBonus: 5 },
      reviewAdvice: {
        rewatchMessage: 'Rewatch the concept build and focus on the model before the symbols.',
        focus: 'Draw the representation, label the quantities, then compute or explain.',
      },
      questions,
    },
  }
}

function main() {
  if (!fs.existsSync(bankPath)) throw new Error(`Missing exercise bank: ${bankPath}`)
  ensureDir(visualRoot)
  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'))
  fs.writeFileSync(bankCopyPath, JSON.stringify(bank, null, 2))

  const lessons = bank.lessons.map(convertLesson)
  const course = {
    id: 'course-ib-big-math',
    title: 'IB MYP Grade 6 Mathematics',
    description: 'A 40-lesson MYP Year 1 mathematics course with concept-first videos, visual models, 800 adaptive practice questions, hints, wrong-question review, and mastery rewards.',
    category: 'Mathematics',
    courseTrack: 'ib-big-math',
    status: 'active',
    accessLevel: 'paid',
    isFree: false,
    price: 29,
    thumbnailUrl: '/course-covers/ib-g6-myp-cover.svg',
    difficultyLevel: 'advanced',
    gradeLevel: 'G6',
    difficulty: 'Hard',
    videoProvider: 'tencent-vod',
    expectedFeatures: [
      '40 IB MYP Year 1 math lessons',
      '800 programmatically gradable practice questions',
      'SVG visual models for geometry, fractions, coordinate grids, data, and algebra',
      'Hint-first wrong answer feedback and wrong-question book integration',
      'Points, gems, streak rewards, and mastery review flow',
    ],
    lessons,
  }

  fs.writeFileSync(courseOutputPath, JSON.stringify(course, null, 2))
  const visualCount = lessons.reduce((sum, lesson) => sum + lesson.practice.questions.filter((question) => question.visualAsset).length, 0)
  console.log(`Wrote ${courseOutputPath}`)
  console.log(`Lessons: ${lessons.length}`)
  console.log(`Questions: ${lessons.reduce((sum, lesson) => sum + lesson.practice.questions.length, 0)}`)
  console.log(`SVG visuals: ${visualCount}`)
}

main()
