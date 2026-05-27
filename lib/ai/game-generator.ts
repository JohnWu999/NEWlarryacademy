import OpenAI from 'openai'
import { GameConfig } from '@/types'

function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  })
}

const GAME_GENERATION_SYSTEM_PROMPT = `你是一个专业的数学游戏设计助手。你的任务是根据用户的自然语言描述，生成结构化的数学游戏配置。

游戏配置必须是有效的JSON格式，包含以下字段：
- title: 游戏标题（字符串）
- description: 游戏描述（字符串）
- gameType: 游戏类型（multiplication, addition, subtraction, division, geometry, fraction, algebra, custom之一）
- difficulty: 难度级别（easy, medium, hard之一）
- timeLimit: 时间限制（秒，数字，可选）
- questionCount: 问题数量（数字）
- config: 游戏特定配置（对象）
  - 对于算术游戏：包含 range（min和max）
  - 对于几何游戏：包含 shapes（形状数组）
  - 对于其他类型：根据需要自定义

示例输出：
{
  "title": "乘法表挑战",
  "description": "练习2-5的乘法表",
  "gameType": "multiplication",
  "difficulty": "easy",
  "timeLimit": 120,
  "questionCount": 10,
  "config": {
    "range": {
      "min": 2,
      "max": 5
    }
  }
}

只输出JSON，不要包含任何其他文字说明。`

export interface GenerateGameParams {
  userInput: string
  difficulty?: 'easy' | 'medium' | 'hard'
  ageGroup?: string
  topic?: string
}

export async function generateGame(params: GenerateGameParams) {
  try {
    const { userInput, difficulty, ageGroup, topic } = params

    let enhancedPrompt = userInput
    if (difficulty) enhancedPrompt += `\n难度：${difficulty}`
    if (ageGroup) enhancedPrompt += `\n年龄组：${ageGroup}`
    if (topic) enhancedPrompt += `\n主题：${topic}`

    const completion = await createOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: GAME_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: enhancedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('AI未返回有效响应')
    }

    // Parse JSON response
    const gameConfig = JSON.parse(responseText)

    // Validate required fields
    if (!gameConfig.title || !gameConfig.gameType) {
      throw new Error('生成的游戏配置缺少必要字段')
    }

    return {
      success: true,
      gameConfig,
    }
  } catch (error) {
    console.error('AI game generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成游戏失败',
    }
  }
}

export function generateSampleQuestions(gameConfig: GameConfig): any[] {
  const { gameType, questionCount, config } = gameConfig

  const questions = []

  switch (gameType) {
    case 'multiplication': {
      const { min = 1, max = 12 } = config.range || {}
      for (let i = 0; i < (questionCount || 10); i++) {
        const a = Math.floor(Math.random() * (max - min + 1)) + min
        const b = Math.floor(Math.random() * (max - min + 1)) + min
        questions.push({
          question: `${a} × ${b} = ?`,
          answer: a * b,
          type: 'multiple-choice',
          options: generateOptions(a * b),
        })
      }
      break
    }

    case 'addition': {
      const { min = 1, max = 100 } = config.range || {}
      for (let i = 0; i < (questionCount || 10); i++) {
        const a = Math.floor(Math.random() * (max - min + 1)) + min
        const b = Math.floor(Math.random() * (max - min + 1)) + min
        questions.push({
          question: `${a} + ${b} = ?`,
          answer: a + b,
          type: 'multiple-choice',
          options: generateOptions(a + b),
        })
      }
      break
    }

    case 'subtraction': {
      const { min = 1, max = 100 } = config.range || {}
      for (let i = 0; i < (questionCount || 10); i++) {
        const a = Math.floor(Math.random() * (max - min + 1)) + min
        const b = Math.floor(Math.random() * a) + 1
        questions.push({
          question: `${a} - ${b} = ?`,
          answer: a - b,
          type: 'multiple-choice',
          options: generateOptions(a - b),
        })
      }
      break
    }

    case 'geometry': {
      const shapes = config.shapes || ['circle', 'square', 'triangle', 'rectangle']
      for (let i = 0; i < (questionCount || 10); i++) {
        const shape = shapes[Math.floor(Math.random() * shapes.length)]
        questions.push({
          question: `识别这个形状`,
          answer: shape,
          type: 'shape-identification',
          shape,
        })
      }
      break
    }

    default: {
      // Generic questions
      for (let i = 0; i < (questionCount || 5); i++) {
        questions.push({
          question: `问题 ${i + 1}`,
          answer: i + 1,
          type: 'generic',
        })
      }
    }
  }

  return questions
}

function generateOptions(correctAnswer: number): number[] {
  const options = [correctAnswer]

  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 20) - 10
    const option = correctAnswer + offset
    if (option > 0 && !options.includes(option)) {
      options.push(option)
    }
  }

  // Shuffle options
  return options.sort(() => Math.random() - 0.5)
}
