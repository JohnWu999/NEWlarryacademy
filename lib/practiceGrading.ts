export type PracticeQuestionForGrading = {
  id: string
  type: string
  prompt?: string
  choices?: string[]
  answer?: string | string[]
  alternativeAnswers?: string[]
  acceptableKeywords?: string[]
  answerPreview?: string
  points?: number
  penalty?: number
  tolerance?: number
  explanation?: string
  hint?: string
  visualAsset?: string
  visualCaption?: string
  grading?: {
    mode?: string
    validator?: string
    accepted_answers?: string[]
    required_concepts?: string[]
    tolerance?: number
    show_answer_on_wrong?: boolean
    show_answer_after_mastery?: boolean
  }
}

export type SubmittedPracticeAnswer = {
  questionId: string
  value: string | string[]
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\times/g, 'x')
    .replace(/\\div/g, '÷')
    .replace(/\{,\}/g, ',')
    .replace(/[.$]/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
}

function normalizeNumber(value: string) {
  const number = Number(normalize(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(number) ? number : null
}

function extractNumbers(value: string) {
  return value
    .match(/-?\d[\d,]*(?:\.\d+)?/g)
    ?.map((item) => Number(item.replace(/,/g, '')))
    .filter((item) => Number.isFinite(item)) || []
}

function getPromptProduct(prompt = '') {
  const source = prompt
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/\\times/g, 'x')
    .replace(/×/g, 'x')
  const match = source.match(/(-?\d[\d,]*(?:\.\d+)?)\s*(?:x|\*)\s*(-?\d[\d,]*(?:\.\d+)?)/i)
  if (!match) return null
  const left = Number(match[1].replace(/,/g, ''))
  const right = Number(match[2].replace(/,/g, ''))
  return Number.isFinite(left) && Number.isFinite(right) ? left * right : null
}

function isEstimateRangeQuestion(question: PracticeQuestionForGrading) {
  const prompt = normalize(question.prompt || '')
  return prompt.includes('underestimate') && prompt.includes('overestimate') && getPromptProduct(question.prompt) !== null
}

function isOpenResponseCorrect(question: PracticeQuestionForGrading, submittedValue: string) {
  const normalized = normalize(submittedValue)
  if (isEstimateRangeQuestion(question)) {
    const target = getPromptProduct(question.prompt)
    const numbers = extractNumbers(submittedValue)
    if (target === null || numbers.length < 2) return false
    return numbers.some((number) => number < target) && numbers.some((number) => number > target)
  }

  const keywords = [...(question.acceptableKeywords || []), ...(question.grading?.required_concepts || [])]
  const keywordHits = keywords.filter((keyword) => normalized.includes(normalize(keyword))).length
  return normalized.length >= 18 && (keywords.length === 0 || keywordHits >= Math.min(2, keywords.length))
}

export function isPracticeAnswerCorrect(question: PracticeQuestionForGrading, submitted?: SubmittedPracticeAnswer) {
  if (!submitted) return false
  const submittedValue = Array.isArray(submitted.value) ? submitted.value.join(' ') : String(submitted.value)
  if (question.type === 'open-response') {
    return isOpenResponseCorrect(question, submittedValue)
  }
  if (question.type === 'numeric-input') {
    const expected = normalizeNumber(String(question.answer))
    const actual = normalizeNumber(Array.isArray(submitted.value) ? submitted.value.join('') : String(submitted.value))
    if (expected === null || actual === null) return false
    return Math.abs(expected - actual) <= Number(question.tolerance ?? question.grading?.tolerance ?? 0.0001)
  }
  if (Array.isArray(question.answer)) {
    const expected = question.answer.map(normalize)
    const actual = Array.isArray(submitted.value) ? submitted.value.map(normalize) : [normalize(String(submitted.value))]
    if (question.type === 'multiple-select') {
      const sortedExpected = expected.sort()
      const sortedActual = actual.sort()
      return sortedExpected.length === sortedActual.length && sortedExpected.every((value, index) => value === sortedActual[index])
    }
    return expected.length === actual.length && expected.every((value, index) => value === actual[index])
  }

  const accepted = [question.answer, ...(question.alternativeAnswers || []), ...(question.grading?.accepted_answers || [])]
    .filter((value): value is string => typeof value === 'string')
    .map(normalize)
  const actual = normalize(submittedValue)
  return accepted.some((answer) => answer === actual || (answer.length >= 4 && actual.includes(answer)) || (actual.length >= 4 && answer.includes(actual)))
}

export function serializePracticeValue(value: string | string[] | undefined | null) {
  if (Array.isArray(value)) return JSON.stringify(value)
  return value == null ? '' : String(value)
}
