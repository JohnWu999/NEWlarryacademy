import fs from 'node:fs'
import path from 'node:path'

const outputPath = path.join(process.cwd(), 'data/ngss-g6-science-course.json')

const lessons = [
  ['Ask Like a Scientist', 'Learn how scientists turn curiosity into testable questions and careful observations.', 509],
  ['Design a Fair Test', 'Build experiments with one independent variable, one dependent variable, and controlled conditions.', 390],
  ['From Data to Evidence', 'Turn measurements and patterns into evidence that supports a scientific claim.', 383],
  ['Matter Is Made of Particles', 'Use particle models to explain matter, spacing, motion, and invisible structure.', 415],
  ['Density and Floating', 'Explore why some objects sink or float by comparing mass, volume, and density.', 367],
  ['Temperature, Heat, and Particle Motion', 'Connect temperature and heat transfer to particle speed and energy.', 365],
  ['Phase Change and Energy Transfer', 'Explain melting, freezing, evaporation, and condensation with energy flow.', 378],
  ['Forces and Motion Intro', 'Start modeling pushes, pulls, speed, direction, and balanced forces.', 383],
  ['Gravity, Friction, and Balance', 'Investigate how gravity and friction affect motion, stability, and everyday systems.', 372],
  ['Energy Forms and Transformations', 'Trace energy as it changes form in systems while still being conserved.', 600],
  ['Waves, Sound, and Vibration', 'See how vibrations create waves and how sound carries energy through matter.', 600],
  ['Light and Vision', 'Explore how light travels, reflects, enters the eye, and helps us see.', 600],
]

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function fileNameFor(index, title) {
  const fileSlug = title.replace(/,/g, '').replace(/-/g, ' ').split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('_')
  return `NGSS_G6_Science_Lesson${String(index).padStart(2, '0')}_${fileSlug}_Schedar.mp4`
}

function makePractice(index, title) {
  const shortTitle = title.replace(/,/g, '')
  return {
    title: `NGSS G6 Lab ${index} Practice Quest`,
    maxScore: 50,
    passingScore: 70,
    rewards: {
      gemsOnPass: 1,
      gemsOnPerfect: 2,
    },
    reviewAdvice: {
      rewatchMessage: `Rewatch the ${shortTitle} video and focus on how evidence supports explanations.`,
      focus: shortTitle,
    },
    questions: [
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q1`,
        type: 'multiple-choice',
        prompt: `In "${shortTitle}", what should a scientist do first when investigating a new phenomenon?`,
        choices: ['Ask a clear testable question', 'Guess the answer and stop', 'Change every variable at once', 'Ignore measurements'],
        answer: 'Ask a clear testable question',
        points: 8,
        penalty: 2,
        hint: 'Start with a question that can be tested with evidence.',
        explanation: 'A strong investigation begins with a testable question.',
        encouragement: { correct: 'Good scientific start.', incorrect: 'Pause and think like a lab designer.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q2`,
        type: 'fill-blank',
        prompt: 'A scientific claim is stronger when it is supported by ____.',
        choices: [],
        answer: 'evidence',
        points: 10,
        penalty: 3,
        hint: 'Scientists use observations and data, not guesses.',
        explanation: 'Evidence from observations, measurements, and patterns supports scientific claims.',
        encouragement: { correct: 'Exactly. Evidence is the backbone.', incorrect: 'Look for the word scientists use for data that supports a claim.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q3`,
        type: 'true-false',
        prompt: 'True or false: A fair test changes one main variable at a time.',
        choices: ['True', 'False'],
        answer: 'True',
        points: 10,
        penalty: 3,
        hint: 'Changing too many things makes it hard to know what caused the result.',
        explanation: 'A fair test isolates one independent variable so the result can be interpreted.',
        encouragement: { correct: 'Nice control of variables.', incorrect: 'Think about what makes a test fair.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q4`,
        type: 'multiple-select',
        prompt: 'Select the habits that make a strong NGSS science explanation.',
        choices: ['Use evidence', 'Describe a pattern', 'Explain the reasoning', 'Hide the data'],
        answer: ['Use evidence', 'Describe a pattern', 'Explain the reasoning'],
        points: 12,
        penalty: 4,
        hint: 'A complete explanation connects claim, evidence, and reasoning.',
        explanation: 'Strong explanations use evidence, patterns, and reasoning while keeping data visible.',
        encouragement: { correct: 'That is real science reasoning.', incorrect: 'Choose the habits that help another scientist trust the explanation.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q5`,
        type: 'multiple-choice',
        prompt: `After watching "${shortTitle}", what is the best next study move?`,
        choices: ['Summarize the model, then try a new example', 'Memorize one sentence only', 'Skip the data table', 'Avoid explaining your reasoning'],
        answer: 'Summarize the model, then try a new example',
        points: 10,
        penalty: 3,
        hint: 'Science sticks when you can use the model in a new situation.',
        explanation: 'Applying the model to a new example shows deeper understanding.',
        encouragement: { correct: 'Great transfer move.', incorrect: 'Pick the choice that helps you use the idea again.' },
      },
    ],
  }
}

const course = {
  id: 'course-ngss-science',
  title: 'NGSS Science',
  description: 'A future-facing NGSS Grade 6 science course built around phenomena, virtual labs, evidence-based explanations, interactive practice, and student curiosity.',
  category: 'ngss-science',
  courseTrack: 'ngss-science',
  status: 'active',
  accessLevel: 'public',
  isFree: true,
  price: 0,
  difficultyLevel: 'intermediate',
  gradeLevel: 'G6',
  difficulty: 'Medium',
  videoProvider: 'tencent-vod',
  expectedFeatures: ['Tencent VOD science videos', 'Interactive practice', 'Virtual lab thinking prompts', 'Points and gems rewards'],
  lessons: lessons.map(([title, description, duration], index) => {
    const episode = index + 1
    return {
      id: `lesson-ngss-g6-${String(episode).padStart(2, '0')}-${slugify(title)}`,
      episode,
      title: `NGSS G6 Science ${episode}: ${title}`,
      description,
      order: episode,
      duration: Number(duration),
      gradeLevel: 'G6',
      difficulty: 'Medium',
      videoProvider: 'tencent-vod',
      isPreview: episode <= 2,
      hasPractice: true,
      hasGame: false,
      rewardsPoints: 50,
      rewardsGems: 1,
      videoFileName: fileNameFor(episode, title),
      practice: makePractice(episode, title),
    }
  }),
}

fs.writeFileSync(outputPath, `${JSON.stringify(course, null, 2)}\n`, 'utf8')
console.log(`Wrote ${course.lessons.length} lessons to ${outputPath}`)
