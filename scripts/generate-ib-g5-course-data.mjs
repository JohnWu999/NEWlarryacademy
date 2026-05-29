import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sourceRoot = '/Users/johnwu/Documents/自动视频剪辑项目/output'
const scriptsPath = path.join(sourceRoot, 'ib_pyp_g5_scripts/ib_pyp_g5_lessons_01_20_scripts.json')
const outputPath = path.join(projectRoot, 'data/ib-pyp-g5-course.json')

const lessons = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'))

const topicHints = [
  'model first, then calculate',
  'place value and powers of ten',
  'integers on a number line',
  'estimation and reasonableness',
  'order of operations',
  'factors and multiples',
  'equivalent fractions',
  'unlike denominators',
  'multiplying fractions',
  'dividing fractions',
  'decimal place value',
  'decimal operations',
  'unit rates',
  'fractions, decimals, and percents',
  'data and averages',
  'patterns and sequences',
  'variables and equations',
  'coordinate graphs',
  'area and volume',
  'data and probability projects',
]

function cleanText(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .trim()
}

function pickVideoFile(episode) {
  const ep = String(episode).padStart(2, '0')
  const dir = path.join(sourceRoot, `ib_pyp_g5_ep${ep}`)
  return fs.readdirSync(dir).find((file) => file.endsWith('.mp4')) || null
}

function durationFor(lesson) {
  const total = lesson.segments.reduce((sum, segment) => sum + (Number(segment.duration) || 0), 0)
  return Math.max(60, Math.round(total))
}

function choiceQuestion(id, prompt, correct, distractors, points, penalty, hint, explanation) {
  const choices = [correct, ...distractors].slice(0, 4)
  return {
    id,
    type: 'multiple-choice',
    prompt: cleanText(prompt),
    choices: choices.map(cleanText),
    answer: cleanText(correct),
    points,
    penalty,
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'choice-burst',
    encouragement: {
      correct: 'Nice. You used the mathematician move, not just the calculator move.',
      incorrect: 'Good attempt. Slow the story down and rebuild the model one step at a time.',
    },
  }
}

function trueFalseQuestion(id, prompt, answer, points, penalty, hint, explanation) {
  return {
    id,
    type: 'true-false',
    prompt: cleanText(prompt),
    choices: ['True', 'False'],
    answer: answer ? 'True' : 'False',
    points,
    penalty,
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'logic-switch',
    encouragement: {
      correct: 'Yes. That judgment is exactly how strong students check their work.',
      incorrect: 'Almost. Try asking whether the units and meaning still match.',
    },
  }
}

function numericQuestion(id, prompt, answer, points, penalty, hint, explanation, unit = '') {
  return {
    id,
    type: 'numeric-input',
    prompt: cleanText(prompt),
    choices: [],
    answer: cleanText(answer),
    points,
    penalty,
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'math-pad',
    inputPlaceholder: unit ? `Type the number in ${unit}` : 'Type the number',
    unit: cleanText(unit),
    encouragement: {
      correct: 'Boom. You calculated it yourself instead of recognizing a button.',
      incorrect: 'Good try. Rebuild the operation slowly, then check the place value.',
    },
  }
}

function fillBlankQuestion(id, prompt, answer, points, penalty, hint, explanation) {
  return {
    id,
    type: 'fill-blank',
    prompt: cleanText(prompt),
    choices: [],
    answer: cleanText(answer),
    points,
    penalty,
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'blank-card',
    inputPlaceholder: 'Fill in the missing math word or value',
    encouragement: {
      correct: 'Yes. You filled the missing piece like a real problem solver.',
      incorrect: 'Close. Look at what the sentence is asking the blank to represent.',
    },
  }
}

function orderQuestion(id, prompt, steps, points, penalty, hint, explanation) {
  return {
    id,
    type: 'order-steps',
    prompt: cleanText(prompt),
    choices: steps.map(cleanText).sort(),
    answer: steps.map(cleanText),
    points,
    penalty,
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'step-ladder',
    encouragement: {
      correct: 'Great sequencing. You made the invisible thinking visible.',
      incorrect: 'The pieces are there. Put the model before the symbols, then check the result.',
    },
  }
}

function numericFromAudit(auditLine) {
  const match = auditLine.match(/=\s*(-?\d+(?:\.\d+)?)/)
  return match ? match[1] : null
}

function buildQuestions(lesson) {
  const episode = lesson.episode
  const ep = String(episode).padStart(2, '0')
  const topic = topicHints[episode - 1] || 'grade 5 math reasoning'
  const firstClaim = lesson.segments.find((segment) => segment.claim)?.claim || lesson.title
  const storyClaim = lesson.segments.find((segment) => segment.scene !== 'title' && segment.claim)?.claim || firstClaim
  const audit = lesson.math_audit.map(cleanText).filter(Boolean)
  const points = [6, 7, 8, 8, 10, 11, 12, 13, 14, 15]
  const penalties = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6]
  const questions = [
    choiceQuestion(
      `${ep}-q01`,
      `What is the best first move in "${lesson.title}"?`,
      'Build a model, name the quantities, then write the equation.',
      ['Start with the biggest number and calculate right away.', 'Guess a rule after seeing the answer.', 'Memorize one shortcut and skip the story.'],
      points[0],
      penalties[0],
      'Larry lessons usually begin by turning the situation into a visible model.',
      `${lesson.title} focuses on ${topic}. The model helps the equation make sense.`
    ),
    trueFalseQuestion(
      `${ep}-q02`,
      `A strong Grade 5 solution should explain why the answer makes sense, not only show a final number.`,
      true,
      points[1],
      penalties[1],
      'Think about the IB habit: construct meaning, transfer to symbols, then apply.',
      cleanText(firstClaim)
    ),
    orderQuestion(
      `${ep}-q03`,
      `Put the problem-solving moves in a powerful order for this lesson.`,
      ['Read the situation', 'Draw or organize the model', 'Write the equation', 'Check reasonableness'],
      points[2],
      penalties[2],
      'A check comes after you have a result to test.',
      'This path keeps meaning, symbols, and checking connected.'
    ),
  ]

  audit.slice(0, 4).forEach((line, index) => {
    const answer = numericFromAudit(line)
    if (answer) {
      if (index % 2 === 0) {
        questions.push(numericQuestion(
          `${ep}-q${String(questions.length + 1).padStart(2, '0')}`,
          `Type the missing result: ${line.replace(/=\s*-?\d+(?:\.\d+)?\.?/, '= ___')}`,
          answer,
          points[questions.length],
          penalties[questions.length],
          'Write the operation on your scratch pad before typing.',
          line
        ))
      } else {
        questions.push(fillBlankQuestion(
          `${ep}-q${String(questions.length + 1).padStart(2, '0')}`,
          `Complete the math sentence: ${line.replace(/=\s*-?\d+(?:\.\d+)?\.?/, '= ___')}`,
          answer,
          points[questions.length],
          penalties[questions.length],
          'The blank is the result of the operation just before it.',
          line
        ))
      }
    } else {
      questions.push(trueFalseQuestion(
        `${ep}-q${String(questions.length + 1).padStart(2, '0')}`,
        line,
        !/incorrect|mixes|wrong/i.test(line),
        points[questions.length],
        penalties[questions.length],
        'Look for words like incorrect, mixes, or unreasonable.',
        line
      ))
    }
  })

  while (questions.length < 10) {
    const idx = questions.length
    const segment = lesson.segments[idx % lesson.segments.length]
    const claim = cleanText(segment.claim || storyClaim)
    if (idx % 4 === 1) {
      questions.push(fillBlankQuestion(
        `${ep}-q${String(idx + 1).padStart(2, '0')}`,
        `Fill in the missing strategy word: A strong solution should explain the ___ before the symbols.`,
        'relationship',
        points[idx],
        penalties[idx],
        'What connects the story to the equation?',
        cleanText(segment.narration || claim).slice(0, 260)
      ))
    } else {
      questions.push(choiceQuestion(
        `${ep}-q${String(idx + 1).padStart(2, '0')}`,
        `Which student move best matches this idea: ${claim}`,
        'Explain the relationship in words, then connect it to symbols.',
        ['Copy the final answer without the relationship.', 'Use a random operation because it looks familiar.', 'Ignore the units and compare only digits.'],
        points[idx],
        penalties[idx],
        'Find the relationship hiding inside the sentence.',
        cleanText(segment.narration || claim).slice(0, 260)
      ))
    }
  }

  return questions.slice(0, 10)
}

const course = {
  id: 'course-ib-pyp-g5-math',
  title: 'IB Big Math G5: 20-Level Math Quest',
  description:
    'A complete Grade 5 IB PYP math path with 20 Larry-style video lessons, concept checks, and game-like practice that rewards clear reasoning, brave mistakes, and steady improvement.',
  category: 'ib-big-math',
  courseTrack: 'ib-big-math',
  status: 'active',
  accessLevel: 'registered',
  isFree: false,
  price: 399,
  difficultyLevel: 'Intermediate',
  gradeLevel: 'G5',
  difficulty: 'Medium',
  videoProvider: 'tencent-vod',
  lessons: lessons.map((lesson) => {
    const ep = String(lesson.episode).padStart(2, '0')
    const description = cleanText(lesson.segments.find((segment) => segment.scene !== 'title')?.narration || lesson.segments[0]?.narration || '')
    const questions = buildQuestions(lesson)
    const maxScore = questions.reduce((sum, question) => sum + question.points, 0)
    return {
      id: `lesson-ib-pyp-g5-ep${ep}`,
      episode: lesson.episode,
      title: `IB G5 Level ${ep} | ${lesson.title}`,
      shortTitle: lesson.title,
      description,
      order: lesson.episode,
      duration: durationFor(lesson),
      gradeLevel: 'G5',
      difficulty: lesson.episode <= 6 ? 'Easy' : lesson.episode <= 14 ? 'Medium' : 'Hard',
      videoProvider: 'tencent-vod',
      videoFileName: pickVideoFile(lesson.episode),
      isPreview: lesson.episode === 1,
      hasPractice: true,
      hasGame: lesson.episode % 4 === 0,
      rewardsPoints: maxScore,
      rewardsGems: lesson.episode % 5 === 0 ? 2 : 1,
      ibAlignment: lesson.ib_alignment.map(cleanText),
      mathAudit: auditToShortList(lesson.math_audit),
      practice: {
        version: 1,
        mode: 'quest',
        title: `${lesson.title} Practice Quest`,
        maxScore,
        passingScore: 70,
        soundPack: 'spark',
        rewards: {
          gemsOnPass: lesson.episode % 5 === 0 ? 2 : 1,
          gemsOnPerfect: 2,
          streakBonus: 5,
        },
        reviewAdvice: {
          rewatchMessage: `If any question felt shaky, rewatch "${lesson.title}" and pause when Larry builds the first model.`,
          focus: topicHints[lesson.episode - 1] || lesson.title,
        },
        questions,
      },
    }
  }),
}

function auditToShortList(audit) {
  return audit.map(cleanText).slice(0, 6)
}

fs.writeFileSync(outputPath, `${JSON.stringify(course, null, 2)}\n`)
console.log(`Wrote ${outputPath}`)
