// Type definitions for the application

export interface GameConfig {
  type: string
  difficulty?: 'easy' | 'medium' | 'hard'
  timeLimit?: number
  questionCount?: number
  range?: { min: number; max: number }
  shapes?: string[]
  [key: string]: any
}

export interface OrderItem {
  type: 'course' | 'product'
  id: string
  name: string
  price: number
  quantity?: number
}

export interface PaymentResult {
  success: boolean
  orderId?: string
  paymentId?: string
  error?: string
}

export interface AIGamePrompt {
  userInput: string
  difficulty?: 'easy' | 'medium' | 'hard'
  ageGroup?: string
  topic?: string
}

export interface LearningStats {
  totalCoursesEnrolled: number
  totalCoursesCompleted: number
  totalLearningTime: number
  averageProgress: number
  recentActivity: {
    courseId: string
    courseName: string
    progress: number
    lastAccessed: Date
  }[]
}

export interface GameStats {
  totalGamesPlayed: number
  averageScore: number
  favoriteGameType: string
  recentGames: {
    gameId: string
    gameName: string
    score: number
    playedAt: Date
  }[]
}
