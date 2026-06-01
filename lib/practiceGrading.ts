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

export function isPracticeAnswerCorrect(question: PracticeQuestionForGrading, submitted?: SubmittedPracticeAnswer) {
  if (!submitted) return false
  const submittedValue = Array.isArray(submitted.value) ? submitted.value.join(' ') : String(submitted.value)
  if (question.type === 'open-response') {
    const normalized = normalize(submittedValue)
    const keywords = question.acceptableKeywords || []
    const keywordHits = keywords.filter((keyword) => normalized.includes(normalize(keyword))).length
    return normalized.length >= 18 && (keywords.length === 0 || keywordHits >= Math.min(2, keywords.length))
  }
  if (question.type === 'numeric-input') {
    const expected = normalizeNumber(String(question.answer))
    const actual = normalizeNumber(Array.isArray(submitted.value) ? submitted.value.join('') : String(submitted.value))
    if (expected === null || actual === null) return false
    return Math.abs(expected - actual) <= Number(question.tolerance || 0.0001)
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

  const accepted = [question.answer, ...(question.alternativeAnswers || [])]
    .filter((value): value is string => typeof value === 'string')
    .map(normalize)
  const actual = normalize(submittedValue)
  return accepted.some((answer) => answer === actual || (answer.length >= 4 && actual.includes(answer)) || (actual.length >= 4 && answer.includes(actual)))
}

export function serializePracticeValue(value: string | string[] | undefined | null) {
  if (Array.isArray(value)) return JSON.stringify(value)
  return value == null ? '' : String(value)
}
