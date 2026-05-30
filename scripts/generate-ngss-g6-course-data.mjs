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
    maxScore: 100,
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
        prompt: `In ${shortTitle}, a scientific claim is stronger when it is supported by ____.`,
        choices: [],
        answer: 'evidence',
        points: 8,
        penalty: 2,
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
        points: 8,
        penalty: 2,
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
        points: 10,
        penalty: 3,
        hint: 'A complete explanation connects claim, evidence, and reasoning.',
        explanation: 'Strong explanations use evidence, patterns, and reasoning while keeping data visible.',
        encouragement: { correct: 'That is real science reasoning.', incorrect: 'Choose the habits that help another scientist trust the explanation.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q5`,
        type: 'order-steps',
        prompt: `Put the ${shortTitle} investigation moves in the best order.`,
        choices: ['Notice the phenomenon', 'Ask a testable question', 'Collect useful data', 'Use evidence to explain the pattern'],
        answer: ['Notice the phenomenon', 'Ask a testable question', 'Collect useful data', 'Use evidence to explain the pattern'],
        points: 10,
        penalty: 3,
        hint: 'Start with what you observe, then test, measure, and explain.',
        explanation: 'Scientific thinking moves from observation to question to data to evidence-based explanation.',
        encouragement: { correct: 'Excellent science ladder.', incorrect: 'Build the ladder from noticing to explaining.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q6`,
        type: 'multiple-choice',
        prompt: `Which answer best shows that you can use the ${shortTitle} idea in a new situation?`,
        choices: ['Explain a new example with the same model', 'Repeat the title only', 'Pick the longest sentence', 'Ignore the result if it is surprising'],
        answer: 'Explain a new example with the same model',
        points: 10,
        penalty: 3,
        hint: 'Science sticks when you can use the model in a new situation.',
        explanation: 'Applying the model to a new example shows deeper understanding.',
        encouragement: { correct: 'Great transfer move.', incorrect: 'Pick the choice that helps you use the idea again.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q7`,
        type: 'fill-blank',
        prompt: `When several observations in ${shortTitle} point the same way, scientists call that repeated result a ____.`,
        choices: [],
        answer: 'pattern',
        points: 8,
        penalty: 2,
        hint: 'Look for the word that means a repeated trend in data.',
        explanation: 'Patterns help scientists make predictions and build explanations.',
        encouragement: { correct: 'Pattern spotted.', incorrect: 'Think about repeated trends in the data.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q8`,
        type: 'multiple-select',
        prompt: `Which actions would make your ${shortTitle} notebook more useful?`,
        choices: ['Label units', 'Record the setup', 'Circle unexpected data', 'Erase measurements that do not fit'],
        answer: ['Label units', 'Record the setup', 'Circle unexpected data'],
        points: 10,
        penalty: 3,
        hint: 'Good scientists keep useful details, especially surprises.',
        explanation: 'Clear units, setup notes, and unexpected data help you review and improve an investigation.',
        encouragement: { correct: 'Strong lab notebook habits.', incorrect: 'Keep the choices that make the data easier to trust.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q9`,
        type: 'multiple-choice',
        prompt: `After finishing ${shortTitle}, what is the strongest next investigation?`,
        choices: ['Test one new variable and compare the data', 'Change everything and hope it works', 'Stop after one example', 'Choose the answer before observing'],
        answer: 'Test one new variable and compare the data',
        points: 12,
        penalty: 4,
        hint: 'A strong extension changes one thing and compares evidence.',
        explanation: 'Testing one new variable lets you compare results and build a stronger explanation.',
        encouragement: { correct: 'That is a real next-lab move.', incorrect: 'Choose the move that creates better evidence.' },
      },
      {
        id: `ngss-g6-l${String(index).padStart(2, '0')}-q10`,
        type: 'open-response',
        prompt: `In 2-4 sentences, explain one idea from ${shortTitle} using evidence or a model. Then write one new question you would test next.`,
        choices: [],
        points: 16,
        penalty: 0,
        hint: 'Use this pattern: I noticed... This suggests... Next I would test...',
        explanation: 'Reflection saved. Strong scientists explain what they noticed and choose the next question.',
        inputPlaceholder: 'I noticed... This suggests... Next I would test...',
        encouragement: { correct: 'Thoughtful scientist reflection.', incorrect: 'Add a little more detail: evidence, model, and next question.' },
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
