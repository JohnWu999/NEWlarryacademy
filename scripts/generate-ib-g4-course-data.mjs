import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sourceRoot = '/Users/johnwu/Documents/自动视频剪辑项目/output'
const exerciseBankPath = '/Users/johnwu/Documents/自动视频剪辑项目/docs/IB_PYP_G4_Lessons_1_40_Exercise_Bank.json'
const outputPath = path.join(projectRoot, 'data/ib-pyp-g4-course.json')

const episodeTitles = {
  1: 'Place Value to Millions',
  2: 'Rounding and Estimation',
  3: 'Addition and Subtraction with Regrouping',
  4: 'Multiplication as Area, Groups, and Scaling',
  5: 'Division as Sharing, Measuring, and Remainders',
  6: 'Factors, Multiples, Prime, and Composite Numbers',
  7: 'Fractions as Equal Parts, Points, and Division',
  8: 'Equivalent Fractions and Comparing Fractions',
  9: 'Add and Subtract Fractions with Like Denominators',
  10: 'Decimals: Tenths and Hundredths',
  11: 'Compare, Order, and Round Decimals',
  12: 'Metric Measurement and Conversion',
  13: 'Time, Elapsed Time, and Timelines',
  14: 'Perimeter, Area, and Composite Shapes',
  15: 'Angles, Polygons, and Symmetry',
  16: 'Coordinate Grids, Maps, and Transformations',
  17: 'Patterns, Rules, and Input-Output Tables',
  18: 'Data Displays and Interpreting Graphs',
  19: 'Probability, Chance, and Fair Games',
  20: 'Fall Project: Plan, Model, Measure, Explain',
  21: 'Multi-Step Problems and Bar Models',
  22: 'Multiplication with Area Models and Partial Products',
  23: 'Long Division and Remainders',
  24: 'Mixed Numbers and Improper Fractions',
  25: 'Fractions with Related Denominators',
  26: 'Decimal Addition and Subtraction',
  27: 'Decimal Place Value Shifts',
  28: 'Percents, Fractions, and Decimals',
  29: 'Ratios and Scale Drawings',
  30: 'Positive and Negative Numbers',
  31: 'Square Numbers and Exponents',
  32: 'Expressions and Order of Operations',
  33: 'Variables and Simple Equations',
  34: 'Line Graphs and Trends',
  35: 'Data Centers and Spread',
  36: 'Circle Graphs and Percent Stories',
  37: 'Probability Experiments and Fairness',
  38: 'Solids, Nets, and Volume',
  39: 'Coordinate Design and Transformations',
  40: 'Grade 4 Math Exhibition Project',
}

const points = [6, 6, 7, 7, 8, 8, 10, 11, 12, 15]
const penalties = [1, 1, 1, 2, 2, 2, 3, 3, 4, 0]
const bankPoints = [4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 10, 10, 7, 7, 7, 12, 14]
const bankPenalties = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 0, 0]
const exerciseBank = fs.existsSync(exerciseBankPath)
  ? JSON.parse(fs.readFileSync(exerciseBankPath, 'utf8'))
  : null

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').replace(/"/g, "'").trim()
}

function cleanMathText(value = '') {
  return cleanText(value)
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\times/g, 'x')
    .replace(/\\div/g, '÷')
    .replace(/\\Box/g, '□')
    .replace(/\{,\}/g, ',')
    .replace(/\.$/, '')
}

function compactAnswer(value = '') {
  return cleanMathText(value)
    .toLowerCase()
    .replace(/\banswer:\s*/g, '')
    .replace(/\babout\b/g, '')
    .replace(/\bpossible:\s*/g, '')
    .replace(/\bpossible answers:\s*/g, '')
    .replace(/\bopen;\s*/g, '')
    .replace(/[.$]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function unique(values) {
  return [...new Set(values.map(cleanText).filter(Boolean))]
}

function splitAnswerParts(answer = '') {
  const cleaned = cleanMathText(answer)
  if (cleaned.includes(';')) {
    return cleaned
      .split(';')
      .map((part) => part.trim().replace(/\.$/, ''))
      .filter(Boolean)
  }
  return cleaned
    .replace(/\band\b/g, ',')
    .split(/,(?=\s*[-$()\\A-Za-z])/)
    .map((part) => part.trim().replace(/\.$/, ''))
    .filter(Boolean)
}

function answerKeywords(answer = '') {
  return unique(
    cleanMathText(answer)
      .toLowerCase()
      .replace(/[^a-z0-9/%<>.= -]+/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !['possible', 'answer', 'should', 'because', 'there', 'which', 'what', 'with', 'from', 'into', 'than', 'open', 'example'].includes(word))
  ).slice(0, 5)
}

function isTrueFalseExercise(exercise) {
  return /true or false/i.test(exercise.prompt) || /^(true|false)\.?$/i.test(exercise.answer)
}

function isOpenExercise(exercise) {
  const prompt = exercise.prompt.toLowerCase()
  const answer = exercise.answer.toLowerCase()
  return (
    exercise.category === 'Communication' ||
    /^open\b/.test(answer) ||
    /\b(explain|why|describe|draw|create|design|teach|correct|give one|make two|list three|choose a graph)\b/.test(prompt) ||
    exercise.number >= 19
  )
}

function isOrderExercise(exercise) {
  return /\border\b/i.test(exercise.prompt) && splitAnswerParts(exercise.answer).length >= 3
}

function isCompareExercise(exercise) {
  return /___/.test(exercise.prompt) && /[<>＝=]/.test(cleanMathText(exercise.answer))
}

function isNumericExercise(exercise) {
  const answer = compactAnswer(exercise.answer)
  if (/r\d/i.test(answer) || /\/|[a-z]/i.test(answer.replace(/cm|m|ml|in|ft|yd|km|l|x/g, ''))) return false
  return /^-?\$?\d+(?:\.\d+)?%?$/.test(answer.replace(/\s*(tickets|miles|minutes|students|visitors|people|boxes|cookies|pencils|prizes|dollars|cans|books|plants|markers|degrees|units|cm|m|ml|in)\b/g, ''))
}

function answerAlternatives(answer = '') {
  const raw = cleanMathText(answer)
  const compact = compactAnswer(answer)
  const alternatives = [raw, compact]
  const firstNumber = raw.match(/-?\d+(?:,\d{3})*(?:\.\d+)?%?/)
  if (firstNumber) alternatives.push(firstNumber[0], firstNumber[0].replace(/,/g, ''))
  if (/^yes\b/i.test(raw)) alternatives.push('yes')
  if (/^no\b/i.test(raw)) alternatives.push('no')
  if (/^true\b/i.test(raw)) alternatives.push('true')
  if (/^false\b/i.test(raw)) alternatives.push('false')
  if (/city\s+[ab]/i.test(raw)) alternatives.push(raw.match(/city\s+[ab]/i)?.[0] || '')
  if (/prime/i.test(raw)) alternatives.push('prime')
  if (/composite/i.test(raw)) alternatives.push('composite')
  return unique(alternatives)
}

function makeBankQuestion(exercise, lessonTitle) {
  const index = Math.max(0, Number(exercise.number || 1) - 1)
  const answer = cleanText(exercise.answer)
  const base = {
    id: exercise.id,
    prompt: cleanText(exercise.prompt),
    answer: cleanMathText(answer),
    answerPreview: cleanMathText(answer),
    alternativeAnswers: answerAlternatives(answer),
    acceptableKeywords: answerKeywords(answer),
    points: bankPoints[index] || 8,
    penalty: bankPenalties[index] ?? 2,
    hint: `${exercise.category} · ${exercise.difficulty}: build a quick model, then check the units and the meaning.`,
    explanation: `Expected idea: ${cleanMathText(answer)}`,
    sourceCategory: exercise.category,
    difficulty: exercise.difficulty,
    encouragement: {
      correct: index >= 18 ? 'That is championship-level reasoning.' : 'Nice. You solved the math, not just the screen.',
      incorrect: 'Good attempt. This one is saved for review; keep your streak moving.',
    },
  }

  if (isTrueFalseExercise(exercise)) {
    return {
      ...base,
      type: 'true-false',
      choices: ['True', 'False'],
      answer: /^true/i.test(answer) ? 'True' : 'False',
      alternativeAnswers: [/^true/i.test(answer) ? 'true' : 'false'],
      visual: 'truth-lab',
    }
  }

  if (isOrderExercise(exercise)) {
    const steps = splitAnswerParts(answer)
    return {
      ...base,
      type: 'order-steps',
      choices: [...steps].sort(),
      answer: steps,
      alternativeAnswers: [],
      visual: 'sequence-track',
      inputPlaceholder: 'Tap the values in order',
    }
  }

  if (isOpenExercise(exercise)) {
    return {
      ...base,
      type: 'open-response',
      choices: [],
      answer: '',
      visual: exercise.category === 'Communication' ? 'math-talk' : 'strategy-board',
      inputPlaceholder: `Explain your thinking for ${lessonTitle}.`,
      hint: 'Write one or two complete sentences. Use a number, model, unit, or reason from the problem.',
      explanation: 'Open response: we look for a real explanation, model, or reasonable example rather than one exact sentence.',
    }
  }

  if (isCompareExercise(exercise)) {
    const symbol = cleanMathText(answer).match(/[<>=]/)?.[0] || cleanMathText(answer)
    return {
      ...base,
      type: 'multiple-choice',
      choices: ['<', '>', '='],
      answer: symbol,
      alternativeAnswers: [symbol],
      visual: 'compare-scale',
    }
  }

  if (/which .*:|which .*\\?|which .* is|who /i.test(exercise.prompt) || /prime or composite/i.test(exercise.prompt)) {
    const correct = cleanMathText(answer)
    const distractors = /prime|composite/i.test(correct)
      ? ['Prime', 'Composite', 'Neither']
      : /which form/i.test(exercise.prompt)
      ? ['Standard form', 'Word form', 'Expanded form']
      : /yes|no/i.test(correct)
      ? ['Yes', 'No', 'Not enough information']
      : []
    if (distractors.length) {
      return {
        ...base,
        type: 'multiple-choice',
        choices: unique([correct, ...distractors]).slice(0, 4),
        answer: correct,
        visual: 'choice-burst',
      }
    }
  }

  if (isNumericExercise(exercise)) {
    return {
      ...base,
      type: 'numeric-input',
      choices: [],
      answer: answerAlternatives(answer).find((item) => /^-?\d/.test(item.replace('$', ''))) || cleanMathText(answer),
      visual: 'math-pad',
      inputPlaceholder: 'Type the number',
    }
  }

  return {
    ...base,
    type: 'fill-blank',
    choices: [],
    visual: /fraction/i.test(`${exercise.prompt} ${answer}`) ? 'fraction-builder' : 'blank-card',
    inputPlaceholder: 'Type the answer in words, numbers, or symbols',
  }
}

function buildPracticeFromExerciseBank(episode, title) {
  const lesson = exerciseBank?.lessons?.find((item) => Number(item.lesson) === Number(episode))
  if (!lesson || !Array.isArray(lesson.exercises)) return null
  const questions = lesson.exercises.map((exercise) => makeBankQuestion(exercise, title))
  const maxScore = questions.reduce((sum, question) => sum + Number(question.points || 0), 0)
  return {
    title: `${title} Practice Quest`,
    source: 'IB_PYP_G4_Lessons_1_40_Exercise_Bank.md',
    maxScore,
    passingScore: 75,
    rewards: {
      gemsOnPass: 0,
      gemsOnPerfect: 2,
      streakBonus: 1,
    },
    reviewAdvice: {
      rewatchMessage: `If your score is below 80, rewatch "${title}" and then replay the 20-question quest.`,
      focus: `Master the full ${title.toLowerCase()} set: concept checks, skill drills, applications, spiral review, and communication.`,
    },
    questions,
  }
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function readManifest(episode) {
  const ep = String(episode).padStart(2, '0')
  const file = path.join(sourceRoot, `ib_pyp_g4_ep${ep}`, `ib_pyp_g4_ep${ep}_manifest.json`)
  try {
    const text = fs.readFileSync(file, 'utf8')
    if (!text.trim()) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

function pickVideoFile(episode) {
  const ep = String(episode).padStart(2, '0')
  const dir = path.join(sourceRoot, `ib_pyp_g4_ep${ep}`)
  return fs.readdirSync(dir).find((file) => file.endsWith('.mp4')) || null
}

function ffprobeDuration(episode, videoFileName) {
  const ep = String(episode).padStart(2, '0')
  const videoPath = path.join(sourceRoot, `ib_pyp_g4_ep${ep}`, videoFileName)
  try {
    const result = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', videoPath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return Math.max(60, Math.round(Number(result.trim()) || 0))
  } catch {
    return 600
  }
}

function durationFor(episode, manifest, videoFileName) {
  const segments = manifest?.segments
  if (Array.isArray(segments) && segments.length) {
    const total = segments.reduce((sum, segment) => sum + (Number(segment.duration) || 0), 0)
    if (total > 0) return Math.max(60, Math.round(total))
  }
  return ffprobeDuration(episode, videoFileName)
}

function choiceQuestion(id, prompt, correct, distractors, index, hint, explanation) {
  return {
    id,
    type: 'multiple-choice',
    prompt: cleanText(prompt),
    choices: [correct, ...distractors].map(cleanText).filter(Boolean).slice(0, 4),
    answer: cleanText(correct),
    points: points[index],
    penalty: penalties[index],
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'choice-burst',
    encouragement: {
      correct: 'Great move. You chose the math idea and the answer.',
      incorrect: 'Good try. Keep your model in your head and move to the next one.',
    },
  }
}

function numericQuestion(id, prompt, answer, index, hint, explanation, unit = '') {
  return {
    id,
    type: 'numeric-input',
    prompt: cleanText(prompt),
    choices: [],
    answer: cleanText(answer),
    points: points[index],
    penalty: penalties[index],
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'math-pad',
    inputPlaceholder: unit ? `Type the number in ${unit}` : 'Type the number',
    unit: cleanText(unit),
    encouragement: {
      correct: 'Yes. Clean calculation.',
      incorrect: 'Keep going. One missed step is useful data for your review list.',
    },
  }
}

function fillQuestion(id, prompt, answer, index, hint, explanation) {
  return {
    id,
    type: 'fill-blank',
    prompt: cleanText(prompt),
    choices: [],
    answer: cleanText(answer),
    points: points[index],
    penalty: penalties[index],
    hint: cleanText(hint),
    explanation: cleanText(explanation),
    visual: 'blank-card',
    inputPlaceholder: 'Fill in the missing value or word',
    encouragement: {
      correct: 'Nice. You found the missing piece.',
      incorrect: 'Almost. Read what the blank represents and keep moving.',
    },
  }
}

function openQuestion(id, title) {
  return {
    id,
    type: 'open-response',
    prompt: `Write one short strategy note for "${title}": what will you check first when you solve this kind of problem again?`,
    choices: [],
    points: points[9],
    penalty: penalties[9],
    hint: 'Name one concrete checking move, such as drawing a model, checking units, or estimating first.',
    explanation: 'A strong strategy note helps you reuse the skill in a new problem.',
    visual: 'reflection-card',
    inputPlaceholder: 'Write your strategy in one or two sentences',
    encouragement: {
      correct: 'Excellent reflection. That is how practice turns into mastery.',
      incorrect: 'Write a real strategy, even a short one. Your future self will use it.',
    },
  }
}

function buildPractice(episode, title) {
  const bankPractice = buildPracticeFromExerciseBank(episode, title)
  if (bankPractice) return bankPractice

  const ep = String(episode).padStart(2, '0')
  const q = (i, kind, prompt, answer, hint, explanation, extra = {}) => {
    const id = `ib-g4-${ep}-q${String(i + 1).padStart(2, '0')}`
    if (kind === 'choice') return choiceQuestion(id, prompt, answer, extra.distractors || [], i, hint, explanation)
    if (kind === 'fill') return fillQuestion(id, prompt, answer, i, hint, explanation)
    return numericQuestion(id, prompt, answer, i, hint, explanation, extra.unit || '')
  }

  const banks = {
    1: [
      q(0, 'numeric', 'What is the value of the digit 7 in 4,782,105?', '700000', 'The 7 is in the hundred-thousands place.', '7 hundred-thousands = 700,000.'),
      q(1, 'fill', 'Complete: 6,304,020 = 6,000,000 + ___ + 4,000 + 20.', '300000', 'Look at the hundred-thousands digit.', 'The 3 is worth 300,000.'),
      q(2, 'choice', 'Which number is greatest?', '8,105,220', 'Compare from left to right.', '8,105,220 is greatest.', { distractors: ['8,015,220', '8,105,202', '8,051,220'] }),
      q(3, 'numeric', 'Write 2 million + 50 thousand + 9 hundred + 6 in standard form.', '2050906', 'Keep zeroes for missing places.', '2,050,906.'),
      q(4, 'numeric', '10 times 43,200 equals what?', '432000', 'Multiplying by 10 shifts one place left.', '43,200 x 10 = 432,000.'),
      q(5, 'numeric', '1/10 of 890,000 equals what?', '89000', 'Divide by 10.', '890,000 / 10 = 89,000.'),
      q(6, 'fill', 'In 5,608,030, the digit 6 is in the ___ place.', 'hundred thousands', 'Read the place value chart.', '6 is in the hundred-thousands place.'),
      q(7, 'numeric', 'What number is 40,000 more than 1,276,350?', '1316350', 'Add 4 ten-thousands.', '1,276,350 + 40,000 = 1,316,350.'),
      q(8, 'numeric', 'What number is 300,000 less than 7,020,400?', '6720400', 'Subtract 3 hundred-thousands.', '7,020,400 - 300,000 = 6,720,400.'),
    ],
    2: [
      q(0, 'numeric', 'Round 48,673 to the nearest thousand.', '49000', 'Look at the hundreds digit.', '48,673 rounds to 49,000.'),
      q(1, 'numeric', 'Round 624,381 to the nearest ten thousand.', '620000', 'Look at the thousands digit.', '624,381 rounds to 620,000.'),
      q(2, 'choice', 'Which estimate is best for 398 + 612?', '400 + 600 = 1000', 'Round to friendly hundreds.', '398 is about 400 and 612 is about 600.', { distractors: ['300 + 600 = 900', '390 + 610 = 900', '400 + 700 = 1100'] }),
      q(3, 'numeric', 'Estimate 7,924 - 3,118 by rounding to the nearest thousand.', '5000', 'Round both numbers first.', '8,000 - 3,000 = 5,000.'),
      q(4, 'numeric', 'Round 15,049 to the nearest hundred.', '15000', 'Look at the tens digit.', '15,049 rounds to 15,000.'),
      q(5, 'numeric', 'Round 15,050 to the nearest hundred.', '15100', 'A 5 in the tens place rounds up.', '15,050 rounds to 15,100.'),
      q(6, 'numeric', 'A book costs $18 and a game costs $31. Estimate the total to the nearest ten.', '50', '18 is about 20 and 31 is about 30.', '20 + 30 = 50.', { unit: 'dollars' }),
      q(7, 'numeric', 'Estimate 49 x 21 using tens.', '1000', '49 is about 50 and 21 is about 20.', '50 x 20 = 1,000.'),
      q(8, 'choice', 'Which exact answer is reasonable for 49 x 21?', '1029', 'Compare with the estimate 1,000.', '49 x 21 = 1,029, close to 1,000.', { distractors: ['129', '10029', '209'] }),
    ],
    3: [
      q(0, 'numeric', 'Compute 48,765 + 23,489.', '72254', 'Line up place values.', '48,765 + 23,489 = 72,254.'),
      q(1, 'numeric', 'Compute 70,000 - 26,845.', '43155', 'Regroup across zeros carefully.', '70,000 - 26,845 = 43,155.'),
      q(2, 'numeric', 'A library has 18,432 fiction books and 9,875 nonfiction books. How many books total?', '28307', 'Add both groups.', '18,432 + 9,875 = 28,307.'),
      q(3, 'numeric', 'A stadium holds 52,400 people. If 38,965 seats are filled, how many seats are empty?', '13435', 'Subtract filled seats from capacity.', '52,400 - 38,965 = 13,435.'),
      q(4, 'fill', 'In subtraction, regrouping 1 thousand gives ___ hundreds.', '10', 'One thousand is ten hundreds.', '1,000 = 10 hundreds.'),
      q(5, 'choice', 'Which equation checks 62,314 - 27,908 = 34,406?', '34,406 + 27,908 = 62,314', 'Use inverse operations.', 'Subtraction is checked with addition.', { distractors: ['62,314 + 27,908 = 34,406', '34,406 - 27,908 = 62,314', '62,314 - 34,406 = 96,720'] }),
      q(6, 'numeric', 'Compute 305,018 + 79,996.', '385014', 'Line up each digit.', '305,018 + 79,996 = 385,014.'),
      q(7, 'numeric', 'Compute 401,000 - 189,456.', '211544', 'Regroup across zeros.', '401,000 - 189,456 = 211,544.'),
      q(8, 'numeric', 'A team goal is 250,000 steps. They walked 118,975 steps. How many more steps are needed?', '131025', 'Goal minus completed.', '250,000 - 118,975 = 131,025.'),
    ],
    4: [
      q(0, 'numeric', 'There are 18 rows with 7 chairs in each row. How many chairs?', '126', 'Rows times chairs per row.', '18 x 7 = 126.'),
      q(1, 'numeric', 'A rectangle is 14 units by 9 units. What is its area?', '126', 'Area = length x width.', '14 x 9 = 126.', { unit: 'square units' }),
      q(2, 'numeric', 'Compute 32 x 6.', '192', 'Break 32 into 30 + 2.', '30 x 6 + 2 x 6 = 180 + 12 = 192.'),
      q(3, 'numeric', 'Compute 45 x 12.', '540', 'Use 45 x 10 and 45 x 2.', '450 + 90 = 540.'),
      q(4, 'choice', 'Which expression matches a 23 by 8 area model split into 20 and 3?', '20 x 8 + 3 x 8', 'Split 23 into tens and ones.', '23 x 8 = 20 x 8 + 3 x 8.', { distractors: ['20 + 8 x 3', '23 x 20 + 8', '20 x 3 + 8'] }),
      q(5, 'numeric', 'Compute 206 x 4.', '824', 'Multiply each place by 4.', '200 x 4 + 6 x 4 = 824.'),
      q(6, 'numeric', 'A game score triples from 128. What is the new score?', '384', 'Triple means multiply by 3.', '128 x 3 = 384.'),
      q(7, 'numeric', 'Compute 27 x 15.', '405', 'Use 27 x 10 + 27 x 5.', '270 + 135 = 405.'),
      q(8, 'numeric', 'A 16 by 16 square has area what?', '256', 'Side times side.', '16 x 16 = 256.', { unit: 'square units' }),
    ],
    5: [
      q(0, 'numeric', 'Share 72 stickers equally among 8 students. How many each?', '9', 'Use division.', '72 / 8 = 9.'),
      q(1, 'numeric', 'A teacher packs 96 pencils into boxes of 12. How many boxes?', '8', 'How many groups of 12?', '96 / 12 = 8.'),
      q(2, 'numeric', 'Compute 135 / 5.', '27', 'Break 135 into 100 + 35.', '100 / 5 + 35 / 5 = 20 + 7 = 27.'),
      q(3, 'numeric', '29 students ride vans with 6 seats each. How many vans are needed?', '5', 'A remainder still needs a van.', '29 / 6 = 4 r5, so 5 vans.'),
      q(4, 'fill', '43 / 7 = 6 remainder ___.', '1', '7 x 6 = 42.', '43 - 42 = 1.'),
      q(5, 'numeric', 'Compute 224 / 8.', '28', '8 x 28 = 224.', '224 / 8 = 28.'),
      q(6, 'choice', 'Which equation checks 156 / 12 = 13?', '12 x 13 = 156', 'Division can be checked by multiplication.', '12 x 13 = 156.', { distractors: ['156 x 13 = 12', '156 - 12 = 13', '13 - 12 = 156'] }),
      q(7, 'numeric', 'A team has 250 points over 10 rounds. What is the average per round?', '25', 'Total divided by number of rounds.', '250 / 10 = 25.'),
      q(8, 'numeric', 'Divide 487 by 4. What is the remainder?', '3', '4 x 121 = 484.', '487 / 4 = 121 r3.'),
    ],
  }

  const fallback = [
    q(0, 'numeric', `A ${title.toLowerCase()} warm-up has 6 groups of 14. How many total?`, '84', 'Multiply groups by size.', '6 x 14 = 84.'),
    q(1, 'numeric', `Compute 128 + ${episode * 7}.`, String(128 + episode * 7), 'Add the ones, tens, then hundreds.', `128 + ${episode * 7} = ${128 + episode * 7}.`),
    q(2, 'numeric', `Compute ${900 + episode * 12} - 275.`, String(900 + episode * 12 - 275), 'Subtract carefully by place value.', `${900 + episode * 12} - 275 = ${900 + episode * 12 - 275}.`),
    q(3, 'numeric', `Compute ${episode + 18} x 6.`, String((episode + 18) * 6), 'Multiply by 6.', `${episode + 18} x 6 = ${(episode + 18) * 6}.`),
    q(4, 'numeric', `${(episode + 9) * 8} items are shared equally into 8 boxes. How many in each box?`, String(episode + 9), 'Use division.', `${(episode + 9) * 8} / 8 = ${episode + 9}.`),
    q(5, 'choice', `Which answer is closest to ${episode * 111 + 498}?`, String(Math.round((episode * 111 + 498) / 100) * 100), 'Round to the nearest hundred.', 'Use the hundreds place to estimate.', { distractors: [String(episode * 111 + 498), String(Math.floor((episode * 111 + 498) / 100) * 100 - 100), String(Math.ceil((episode * 111 + 498) / 100) * 100 + 100)] }),
    q(6, 'numeric', `Find the missing number: ___ + ${episode + 36} = ${episode + 100}.`, '64', 'Subtract the known addend.', `${episode + 100} - ${episode + 36} = 64.`),
    q(7, 'numeric', `A pattern starts ${episode}, ${episode + 4}, ${episode + 8}. What is the 6th term?`, String(episode + 20), 'Add 4 each step.', `The 6th term is ${episode + 20}.`),
    q(8, 'fill', `Complete the math sentence: ${episode + 25} x 10 = ___.`, String((episode + 25) * 10), 'Multiplying by 10 appends one zero.', `${episode + 25} x 10 = ${(episode + 25) * 10}.`),
  ]

  const questions = (banks[episode] || fallback).map((question, index) => ({
    ...question,
    id: `ib-g4-${ep}-q${String(index + 1).padStart(2, '0')}`,
  }))

  questions.push(openQuestion(`ib-g4-${ep}-q10`, title))

  return {
    title: `${title} Practice Quest`,
    maxScore: points.reduce((sum, value) => sum + value, 0),
    passingScore: 64,
    rewards: {
      gemsOnPass: 0,
      gemsOnPerfect: 1,
      streakBonus: 1,
    },
    reviewAdvice: {
      rewatchMessage: `If your score is below 80, rewatch the "${title}" video and pause at each worked example before trying again.`,
      focus: `Practice the core ${title.toLowerCase()} skill until you can show the model and the calculation.`,
    },
    questions,
  }
}

function lessonDescription(title) {
  return `IB Big Math Grade 4 lesson on ${title.toLowerCase()}, built around video instruction, focused math drills, and a short reflection prompt.`
}

const lessons = Array.from({ length: 40 }, (_, index) => {
  const episode = index + 1
  const ep = String(episode).padStart(2, '0')
  const manifest = readManifest(episode)
  const videoFileName = pickVideoFile(episode)
  if (!videoFileName) throw new Error(`Missing video file for IB G4 episode ${ep}`)

  const title = cleanText(manifest?.title || episodeTitles[episode])
  const slug = slugify(title)

  return {
    id: `lesson-ib-pyp-g4-${ep}-${slug}`,
    episode,
    title: `IB Big Math G4 Episode ${episode}: ${title}`,
    shortTitle: title,
    description: lessonDescription(title),
    order: episode,
    duration: durationFor(episode, manifest, videoFileName),
    gradeLevel: 'G4',
    difficulty: episode <= 12 ? 'Easy' : episode <= 28 ? 'Medium' : 'Hard',
    videoProvider: 'tencent-vod',
    videoFileName,
    isPreview: episode <= 5,
    hasPractice: true,
    hasGame: true,
    rewardsPoints: 80,
    rewardsGems: episode % 10 === 0 ? 1 : 0,
    practice: buildPractice(episode, title),
  }
})

const course = {
  id: 'course-ib-pyp-g4',
  title: 'IB Big Math Grade 4',
  description:
    'A 40-lesson IB Math core companion for Grade 4: essential concepts, video explanations, focused drills, visual progress, and review support where IB has no single textbook.',
  category: 'ib-big-math',
  courseTrack: 'ib-big-math',
  status: 'active',
  accessLevel: 'registered',
  isFree: false,
  price: 0,
  thumbnailUrl: '/course-covers/ib-g4-cover.svg',
  difficultyLevel: 'Grade 4',
  gradeLevel: 'G4',
  difficulty: 'Easy to Medium',
  videoProvider: 'tencent-vod',
  expectedFeatures: ['Tencent VOD lessons', 'Interactive practice', 'Wrong-answer review', 'Points and gems rewards'],
  lessons,
}

fs.writeFileSync(outputPath, JSON.stringify(course, null, 2) + '\n', 'utf8')
console.log(`Wrote ${lessons.length} IB G4 lessons to ${outputPath}`)
