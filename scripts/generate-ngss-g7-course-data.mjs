import fs from 'fs'
import path from 'path'

const lessons = [
  {
    slug: 'systems-scale-and-models',
    title: 'Systems, Scale, and Models',
    description: 'Use systems thinking, scale, and models to explain complex science phenomena.',
    duration: 438,
    videoFileName: 'NGSS_G7_Science_Lesson01_Systems_Scale_And_Models_Schedar.mp4',
    focus: 'systems, scale, and models',
    keyTerm: 'boundary',
    components: ['inputs', 'components', 'interactions', 'outputs'],
    process: 'define the system boundary, identify components, show interactions, and revise with evidence',
    evidence: 'a model becomes stronger when it explains the pattern and shows what is left out',
    misconception: 'a model does not need to include every detail to be useful',
    openPrompt: 'Choose a familiar system, such as a school, a plant, or a phone. Name two components, one input, one process, and one output.',
  },
  {
    slug: 'cells-are-the-basic-unit-of-life',
    title: 'Cells Are the Basic Unit of Life',
    description: 'Explain why cells are the basic unit of life and how cell structures support life functions.',
    duration: 318,
    videoFileName: 'NGSS_G7_Science_Lesson02_Cells_Are_The_Basic_Unit_Of_Life_Schedar.mp4',
    focus: 'cells as the basic unit of life',
    keyTerm: 'membrane',
    components: ['cell membrane', 'cytoplasm', 'nucleus', 'energy use'],
    process: 'cells take in materials, use energy, respond, grow, and remove wastes',
    evidence: 'microscope observations show that living things are made of cells',
    misconception: 'single-celled organisms can still carry out all life functions',
    openPrompt: 'Pick one cell structure from the lesson and explain how its structure helps the cell survive or do its job.',
  },
  {
    slug: 'plant-cells-and-animal-cells',
    title: 'Plant Cells and Animal Cells',
    description: 'Compare plant and animal cells using organelles, structure-function evidence, and models.',
    duration: 203,
    videoFileName: 'NGSS_G7_Science_Lesson03_Plant_Cells_And_Animal_Cells_Schedar.mp4',
    focus: 'plant and animal cell comparison',
    keyTerm: 'chloroplasts',
    components: ['cell wall', 'chloroplasts', 'vacuole', 'mitochondria'],
    process: 'compare shared organelles, identify plant-only structures, and support the claim with evidence',
    evidence: 'cell walls and chloroplasts strongly support a plant-cell claim',
    misconception: 'both plant and animal cells have mitochondria',
    openPrompt: 'Explain one similarity and one difference between plant and animal cells, using the name of at least one organelle.',
  },
  {
    slug: 'photosynthesis-light-to-sugar',
    title: 'Photosynthesis: Light to Sugar',
    description: 'Model photosynthesis as a matter-and-energy process that turns light, carbon dioxide, and water into sugar and oxygen.',
    duration: 300,
    videoFileName: 'NGSS_G7_Science_Lesson04_Photosynthesis_Light_To_Sugar_Schedar.mp4',
    focus: 'photosynthesis',
    keyTerm: 'chlorophyll',
    components: ['light', 'carbon dioxide', 'water', 'glucose', 'oxygen'],
    process: 'chloroplasts capture light energy and use carbon dioxide and water to build sugar and release oxygen',
    evidence: 'leaf disks floating can show oxygen production during photosynthesis',
    misconception: 'plants use photosynthesis to make sugar, not to make sunlight',
    openPrompt: 'A plant is placed in bright light and then in dim light. Predict how photosynthesis might change and explain your reasoning using inputs, outputs, or evidence.',
  },
  {
    slug: 'cellular-respiration-energy-from-food',
    title: 'Cellular Respiration: Energy from Food',
    description: 'Explain how cells release usable energy from food through cellular respiration in mitochondria.',
    duration: 222,
    videoFileName: 'NGSS_G7_Science_Lesson05_Cellular_Respiration_Energy_From_Food_Schedar.mp4',
    focus: 'cellular respiration',
    keyTerm: 'mitochondria',
    components: ['glucose', 'oxygen', 'carbon dioxide', 'water', 'usable energy'],
    process: 'cells use oxygen to break down glucose and release usable energy',
    evidence: 'active muscle cells increase respiration because they need more usable energy',
    misconception: 'plants and animals both carry out cellular respiration',
    openPrompt: 'Compare photosynthesis and cellular respiration in two sentences. Include one input or output from each process.',
  },
  {
    slug: 'matter-cycles-in-living-systems',
    title: 'Matter Cycles in Living Systems',
    description: 'Trace how atoms move through living systems while matter is conserved and reused.',
    duration: 390,
    videoFileName: 'NGSS_G7_Science_Lesson06_Matter_Cycles_In_Living_Systems_Schedar.mp4',
    focus: 'matter cycling in living systems',
    keyTerm: 'conserved',
    components: ['producers', 'consumers', 'decomposers', 'carbon dioxide', 'nutrients'],
    process: 'matter moves from the environment into organisms and returns through waste, respiration, and decomposition',
    evidence: 'a closed terrarium can show that matter cycles even when little material enters or leaves',
    misconception: 'matter cycles, but energy flows and is not recycled in the same way',
    openPrompt: 'Use producers, consumers, and decomposers to explain how a carbon atom could move through a small ecosystem.',
  },
  {
    slug: 'body-systems-and-homeostasis',
    title: 'Body Systems and Homeostasis',
    description: 'Explain how body systems interact to keep internal conditions stable.',
    duration: 244,
    videoFileName: 'NGSS_G7_Science_Lesson07_Body_Systems_And_Homeostasis_Schedar.mp4',
    focus: 'body systems and homeostasis',
    keyTerm: 'homeostasis',
    components: ['nervous system', 'circulatory system', 'respiratory system', 'feedback', 'temperature'],
    process: 'body systems detect change, send signals, respond, and bring conditions back toward a stable range',
    evidence: 'sweating and faster breathing are responses that help maintain internal balance',
    misconception: 'homeostasis means dynamic regulation, not that nothing changes',
    openPrompt: 'Describe one example of homeostasis during exercise and explain which body systems work together.',
  },
  {
    slug: 'sensory-receptors-nerves-and-brain-responses',
    title: 'Sensory Receptors, Nerves, and Brain Responses',
    description: 'Model how sensory receptors detect stimuli and how the nervous system produces responses.',
    duration: 152,
    videoFileName: 'NGSS_G7_Science_Lesson08_Sensory_Receptors_Nerves_And_Brain_Responses_Schedar.mp4',
    focus: 'sensory receptors and nervous system responses',
    keyTerm: 'stimulus',
    components: ['receptor', 'sensory neuron', 'brain', 'motor neuron', 'response'],
    process: 'a receptor detects a stimulus, signals travel through nerves, the brain processes information, and the body responds',
    evidence: 'reaction time tests provide data about nervous system processing',
    misconception: 'the brain interprets signals; receptors do not make the whole decision alone',
    openPrompt: 'Choose one sense and trace the path from stimulus to receptor to brain to response.',
  },
  {
    slug: 'genes-traits-and-inheritance',
    title: 'Genes, Traits, and Inheritance',
    description: 'Use models of genes and inheritance to explain why offspring resemble but are not identical to parents.',
    duration: 158,
    videoFileName: 'NGSS_G7_Science_Lesson09_Genes_Traits_And_Inheritance_Schedar.mp4',
    focus: 'genes, traits, and inheritance',
    keyTerm: 'gene',
    components: ['DNA', 'genes', 'alleles', 'traits', 'offspring'],
    process: 'offspring inherit genetic information from parents, and gene combinations influence traits',
    evidence: 'family trait patterns and Punnett-style models can support inheritance predictions',
    misconception: 'inherited traits come from genetic information, not from practice or preference',
    openPrompt: 'Explain why two siblings can share some traits but still look different. Use genes or inherited information in your answer.',
  },
  {
    slug: 'natural-selection-and-adaptation',
    title: 'Natural Selection and Adaptation',
    description: 'Explain how variation, selection pressures, and reproduction can change trait frequencies over time.',
    duration: 626,
    videoFileName: 'NGSS_G7_Science_Lesson10_Natural_Selection_And_Adaptation_Schedar_1440p_1080p_tmp.mp4',
    focus: 'natural selection and adaptation',
    keyTerm: 'adaptation',
    components: ['variation', 'environment', 'survival', 'reproduction', 'trait frequency'],
    process: 'individuals with helpful inherited traits survive and reproduce more often, so those traits can become more common',
    evidence: 'population data over generations can show trait frequencies changing',
    misconception: 'individual organisms do not choose to adapt instantly because they need a trait',
    openPrompt: 'Use variation, environment, and reproduction to explain how a helpful trait could become more common in a population.',
  },
  {
    slug: 'waves-sound-and-vibration',
    title: 'Waves, Sound, and Vibration',
    description: 'Connect vibration, wave properties, and energy transfer to explain sound.',
    duration: 402,
    videoFileName: 'NGSS_G7_Science_Lesson11_Waves_Sound_And_Vibration_Schedar_1440p_1080p_tmp.mp4',
    focus: 'waves, sound, and vibration',
    keyTerm: 'frequency',
    components: ['vibration', 'medium', 'amplitude', 'frequency', 'energy transfer'],
    process: 'a vibrating source transfers energy through a medium as sound waves',
    evidence: 'changing string length or tension changes pitch because it changes vibration frequency',
    misconception: 'sound needs a medium and cannot travel through empty space the same way light can',
    openPrompt: 'Explain how a vibrating guitar string produces sound and what might change the pitch.',
  },
  {
    slug: 'light-reflection-and-vision',
    title: 'Light, Reflection, and Vision',
    description: 'Use light-ray models to explain reflection, absorption, and how we see objects.',
    duration: 222,
    videoFileName: 'NGSS_G7_Science_Lesson12_Light_Reflection_And_Vision_Schedar_1440p_1080p_tmp.mp4',
    focus: 'light, reflection, and vision',
    keyTerm: 'reflection',
    components: ['light source', 'object', 'reflected light', 'eye', 'absorption'],
    process: 'light from a source hits an object, some light reflects, and reflected light enters the eye',
    evidence: 'ray diagrams can predict how mirrors change the path of light',
    misconception: 'we see most objects because light reflects from them into our eyes',
    openPrompt: 'Use a ray model to explain how you see a book on a desk. Include a light source, the book, and your eye.',
  },
  {
    slug: 'earth-systems-and-plate-tectonics',
    title: 'Earth Systems and Plate Tectonics',
    description: 'Explain how plate motion and Earth-system interactions shape landforms and geologic events.',
    duration: 306,
    videoFileName: 'NGSS_G7_Science_Lesson13_Earth_Systems_And_Plate_Tectonics_Schedar_1440p_1080p_tmp.mp4',
    focus: 'Earth systems and plate tectonics',
    keyTerm: 'plate boundary',
    components: ['lithosphere', 'mantle convection', 'plate boundary', 'earthquakes', 'volcanoes'],
    process: 'slow plate motion at boundaries builds mountains, opens rifts, and triggers earthquakes or volcanoes',
    evidence: 'earthquake and volcano patterns often line up with plate boundaries',
    misconception: 'plates move slowly but can still cause dramatic changes over geologic time',
    openPrompt: 'Explain how earthquake and volcano data can be evidence for plate boundaries.',
  },
  {
    slug: 'water-cycle-weather-and-climate',
    title: 'Water Cycle, Weather, and Climate',
    description: 'Connect water-cycle processes with weather patterns and long-term climate averages.',
    duration: 415,
    videoFileName: 'NGSS_G7_Science_Lesson14_Water_Cycle_Weather_And_Climate_Schedar_1440p_1080p_tmp.mp4',
    focus: 'water cycle, weather, and climate',
    keyTerm: 'condensation',
    components: ['evaporation', 'condensation', 'precipitation', 'runoff', 'climate averages'],
    process: 'solar energy drives evaporation, water vapor condenses into clouds, and precipitation returns water to Earth',
    evidence: 'weather records over many years help describe climate patterns',
    misconception: 'weather is short-term conditions; climate is long-term pattern',
    openPrompt: 'Explain the difference between weather and climate using one water-cycle example.',
  },
  {
    slug: 'climate-evidence-and-data',
    title: 'Climate Evidence and Data',
    description: 'Analyze climate data to separate evidence, trends, variability, and claims.',
    duration: 579,
    videoFileName: 'NGSS_G7_Science_Lesson15_Climate_Evidence_And_Data_Schedar_1440p_1080p_tmp.mp4',
    focus: 'climate evidence and data',
    keyTerm: 'trend',
    components: ['temperature records', 'ice cores', 'tree rings', 'carbon dioxide', 'graphs'],
    process: 'scientists compare multiple data sources over time to identify climate trends',
    evidence: 'a long-term upward pattern across many measurements is stronger evidence than one unusual day',
    misconception: 'one cold day does not disprove a long-term climate trend',
    openPrompt: 'Describe one kind of climate evidence and explain why many years of data are more useful than one day of weather.',
  },
  {
    slug: 'natural-hazards-risk-and-design',
    title: 'Natural Hazards, Risk, and Design',
    description: 'Use hazard data, probability, and design constraints to reduce risk from natural hazards.',
    duration: 331,
    videoFileName: 'NGSS_G7_Science_Lesson16_Natural_Hazards_Risk_And_Design_Schedar_1440p_1080p_tmp.mp4',
    focus: 'natural hazards, risk, and design',
    keyTerm: 'risk',
    components: ['hazard map', 'probability', 'exposure', 'constraints', 'design solution'],
    process: 'engineers use hazard data and constraints to design ways to reduce risk',
    evidence: 'maps of past floods, quakes, or fires can guide safer design choices',
    misconception: 'risk can be reduced even when hazards cannot be completely prevented',
    openPrompt: 'Choose one natural hazard and propose a design solution that reduces risk while considering one constraint.',
  },
  {
    slug: 'human-impact-and-solutions',
    title: 'Human Impact and Solutions',
    description: 'Evaluate how human activities affect Earth systems and how solutions can reduce negative impacts.',
    duration: 551,
    videoFileName: 'NGSS_G7_Science_Lesson17_Human_Impact_And_Solutions_Schedar_1440p_1080p_tmp.mp4',
    focus: 'human impact and solutions',
    keyTerm: 'trade-off',
    components: ['resource use', 'pollution', 'habitat change', 'solution', 'trade-off'],
    process: 'human activities change Earth systems, and solutions are evaluated by benefits, costs, and trade-offs',
    evidence: 'before-and-after data can show whether a solution reduces an impact',
    misconception: 'a good solution can have trade-offs and still be worth testing',
    openPrompt: 'Describe one human impact on an ecosystem and one solution. Include a possible trade-off.',
  },
  {
    slug: 'populations-resources-and-ecosystem-balance',
    title: 'Populations, Resources, and Ecosystem Balance',
    description: 'Explain how resources, competition, and limiting factors affect population changes.',
    duration: 474,
    videoFileName: 'NGSS_G7_Science_Lesson18_Populations_Resources_And_Ecosystem_Balance_Schedar_1440p_1080p_tmp.mp4',
    focus: 'populations, resources, and ecosystem balance',
    keyTerm: 'limiting factor',
    components: ['population', 'food', 'water', 'space', 'competition'],
    process: 'population size changes when births, deaths, resources, and competition change',
    evidence: 'population graphs can show growth, decline, or stabilization when resources change',
    misconception: 'more organisms can increase competition when resources are limited',
    openPrompt: 'Explain how a drought could affect a deer population and the plants they eat.',
  },
  {
    slug: 'biodiversity-stability-and-conservation',
    title: 'Biodiversity, Stability, and Conservation',
    description: 'Use biodiversity evidence to explain ecosystem stability and conservation choices.',
    duration: 382,
    videoFileName: 'NGSS_G7_Science_Lesson19_Biodiversity_Stability_And_Conservation_Schedar_1440p_1080p_tmp.mp4',
    focus: 'biodiversity, stability, and conservation',
    keyTerm: 'biodiversity',
    components: ['species richness', 'genetic variation', 'habitat', 'stability', 'conservation'],
    process: 'biodiversity can make ecosystems more resilient because different organisms fill different roles',
    evidence: 'species counts and habitat data can support conservation priorities',
    misconception: 'biodiversity includes more than just the number of large animals',
    openPrompt: 'Explain why protecting biodiversity can help an ecosystem recover after a disturbance.',
  },
  {
    slug: 'engineering-design-to-protect-ecosystems',
    title: 'Engineering Design to Protect Ecosystems',
    description: 'Apply engineering design to protect ecosystems using criteria, constraints, testing, and iteration.',
    duration: 492,
    videoFileName: 'NGSS_G7_Science_Lesson20_Engineering_Design_To_Protect_Ecosystems_Schedar_1440p_1080p_tmp.mp4',
    focus: 'engineering design to protect ecosystems',
    keyTerm: 'criteria',
    components: ['problem', 'criteria', 'constraints', 'prototype', 'iteration'],
    process: 'engineers define a problem, set criteria and constraints, build a solution, test it, and improve it',
    evidence: 'test results show whether a prototype meets the criteria and what should change next',
    misconception: 'engineering design usually improves through iteration, not one perfect first answer',
    openPrompt: 'Design a simple solution to protect an ecosystem near a school. Name one criterion, one constraint, and one test you would run.',
  },
]

const palettes = [
  ['#07152f', '#155e75', '#67e8f9', '#e0f2fe'],
  ['#062018', '#047857', '#6ee7b7', '#ecfdf5'],
  ['#1d102f', '#7c3aed', '#c4b5fd', '#faf5ff'],
  ['#2a1206', '#c2410c', '#fdba74', '#fff7ed'],
  ['#171717', '#334155', '#94a3b8', '#f8fafc'],
  ['#0b1120', '#1d4ed8', '#93c5fd', '#eff6ff'],
]

function makeQuestion(lesson, index, raw) {
  const [type, prompt, choices, answer, hint, explanation, extra = {}] = raw
  const basePoints = index < 5 ? 8 : index < 9 ? 10 : 20
  return {
    id: `ngss-g7-${String(lesson.episode).padStart(2, '0')}-${lesson.slug}-q${index + 1}`,
    type,
    prompt,
    choices,
    answer,
    points: basePoints,
    penalty: index < 5 ? 2 : 3,
    hint,
    explanation,
    encouragement: {
      correct: index === 9 ? 'Excellent science explanation.' : 'Nice evidence-based thinking.',
      incorrect: 'Good attempt. Use the hint, keep the model in your head, and move forward.',
    },
    ...extra,
  }
}

function questionRows(lesson) {
  const firstComponent = lesson.components[0]
  const secondComponent = lesson.components[1]
  const thirdComponent = lesson.components[2]
  return [
    [
      'multiple-choice',
      `Which statement best explains ${lesson.focus}?`,
      [
        lesson.process,
        `${lesson.focus} means memorizing a word list with no evidence`,
        `${lesson.focus} happens without matter, energy, or information`,
        `${lesson.focus} is only about drawing a pretty picture`,
      ],
      lesson.process,
      'Choose the answer that explains a cause, process, or relationship.',
      `The key idea is that ${lesson.process}.`,
    ],
    [
      'fill-blank',
      `A key vocabulary word for this lesson is ____.`,
      [],
      lesson.keyTerm,
      `The word starts with ${lesson.keyTerm[0].toUpperCase()} and is central to ${lesson.focus}.`,
      `${lesson.keyTerm} is a core term for explaining ${lesson.focus}.`,
      { alternativeAnswers: [lesson.keyTerm.toLowerCase(), lesson.keyTerm.replace('-', ' ')] },
    ],
    [
      'true-false',
      lesson.misconception.charAt(0).toUpperCase() + lesson.misconception.slice(1) + '.',
      ['true', 'false'],
      'true',
      'This is written as a careful science correction, not a common wrong idea.',
      lesson.misconception.charAt(0).toUpperCase() + lesson.misconception.slice(1) + '.',
    ],
    [
      'multiple-select',
      `Select the items that belong in a model of ${lesson.focus}.`,
      [firstComponent, secondComponent, thirdComponent, 'random decoration'],
      [firstComponent, secondComponent, thirdComponent],
      'Choose the parts that help explain the system or process.',
      `${firstComponent}, ${secondComponent}, and ${thirdComponent} are useful evidence-based pieces of this model.`,
    ],
    [
      'order-steps',
      `Put these reasoning steps in a strong order for explaining ${lesson.focus}.`,
      ['Observe the pattern', 'Build or choose a model', 'Use evidence to support a claim', 'Revise the explanation'],
      ['Observe the pattern', 'Build or choose a model', 'Use evidence to support a claim', 'Revise the explanation'],
      'Start with the observation before the claim.',
      'Strong science reasoning moves from observations to models, evidence, and revision.',
    ],
    [
      'multiple-choice',
      `Which would be the strongest evidence for a claim about ${lesson.focus}?`,
      [
        lesson.evidence,
        'one opinion from a person who did not observe the system',
        'a colorful picture with no labels or data',
        'a guess that cannot be tested',
      ],
      lesson.evidence,
      'Evidence should connect directly to the claim.',
      lesson.evidence.charAt(0).toUpperCase() + lesson.evidence.slice(1) + '.',
    ],
    [
      'fill-blank',
      `In ${lesson.focus}, one important part of the model is ____.`,
      [],
      firstComponent,
      'Use one of the lesson components.',
      `${firstComponent} is one of the important components for this lesson.`,
      { alternativeAnswers: [firstComponent.toLowerCase()] },
    ],
    [
      'multiple-select',
      `Which questions would help a scientist improve an explanation of ${lesson.focus}?`,
      [
        'What evidence supports the claim?',
        'What pattern does the model explain?',
        'What limitation or missing part should be revised?',
        'How can I avoid checking data?',
      ],
      ['What evidence supports the claim?', 'What pattern does the model explain?', 'What limitation or missing part should be revised?'],
      'Look for evidence, patterns, and limitations.',
      'Model improvement depends on evidence, explanatory power, and limits.',
    ],
    [
      'multiple-choice',
      `A student wants to explain ${lesson.focus}. What should they do first?`,
      [
        'identify the important parts and relationships',
        'copy the answer without evidence',
        'ignore variables and patterns',
        'choose the longest sentence every time',
      ],
      'identify the important parts and relationships',
      'Good explanations start by identifying what matters.',
      `To explain ${lesson.focus}, first identify the key parts, relationships, and evidence.`,
    ],
    [
      'open-response',
      lesson.openPrompt,
      [],
      lesson.components.slice(0, 3),
      'Use at least two science terms from the lesson and explain the relationship.',
      `A strong response uses lesson vocabulary, evidence, and cause-effect reasoning about ${lesson.focus}.`,
      {
        acceptableKeywords: [lesson.keyTerm, ...lesson.components.slice(0, 4), lesson.focus.split(',')[0]],
        answerPreview: `Use words such as ${[lesson.keyTerm, ...lesson.components.slice(0, 2)].join(', ')} and explain why they matter.`,
      },
    ],
  ]
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function coverSvg(lesson, index) {
  const [dark, mid, accent, light] = palettes[index % palettes.length]
  const episode = String(lesson.episode).padStart(2, '0')
  const title = xmlEscape(lesson.title)
  const focus = xmlEscape(lesson.focus.toUpperCase())
  const term = xmlEscape(lesson.keyTerm.toUpperCase())
  const icon = index % 4
  const motif = icon === 0
    ? `<circle cx="826" cy="264" r="120" fill="none" stroke="${accent}" stroke-width="5" opacity=".75"/><circle cx="826" cy="264" r="54" fill="${accent}" opacity=".22"/><path d="M674 404 C766 334 892 334 984 404" fill="none" stroke="${light}" stroke-width="6" opacity=".72"/>`
    : icon === 1
      ? `<path d="M700 206 L900 132 L1070 260 L1016 492 L764 514 L640 342 Z" fill="${mid}" opacity=".34" stroke="${accent}" stroke-width="5"/><circle cx="840" cy="326" r="74" fill="${accent}" opacity=".18"/><path d="M760 326 H920 M840 246 V406" stroke="${light}" stroke-width="6" opacity=".78"/>`
      : icon === 2
        ? `<path d="M674 420 C738 260 810 230 872 344 C934 460 1004 288 1064 172" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/><circle cx="674" cy="420" r="15" fill="${light}"/><circle cx="872" cy="344" r="15" fill="${light}"/><circle cx="1064" cy="172" r="15" fill="${light}"/>`
        : `<rect x="680" y="160" width="330" height="250" rx="42" fill="${mid}" opacity=".30" stroke="${accent}" stroke-width="5"/><path d="M724 318 H966 M790 220 V372 M900 220 V372" stroke="${light}" stroke-width="5" opacity=".52"/><circle cx="790" cy="282" r="32" fill="${accent}" opacity=".50"/><circle cx="900" cy="282" r="32" fill="${accent}" opacity=".28"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="g" cx="80%" cy="16%" r="70%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".66"/>
      <stop offset=".44" stop-color="${mid}" stop-opacity=".35"/>
      <stop offset="1" stop-color="${dark}" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#shade)"/>
  <rect width="1280" height="720" fill="url(#g)" opacity=".92"/>
  <g opacity=".22" stroke="${light}" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<path d="M${80 + i * 96} 80 V640"/>`).join('')}
    ${Array.from({ length: 6 }, (_, i) => `<path d="M72 ${126 + i * 88} H1208"/>`).join('')}
  </g>
  <g opacity=".16">
    <circle cx="1098" cy="122" r="138" fill="${accent}"/>
    <circle cx="118" cy="616" r="210" fill="${mid}"/>
  </g>
  ${motif}
  <rect x="72" y="92" width="328" height="66" rx="33" fill="#000" opacity=".32" stroke="${accent}" stroke-width="2"/>
  <text x="96" y="134" fill="${light}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" letter-spacing="7">NGSS G7 SCIENCE</text>
  <text x="86" y="248" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900">LESSON ${episode}</text>
  <foreignObject x="82" y="278" width="610" height="176">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,Helvetica,sans-serif;color:white;font-size:54px;font-weight:900;line-height:1.04;letter-spacing:-1px">${title}</div>
  </foreignObject>
  <rect x="82" y="516" width="486" height="54" rx="27" fill="#000" opacity=".34"/>
  <text x="110" y="552" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" letter-spacing="4">${term}</text>
  <text x="82" y="628" fill="${light}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" opacity=".86">${focus}</text>
  <text x="1030" y="624" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="5" opacity=".72">LARRY ACADEMY</text>
</svg>
`
}

const course = {
  id: 'course-ngss-science-g7',
  title: 'NGSS Science Grade 7',
  description: 'A complete 20-lesson Grade 7 NGSS pathway for cells, body systems, genetics, natural selection, waves, light, Earth systems, climate evidence, hazards, ecosystems, biodiversity, and engineering design.',
  category: 'ngss-science',
  courseTrack: 'ngss-science',
  gradeLevel: 'G7',
  thumbnailUrl: '/course-covers/ngss-g7-cover.svg',
  lessons: lessons.map((lesson, index) => ({
    id: `lesson-ngss-g7-${String(index + 1).padStart(2, '0')}-${lesson.slug}`,
    episode: index + 1,
    title: `NGSS G7 Science ${index + 1}: ${lesson.title}`,
    description: lesson.description,
    duration: lesson.duration,
    videoFileName: lesson.videoFileName,
    coverUrl: `/lesson-covers/ngss-g7/lesson-${String(index + 1).padStart(2, '0')}.svg`,
    focus: lesson.focus,
    keyTerm: lesson.keyTerm,
    components: lesson.components,
    order: index + 1,
    gradeLevel: 'G7',
    difficulty: index < 6 ? 'Medium' : 'Hard',
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
      questions: questionRows({ ...lesson, episode: index + 1 }).map((question, questionIndex) => makeQuestion({ ...lesson, episode: index + 1 }, questionIndex, question)),
    },
  })),
}

const outputPath = path.join(process.cwd(), 'data', 'ngss-g7-science-course.json')
const coverDir = path.join(process.cwd(), 'public', 'lesson-covers', 'ngss-g7')
fs.mkdirSync(coverDir, { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify(course, null, 2)}\n`)
course.lessons.forEach((lesson, index) => {
  fs.writeFileSync(path.join(coverDir, `lesson-${String(index + 1).padStart(2, '0')}.svg`), coverSvg(lesson, index))
})
console.log(`Wrote ${course.lessons.length} lessons to ${outputPath}`)
console.log(`Wrote ${course.lessons.length} covers to ${coverDir}`)
