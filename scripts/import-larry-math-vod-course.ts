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
        isPreview: order <= 3,
        hasPractice: false,
        hasGame: false,
        rewardsPoints: 10,
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
        isPreview: order <= 3,
        hasPractice: false,
        hasGame: false,
        rewardsPoints: 10,
        rewardsGems: 0,
        gradeLevel: courseModule.gradeLevel,
        difficulty: courseModule.difficulty,
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
