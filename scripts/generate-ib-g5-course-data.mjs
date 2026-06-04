import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sourceRoot = '/Users/johnwu/Documents/自动视频剪辑项目/output'
const scriptsPath = path.join(sourceRoot, 'ib_pyp_g5_scripts/ib_pyp_g5_lessons_01_20_scripts.json')
const outputPath = path.join(projectRoot, 'data/ib-pyp-g5-course.json')
const existingCourse = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : null

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
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.mp4')).sort()
  if (episode === 20) {
    return files.find((file) => file === 'IB_PYP_G5_Ep20_Data_Probability_Project_Fenrir.mp4') || files[0] || null
  }
  return files[0] || null
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

function shuffleChoices(correct, distractors) {
  return [correct, ...distractors]
    .map(cleanText)
    .filter((value, index, arr) => value && arr.indexOf(value) === index)
    .slice(0, 4)
}

function drillQuestion(kind, id, prompt, answer, points, penalty, hint, explanation, options = {}) {
  if (kind === 'choice') {
    return {
      ...choiceQuestion(id, prompt, answer, options.distractors || [], points, penalty, hint, explanation),
      choices: shuffleChoices(answer, options.distractors || []),
      encouragement: {
        correct: 'Yes. That is real math power.',
        incorrect: 'Keep going. Recalculate one clean step and try again.',
      },
    }
  }

  if (kind === 'fill') {
    return fillBlankQuestion(id, prompt, answer, points, penalty, hint, explanation)
  }

  return numericQuestion(id, prompt, answer, points, penalty, hint, explanation, options.unit || '')
}

function conceptQuestion(ep, lesson, points, penalties) {
  return trueFalseQuestion(
    `${ep}-q15`,
    `Before moving on, check the habit: a good solution for "${lesson.title}" should show the operation or model, not only the final answer.`,
    true,
    points[14],
    penalties[14],
    'This is the one thinking-check question. The other questions are skill practice.',
    'Strong math work combines accurate computation with visible reasoning.'
  )
}

function topicDrills(episode, ep, lesson, points, penalties) {
  const q = (index, kind, prompt, answer, hint, explanation, options) =>
    drillQuestion(kind, `${ep}-q${String(index + 1).padStart(2, '0')}`, prompt, answer, points[index], penalties[index], hint, explanation, options)

  const banks = {
    1: [
      q(0, 'numeric', 'Class fair: 9 notebooks are sold for $8 each. How many dollars from notebooks?', '72', 'Multiply price by quantity.', '9 x 8 = 72 dollars.', { unit: 'dollars' }),
      q(1, 'numeric', 'Markers cost $3 each. The class sells 27 markers. How many dollars from markers?', '81', 'Price times quantity.', '3 x 27 = 81 dollars.', { unit: 'dollars' }),
      q(2, 'numeric', 'Notebook revenue is $72 and marker revenue is $81. What is the total revenue?', '153', 'Add both revenue amounts.', '72 + 81 = 153 dollars.', { unit: 'dollars' }),
      q(3, 'numeric', 'Total revenue is $153. Booth fee is $25. What is the profit?', '128', 'Profit means revenue minus cost.', '153 - 25 = 128 dollars.', { unit: 'dollars' }),
      q(4, 'choice', 'Which expression matches: 6 tickets at $4 each, plus 8 snacks at $3 each, minus a $10 fee?', '6 x 4 + 8 x 3 - 10', 'Choose the expression with multiplication before adding totals.', 'Each price must multiply its quantity first.', { distractors: ['6 + 4 + 8 + 3 - 10', '6 x 8 + 4 x 3 - 10', '6 x 4 - 8 x 3 + 10'] }),
      q(5, 'numeric', 'Evaluate: 6 x 4 + 8 x 3 - 10.', '38', 'Multiply first, then add and subtract.', '24 + 24 - 10 = 38.'),
      q(6, 'numeric', 'A school sells 14 pencils for $2 each and pays $5 for supplies. What is the profit?', '23', 'Revenue minus supplies.', '14 x 2 - 5 = 23.'),
      q(7, 'numeric', 'A table shows 5 packs with 12 stickers each. How many stickers total?', '60', 'Packs times stickers per pack.', '5 x 12 = 60.'),
      q(8, 'numeric', 'A student has $60 revenue and $18 cost. What is the profit?', '42', 'Subtract cost from revenue.', '60 - 18 = 42.'),
      q(9, 'numeric', 'A booth sells 18 bracelets at $5 each and 12 stickers at $2 each. What is total revenue?', '114', 'Find each revenue, then add.', '18 x 5 + 12 x 2 = 90 + 24 = 114.'),
      q(10, 'numeric', 'Total revenue is $114 and total cost is $37. What is profit?', '77', 'Profit = revenue - cost.', '114 - 37 = 77.'),
      q(11, 'choice', 'Which equation matches profit from p pencils at $2 each with a $9 fee?', '2p - 9', 'Revenue is 2p, then subtract fee.', 'The expression is 2p - 9.', { distractors: ['2 + p - 9', '9 - 2p', '2p + 9'] }),
      q(12, 'numeric', 'If p = 34, evaluate 2p - 9.', '59', 'Substitute p = 34.', '2 x 34 - 9 = 59.'),
      q(13, 'numeric', 'A class needs at least $150 profit. It has $195 revenue and $52 cost. How many dollars short or over the goal?', '-7', 'Profit is 143, compare to 150. Negative means short.', '195 - 52 = 143; 143 - 150 = -7.'),
    ],
    2: [
      q(0, 'numeric', 'What is the value of the digit 7 in 4,782,105?', '700000', 'The 7 is in the hundred-thousands place.', '7 hundred-thousands = 700,000.'),
      q(1, 'numeric', 'Write 3,000,000 + 400,000 + 20,000 + 900 + 8 in standard form.', '3420908', 'Keep the zero places.', 'The number is 3,420,908.'),
      q(2, 'choice', 'Which number is greatest?', '8,105,220', 'Compare from left to right.', '8,105,220 has the greatest ten-thousands/higher-place comparison.', { distractors: ['8,015,220', '8,105,202', '8,051,220'] }),
      q(3, 'numeric', 'Round 6,842,197 to the nearest thousand.', '6842000', 'Look at the hundreds digit.', '6,842,197 rounds to 6,842,000.'),
      q(4, 'numeric', '10 times 43,200 equals what?', '432000', 'Moving one place left makes ten times as much.', '43,200 x 10 = 432,000.'),
      q(5, 'numeric', '1/10 of 890,000 equals what?', '89000', 'Divide by 10.', '890,000 / 10 = 89,000.'),
      q(6, 'fill', 'Complete: 5,608,030 = 5,000,000 + ___ + 8,000 + 30.', '600000', 'Find the hundred-thousands part.', 'The digit 6 is worth 600,000.'),
      q(7, 'choice', 'Which is the word form of 2,045,109?', 'two million forty-five thousand one hundred nine', 'Read by periods: millions, thousands, ones.', '2,045,109 is two million forty-five thousand one hundred nine.', { distractors: ['two million four hundred five thousand nineteen', 'two hundred forty-five thousand one hundred nine', 'two million forty-five hundred one hundred nine'] }),
      q(8, 'numeric', 'How many zeros are in one billion?', '9', 'One billion is 1,000,000,000.', 'There are 9 zeros.'),
      q(9, 'numeric', 'What is the value of 4 in 9,405,112?', '400000', 'The 4 is in the hundred-thousands place.', '4 hundred-thousands = 400,000.'),
      q(10, 'numeric', 'Round 28,549,112 to the nearest million.', '29000000', 'Look at the hundred-thousands digit.', '28,549,112 rounds to 29,000,000.'),
      q(11, 'choice', 'Which number equals 70,000,000 + 500,000 + 8,000 + 60?', '70,508,060', 'Keep every place value.', '70,000,000 + 500,000 + 8,000 + 60 = 70,508,060.', { distractors: ['75,080,060', '70,580,600', '7,508,060'] }),
      q(12, 'numeric', 'Compare: 4,090,200 is how much more than 4,009,200?', '81000', 'Subtract the smaller number.', '4,090,200 - 4,009,200 = 81,000.'),
      q(13, 'choice', 'Order from least to greatest.', '6,099,999; 6,900,000; 6,909,000; 6,990,000', 'Compare hundred-thousands, then ten-thousands.', 'This is the increasing order.', { distractors: ['6,990,000; 6,909,000; 6,900,000; 6,099,999', '6,900,000; 6,099,999; 6,909,000; 6,990,000', '6,099,999; 6,909,000; 6,900,000; 6,990,000'] }),
    ],
    3: [
      q(0, 'numeric', 'A submarine is at -35 meters and rises 12 meters. What is its new position?', '-23', 'Move right/up 12 from -35.', '-35 + 12 = -23.', { unit: 'meters' }),
      q(1, 'numeric', 'Temperature changes from -4°C to 9°C. How many degrees did it increase?', '13', 'Find the distance between -4 and 9.', '9 - (-4) = 13.', { unit: 'degrees' }),
      q(2, 'choice', 'Which integer is least?', '-18', 'Farther left on the number line is smaller.', '-18 is less than -12, -8, and 0.', { distractors: ['-12', '-8', '0'] }),
      q(3, 'numeric', 'What is | -27 | ?', '27', 'Absolute value is distance from zero.', '|-27| = 27.'),
      q(4, 'numeric', 'Start at 6 on a number line. Move left 14. Where do you land?', '-8', 'Left means subtract.', '6 - 14 = -8.'),
      q(5, 'choice', 'Which is true?', '-3 > -7', 'Negative numbers closer to zero are greater.', '-3 is to the right of -7.', { distractors: ['-3 < -7', '-9 > -2', '-1 < -8'] }),
      q(6, 'numeric', 'An elevator goes from floor -2 to floor 5. How many floors does it travel?', '7', 'Count the distance.', '5 - (-2) = 7.'),
      q(7, 'numeric', 'What integer is 9 less than 2?', '-7', 'Compute 2 - 9.', '2 - 9 = -7.'),
      q(8, 'choice', 'Order from least to greatest.', '-6, -1, 0, 4', 'Least means leftmost first.', 'Negative six, then negative one, then zero, then four.', { distractors: ['4, 0, -1, -6', '-1, -6, 0, 4', '0, -1, -6, 4'] }),
      q(9, 'numeric', 'A hiker is at -18 meters and climbs 45 meters. What is the new elevation?', '27', 'Add the change.', '-18 + 45 = 27.'),
      q(10, 'numeric', 'What is the distance between -11 and 13?', '24', 'Subtract endpoints or count across zero.', '13 - (-11) = 24.'),
      q(11, 'choice', 'Which integer has the greatest absolute value?', '-42', 'Absolute value is distance from zero.', '|-42| is 42, the greatest distance.', { distractors: ['35', '-18', '0'] }),
      q(12, 'numeric', 'Start at -7. Move right 19, then left 5. Where are you?', '7', 'Compute -7 + 19 - 5.', '-7 + 19 - 5 = 7.'),
      q(13, 'choice', 'Which comparison is true?', '-12 < -5', 'Farther left is smaller.', '-12 is less than -5.', { distractors: ['-12 > -5', '-2 < -9', '0 < -1'] }),
    ],
    4: [
      q(0, 'numeric', 'Estimate 298 x 42 using 300 x 40.', '12000', 'Round to friendly numbers.', '300 x 40 = 12,000.'),
      q(1, 'numeric', 'Estimate 6,842 + 3,197 using 6,800 + 3,200.', '10000', 'Add the rounded numbers.', '6,800 + 3,200 = 10,000.'),
      q(2, 'numeric', 'Estimate 49 x 21 using 50 x 20.', '1000', 'Multiply the friendly numbers.', '50 x 20 = 1,000.'),
      q(3, 'choice', 'Is 7,638 reasonable for 402 x 19?', 'Yes, because 400 x 20 is about 8,000.', 'Use an estimate near the exact answer.', '402 x 19 is close to 400 x 20 = 8,000.', { distractors: ['No, it should be near 80,000.', 'No, it should be near 800.', 'Yes, because 402 + 19 is 421.'] }),
      q(4, 'numeric', 'Round 14,682 to the nearest hundred.', '14700', 'Look at the tens digit.', '14,682 rounds to 14,700.'),
      q(5, 'numeric', 'Round 5,249 to the nearest thousand.', '5000', 'Look at the hundreds digit.', '5,249 rounds to 5,000.'),
      q(6, 'numeric', 'Estimate 78 x 62 using 80 x 60.', '4800', 'Use friendly tens.', '80 x 60 = 4,800.'),
      q(7, 'choice', 'Which exact answer is most reasonable for 31 x 19?', '589', 'Estimate 30 x 20 = 600.', '589 is close to 600.', { distractors: ['58,900', '59', '5,890'] }),
      q(8, 'numeric', 'Estimate 8 x 39 using 8 x 40.', '320', 'Round 39 to 40.', '8 x 40 = 320.'),
      q(9, 'numeric', 'Estimate 612 x 48 using 600 x 50.', '30000', 'Round both factors.', '600 x 50 = 30,000.'),
      q(10, 'numeric', 'Round 983,451 to the nearest ten thousand.', '980000', 'Look at the thousands digit.', '983,451 rounds to 980,000.'),
      q(11, 'choice', 'Which estimate is best for 19,870 ÷ 41?', '20,000 ÷ 40 = 500', 'Use friendly numbers.', '19,870 is close to 20,000 and 41 is close to 40.', { distractors: ['2,000 ÷ 40 = 50', '20,000 x 40 = 800,000', '20,000 ÷ 4 = 5,000'] }),
      q(12, 'numeric', 'Estimate 7,905 - 3,112 using 7,900 - 3,100.', '4800', 'Subtract rounded numbers.', '7,900 - 3,100 = 4,800.'),
      q(13, 'choice', 'An answer of 82,000 for 398 x 21 is...', 'unreasonable; it should be near 8,000', 'Estimate 400 x 20.', '400 x 20 = 8,000, not 82,000.', { distractors: ['reasonable; 398 x 21 is near 82,000', 'too small; it should be near 800,000', 'impossible to estimate'] }),
    ],
    5: [
      q(0, 'numeric', 'Compute 36 x 24.', '864', 'Use partial products or standard algorithm.', '36 x 24 = 864.'),
      q(1, 'numeric', 'Compute 125 ÷ 6. What is the quotient?', '20', '6 x 20 = 120.', '125 ÷ 6 = 20 remainder 5.'),
      q(2, 'numeric', 'Compute the remainder in 125 ÷ 6.', '5', 'Subtract 120 from 125.', '125 - 120 = 5.'),
      q(3, 'numeric', 'Evaluate 6 + 4 x 5.', '26', 'Multiply before adding.', '6 + 20 = 26.'),
      q(4, 'numeric', 'Evaluate (6 + 4) x 5.', '50', 'Parentheses first.', '10 x 5 = 50.'),
      q(5, 'numeric', 'Evaluate 48 ÷ 6 + 7 x 3.', '29', 'Division and multiplication first.', '8 + 21 = 29.'),
      q(6, 'numeric', 'Compute 24 x 13.', '312', 'Use 24 x 10 plus 24 x 3.', '240 + 72 = 312.'),
      q(7, 'numeric', 'Compute 408 ÷ 12.', '34', '12 x 34 = 408.', '408 ÷ 12 = 34.'),
      q(8, 'numeric', 'Evaluate 9 x (14 - 6) + 5.', '77', 'Parentheses first.', '9 x 8 + 5 = 77.'),
      q(9, 'numeric', 'Compute 47 x 32.', '1504', 'Use partial products.', '47 x 32 = 47 x 30 + 47 x 2 = 1,504.'),
      q(10, 'numeric', 'Compute 936 ÷ 24.', '39', '24 x 39 = 936.', '936 ÷ 24 = 39.'),
      q(11, 'numeric', 'Evaluate 72 ÷ (3 x 4) + 18.', '24', 'Parentheses first.', '72 ÷ 12 + 18 = 6 + 18 = 24.'),
      q(12, 'numeric', 'Evaluate 5 x 8 + 36 ÷ 6 - 7.', '39', 'Multiply/divide first.', '40 + 6 - 7 = 39.'),
      q(13, 'choice', 'Which expression equals 96?', '(8 + 4) x 8', 'Compute each expression.', '(8 + 4) x 8 = 12 x 8 = 96.', { distractors: ['8 + 4 x 8', '96 ÷ 8 + 4', '8 x 4 + 8'] }),
    ],
    6: [
      q(0, 'fill', 'List the greatest common factor of 18 and 24.', '6', 'Find the largest shared factor.', 'Factors of 18 and 24 share 1, 2, 3, 6. GCF is 6.'),
      q(1, 'numeric', 'What is the least common multiple of 6 and 8?', '24', 'List multiples until they match.', '6,12,18,24 and 8,16,24.'),
      q(2, 'choice', 'Which number is prime?', '29', 'Prime has exactly two factors.', '29 has factors 1 and 29.', { distractors: ['21', '27', '33'] }),
      q(3, 'choice', 'Which number is composite?', '35', 'Composite has more than two factors.', '35 = 5 x 7.', { distractors: ['31', '37', '41'] }),
      q(4, 'numeric', 'How many factors does 16 have?', '5', 'List 1, 2, 4, 8, 16.', '16 has 5 positive factors.'),
      q(5, 'numeric', 'What is the 7th multiple of 9?', '63', 'Multiply 9 by 7.', '9 x 7 = 63.'),
      q(6, 'fill', 'Complete the factor pair: 42 = 6 x ___.', '7', 'Divide 42 by 6.', '42 ÷ 6 = 7.'),
      q(7, 'numeric', 'Find the GCF of 36 and 60.', '12', 'Largest shared factor.', '36 and 60 have GCF 12.'),
      q(8, 'numeric', 'Find the LCM of 4 and 10.', '20', 'First shared multiple.', '4,8,12,16,20 and 10,20.'),
      q(9, 'numeric', 'Find the GCF of 45 and 75.', '15', 'Largest shared factor.', 'GCF is 15.'),
      q(10, 'numeric', 'Find the LCM of 9 and 12.', '36', 'First shared multiple.', '9,18,27,36 and 12,24,36.'),
      q(11, 'choice', 'Which number has exactly two factors?', '43', 'That is prime.', '43 has only 1 and 43.', { distractors: ['39', '45', '49'] }),
      q(12, 'fill', 'Complete: the factor pairs of 28 include 1 x 28, 2 x 14, and 4 x ___.', '7', '28 divided by 4.', '4 x 7 = 28.'),
      q(13, 'numeric', 'How many multiples of 6 are less than 40?', '6', '6, 12, 18, 24, 30, 36.', 'There are 6.'),
    ],
    7: [
      q(0, 'fill', 'Simplify 6/8.', '3/4', 'Divide numerator and denominator by 2.', '6/8 = 3/4.'),
      q(1, 'fill', 'What fraction is equivalent to 2/3 with denominator 12?', '8/12', 'Multiply numerator and denominator by 4.', '2/3 = 8/12.'),
      q(2, 'choice', 'Which fraction is equal to 3/5?', '9/15', 'Multiply numerator and denominator by the same number.', '3/5 x 3/3 = 9/15.', { distractors: ['6/15', '9/10', '12/15'] }),
      q(3, 'fill', 'Simplify 12/18.', '2/3', 'Divide by the GCF, 6.', '12/18 = 2/3.'),
      q(4, 'choice', 'Which is greater?', '5/8', 'Use common denominator or benchmark half.', '5/8 is greater than 3/8.', { distractors: ['3/8', 'They are equal', 'Cannot compare'] }),
      q(5, 'fill', 'Put 4/6 in simplest form.', '2/3', 'Divide both parts by 2.', '4/6 = 2/3.'),
      q(6, 'numeric', 'In 7/9, what is the denominator?', '9', 'Denominator names total equal parts.', 'The denominator is 9.'),
      q(7, 'numeric', 'In 7/9, what is the numerator?', '7', 'Numerator counts selected parts.', 'The numerator is 7.'),
      q(8, 'choice', 'Which fraction is closest to 1 whole?', '9/10', 'A fraction near 1 has numerator close to denominator.', '9/10 is closest to 1.', { distractors: ['1/10', '3/10', '5/10'] }),
      q(9, 'fill', 'Simplify 15/25.', '3/5', 'Divide by 5.', '15/25 = 3/5.'),
      q(10, 'fill', 'Make an equivalent fraction: 5/6 = ___/24.', '20/24', 'Multiply by 4.', '5/6 = 20/24.'),
      q(11, 'choice', 'Which is greater?', '7/12', 'Use denominator 12.', '7/12 > 5/12.', { distractors: ['5/12', 'They are equal', 'Cannot compare'] }),
      q(12, 'fill', 'Simplify 21/28.', '3/4', 'Divide by 7.', '21/28 = 3/4.'),
      q(13, 'choice', 'Which fraction equals 0.75?', '3/4', 'Three fourths is seventy-five hundredths.', '3/4 = 0.75.', { distractors: ['1/4', '2/5', '7/10'] }),
    ],
    8: [
      q(0, 'fill', 'Compute 1/2 + 1/4.', '3/4', 'Convert 1/2 to 2/4.', '2/4 + 1/4 = 3/4.'),
      q(1, 'fill', 'Compute 2/3 + 1/6.', '5/6', 'Use denominator 6.', '4/6 + 1/6 = 5/6.'),
      q(2, 'fill', 'Compute 5/6 - 1/3.', '1/2', 'Convert 1/3 to 2/6.', '5/6 - 2/6 = 3/6 = 1/2.'),
      q(3, 'fill', 'Compute 3/4 + 1/8.', '7/8', 'Use denominator 8.', '6/8 + 1/8 = 7/8.'),
      q(4, 'fill', 'Compute 7/10 - 1/5.', '1/2', 'Convert 1/5 to 2/10.', '7/10 - 2/10 = 5/10 = 1/2.'),
      q(5, 'fill', 'Compute 1/3 + 1/4.', '7/12', 'Use denominator 12.', '4/12 + 3/12 = 7/12.'),
      q(6, 'fill', 'Compute 5/8 + 1/4.', '7/8', 'Convert 1/4 to 2/8.', '5/8 + 2/8 = 7/8.'),
      q(7, 'fill', 'Compute 1 1/2 + 2 1/4.', '3 3/4', 'Add wholes and fractions.', '1 1/2 + 2 1/4 = 3 3/4.'),
      q(8, 'fill', 'Compute 4/5 - 1/10.', '7/10', 'Use denominator 10.', '8/10 - 1/10 = 7/10.'),
      q(9, 'fill', 'Compute 2/5 + 3/10.', '7/10', 'Convert 2/5 to 4/10.', '4/10 + 3/10 = 7/10.'),
      q(10, 'fill', 'Compute 7/12 - 1/6.', '5/12', 'Convert 1/6 to 2/12.', '7/12 - 2/12 = 5/12.'),
      q(11, 'fill', 'Compute 2 2/3 + 1 1/6.', '3 5/6', 'Add wholes and sixths.', '2 4/6 + 1 1/6 = 3 5/6.'),
      q(12, 'fill', 'Compute 5/6 + 3/4.', '1 7/12', 'Use denominator 12.', '10/12 + 9/12 = 19/12 = 1 7/12.'),
      q(13, 'fill', 'Compute 3 1/5 - 1 3/10.', '1 9/10', 'Use tenths.', '3 2/10 - 1 3/10 = 1 9/10.'),
    ],
    9: [
      q(0, 'fill', 'Compute 2/3 x 3/5.', '2/5', 'Multiply, then simplify.', '6/15 = 2/5.'),
      q(1, 'fill', 'Compute 4 x 1/3.', '4/3', 'Whole number times numerator.', '4 x 1/3 = 4/3.'),
      q(2, 'fill', 'Write 4/3 as a mixed number.', '1 1/3', '3/3 makes 1 whole.', '4/3 = 1 1/3.'),
      q(3, 'fill', 'Compute 1/2 x 1/3.', '1/6', 'Multiply numerators and denominators.', '1/2 x 1/3 = 1/6.'),
      q(4, 'fill', 'Compute 3/4 x 4/5.', '3/5', 'Multiply and simplify.', '12/20 = 3/5.'),
      q(5, 'fill', 'Compute 2/5 x 10.', '4', '10 x 2/5 = 20/5.', '20/5 = 4.'),
      q(6, 'fill', 'Compute 5/6 x 3/10.', '1/4', 'Multiply and simplify.', '15/60 = 1/4.'),
      q(7, 'fill', 'What is 1/4 of 20?', '5', 'Of means multiply.', '20 x 1/4 = 5.'),
      q(8, 'fill', 'Compute 2/3 of 18.', '12', '18 divided into thirds, then take 2 parts.', '18 x 2/3 = 12.'),
      q(9, 'fill', 'Compute 3/8 x 4/9.', '1/6', 'Multiply and simplify.', '12/72 = 1/6.'),
      q(10, 'fill', 'Compute 7/10 x 5/14.', '1/4', 'Cancel or multiply then simplify.', '35/140 = 1/4.'),
      q(11, 'fill', 'Find 3/5 of 45.', '27', 'Divide by 5, then multiply by 3.', '45 x 3/5 = 27.'),
      q(12, 'fill', 'Compute 2 1/2 x 4.', '10', '2.5 times 4.', '2 1/2 x 4 = 10.'),
      q(13, 'choice', 'Which product is less than 1?', '2/3 x 3/4', 'A proper fraction times a proper fraction is less than each factor.', '2/3 x 3/4 = 1/2.', { distractors: ['3 x 2/3', '5/4 x 2', '4 x 1/2'] }),
    ],
    10: [
      q(0, 'numeric', 'Compute 2 ÷ 1/3.', '6', 'How many thirds fit in 2?', 'There are 6 thirds in 2.'),
      q(1, 'fill', 'Compute 3/4 ÷ 3.', '1/4', 'Share 3/4 into 3 equal parts.', '3/4 ÷ 3 = 1/4.'),
      q(2, 'numeric', 'Compute 3/4 ÷ 1/8.', '6', 'How many eighths are in 3/4?', '3/4 = 6/8.'),
      q(3, 'numeric', 'Compute 5 ÷ 1/5.', '25', 'How many fifths are in 5 wholes?', '5 x 5 = 25.'),
      q(4, 'fill', 'Compute 2/3 ÷ 4.', '1/6', 'Divide by 4 means multiply by 1/4.', '2/3 x 1/4 = 2/12 = 1/6.'),
      q(5, 'numeric', 'Compute 4/5 ÷ 1/10.', '8', 'Convert 4/5 to tenths.', '4/5 = 8/10.'),
      q(6, 'fill', 'Compute 1/2 ÷ 1/4.', '2', 'How many fourths fit in one half?', '1/2 = 2/4.'),
      q(7, 'numeric', 'Compute 6 ÷ 1/2.', '12', 'How many halves are in 6?', '6 x 2 = 12.'),
      q(8, 'fill', 'Compute 3/5 ÷ 2.', '3/10', 'Multiply by 1/2.', '3/5 x 1/2 = 3/10.'),
      q(9, 'numeric', 'Compute 4 ÷ 1/8.', '32', 'How many eighths in 4?', '4 x 8 = 32.'),
      q(10, 'fill', 'Compute 5/6 ÷ 1/3.', '5/2', 'Multiply by 3.', '5/6 x 3 = 15/6 = 5/2.'),
      q(11, 'numeric', 'Compute 7/10 ÷ 1/10.', '7', 'How many tenths in seven tenths?', '7/10 contains 7 tenths.'),
      q(12, 'fill', 'Compute 2/5 ÷ 3.', '2/15', 'Multiply by 1/3.', '2/5 x 1/3 = 2/15.'),
      q(13, 'choice', 'Which division means “how many sixths fit in 2 wholes”?', '2 ÷ 1/6', 'Measurement division asks how many of the unit fit.', '2 ÷ 1/6 asks how many sixths are in 2.', { distractors: ['1/6 ÷ 2', '2 x 1/6', '2 + 1/6'] }),
    ],
    11: [
      q(0, 'fill', 'Write 3.472 in expanded form: 3 + 4/10 + ___/100 + 2/1000.', '7', 'The hundredths digit is 7.', '3.472 has 7 hundredths.'),
      q(1, 'fill', 'Write 0.47 as a fraction.', '47/100', 'Forty-seven hundredths.', '0.47 = 47/100.'),
      q(2, 'choice', 'Which is greater?', '3.501', 'Compare tenths first.', '3.501 > 3.472 because 5 tenths > 4 tenths.', { distractors: ['3.472', 'They are equal', 'Cannot compare'] }),
      q(3, 'fill', 'Round 3.472 to the nearest tenth.', '3.5', 'Look at the hundredths digit.', '3.472 rounds to 3.5.'),
      q(4, 'choice', 'Which decimal is equal to 0.5?', '0.50', 'Trailing zeros do not change value.', '0.5 = 0.50.', { distractors: ['0.05', '5.0', '0.005'] }),
      q(5, 'choice', 'Which time is shorter?', '12.08', 'Compare tenths then hundredths.', '12.08 < 12.80.'),
      q(6, 'numeric', 'What digit is in the thousandths place of 6.819?', '9', 'Third digit to the right of decimal.', 'The thousandths digit is 9.'),
      q(7, 'fill', 'Write 5 + 3/10 + 2/100 as a decimal.', '5.32', 'Tenths and hundredths.', '5 + 0.3 + 0.02 = 5.32.'),
      q(8, 'choice', 'Order from least to greatest.', '0.09, 0.3, 0.45, 0.5', 'Compare using hundredths.', '0.09 < 0.30 < 0.45 < 0.50.', { distractors: ['0.5, 0.45, 0.3, 0.09', '0.3, 0.09, 0.45, 0.5', '0.09, 0.45, 0.3, 0.5'] }),
      q(9, 'fill', 'Write 0.306 as a fraction.', '306/1000', 'Three hundred six thousandths.', '0.306 = 306/1000.'),
      q(10, 'choice', 'Which is greater?', '0.709', 'Compare thousandths after tenths/hundredths.', '0.709 > 0.701.', { distractors: ['0.701', 'They are equal', '0.071'] }),
      q(11, 'fill', 'Round 18.946 to the nearest hundredth.', '18.95', 'Look at the thousandths digit.', '18.946 rounds to 18.95.'),
      q(12, 'fill', 'Write 9 + 6/100 + 4/1000 as a decimal.', '9.064', 'No tenths, 6 hundredths, 4 thousandths.', '9.064.'),
      q(13, 'choice', 'Which decimal equals 4.2?', '4.200', 'Trailing zeros keep value the same.', '4.2 = 4.200.', { distractors: ['4.02', '4.002', '42.00'] }),
    ],
    12: [
      q(0, 'fill', 'Compute 2.75 + 3.40.', '6.15', 'Line up decimal points.', '2.75 + 3.40 = 6.15.'),
      q(1, 'fill', 'Compute 6.15 - 1.25.', '4.90', 'Subtract hundredths and tenths.', '6.15 - 1.25 = 4.90.'),
      q(2, 'fill', 'Compute 2.75 x 3.', '8.25', 'Multiply 275 cents by 3.', '2.75 x 3 = 8.25.'),
      q(3, 'fill', 'Compute 2 x 4.80 + 1.75.', '11.35', 'Multiply first.', '9.60 + 1.75 = 11.35.'),
      q(4, 'fill', 'Compute 7.2 + 0.85.', '8.05', 'Write 7.20 + 0.85.', '7.20 + 0.85 = 8.05.'),
      q(5, 'fill', 'Compute 10 - 3.48.', '6.52', 'Use 10.00 - 3.48.', '10.00 - 3.48 = 6.52.'),
      q(6, 'fill', 'Compute 0.6 x 8.', '4.8', 'Six tenths times 8.', '0.6 x 8 = 4.8.'),
      q(7, 'fill', 'Compute 3.25 x 4.', '13', '325 cents times 4.', '3.25 x 4 = 13.00.'),
      q(8, 'choice', 'Which estimate best checks 2.75 x 3?', '3 x 3 = 9', 'Round 2.75 to 3.', '2.75 x 3 is close to 9.', { distractors: ['2 x 3 = 6', '30 x 3 = 90', '3 + 3 = 6'] }),
      q(9, 'fill', 'Compute 18.4 - 7.95.', '10.45', 'Line up decimals.', '18.40 - 7.95 = 10.45.'),
      q(10, 'fill', 'Compute 6.08 + 14.7.', '20.78', 'Write 14.70.', '6.08 + 14.70 = 20.78.'),
      q(11, 'fill', 'Compute 0.25 x 12.', '3', 'A quarter of 12.', '0.25 x 12 = 3.'),
      q(12, 'fill', 'Compute 4.6 x 7.', '32.2', '46 tenths times 7.', '4.6 x 7 = 32.2.'),
      q(13, 'fill', 'A snack costs $2.35. How much for 6 snacks?', '14.10', 'Multiply money by 6.', '2.35 x 6 = 14.10.'),
    ],
    13: [
      q(0, 'fill', 'Compute 12.60 ÷ 3.', '4.20', 'Split dollars and cents equally.', '12.60 ÷ 3 = 4.20.'),
      q(1, 'fill', 'Compute 8.75 ÷ 5.', '1.75', '875 cents divided by 5.', '8.75 ÷ 5 = 1.75.'),
      q(2, 'fill', 'Compute 4.50 ÷ 3.', '1.50', '450 cents divided by 3.', '4.50 ÷ 3 = 1.50.'),
      q(3, 'fill', 'Compute 5.20 ÷ 4.', '1.30', '520 cents divided by 4.', '5.20 ÷ 4 = 1.30.'),
      q(4, 'fill', 'Compute 26.80 ÷ 4.', '6.70', 'Divide 2680 cents by 4.', '26.80 ÷ 4 = 6.70.'),
      q(5, 'fill', 'A 6-pack costs $9.00. What is the cost per item?', '1.50', 'Divide total cost by 6.', '9.00 ÷ 6 = 1.50.'),
      q(6, 'fill', 'A runner travels 7.5 miles in 3 hours. Miles per hour?', '2.5', 'Distance divided by time.', '7.5 ÷ 3 = 2.5.'),
      q(7, 'fill', 'Compute 3.6 ÷ 9.', '0.4', '36 tenths divided by 9.', '3.6 ÷ 9 = 0.4.'),
      q(8, 'fill', 'Compute 14.4 ÷ 12.', '1.2', '144 tenths divided by 12.', '14.4 ÷ 12 = 1.2.'),
      q(9, 'fill', 'A 4.8 kg bag is split equally among 6 people. How many kg per person?', '0.8', 'Divide 4.8 by 6.', '4.8 ÷ 6 = 0.8.'),
      q(10, 'fill', 'A 7.50 dollar pack has 3 items. Cost per item?', '2.50', 'Divide by 3.', '7.50 ÷ 3 = 2.50.'),
      q(11, 'fill', 'Compute 9.6 ÷ 8.', '1.2', '96 tenths divided by 8.', '9.6 ÷ 8 = 1.2.'),
      q(12, 'fill', 'A car travels 27.5 miles in 5 hours. Miles per hour?', '5.5', 'Distance divided by time.', '27.5 ÷ 5 = 5.5.'),
      q(13, 'choice', 'Which unit rate is lower?', '$1.20 each', 'Compare cost per one.', '$1.20 is lower than $1.35, $1.50, and $2.00.', { distractors: ['$1.35 each', '$1.50 each', '$2.00 each'] }),
    ],
    14: [
      q(0, 'fill', 'Write 50% as a fraction in simplest form.', '1/2', '50 out of 100.', '50/100 = 1/2.'),
      q(1, 'fill', 'Write 25% as a decimal.', '0.25', 'Percent means out of 100.', '25% = 0.25.'),
      q(2, 'numeric', 'Find 25% of 80.', '20', '25% is one fourth.', '80 ÷ 4 = 20.'),
      q(3, 'numeric', 'Find 25% of 48.', '12', 'One fourth of 48.', '48 ÷ 4 = 12.'),
      q(4, 'numeric', 'A $48 item is 25% off. What is the sale price?', '36', 'Subtract the discount.', '48 - 12 = 36.'),
      q(5, 'numeric', 'Find 30% of 60.', '18', '10% is 6, so 30% is 18.', '60 x 0.30 = 18.'),
      q(6, 'numeric', 'A $60 item is 30% off. What is the sale price?', '42', 'Subtract the discount.', '60 - 18 = 42.'),
      q(7, 'fill', 'Write 75% as a fraction in simplest form.', '3/4', '75/100 simplifies.', '75/100 = 3/4.'),
      q(8, 'fill', 'Write 0.6 as a percent.', '60%', 'Move from decimal to percent.', '0.6 = 60%.'),
      q(9, 'numeric', 'Find 10% of 250.', '25', 'Move one decimal place or divide by 10.', '250 ÷ 10 = 25.'),
      q(10, 'numeric', 'Find 15% of 200.', '30', '10% is 20 and 5% is 10.', '15% of 200 = 30.'),
      q(11, 'numeric', 'A $120 item is 20% off. What is the discount?', '24', '20% is one fifth.', '120 x 0.20 = 24.'),
      q(12, 'numeric', 'A $120 item is 20% off. What is the sale price?', '96', 'Subtract discount from original price.', '120 - 24 = 96.'),
      q(13, 'fill', 'Write 3/5 as a percent.', '60%', '3 divided by 5 is 0.6.', '3/5 = 60%.'),
    ],
    15: [
      q(0, 'numeric', 'Find the mean of 6, 9, 5, 4.', '6', 'Add and divide by 4.', '24 ÷ 4 = 6.'),
      q(1, 'fill', 'Find the median of 4, 5, 6, 9.', '5.5', 'Average the two middle values.', '(5 + 6) ÷ 2 = 5.5.'),
      q(2, 'numeric', 'Find the range of 4, 5, 6, 9.', '5', 'Largest minus smallest.', '9 - 4 = 5.'),
      q(3, 'fill', 'Find the mode of 10, 20, 20, 30, 40.', '20', 'Mode appears most often.', '20 appears twice.'),
      q(4, 'numeric', 'Find the mean of 10, 20, 20, 30, 40.', '24', 'Sum is 120, divide by 5.', '120 ÷ 5 = 24.'),
      q(5, 'numeric', 'Find the median of 10, 20, 20, 30, 40.', '20', 'Middle value in order.', 'The median is 20.'),
      q(6, 'numeric', 'Find the range of 10, 20, 20, 30, 40.', '30', '40 minus 10.', 'Range = 30.'),
      q(7, 'numeric', 'A survey has Apple 6, Mango 9, Grape 5, Pear 4. How many votes total?', '24', 'Add all categories.', '6 + 9 + 5 + 4 = 24.'),
      q(8, 'choice', 'Which fruit is the mode: Apple 6, Mango 9, Grape 5, Pear 4?', 'Mango', 'Mode has greatest frequency.', 'Mango has 9 votes.', { distractors: ['Apple', 'Grape', 'Pear'] }),
      q(9, 'numeric', 'Find the mean of 8, 12, 15, 17.', '13', 'Add and divide by 4.', '52 ÷ 4 = 13.'),
      q(10, 'numeric', 'Find the median of 3, 7, 8, 12, 20.', '8', 'Middle value.', 'The median is 8.'),
      q(11, 'numeric', 'Find the range of 13, 4, 18, 9, 11.', '14', '18 - 4.', 'Range = 14.'),
      q(12, 'fill', 'Find the mode of 2, 3, 3, 5, 7, 7, 7.', '7', 'Most frequent.', '7 appears three times.'),
      q(13, 'choice', 'Which set has range 9?', '1, 4, 10', 'Largest minus smallest.', '10 - 1 = 9.', { distractors: ['2, 5, 8', '3, 3, 3', '10, 12, 15'] }),
    ],
    16: [
      q(0, 'numeric', 'Pattern 4, 7, 10, 13. What is the next term?', '16', 'Add 3 each time.', '13 + 3 = 16.'),
      q(1, 'numeric', 'For M = 3n + 1, find M when n = 10.', '31', 'Substitute 10.', '3 x 10 + 1 = 31.'),
      q(2, 'numeric', 'For M = 3n + 1, find M when n = 6.', '19', 'Substitute 6.', '3 x 6 + 1 = 19.'),
      q(3, 'fill', 'A row pattern starts at 8 and adds 2 each row. How many seats in row 5?', '16', 'Use 8 + 2(r - 1).', '8 + 2(5 - 1) = 16.'),
      q(4, 'fill', 'Complete the recursive rule for 4, 7, 10, 13: start at 4 and add ___.', '3', 'Find the difference.', 'Each term increases by 3.'),
      q(5, 'numeric', 'For seats = 8 + 2(r - 1), find seats when r = 12.', '30', 'Substitute 12.', '8 + 2(11) = 30.'),
      q(6, 'numeric', 'Sequence 5, 9, 13, 17. What is term 8?', '33', 'Rule is 4n + 1.', '4 x 8 + 1 = 33.'),
      q(7, 'choice', 'Which rule matches 4, 7, 10, 13?', 'M = 3n + 1', 'Test n = 1 gives 4.', '3n + 1 gives 4, 7, 10, 13.', { distractors: ['M = 4n', 'M = n + 3', 'M = 3n - 1'] }),
      q(8, 'numeric', 'Pattern adds 6 each time. If term 1 is 11, what is term 4?', '29', 'Add 6 three times.', '11 + 18 = 29.'),
      q(9, 'numeric', 'Rule y = 5n - 2. Find y when n = 9.', '43', 'Substitute 9.', '5 x 9 - 2 = 43.'),
      q(10, 'numeric', 'Sequence 2, 6, 10, 14. What is term 12?', '46', 'Rule is 4n - 2.', '4 x 12 - 2 = 46.'),
      q(11, 'choice', 'Which explicit rule matches 7, 12, 17, 22?', 'A = 5n + 2', 'Test n = 1.', '5(1)+2=7 and add 5 each term.', { distractors: ['A = 7n', 'A = 5n - 2', 'A = n + 5'] }),
      q(12, 'numeric', 'A tile pattern starts with 10 tiles and adds 4 each figure. How many tiles in figure 6?', '30', '10 + 4(6 - 1).', '10 + 20 = 30.'),
      q(13, 'numeric', 'If term 1 is 3 and the rule adds 8 each time, what is term 7?', '51', 'Add 8 six times.', '3 + 48 = 51.'),
    ],
    17: [
      q(0, 'numeric', 'Solve x + 7 = 23.', '16', 'Subtract 7 from both sides.', 'x = 16.'),
      q(1, 'numeric', 'Solve 3x = 18.', '6', 'Divide both sides by 3.', 'x = 6.'),
      q(2, 'numeric', 'Solve 2x + 5 = 17.', '6', 'Subtract 5, then divide by 2.', '2x = 12, x = 6.'),
      q(3, 'numeric', 'Solve 3m + 4 = 22.', '6', 'Subtract 4, then divide by 3.', '3m = 18, m = 6.'),
      q(4, 'numeric', 'Evaluate 4x + 3 when x = 5.', '23', 'Substitute 5.', '4(5) + 3 = 23.'),
      q(5, 'numeric', 'Solve y - 9 = 14.', '23', 'Add 9 to both sides.', 'y = 23.'),
      q(6, 'numeric', 'Solve a/4 = 7.', '28', 'Multiply both sides by 4.', 'a = 28.'),
      q(7, 'numeric', 'Solve 5p - 6 = 29.', '7', 'Add 6, then divide by 5.', '5p = 35, p = 7.'),
      q(8, 'choice', 'Which equation matches: five more than twice a number is 19?', '2x + 5 = 19', 'Twice a number is 2x.', 'Five more than twice a number is 2x + 5.', { distractors: ['5x + 2 = 19', '2 + 5x = 19', '2x - 5 = 19'] }),
      q(9, 'numeric', 'Solve 4x + 8 = 36.', '7', 'Subtract 8, divide by 4.', '4x = 28, x = 7.'),
      q(10, 'numeric', 'Solve 6n - 9 = 45.', '9', 'Add 9, divide by 6.', '6n = 54, n = 9.'),
      q(11, 'numeric', 'Evaluate 2a + 3b when a = 4 and b = 7.', '29', 'Substitute both variables.', '8 + 21 = 29.'),
      q(12, 'choice', 'Which expression means “three times a number decreased by 4”?', '3x - 4', 'Three times a number is 3x.', 'Decreased by 4 means subtract 4.', { distractors: ['3 - 4x', '4 - 3x', '3x + 4'] }),
      q(13, 'numeric', 'Solve x/5 + 3 = 11.', '40', 'Subtract 3, then multiply by 5.', 'x/5 = 8, x = 40.'),
    ],
    18: [
      q(0, 'choice', 'Which point is different from (3,5)?', '(5,3)', 'Coordinate pairs are ordered.', '(3,5) and (5,3) are different.', { distractors: ['(3,5)', 'x=3, y=5', '3 right, 5 up'] }),
      q(1, 'fill', 'What is the origin as an ordered pair?', '(0,0)', 'Origin is where axes meet.', 'The origin is (0,0).'),
      q(2, 'numeric', 'Rule: distance = 12 x time. What is distance when time = 3?', '36', 'Multiply 12 by 3.', '12 x 3 = 36.'),
      q(3, 'fill', 'Rule: y = 4x + 1. What is y when x = 5?', '21', 'Substitute 5.', '4 x 5 + 1 = 21.'),
      q(4, 'fill', 'For point (7,2), what is the x-coordinate?', '7', 'x comes first.', 'The x-coordinate is 7.'),
      q(5, 'fill', 'For point (7,2), what is the y-coordinate?', '2', 'y comes second.', 'The y-coordinate is 2.'),
      q(6, 'numeric', 'A cyclist travels 12 km each hour. How far in 5 hours?', '60', 'Rate times time.', '12 x 5 = 60.'),
      q(7, 'choice', 'Which point is on y = 12x?', '(2,24)', 'Test x = 2.', '12 x 2 = 24.', { distractors: ['(2,12)', '(24,2)', '(3,24)'] }),
      q(8, 'numeric', 'If y = 3x, what is y when x = 9?', '27', 'Multiply by 3.', '3 x 9 = 27.'),
      q(9, 'fill', 'For point (4,9), write the ordered pair after moving 3 right and 2 down.', '(7,7)', 'Add to x, subtract from y.', '(4+3, 9-2) = (7,7).'),
      q(10, 'numeric', 'Rule y = 2x + 5. What is y when x = 8?', '21', 'Substitute 8.', '2 x 8 + 5 = 21.'),
      q(11, 'choice', 'Which point has x-coordinate 6?', '(6,11)', 'x is first.', '(6,11) has x = 6.', { distractors: ['(11,6)', '(5,6)', '(0,11)'] }),
      q(12, 'fill', 'A table has x=1,2,3 and y=5,10,15. What is the rule?', 'y = 5x', 'y is five times x.', 'The rule is y = 5x.'),
      q(13, 'numeric', 'Rule distance = 15 x time. How many hours for 75 km?', '5', 'Solve 15t = 75.', '75 ÷ 15 = 5.'),
    ],
    19: [
      q(0, 'numeric', 'Find the area of a rectangle 6 by 4.', '24', 'Area = length x width.', '6 x 4 = 24.', { unit: 'square units' }),
      q(1, 'numeric', 'Composite area: 4 x 5 + 3 x 3.', '29', 'Find both rectangles and add.', '20 + 9 = 29.'),
      q(2, 'numeric', 'Composite area: 7 x 5 - 3 x 2.', '29', 'Complete rectangle then subtract missing part.', '35 - 6 = 29.'),
      q(3, 'numeric', 'Find volume of a prism 6 by 3 by 4.', '72', 'Volume = length x width x height.', '6 x 3 x 4 = 72.', { unit: 'cubic units' }),
      q(4, 'numeric', 'Find area: 8 x 4 + 3 x 2.', '38', 'Add the two rectangle areas.', '32 + 6 = 38.'),
      q(5, 'numeric', 'Find area of a triangle with base 10 and height 6.', '30', 'Area = base x height ÷ 2.', '10 x 6 ÷ 2 = 30.'),
      q(6, 'numeric', 'Find volume of a box 5 by 4 by 3.', '60', 'Multiply the three dimensions.', '5 x 4 x 3 = 60.'),
      q(7, 'numeric', 'A rectangle has area 48 and width 6. What is its length?', '8', 'Length = area ÷ width.', '48 ÷ 6 = 8.'),
      q(8, 'numeric', 'Find perimeter of a 9 by 4 rectangle.', '26', 'Perimeter = 2L + 2W.', '18 + 8 = 26.'),
      q(9, 'numeric', 'A composite figure is a 10 by 6 rectangle with a 3 by 2 corner removed. Find area.', '54', 'Complete then subtract.', '10 x 6 - 3 x 2 = 54.'),
      q(10, 'numeric', 'Find volume of a prism 8 by 5 by 2.', '80', 'Multiply dimensions.', '8 x 5 x 2 = 80.'),
      q(11, 'numeric', 'A rectangle has perimeter 34 and length 10. What is width?', '7', '2L + 2W = 34.', '20 + 2W = 34, W = 7.'),
      q(12, 'numeric', 'Find area of a parallelogram with base 9 and height 6.', '54', 'Area = base x height.', '9 x 6 = 54.'),
      q(13, 'numeric', 'Find volume of a cube with side length 5.', '125', 'Volume = side cubed.', '5 x 5 x 5 = 125.'),
    ],
    20: [
      q(0, 'numeric', 'Find the mean of 10, 20, 20, 30, 40.', '24', 'Sum is 120, divide by 5.', '120 ÷ 5 = 24.'),
      q(1, 'numeric', 'Find the median of 10, 20, 20, 30, 40.', '20', 'Middle number.', 'Median is 20.'),
      q(2, 'numeric', 'Find the mode of 10, 20, 20, 30, 40.', '20', 'Most frequent value.', 'Mode is 20.'),
      q(3, 'numeric', 'Find the range of 10, 20, 20, 30, 40.', '30', 'Largest minus smallest.', '40 - 10 = 30.'),
      q(4, 'fill', 'Probability of impossible event as a number from 0 to 1.', '0', 'Impossible means never.', 'Impossible probability is 0.'),
      q(5, 'fill', 'Probability of certain event as a number from 0 to 1.', '1', 'Certain means always.', 'Certain probability is 1.'),
      q(6, 'fill', 'A bag has 3 red and 7 blue blocks. Probability of red?', '3/10', 'Favorable over total.', '3 red out of 10 total.'),
      q(7, 'fill', 'A spinner has 4 equal sections and 1 is green. Probability of green?', '1/4', 'One favorable section out of four.', 'Probability is 1/4.'),
      q(8, 'choice', 'Which graph best compares categories like favorite fruit?', 'bar graph', 'Bar graphs compare categories.', 'Favorite fruit is categorical data.', { distractors: ['line graph', 'coordinate plane', 'number line'] }),
      q(9, 'fill', 'A bag has 5 red, 3 blue, 2 green. Probability of blue?', '3/10', '3 blue out of 10 total.', 'P(blue) = 3/10.'),
      q(10, 'fill', 'A fair coin is flipped once. Probability of heads?', '1/2', 'One favorable outcome out of two.', 'P(heads) = 1/2.'),
      q(11, 'choice', 'Which event is most likely?', 'drawing a blue marble from 8 blue and 2 red', '8 out of 10 is high probability.', 'Blue has probability 8/10.', { distractors: ['drawing red from 8 blue and 2 red', 'rolling a 6 on a die', 'drawing green when there are no green marbles'] }),
      q(12, 'numeric', 'Find the mean of 5, 5, 10, 20.', '10', 'Sum is 40, divide by 4.', '40 ÷ 4 = 10.'),
      q(13, 'fill', 'Probability of rolling an even number on a fair die.', '1/2', 'Even outcomes are 2, 4, 6.', '3 out of 6 = 1/2.'),
    ],
  }

  return banks[episode] || []
}

function buildQuestions(lesson) {
  const episode = lesson.episode
  const ep = String(episode).padStart(2, '0')
  const points = [5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 10, 11, 12, 13, 15]
  const penalties = [1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6]
  const drills = topicDrills(episode, ep, lesson, points, penalties)
  return [...drills.slice(0, 14), conceptQuestion(ep, lesson, points, penalties)]
}

const course = {
  id: 'course-ib-pyp-g5-math',
  title: 'IB Big Math G5',
  description:
    'A Grade 5 IB Math core companion built around the concepts students actually need: video lessons, systematic practice, visible progress, and a strong bridge for preview and review.',
  category: 'ib-big-math',
  courseTrack: 'ib-big-math',
  status: 'active',
  accessLevel: 'paid',
  isFree: false,
  price: 29,
  thumbnailUrl: '/course-covers/ib-g5-cover.svg',
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

const preservedAdvancedLessons =
  existingCourse?.lessons?.filter((lesson) => Number(lesson.episode) > 20) || []

if (preservedAdvancedLessons.length) {
  course.lessons = [...course.lessons, ...preservedAdvancedLessons].sort((a, b) => a.episode - b.episode)
}

fs.writeFileSync(outputPath, `${JSON.stringify(course, null, 2)}\n`)
console.log(`Wrote ${outputPath}`)
