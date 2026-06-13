import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

type VodEntry = {
  episode: number
  title: string
  fileId: string
  mediaUrl: string
  sourcePath?: string
  sourceFileName?: string
  sizeBytes?: number
  durationSeconds?: number | null
  uploadedAt?: string
}

type ModuleKey =
  | 'number-sense'
  | 'word-problem-modeling'
  | 'fractions-ratios-percent'
  | 'geometry-spatial'
  | 'amc8-reasoning'

type CourseModule = {
  id: string
  key: ModuleKey
  title: string
  description: string
  gradeLevel: string
  difficulty: string
  difficultyLevel: string
  thumbnailUrl: string
  order: number
}

type LarryPracticeQuestion = {
  id: string
  type: 'multiple-choice' | 'true-false' | 'order-steps' | 'numeric-input' | 'fill-blank' | 'multiple-select' | 'open-response'
  prompt: string
  choices: string[]
  answer?: string | string[]
  alternativeAnswers?: string[]
  acceptableKeywords?: string[]
  answerPreview?: string
  points: number
  penalty: number
  hint: string
  explanation: string
  visual?: string
  inputPlaceholder?: string
  unit?: string
  tolerance?: number
  encouragement?: {
    correct?: string
    incorrect?: string
  }
}

type LarryPracticeConfig = {
  title: string
  maxScore: number
  passingScore: number
  rewards: {
    gemsOnPass: number
    gemsOnPerfect: number
    streakBonus: number
  }
  reviewAdvice: {
    rewatchMessage: string
    focus: string
  }
  questions: LarryPracticeQuestion[]
}

const vodMapPath = path.join(process.cwd(), 'data', 'larry-math-vod-map.json')

const knownTitles = new Map<number, string>([
  [1, 'Parentheses and Sign Change Rules'],
  [3, 'Multiplication Table of 5 Challenge'],
  [6, 'Snack Distribution Logic Puzzle'],
  [7, 'Solving the Interval Problem'],
  [8, 'Cube Net Geometry and Patterns'],
  [9, 'Sum and Difference Word Problem'],
  [10, 'Grid Logic Puzzle Challenge'],
  [12, 'Quadratic Expressions and Word Problems'],
  [14, 'Line-up Logic Word Problem'],
  [15, 'Yellow Circle Perimeter Geometry Challenge'],
  [18, 'Mental Math Addition Grouping Strategy'],
  [29, 'Number Pattern Identification Challenge'],
  [30, 'Algebraic Shape Logic Puzzle'],
  [31, 'Logic Grid Method Puzzle'],
  [32, 'Logic Grid and Ranking Puzzle'],
  [33, 'Circular Gems Logic Puzzle'],
  [34, 'Working Backward Word Problem'],
  [35, '3D Cube Surface Area Puzzle'],
  [36, 'Geometric Grid Pattern Challenge'],
  [37, 'Finding the Median in Statistics'],
  [38, 'Proving the Value of Pi'],
  [40, 'Rolling Die Path Logic Puzzle'],
  [41, 'Square Pool and Lawn Area Puzzle'],
  [42, 'Hologram Coding Coefficient of Memory'],
  [45, 'Classic Age Difference Riddle'],
  [46, 'Common Factor Arithmetic Shortcuts'],
  [49, 'Parallelogram Side Length Puzzle'],
  [50, 'Square and Trapezoid Area Puzzle'],
  [51, 'Multiplying and Dividing Decimals'],
  [52, 'Triangle and Polygon Interior Angles'],
  [53, 'Repeating Digit Multiplication Patterns'],
  [54, 'Multiplication and Addition Counting Rules'],
  [103, 'Speed Distance Time Word Problem'],
  [104, 'Counting Four Digit Distinct Integers'],
  [105, 'Successive Discount Percentage Logic'],
  [106, 'Triangle Folding Angle Sum Puzzle'],
  [107, 'Combinatorics Distribution Problem'],
  [108, 'Trapezoid and Circle Geometry Problem'],
  [109, 'Rectangle Perimeter Six Dimensions'],
  [110, 'AMC 8 Tree Interval Problem'],
  [111, 'Fractions Percentages and Decimals Problem'],
  [113, 'Maximize Black Surface Area Puzzle'],
  [114, 'Fibonacci Sequence Remainder Patterns'],
  [115, 'Nested Circles Shaded Area Problem'],
  [116, 'Modular Arithmetic Grid Swap Puzzle'],
  [119, 'Large Number Primality Test'],
  [120, 'Divisibility Rules 3 and 9 Proof'],
  [121, 'Digits 0-6 Subtraction Puzzle'],
  [122, 'Algebra Fraction Word Problem'],
  [123, 'Prime Factorization Age Word Problem'],
  [124, 'Equal Product Grouping Challenge'],
  [125, 'Trailing Zeros in Factorials'],
  [126, 'Comparing Exponents and Roots'],
  [128, 'Shadow Height Ratio Problem'],
  [129, 'Pythagorean Theorem Equal Area Puzzle'],
  [162, 'Triangle Area Ratio Puzzle'],
  [163, 'Average Speed Word Problems'],
  [183, 'Positive Factors of 23,232'],
])

const modules: Record<ModuleKey, CourseModule> = {
  'number-sense': {
    id: 'course-larry-math-g3-g4-number-sense',
    key: 'number-sense',
    title: 'Larry Math G3-G4: Number Sense & Mental Math',
    description:
      'Start where strong math instincts are built: signs, multiplication patterns, decimals, mental math, and flexible calculation. Larry explains the shortcuts students actually remember, then turns them into confident habits.',
    gradeLevel: 'G3-G4',
    difficulty: 'Easy',
    difficultyLevel: 'beginner',
    thumbnailUrl: '/course-covers/larry-math-number-sense.svg',
    order: 1,
  },
  'word-problem-modeling': {
    id: 'course-larry-math-g4-g5-word-problem-modeling',
    key: 'word-problem-modeling',
    title: 'Larry Math G4-G5: Word Problems & Visual Models',
    description:
      'Learn how to turn stories into models: tables, diagrams, equations, interval thinking, working backward, line-up logic, speed-distance-time, and everyday reasoning that makes word problems feel solvable.',
    gradeLevel: 'G4-G5',
    difficulty: 'Medium',
    difficultyLevel: 'intermediate',
    thumbnailUrl: '/course-covers/larry-math-word-models.svg',
    order: 2,
  },
  'fractions-ratios-percent': {
    id: 'course-larry-math-g5-g6-fractions-ratios-percent',
    key: 'fractions-ratios-percent',
    title: 'Larry Math G5-G6: Fractions, Ratios & Percent',
    description:
      'Build the bridge into middle-school math: fractions, decimals, ratios, rates, percentages, averages, discounts, and proportional reasoning through clear peer explanations and contest-style examples.',
    gradeLevel: 'G5-G6',
    difficulty: 'Medium',
    difficultyLevel: 'intermediate',
    thumbnailUrl: '/course-covers/larry-math-ratios-percent.svg',
    order: 3,
  },
  'geometry-spatial': {
    id: 'course-larry-math-g5-g7-geometry-spatial',
    key: 'geometry-spatial',
    title: 'Larry Math G5-G7: Geometry & Spatial Reasoning',
    description:
      'See geometry as a visual adventure: area, perimeter, angles, cube nets, surface area, circles, triangles, trapezoids, shadows, Pythagorean ideas, and elegant visual proofs.',
    gradeLevel: 'G5-G7',
    difficulty: 'Medium',
    difficultyLevel: 'intermediate',
    thumbnailUrl: '/course-covers/larry-math-geometry.svg',
    order: 4,
  },
  'amc8-reasoning': {
    id: 'course-larry-math-g6-g8-amc8-reasoning',
    key: 'amc8-reasoning',
    title: 'Larry Math G6-G8: AMC 8 Logic & Number Theory',
    description:
      'A deeper contest-thinking lane for students ready to stretch: factors, divisibility, primes, modular arithmetic, counting, combinatorics, sequences, logic grids, and multi-step proof-style reasoning.',
    gradeLevel: 'G6-G8',
    difficulty: 'Hard',
    difficultyLevel: 'advanced',
    thumbnailUrl: '/course-covers/larry-math-amc8.svg',
    order: 5,
  },
}

const keywordModuleRules: Array<[RegExp, ModuleKey]> = [
  [/fraction|ratio|percent|decimal|average|discount|speed|rate|proportion/i, 'fractions-ratios-percent'],
  [/triangle|circle|angle|cube|net|geometry|area|perimeter|trapezoid|rectangle|polygon|shadow|pythagorean|surface/i, 'geometry-spatial'],
  [/prime|factor|divisib|modular|fibonacci|combinatorics|counting|grid|logic|sequence|remainder|factorial|exponent|root|product/i, 'amc8-reasoning'],
  [/word problem|interval|line-up|working backward|age|distribution|snack|time/i, 'word-problem-modeling'],
  [/multiplication|addition|subtraction|sign|mental math|pattern|digit/i, 'number-sense'],
]

function titleForEpisode(entry: VodEntry) {
  return knownTitles.get(entry.episode) ?? inferFallbackTitle(entry.episode)
}

function inferFallbackTitle(episode: number) {
  if (episode <= 24) return 'Number Sense and Early Problem Solving'
  if (episode <= 62) return 'Visual Models and Arithmetic Strategies'
  if (episode <= 101) return 'Middle Grade Math Challenge'
  if (episode <= 129) return 'AMC 8 Reasoning Challenge'
  if (episode <= 164) return 'Advanced Logic and Contest Math'
  return 'Math Thinking Lab'
}

function classify(entry: VodEntry): ModuleKey {
  const topic = `${entry.title} ${titleForEpisode(entry)}`
  for (const [rule, moduleKey] of keywordModuleRules) {
    if (rule.test(topic)) return moduleKey
  }
  if (entry.episode <= 24) return 'number-sense'
  if (entry.episode <= 74) return 'word-problem-modeling'
  if (entry.episode <= 111) return 'fractions-ratios-percent'
  if (entry.episode <= 129) return 'geometry-spatial'
  return 'amc8-reasoning'
}

function lessonDescription(entry: VodEntry, module: CourseModule, topic: string) {
  const sourceName = entry.sourceFileName ? ` Source: ${entry.sourceFileName}.` : ''
  return `${module.gradeLevel} ${module.title.split(': ')[1]} lesson with Tencent VOD playback. Focus: ${topic}.${sourceName}`
}

function seededNumber(seed: number, offset: number, min: number, span: number) {
  return min + ((seed * 37 + offset * 19) % span)
}

function numericQuestion(
  id: string,
  prompt: string,
  answer: number | string,
  explanation: string,
  hint: string,
  points: number,
  penalty: number,
  unit?: string
): LarryPracticeQuestion {
  return {
    id,
    type: 'numeric-input',
    prompt,
    choices: [],
    answer: String(answer),
    points,
    penalty,
    hint,
    explanation,
    inputPlaceholder: 'Type the number',
    unit,
    encouragement: {
      correct: 'Nice. You made the calculation clean.',
      incorrect: 'Good try. Slow down and rebuild the number relationship.',
    },
  }
}

function multipleChoiceQuestion(
  id: string,
  prompt: string,
  answer: string,
  distractors: Array<string | number>,
  explanation: string,
  hint: string,
  points: number,
  penalty: number
): LarryPracticeQuestion {
  const choices = [answer, ...distractors.map(String)]
  return {
    id,
    type: 'multiple-choice',
    prompt,
    choices,
    answer,
    points,
    penalty,
    hint,
    explanation,
    encouragement: {
      correct: 'Sharp choice.',
      incorrect: 'Not yet. Look for the structure before calculating.',
    },
  }
}

function trueFalseQuestion(
  id: string,
  prompt: string,
  answer: 'True' | 'False',
  explanation: string,
  hint: string,
  points: number,
  penalty: number
): LarryPracticeQuestion {
  return {
    id,
    type: 'true-false',
    prompt,
    choices: ['True', 'False'],
    answer,
    points,
    penalty,
    hint,
    explanation,
    encouragement: {
      correct: 'Good mathematical judgment.',
      incorrect: 'Check the claim with a small example first.',
    },
  }
}

function orderQuestion(
  id: string,
  prompt: string,
  answer: string[],
  explanation: string,
  hint: string,
  points: number,
  penalty: number
): LarryPracticeQuestion {
  return {
    id,
    type: 'order-steps',
    prompt,
    choices: answer,
    answer,
    points,
    penalty,
    hint,
    explanation,
    encouragement: {
      correct: 'That is a strong solving path.',
      incorrect: 'Think like Larry: model first, calculate second, check last.',
    },
  }
}

function selectQuestion(
  id: string,
  prompt: string,
  choices: string[],
  answer: string[],
  explanation: string,
  hint: string,
  points: number,
  penalty: number
): LarryPracticeQuestion {
  return {
    id,
    type: 'multiple-select',
    prompt,
    choices,
    answer,
    points,
    penalty,
    hint,
    explanation,
    encouragement: {
      correct: 'Great. You found every matching idea.',
      incorrect: 'Almost. There may be more than one correct choice.',
    },
  }
}

function reflectionQuestion(
  id: string,
  prompt: string,
  keywords: string[],
  focus: string
): LarryPracticeQuestion {
  return {
    id,
    type: 'open-response',
    prompt,
    choices: [],
    acceptableKeywords: keywords,
    answerPreview: `Use ${keywords.slice(0, 2).join(' and ')} to explain your thinking.`,
    points: 10,
    penalty: 0,
    hint: `Use at least two math words: ${keywords.slice(0, 3).join(', ')}.`,
    explanation: `A strong answer explains the ${focus} with a number, model, or short reason.`,
    inputPlaceholder: 'I would start by ... because ...',
    encouragement: {
      correct: 'Clear reasoning. That is how math thinking grows.',
      incorrect: 'Good start. Add one number or model word so your thinking is clearer.',
    },
  }
}

function buildLarryPracticeConfig(entry: VodEntry, module: CourseModule, topic: string, order: number): LarryPracticeConfig {
  if (entry.episode === 183) {
    const questions: LarryPracticeQuestion[] = [
      numericQuestion(
        'q1',
        'When 23,232 is divided by 2 repeatedly, what is the exponent of 2 in its prime factorization?',
        6,
        '23,232 = 2^6 x 363, so the exponent of 2 is 6.',
        'Keep halving until the remaining number is odd.',
        6,
        2
      ),
      multipleChoiceQuestion(
        'q2',
        'Which prime factorization is correct for 23,232?',
        '2^6 x 3 x 11^2',
        ['2^5 x 3^2 x 11', '2^6 x 3^2 x 11', '2^4 x 3 x 11^3'],
        '23,232 = 64 x 363 = 2^6 x 3 x 121 = 2^6 x 3 x 11^2.',
        'After removing 2^6, factor 363.',
        8,
        3
      ),
      numericQuestion(
        'q3',
        'How many positive factors does 23,232 have?',
        42,
        'The exponents are 6, 1, and 2, so the count is (6+1)(1+1)(2+1)=7 x 2 x 3=42.',
        'For n = p^a q^b r^c, use (a + 1)(b + 1)(c + 1).',
        10,
        4
      ),
      trueFalseQuestion(
        'q4',
        'To count the positive factors of 2^6 x 3^1 x 11^2, you multiply 6 x 1 x 2.',
        'False',
        'You multiply (6+1)(1+1)(2+1), because each prime can appear from exponent 0 up to its maximum exponent.',
        'Each exponent includes the choice of using zero copies of that prime.',
        8,
        3
      ),
      orderQuestion(
        'q5',
        'Put the divisor-count strategy in the best order.',
        ['Break 23,232 into prime factors', 'Write the factorization with exponents', 'Add 1 to each exponent', 'Multiply the results'],
        'A clean path is factorize, record exponents, count choices for each prime, then multiply the choices.',
        'Factor first. Count choices only after the exponents are clear.',
        10,
        3
      ),
      selectQuestion(
        'q6',
        'Select all numbers that are factors of 23,232.',
        ['64', '121', '125', '13', '242'],
        ['64', '121', '242'],
        '64 = 2^6, 121 = 11^2, and 242 = 2 x 11^2 all fit inside the prime factorization. 125 and 13 do not.',
        'Use the prime factorization 2^6 x 3 x 11^2.',
        10,
        4
      ),
      numericQuestion(
        'q7',
        'How many positive factors of 23,232 are perfect squares?',
        8,
        'For 2^6, even exponents are 0,2,4,6: 4 choices. For 3^1: only 0, so 1 choice. For 11^2: 0 or 2, so 2 choices. Total: 4 x 1 x 2 = 8.',
        'For a square factor, each prime exponent must be even.',
        10,
        4
      ),
      reflectionQuestion(
        'q8',
        'Explain in one or two sentences why the answer is 42, not 9.',
        ['exponents', 'zero', 'choices', 'multiply', 'prime factorization'],
        'divisor-count reasoning'
      ),
    ]
    const maxScore = questions.reduce((sum, question) => sum + question.points, 0)
    return {
      title: 'Positive Factors of 23,232 Practice Quest',
      maxScore,
      passingScore: 72,
      rewards: {
        gemsOnPass: 0,
        gemsOnPerfect: 1,
        streakBonus: 1,
      },
      reviewAdvice: {
        rewatchMessage: "Replay Larry's factorization example once, then rebuild the exponent choices.",
        focus: 'Positive Factors of 23,232',
      },
      questions,
    }
  }

  const seed = entry.episode + order
  const a = seededNumber(seed, 1, 6, 24)
  const b = seededNumber(seed, 2, 4, 18)
  const c = seededNumber(seed, 3, 3, 12)
  const d = seededNumber(seed, 4, 2, 9)
  const questions: LarryPracticeQuestion[] = []

  if (module.key === 'number-sense') {
    questions.push(
      numericQuestion('q1', `Compute mentally: ${a * 10 + b} + ${c * 10 + d}`, a * 10 + b + c * 10 + d, 'Add tens with tens and ones with ones, then combine.', 'Break both numbers into tens and ones.', 6, 2),
      multipleChoiceQuestion('q2', `Which expression has the same value as ${a} x (${b} + ${c})?`, `${a} x ${b} + ${a} x ${c}`, [`${a} + ${b} x ${c}`, `${a + b} x ${c}`, `${a} x ${b} + ${c}`], 'This uses the distributive property.', 'Multiply the outside number by each part inside the parentheses.', 6, 2),
      numericQuestion('q3', `A number is ${a * b}. Divide it by ${a}. What do you get?`, b, 'Multiplication and division undo each other.', `Think: ${a} x ? = ${a * b}.`, 8, 3),
      trueFalseQuestion('q4', `${a + b} + ${c} = ${c} + ${a + b}`, 'True', 'Addition can be reordered without changing the total.', 'Try both sides quickly.', 8, 3),
      orderQuestion('q5', `Put the mental math steps in order for ${a * 10 + b} - ${c}.`, ['Break the number into tens and ones', 'Subtract the easy part first', 'Adjust the ones', 'Check the answer by adding back'], 'A clean mental method breaks, subtracts, adjusts, and checks.', 'Start with place value.', 10, 3),
      selectQuestion('q6', `Select all numbers divisible by ${d}.`, [String(d * 2), String(d * 3 + 1), String(d * 4), String(d * 5 + 2)], [String(d * 2), String(d * 4)], 'A number is divisible when it is an exact multiple.', `Look for ${d} times a whole number.`, 10, 4),
      numericQuestion('q7', `Fill the blank: ${a} x ___ = ${a * c}`, c, 'Use inverse thinking: divide the product by the known factor.', `Ask: how many ${a}s make ${a * c}?`, 12, 4),
      reflectionQuestion('q8', `What mental math move would make "${topic}" easier to solve?`, ['break apart', 'place value', 'check'], 'mental math strategy')
    )
  } else if (module.key === 'word-problem-modeling') {
    questions.push(
      numericQuestion('q1', `A club has ${a} rows with ${b} students in each row. How many students are there?`, a * b, 'Rows and equal groups multiply.', 'Draw rows or write equal groups.', 6, 2, 'students'),
      numericQuestion('q2', `Larry has ${a * 3} stickers. He gives ${b} to a friend and then gets ${c}. How many stickers now?`, a * 3 - b + c, 'Track the story in order: subtract, then add.', 'Write one expression from left to right.', 6, 2, 'stickers'),
      multipleChoiceQuestion('q3', `Which model best fits a total split equally into ${d} groups?`, 'bar model with equal parts', ['single number line jump', 'random guess table', 'circle graph only'], 'Equal groups are easy to see with equal bar parts.', 'Look for equal parts.', 8, 3),
      trueFalseQuestion('q4', `If each ticket costs $${d}, then ${a} tickets cost $${a + d}.`, 'False', 'Equal-price tickets use multiplication, not addition.', `Compare ${d} x ${a} with ${a} + ${d}.`, 8, 3),
      orderQuestion('q5', 'Put the word-problem strategy in the best order.', ['Underline the question', 'List the known numbers', 'Choose a diagram or equation', 'Calculate and check the unit'], 'This keeps the story, model, calculation, and unit connected.', 'Do not calculate before you know what is being asked.', 10, 3),
      selectQuestion('q6', 'Which are good first moves for a word problem?', ['Draw a bar model', 'Label the unknown', 'Guess without reading', 'Check units'], ['Draw a bar model', 'Label the unknown', 'Check units'], 'Good solvers slow the story down before calculating.', 'Choose actions that make structure visible.', 10, 4),
      numericQuestion('q7', `A trip is ${a * 5} km. Larry has traveled ${b * 2} km. How many km are left?`, a * 5 - b * 2, 'Remaining distance is total minus traveled.', 'Use total - part.', 12, 4, 'km'),
      reflectionQuestion('q8', `For "${topic}", what should you draw before calculating?`, ['diagram', 'bar model', 'unknown', 'unit'], 'word-problem model')
    )
  } else if (module.key === 'fractions-ratios-percent') {
    const total = (a + b) * 4
    const percentBase = c * 20
    questions.push(
      numericQuestion('q1', `What is 1/4 of ${total}?`, total / 4, 'One fourth means divide by 4.', 'Split the total into 4 equal parts.', 6, 2),
      numericQuestion('q2', `${a} out of ${a + b} students chose math. How many did not choose math?`, b, 'The other part is total minus the math group.', 'Use total - part.', 6, 2, 'students'),
      multipleChoiceQuestion('q3', `Which is equivalent to ${c}/${c * 2}?`, '1/2', ['1/3', '2/3', `${c}/2`], 'The numerator is half of the denominator.', 'Divide top and bottom by the same number.', 8, 3),
      trueFalseQuestion('q4', `25% of ${percentBase} is ${percentBase / 4}.`, 'True', '25% is one fourth.', 'Change 25% to 1/4.', 8, 3),
      orderQuestion('q5', `Order the steps for finding ${d * 10}% of ${a * 10}.`, ['Change percent to a fraction or decimal', 'Multiply by the whole', 'Simplify the product', 'Check if the answer size is reasonable'], 'Percent questions become easier after changing the percent form.', 'Start by rewriting the percent.', 10, 3),
      selectQuestion('q6', 'Select the proportional pairs.', ['2/4 and 1/2', '3/9 and 1/3', '4/5 and 4/10', '6/8 and 3/4'], ['2/4 and 1/2', '3/9 and 1/3', '6/8 and 3/4'], 'Equivalent ratios reduce to the same value.', 'Simplify each pair.', 10, 4),
      numericQuestion('q7', `A score improves from ${a * 2} to ${a * 2 + b}. How many points did it improve?`, b, 'Improvement is new score minus old score.', 'Subtract the starting value from the ending value.', 12, 4, 'points'),
      reflectionQuestion('q8', `Which fraction, ratio, or percent model helps explain "${topic}"?`, ['fraction', 'ratio', 'percent', 'whole'], 'proportional reasoning')
    )
  } else if (module.key === 'geometry-spatial') {
    questions.push(
      numericQuestion('q1', `A rectangle is ${a} cm by ${b} cm. What is its area?`, a * b, 'Rectangle area is length times width.', 'Multiply the two side lengths.', 6, 2, 'cm^2'),
      numericQuestion('q2', `A square has side length ${d + 3}. What is its perimeter?`, (d + 3) * 4, 'A square has four equal sides.', 'Add the side four times.', 6, 2, 'cm'),
      multipleChoiceQuestion('q3', 'Which formula finds triangle area?', 'base x height ÷ 2', ['base + height', 'length x width', 'side x 4'], 'A triangle is half of a matching rectangle.', 'Think of a triangle inside a rectangle.', 8, 3),
      trueFalseQuestion('q4', `A ${a} by ${b} rectangle has the same area as a ${b} by ${a} rectangle.`, 'True', 'Changing the order of multiplication does not change the area.', 'Compare the two products.', 8, 3),
      orderQuestion('q5', 'Order the geometry solving steps.', ['Identify the shape', 'Mark the known lengths', 'Choose area, perimeter, or angle relationship', 'Compute and include units'], 'Geometry becomes clear after choosing the right relationship.', 'Shape first, formula second.', 10, 3),
      selectQuestion('q6', 'Select all area units.', ['square cm', 'cm^2', 'meters', 'square inches'], ['square cm', 'cm^2', 'square inches'], 'Area uses square units.', 'Look for square language.', 10, 4),
      numericQuestion('q7', `A triangle has base ${a} and height ${c}. What is its area?`, (a * c) / 2, 'Triangle area is base times height divided by 2.', 'Find the rectangle area, then take half.', 12, 4, 'square units'),
      reflectionQuestion('q8', `What diagram would make "${topic}" easier to see?`, ['shape', 'length', 'area', 'angle'], 'geometry model')
    )
  } else {
    const sequenceStart = a + 1
    questions.push(
      numericQuestion('q1', `What is the next number: ${sequenceStart}, ${sequenceStart + d}, ${sequenceStart + d * 2}, ___?`, sequenceStart + d * 3, 'The pattern adds the same amount each time.', 'Find the repeated difference.', 6, 2),
      numericQuestion('q2', `How many ways can you choose 1 snack and 1 drink from ${c} snacks and ${d} drinks?`, c * d, 'Use the multiplication counting principle.', 'Each snack can pair with each drink.', 6, 2, 'ways'),
      multipleChoiceQuestion('q3', `Which number is a factor of ${a * b}?`, String(a), [a + 1, b + 2, a + b + 1], 'A factor divides the product evenly.', `Because ${a} x ${b} = ${a * b}.`, 8, 3),
      trueFalseQuestion('q4', `If a number is divisible by 6, it must be divisible by both 2 and 3.`, 'True', 'Since 6 = 2 x 3, divisibility by 6 includes both tests.', 'Break 6 into prime factors.', 8, 3),
      orderQuestion('q5', 'Order the contest-math attack plan.', ['Try a small case', 'Look for a pattern', 'Write the rule', 'Test the rule on the original problem'], 'Small cases reveal the structure before the full problem.', 'Do not jump straight to the biggest numbers.', 10, 3),
      selectQuestion('q6', `Select all multiples of ${d}.`, [String(d), String(d + 1), String(d * 3), String(d * 4 + 1)], [String(d), String(d * 3)], 'Multiples are made by multiplying by whole numbers.', `Use ${d} times 1, 2, 3...`, 10, 4),
      numericQuestion('q7', `The remainder when ${a * b + d} is divided by ${b} is what?`, d % b, 'Subtract the largest multiple of the divisor.', `Since ${a * b} is divisible by ${b}, only the extra ${d} matters.`, 12, 4),
      reflectionQuestion('q8', `What small case or pattern would you test first for "${topic}"?`, ['small case', 'pattern', 'rule', 'check'], 'contest reasoning')
    )
  }

  const maxScore = questions.reduce((sum, question) => sum + question.points, 0)
  return {
    title: `${topic} Practice Quest`,
    maxScore,
    passingScore: 72,
    rewards: {
      gemsOnPass: 0,
      gemsOnPerfect: 1,
      streakBonus: 1,
    },
    reviewAdvice: {
      rewatchMessage: 'Replay Larry’s example once, then try the quest again with a cleaner model.',
      focus: topic,
    },
    questions,
  }
}

async function archiveLegacyYoutubeLarryMath() {
  const youtubeWhere = {
    course: { courseTrack: 'larry-math' },
    OR: [
      { videoProvider: 'youtube' },
      { videoUrl: { contains: 'youtube.com' } },
      { videoUrl: { contains: 'youtu.be' } },
      { youtubeVideoId: { not: null } },
    ],
  }

  const youtubeLessons = await prisma.lesson.count({ where: youtubeWhere })
  await prisma.lesson.deleteMany({ where: youtubeWhere })

  const archivedCourses = await prisma.course.updateMany({
    where: {
      courseTrack: 'larry-math',
      OR: [
        { id: 'course-larry-math-core' },
        { id: 'course-larry-math-class-library' },
        { videoProvider: 'youtube' },
        { videoUrl: { contains: 'youtube.com' } },
        { videoUrl: { contains: 'youtu.be' } },
        { youtubeVideoId: { not: null } },
      ],
    },
    data: {
      status: 'archived',
      published: false,
      featured: false,
      videoProvider: 'tencent-vod',
      videoUrl: null,
      youtubeVideoId: null,
    },
  })

  return { youtubeLessons, archivedCourses: archivedCourses.count }
}

async function main() {
  if (!fs.existsSync(vodMapPath)) {
    throw new Error(`Missing Larry Math VOD map: ${vodMapPath}`)
  }

  const vodMap = JSON.parse(fs.readFileSync(vodMapPath, 'utf8')) as Record<string, VodEntry>
  const entries = Object.values(vodMap)
    .filter((entry) => entry.mediaUrl && entry.fileId)
    .sort((a, b) => a.episode - b.episode)

  if (entries.length === 0) {
    throw new Error('Larry Math VOD map has no upload records with mediaUrl/fileId.')
  }

  const legacy = await archiveLegacyYoutubeLarryMath()

  for (const courseModule of Object.values(modules).sort((a, b) => a.order - b.order)) {
    await prisma.course.upsert({
      where: { id: courseModule.id },
      update: {
        title: courseModule.title,
        description: courseModule.description,
        price: 0,
        isFree: true,
        accessLevel: 'public',
        category: 'math',
        courseTrack: 'larry-math',
        status: 'active',
        videoProvider: 'tencent-vod',
        difficultyLevel: courseModule.difficultyLevel,
        thumbnailUrl: courseModule.thumbnailUrl,
        duration: 0,
        gradeLevel: courseModule.gradeLevel,
        difficulty: courseModule.difficulty,
        featured: true,
        published: true,
        expectedFeatures: JSON.stringify([
          'Tencent VOD video lessons',
          'Free public-benefit course access',
          'Lesson-by-lesson practice quests',
          'Peer-created math explanations',
          'Organized by grade band and skill module',
          'YouTube-free playback for easier access',
        ]),
      },
      create: {
        id: courseModule.id,
        title: courseModule.title,
        description: courseModule.description,
        price: 0,
        isFree: true,
        accessLevel: 'public',
        category: 'math',
        courseTrack: 'larry-math',
        status: 'active',
        videoProvider: 'tencent-vod',
        difficultyLevel: courseModule.difficultyLevel,
        thumbnailUrl: courseModule.thumbnailUrl,
        duration: 0,
        gradeLevel: courseModule.gradeLevel,
        difficulty: courseModule.difficulty,
        featured: true,
        published: true,
        expectedFeatures: JSON.stringify([
          'Tencent VOD video lessons',
          'Free public-benefit course access',
          'Lesson-by-lesson practice quests',
          'Peer-created math explanations',
          'Organized by grade band and skill module',
          'YouTube-free playback for easier access',
        ]),
      },
    })
  }

  const moduleCounts = new Map<ModuleKey, number>()
  for (const entry of entries) {
    const moduleKey = classify(entry)
    const courseModule = modules[moduleKey]
    const order = (moduleCounts.get(moduleKey) ?? 0) + 1
    moduleCounts.set(moduleKey, order)

    const topic = titleForEpisode(entry)
    const lessonId = `lesson-larry-math-vod-${String(entry.episode).padStart(3, '0')}`
    const practiceConfig = buildLarryPracticeConfig(entry, courseModule, topic, order)
    const practiceActivityId = `activity-${lessonId}-practice`

    await prisma.lesson.upsert({
      where: { id: lessonId },
      update: {
        courseId: courseModule.id,
        title: `Larry Math Class ${entry.episode}: ${topic}`,
        description: lessonDescription(entry, courseModule, topic),
        videoUrl: entry.mediaUrl,
        videoProvider: 'tencent-vod',
        youtubeVideoId: null,
        tencentVodFileId: entry.fileId,
        order,
        duration: entry.durationSeconds ? Math.round(entry.durationSeconds) : 600,
        isPreview: true,
        hasPractice: true,
        hasGame: false,
        rewardsPoints: practiceConfig.maxScore,
        rewardsGems: 0,
        gradeLevel: courseModule.gradeLevel,
        difficulty: courseModule.difficulty,
      },
      create: {
        id: lessonId,
        courseId: courseModule.id,
        title: `Larry Math Class ${entry.episode}: ${topic}`,
        description: lessonDescription(entry, courseModule, topic),
        videoUrl: entry.mediaUrl,
        videoProvider: 'tencent-vod',
        youtubeVideoId: null,
        tencentVodFileId: entry.fileId,
        order,
        duration: entry.durationSeconds ? Math.round(entry.durationSeconds) : 600,
        isPreview: true,
        hasPractice: true,
        hasGame: false,
        rewardsPoints: practiceConfig.maxScore,
        rewardsGems: 0,
        gradeLevel: courseModule.gradeLevel,
        difficulty: courseModule.difficulty,
      },
    })

    await prisma.lessonActivity.upsert({
      where: { id: practiceActivityId },
      update: {
        courseId: courseModule.id,
        lessonId,
        type: 'practice',
        title: `${topic} Practice Quest`,
        description: 'A free Larry Math practice quest with drills, models, and one reasoning reflection.',
        config: JSON.stringify(practiceConfig),
        provider: 'internal-practice',
        order: 1,
        isRequired: false,
        rewardsPoints: practiceConfig.maxScore,
        rewardsGems: 0,
        published: true,
      },
      create: {
        id: practiceActivityId,
        courseId: courseModule.id,
        lessonId,
        type: 'practice',
        title: `${topic} Practice Quest`,
        description: 'A free Larry Math practice quest with drills, models, and one reasoning reflection.',
        config: JSON.stringify(practiceConfig),
        provider: 'internal-practice',
        order: 1,
        isRequired: false,
        rewardsPoints: practiceConfig.maxScore,
        rewardsGems: 0,
        published: true,
      },
    })
  }

  for (const courseModule of Object.values(modules)) {
    const lessonCount = moduleCounts.get(courseModule.key) ?? 0
    await prisma.course.update({
      where: { id: courseModule.id },
      data: { duration: lessonCount * 10 },
    })
  }

  const youtubeRemainder = await prisma.lesson.count({
    where: {
      course: { courseTrack: 'larry-math' },
      OR: [
        { videoProvider: 'youtube' },
        { videoUrl: { contains: 'youtube.com' } },
        { videoUrl: { contains: 'youtu.be' } },
        { youtubeVideoId: { not: null } },
      ],
    },
  })

  console.log(`Larry Math VOD lessons imported: ${entries.length}`)
  console.log(`Archived legacy YouTube courses: ${legacy.archivedCourses}; removed YouTube lessons: ${legacy.youtubeLessons}`)
  console.log(`Remaining Larry Math YouTube lessons: ${youtubeRemainder}`)
  for (const courseModule of Object.values(modules).sort((a, b) => a.order - b.order)) {
    console.log(`${courseModule.title}: ${moduleCounts.get(courseModule.key) ?? 0} lessons`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error)
    prisma.$disconnect()
    process.exit(1)
  })
