import fs from 'fs'
import path from 'path'

const lessons = [
  {
    id: 'lesson-ngss-g7-01-systems-scale-and-models',
    episode: 1,
    title: 'NGSS G7 Science 1: Systems, Scale, and Models',
    description: 'Use systems thinking, scale, and models to explain complex science phenomena.',
    duration: 438,
    videoFileName: 'NGSS_G7_Science_Lesson01_Systems_Scale_And_Models_Schedar.mp4',
    focus: 'systems, scale, and models',
    questions: [
      ['multiple-choice', 'A science system is best described as...', ['a group of interacting parts that work together', 'one object with no connections', 'a list of vocabulary words', 'a guess with no evidence'], 'a group of interacting parts that work together', 'Look for parts plus interactions.', 'A system has components and relationships, such as organs in a body system or parts of an ecosystem.'],
      ['fill-blank', 'In a system model, matter, energy, or information entering the system is called an ____.', [], 'input', 'It goes into the system before the process happens.', 'Inputs enter a system; outputs leave it after processes happen.'],
      ['true-false', 'A model can be useful even if it does not show every detail of the real system.', ['true', 'false'], 'true', 'All models simplify reality.', 'Good models are useful because they highlight important parts while leaving out some details.'],
      ['multiple-select', 'Select the items that could be components of an ecosystem system model.', ['sunlight', 'plants', 'animals', 'a random phone charger'], ['sunlight', 'plants', 'animals'], 'Choose parts that interact in the ecosystem.', 'Sunlight, plants, and animals can all be components in an ecosystem model.'],
      ['order-steps', 'Put these model-building steps in a strong order.', ['Define the system boundary', 'Identify components', 'Show interactions', 'Use evidence to revise the model'], ['Define the system boundary', 'Identify components', 'Show interactions', 'Use evidence to revise the model'], 'Start by deciding what is inside the system.', 'Scientists first define the boundary, then add parts, interactions, and revisions from evidence.'],
      ['multiple-choice', 'Why does scale matter when studying cells, organs, and ecosystems?', ['Different scales reveal different patterns', 'Scale never changes what we notice', 'Only the largest scale is scientific', 'Small things cannot be modeled'], 'Different scales reveal different patterns', 'Think microscope versus whole ecosystem.', 'A cell-scale model shows different evidence than an organism-scale or ecosystem-scale model.'],
      ['fill-blank', 'The line that separates what is inside a system model from what is outside is the system ____.', [], 'boundary', 'It marks the edge of the model.', 'A system boundary helps scientists decide what to include and what to treat as surroundings.'],
      ['multiple-select', 'Which statements are good model-evaluation questions?', ['What does the model explain well?', 'What important parts are missing?', 'What evidence supports the model?', 'How can I make it prettier only?'], ['What does the model explain well?', 'What important parts are missing?', 'What evidence supports the model?'], 'Evaluation is about explanation and evidence.', 'Scientists judge models by usefulness, limits, and evidence.'],
      ['multiple-choice', 'A food web is a model mainly because it...', ['shows energy relationships among organisms', 'is a perfect copy of nature', 'removes all interactions', 'proves every ecosystem is the same'], 'shows energy relationships among organisms', 'A food web focuses on relationships.', 'Food webs model feeding relationships and energy flow, but they do not show every detail.'],
      ['open-response', 'Choose a familiar system, such as a school, a plant, or a phone. Name two components, one input, one process, and one output.', [], ['component', 'input', 'output'], 'Use the words component, input, process, and output.', 'A strong response identifies parts and explains how something enters, changes, and leaves the system.'],
    ],
  },
  {
    id: 'lesson-ngss-g7-02-cells-are-the-basic-unit-of-life',
    episode: 2,
    title: 'NGSS G7 Science 2: Cells Are the Basic Unit of Life',
    description: 'Explain why cells are the basic unit of life and how cell structures support life functions.',
    duration: 318,
    videoFileName: 'NGSS_G7_Science_Lesson02_Cells_Are_The_Basic_Unit_Of_Life_Schedar.mp4',
    focus: 'cells as the basic unit of life',
    questions: [
      ['multiple-choice', 'Why are cells called the basic unit of life?', ['All living things are made of cells that carry out life functions', 'Cells are always larger than organs', 'Only animals have cells', 'Cells do not interact with their environment'], 'All living things are made of cells that carry out life functions', 'Think smallest living unit.', 'Cells are the smallest units that can perform life processes.'],
      ['fill-blank', 'The cell structure that controls what enters and leaves the cell is the cell ____.', [], 'membrane', 'It is the cell boundary.', 'The cell membrane helps regulate materials moving into and out of the cell.'],
      ['true-false', 'A single-celled organism can carry out all life functions in one cell.', ['true', 'false'], 'true', 'One cell can still be alive.', 'Many organisms are unicellular and perform nutrition, response, and reproduction within one cell.'],
      ['multiple-select', 'Which are common needs or functions of living cells?', ['getting materials', 'using energy', 'removing wastes', 'turning into plastic'], ['getting materials', 'using energy', 'removing wastes'], 'Cells need materials and energy and must manage waste.', 'Cells exchange materials, use energy, and remove wastes to stay alive.'],
      ['order-steps', 'Order these levels of organization from smallest to largest.', ['cell', 'tissue', 'organ', 'organ system'], ['cell', 'tissue', 'organ', 'organ system'], 'Start with the basic unit of life.', 'Cells build tissues, tissues build organs, and organs work in organ systems.'],
      ['multiple-choice', 'A microscope helps scientists study cells because cells are usually...', ['too small to see clearly with only our eyes', 'too hot to touch', 'not made of matter', 'always larger than organisms'], 'too small to see clearly with only our eyes', 'Think about scale.', 'Microscopes extend observation to the cellular scale.'],
      ['fill-blank', 'A specialized cell has a structure that helps it do a specific ____.', [], 'function', 'Structure and function go together.', 'Cell structures often support the function the cell performs.'],
      ['multiple-select', 'Which observations would be evidence that a sample is living?', ['it is made of cells', 'it uses energy', 'it grows or reproduces', 'it is shiny metal'], ['it is made of cells', 'it uses energy', 'it grows or reproduces'], 'Living things share life processes.', 'Cellular structure and life processes support the claim that a sample is living.'],
      ['multiple-choice', 'Which claim best connects structure and function?', ['A nerve cell has long branches that help it send signals', 'A cell has no parts and no jobs', 'A tissue is smaller than a cell', 'A microscope changes nonliving things into cells'], 'A nerve cell has long branches that help it send signals', 'Look for a feature helping a job.', 'Structure-function reasoning explains how a shape or part supports what the cell does.'],
      ['open-response', 'Pick one cell structure from the lesson and explain how its structure helps the cell survive or do its job.', [], ['structure', 'function', 'cell'], 'Name the structure, then explain the job.', 'A strong response connects a cell part to a life function with evidence-based reasoning.'],
    ],
  },
  {
    id: 'lesson-ngss-g7-03-plant-cells-and-animal-cells',
    episode: 3,
    title: 'NGSS G7 Science 3: Plant Cells and Animal Cells',
    description: 'Compare plant and animal cells using organelles, structure-function evidence, and models.',
    duration: 203,
    videoFileName: 'NGSS_G7_Science_Lesson03_Plant_Cells_And_Animal_Cells_Schedar.mp4',
    focus: 'plant cells and animal cells',
    questions: [
      ['multiple-choice', 'Which structure is found in plant cells but not animal cells?', ['cell wall', 'cell membrane', 'cytoplasm', 'nucleus'], 'cell wall', 'Plants need rigid support.', 'Plant cells have cell walls outside the membrane; animal cells do not.'],
      ['fill-blank', 'Plant cells use ____ to capture light energy for photosynthesis.', [], 'chloroplasts', 'They are green organelles.', 'Chloroplasts contain chlorophyll and help plants make sugar from light energy.'],
      ['true-false', 'Both plant and animal cells have mitochondria.', ['true', 'false'], 'true', 'Both need usable energy.', 'Both plant and animal cells use mitochondria for cellular respiration.'],
      ['multiple-select', 'Select structures commonly found in both plant and animal cells.', ['cell membrane', 'nucleus', 'mitochondria', 'cell wall'], ['cell membrane', 'nucleus', 'mitochondria'], 'Choose shared structures.', 'Cell membrane, nucleus, and mitochondria are common in both plant and animal cells.'],
      ['order-steps', 'Order these from general comparison to evidence-based conclusion.', ['Observe the cell model', 'List shared structures', 'List plant-only structures', 'Write a claim about plant vs animal cells'], ['Observe the cell model', 'List shared structures', 'List plant-only structures', 'Write a claim about plant vs animal cells'], 'Start by observing, then compare.', 'A strong comparison moves from observation to evidence and claim.'],
      ['multiple-choice', 'A large central vacuole in a plant cell mainly helps with...', ['storage and support', 'capturing sound', 'making the cell invisible', 'removing the nucleus'], 'storage and support', 'Think water storage and pressure.', 'Large vacuoles store water and help plant cells maintain pressure.'],
      ['fill-blank', 'The organelle that often acts as the cell control center is the ____.', [], 'nucleus', 'It contains genetic information.', 'The nucleus contains DNA and helps control cell activities.'],
      ['multiple-select', 'Which observations support the claim that a cell is probably a plant cell?', ['box-like shape', 'cell wall', 'chloroplasts', 'no membrane'], ['box-like shape', 'cell wall', 'chloroplasts'], 'Plant cells often have rigid walls and chloroplasts.', 'Cell wall and chloroplast evidence strongly support a plant-cell claim.'],
      ['multiple-choice', 'Why is a Venn diagram useful for comparing plant and animal cells?', ['It separates shared and unique structures', 'It proves cells are not alive', 'It removes evidence', 'It only shows the largest organelles'], 'It separates shared and unique structures', 'Venn diagrams compare similarities and differences.', 'A Venn diagram is a model for organizing shared and unique features.'],
      ['open-response', 'Explain one similarity and one difference between plant and animal cells, using the name of at least one organelle.', [], ['similarity', 'difference', 'organelle'], 'Use one shared structure and one plant-only or animal-cell feature.', 'A strong response compares cells using specific structures such as chloroplast, cell wall, nucleus, or mitochondria.'],
    ],
  },
  {
    id: 'lesson-ngss-g7-04-photosynthesis-light-to-sugar',
    episode: 4,
    title: 'NGSS G7 Science 4: Photosynthesis: Light to Sugar',
    description: 'Model photosynthesis as a matter-and-energy process that turns light, carbon dioxide, and water into sugar and oxygen.',
    duration: 300,
    videoFileName: 'NGSS_G7_Science_Lesson04_Photosynthesis_Light_To_Sugar_Schedar.mp4',
    focus: 'photosynthesis',
    questions: [
      ['multiple-choice', 'What is the main purpose of photosynthesis?', ['make sugar using light energy', 'break down rocks', 'make animals breathe faster', 'turn oxygen into sunlight'], 'make sugar using light energy', 'Plants store energy in sugar.', 'Photosynthesis uses light energy to build sugar molecules.'],
      ['fill-blank', 'Photosynthesis happens mainly in organelles called ____.', [], 'chloroplasts', 'They contain chlorophyll.', 'Chloroplasts capture light energy for photosynthesis.'],
      ['true-false', 'Carbon dioxide and water are inputs for photosynthesis.', ['true', 'false'], 'true', 'Think reactants.', 'Plants use carbon dioxide and water, plus light energy, to make sugar and oxygen.'],
      ['multiple-select', 'Select the outputs of photosynthesis.', ['glucose/sugar', 'oxygen', 'carbon dioxide', 'water only'], ['glucose/sugar', 'oxygen'], 'Outputs leave the process.', 'Photosynthesis produces sugar and oxygen.'],
      ['order-steps', 'Order this simplified photosynthesis process.', ['Light is absorbed by chlorophyll', 'Water and carbon dioxide enter the plant', 'Sugar is built in chloroplasts', 'Oxygen is released'], ['Light is absorbed by chlorophyll', 'Water and carbon dioxide enter the plant', 'Sugar is built in chloroplasts', 'Oxygen is released'], 'Start with light capture.', 'Light capture drives the rearrangement of matter into sugar and oxygen.'],
      ['multiple-choice', 'In a leaf disk experiment, disks floating can be evidence that...', ['oxygen gas is being produced', 'the leaf has become metal', 'light is not involved', 'photosynthesis has stopped forever'], 'oxygen gas is being produced', 'Gas can make disks float.', 'Oxygen from photosynthesis can collect and help leaf disks float.'],
      ['fill-blank', 'The green pigment that absorbs light energy is ____.', [], 'chlorophyll', 'It gives many leaves their green color.', 'Chlorophyll absorbs light used in photosynthesis.'],
      ['multiple-select', 'Which variables could affect the rate of photosynthesis?', ['light intensity', 'carbon dioxide availability', 'temperature', 'the color of the notebook nearby'], ['light intensity', 'carbon dioxide availability', 'temperature'], 'Choose variables connected to the process.', 'Light, carbon dioxide, and temperature can influence photosynthesis rate.'],
      ['multiple-choice', 'Which model best represents photosynthesis?', ['carbon dioxide + water + light -> sugar + oxygen', 'sugar + oxygen -> carbon dioxide + water + energy', 'rock + water -> oxygen + metal', 'light + oxygen -> carbon dioxide only'], 'carbon dioxide + water + light -> sugar + oxygen', 'Recall the inputs and outputs.', 'The equation model summarizes matter and energy changes in photosynthesis.'],
      ['open-response', 'A plant is placed in bright light and then in dim light. Predict how photosynthesis might change and explain your reasoning using inputs, outputs, or evidence.', [], ['light', 'photosynthesis', 'evidence'], 'Use light as the changing variable.', 'A strong response links light availability to sugar/oxygen production and explains the evidence you would look for.'],
    ],
  },
  {
    id: 'lesson-ngss-g7-05-cellular-respiration-energy-from-food',
    episode: 5,
    title: 'NGSS G7 Science 5: Cellular Respiration: Energy from Food',
    description: 'Explain how cells release usable energy from food through cellular respiration in mitochondria.',
    duration: 222,
    videoFileName: 'NGSS_G7_Science_Lesson05_Cellular_Respiration_Energy_From_Food_Schedar.mp4',
    focus: 'cellular respiration',
    questions: [
      ['multiple-choice', 'What is the main purpose of cellular respiration?', ['release usable energy from food', 'capture sunlight to make sugar', 'build a cell wall', 'turn cells into tissues instantly'], 'release usable energy from food', 'Respiration helps cells use food energy.', 'Cellular respiration breaks down sugar to release energy cells can use.'],
      ['fill-blank', 'Cellular respiration happens mainly in organelles called ____.', [], 'mitochondria', 'They are often called cell powerhouses.', 'Mitochondria help convert food energy into usable cellular energy.'],
      ['true-false', 'Cellular respiration uses oxygen and glucose as inputs.', ['true', 'false'], 'true', 'Think reactants.', 'Most cellular respiration uses glucose and oxygen.'],
      ['multiple-select', 'Select the outputs of cellular respiration.', ['carbon dioxide', 'water', 'usable energy', 'sunlight'], ['carbon dioxide', 'water', 'usable energy'], 'Outputs are produced by the process.', 'Respiration produces carbon dioxide, water, and usable energy.'],
      ['order-steps', 'Order this simplified cellular respiration process.', ['Glucose enters the cell', 'Oxygen is used in mitochondria', 'Glucose is broken down', 'Energy is released and carbon dioxide/water are produced'], ['Glucose enters the cell', 'Oxygen is used in mitochondria', 'Glucose is broken down', 'Energy is released and carbon dioxide/water are produced'], 'Start with food entering the cell.', 'Cells use oxygen in mitochondria to break down glucose and release energy.'],
      ['multiple-choice', 'How are photosynthesis and cellular respiration related?', ['Photosynthesis stores energy in sugar; respiration releases energy from sugar', 'They are exactly the same process', 'Respiration makes sunlight', 'Photosynthesis only happens in animals'], 'Photosynthesis stores energy in sugar; respiration releases energy from sugar', 'One builds sugar, one breaks it down.', 'The two processes connect matter and energy in living systems.'],
      ['fill-blank', 'The sugar molecule used as a fuel in respiration is often called ____.', [], 'glucose', 'It is the sugar made by photosynthesis.', 'Glucose is broken down during cellular respiration.'],
      ['multiple-select', 'Which organisms carry out cellular respiration?', ['plants', 'animals', 'many single-celled organisms', 'only nonliving rocks'], ['plants', 'animals', 'many single-celled organisms'], 'Cells need usable energy.', 'Plant, animal, and many single-celled organisms use cellular respiration.'],
      ['multiple-choice', 'During exercise, muscle cells need more energy. What process must increase?', ['cellular respiration', 'photosynthesis in muscles', 'rock cycling', 'evaporation only'], 'cellular respiration', 'Muscles need usable energy from food.', 'Active cells increase respiration to release more usable energy.'],
      ['open-response', 'Compare photosynthesis and cellular respiration in two sentences. Include one input or output from each process.', [], ['photosynthesis', 'respiration', 'input', 'output'], 'Mention what each process uses or produces.', 'A strong response shows that photosynthesis builds sugar while respiration releases energy from sugar.'],
    ],
  },
]

function makeQuestion(lesson, index, raw) {
  const [type, prompt, choices, answer, hint, explanation] = raw
  const basePoints = index < 5 ? 8 : index < 9 ? 10 : 20
  return {
    id: `${lesson.id.replace('lesson-', '')}-q${index + 1}`,
    type,
    prompt,
    choices,
    answer,
    points: basePoints,
    penalty: index < 5 ? 2 : 3,
    hint,
    explanation,
    encouragement: {
      correct: index === 9 ? 'Strong science explanation.' : 'Nice evidence-based thinking.',
      incorrect: 'Good attempt. Use the hint and keep building the model.',
    },
  }
}

const course = {
  id: 'course-ngss-science-g7',
  title: 'NGSS Science Grade 7',
  description: 'A Grade 7 NGSS path for systems thinking, cells, photosynthesis, respiration, evidence-based explanations, and model-driven practice.',
  category: 'ngss-science',
  courseTrack: 'ngss-science',
  gradeLevel: 'G7',
  thumbnailUrl: '/course-covers/ngss-g7-cover.svg',
  lessons: lessons.map((lesson, index) => ({
    ...lesson,
    order: index + 1,
    gradeLevel: 'G7',
    difficulty: index < 3 ? 'Medium' : 'Hard',
    videoProvider: 'tencent-vod',
    isPreview: index < 3,
    hasPractice: true,
    hasGame: false,
    rewardsPoints: 50,
    rewardsGems: 1,
    practice: {
      title: `NGSS G7 Lab ${index + 1} Practice Quest`,
      maxScore: 100,
      passingScore: 70,
      rewards: { gemsOnPass: 1, gemsOnPerfect: 2 },
      reviewAdvice: {
        rewatchMessage: `Rewatch the ${lesson.focus} lesson and focus on the question types you missed.`,
        focus: lesson.focus,
      },
      questions: lesson.questions.map((question, questionIndex) => makeQuestion(lesson, questionIndex, question)),
    },
  })),
}

const outputPath = path.join(process.cwd(), 'data', 'ngss-g7-science-course.json')
fs.writeFileSync(outputPath, `${JSON.stringify(course, null, 2)}\n`)
console.log(`Wrote ${course.lessons.length} lessons to ${outputPath}`)
