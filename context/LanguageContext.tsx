'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Locale = 'zh' | 'en'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const translations = {
  zh: {
    'nav.home': '首页',
    'nav.courses': '视频课程',
    'nav.tools': '3D工具',
    'nav.games': '互动游戏',
    'nav.about': '关于我们',
    'nav.profile': '个人中心',
    'nav.logout': '退出',
    'nav.login': '登录',
    'nav.register': '注册',
    'home.hero.title': '欢迎来到',
    'home.hero.subtitle': '一个由学生亲手创造、面向学生与未来的综合学习平台：在 AI 时代，用 AI 激发更深的好奇心、更强的创造力和无限潜能。',
    'home.hero.start': '开始学习',
    'home.features.title': '我们的特色',
    'home.features.courses.title': '视频课程',
    'home.features.courses.desc': '涵盖多个学科的高质量视频教学，帮助学生深入理解各个知识点。',
    'home.features.tools.title': '3D打印教具',
    'home.features.tools.desc': '创新的3D打印教具，将抽象的数学概念转化为可触摸的实物模型。',
    'home.features.games.title': '互动游戏',
    'home.features.games.desc': '将数学概念融入有趣的在线游戏，让学习过程充满乐趣和挑战。',
    'home.charity.title': '我们的慈善承诺',
    'home.charity.desc': '每 1 美元收入中，我们将捐出 10 美分给 Free Sky Fund，帮助更多孩子获得优质教育机会。',
    'home.stats.users': '学习用户',
    'home.stats.courses': '视频课程',
    'home.stats.tools': '3D工具模型',
    'home.stats.games': '互动游戏',
    'subjects.title': '学科分类',
    'subjects.subtitle': '选择您的研究领域，开启由 3D 和 AI 驱动的未来学习之旅。',
    'math.title': '数学学院',
    'math.subtitle': '通过我们的互动课程，掌握符合 CCSS 标准的数学概念。',
    'math.all_grades': '所有年级',
    'math.grade': '年级',
    'math.lessons': '课节',
    'math.watch': '观看课节',
    'math.from': '来自',
    'games.title': '互动游戏',
    'games.subtitle': '在游戏中学习，让数学概念变得生动有趣。',
    'games.create': '用 AI 创建专属游戏',
    'games.play': '开始游戏',
    'games.plays': '次游玩',
    'games.featured': '精选',
    'games.ai_generated': 'AI 生成',
    'game.multiplication.title': '乘法表挑战',
    'game.multiplication.desc': '通过游戏练习乘法表，提高计算速度。',
    'game.addition.title': '加法速算',
    'game.addition.desc': '快速心算加法题，锻炼数学思维。',
    'game.geometry.title': '几何图形识别',
    'game.geometry.desc': '识别各种几何图形，学习图形特征。',
    'game.even_bubble.title': '偶数泡泡派对',
    'game.even_bubble.desc': '滑动弹出所有能被 2 整除的炫彩泡泡，守护你的五颗爱心！',
    'game.math_race.title': '数学赛车',
    'game.math_race.desc': '驾驶赛车收集星星，用加减法答题获得燃料。',
    'game.spin_wheel.title': '乘法转盘大挑战',
    'game.spin_wheel.desc': '转动转盘答乘法题，连续答对 3 题解锁打地鼠小游戏！',
    'game.treasure.title': '宝藏猎人',
    'game.treasure.desc': '探索神秘土地，用分数运算解开封印，收集圣物反抗暴君！',
    'game.palace.title': '宫殿对决',
    'game.palace.desc': '横版格斗游戏！控制哈利与皇家武士战斗，使用技巧击败对手。',
    'game.rescue.title': '革命救援',
    'game.rescue.desc': '在游戏中运用数学与逻辑完成英雄般的救援任务。',
    'common.loading': '加载中...',
    'common.no_content': '暂无内容',
    'common.explore': '探索课程',
    'common.back_to_games': '返回游戏列表',
    'common.start_game': '开始游戏',
    'common.instructions': '游戏说明',
    'common.related_games': '相关游戏',
    'common.questions': '道题',
    'common.seconds': '秒',
    'common.easy': '简单',
    'common.medium': '中等',
    'common.hard': '困难',
    'common.creator': '创建者',
    'common.new_window': '新窗口打开',
    'games.create.title': '创建专属数学游戏',
    'games.create.subtitle': '用自然语言描述您想要的游戏，AI 将为您生成个性化的学习游戏。',
    'games.create.label.desc': '描述您想要的游戏 *',
    'games.create.placeholder.desc': '例如：创建一个练习乘法表的游戏，重点练习 6-9 的乘法，适合小学三年级学生...',
    'games.create.hint.desc': '💡 提示：尽可能详细地描述游戏类型、难度、适用年级等信息。',
    'games.create.label.difficulty': '难度级别',
    'games.create.label.age': '目标年龄段（可选）',
    'games.create.placeholder.age': '例如：小学三年级、7-9 岁',
    'games.create.examples': '示例提示词',
    'games.create.submit': '生成游戏 ✨',
    'games.create.loading': '生成中... ✨',
    'footer.desc': '一个由学生亲手创造、面向未来的综合学习平台，用 AI 激发更好的学习与无限潜能。',
    'footer.links': '快速链接',
    'footer.about': '关于我们',
    'footer.contact': '联系方式',
    'footer.rights': '保留所有权利。',
    'about.title': '关于学院',
    'about.mission': '我们的使命',
    'about.mission.p1': '我们相信，每个孩子都有独特的学习方式，而好的教育工具应该能够适应他们的需求。',
    'about.mission.p2': '通过结合视频教学、3D 打印教具和互动游戏，我们为学生提供多维度的学习体验。',
    'about.offer.title': '我们提供什么',
    'about.charity.title': '我们的慈善承诺',
    'about.contact.title': '联系我们',
    'tools.title': '3D 打印工具',
    'tools.subtitle': '将抽象的数学概念转化为可触摸的实物模型。',
    'tools.why': '为什么需要 3D 打印教具？',
    'tools.get': '如何获得这些工具？',
    'profile.title': '个人中心',
    'profile.stats.enrolled': '已注册课程',
    'profile.stats.completed': '已完成课程',
    'profile.stats.games': '游戏次数',
    'profile.stats.time': '学习时长 (h)',
    'profile.quick': '快捷操作',
    'profile.logout': '退出登录'
  },
  en: {
    'nav.home': 'Home',
    'nav.courses': 'Courses',
    'nav.tools': '3D Tools',
    'nav.games': 'Games',
    'nav.about': 'About',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'home.hero.title': 'WELCOME TO',
    'home.hero.subtitle': 'A future-facing learning platform built by students, for students, using AI to inspire deeper curiosity, stronger creativity, and unlimited potential.',
    'home.hero.start': 'Start Learning',
    'home.features.title': 'Our Features',
    'home.features.courses.title': 'Video Courses',
    'home.features.courses.desc': 'High-quality video instruction across multiple subjects to help students master every concept.',
    'home.features.tools.title': '3D Printed Tools',
    'home.features.tools.desc': 'Innovative 3D printed teaching aids that transform abstract math into tangible physical models.',
    'home.features.games.title': 'Interactive Games',
    'home.features.games.desc': 'Integrating math concepts into fun online games, making learning exciting and challenging.',
    'home.charity.title': 'Our Charity Commitment',
    'home.charity.desc': 'For every dollar in revenue, we donate 10 cents to the Free Sky Fund to help more children access quality education.',
    'home.stats.users': 'Learners',
    'home.stats.courses': 'Courses',
    'home.stats.tools': '3D Models',
    'home.stats.games': 'Games',
    'subjects.title': 'ACADEMY SUBJECTS',
    'subjects.subtitle': 'Choose your field of study and embark on a futuristic learning journey powered by 3D and AI.',
    'math.title': 'MATH ACADEMY',
    'math.subtitle': 'Master mathematical concepts aligned with CCSS standards through our individual lesson modules.',
    'math.all_grades': 'All Grades',
    'math.grade': 'Grade',
    'math.lessons': 'Lessons',
    'math.watch': 'Watch Lesson',
    'math.from': 'From',
    'games.title': 'INTERACTIVE GAMES',
    'games.subtitle': 'Learn through play, making math concepts vivid and interesting.',
    'games.create': 'Create AI Game',
    'games.play': 'Play Now',
    'games.plays': 'Plays',
    'games.featured': 'Featured',
    'games.ai_generated': 'AI Generated',
    'game.multiplication.title': 'Multiplication Challenge',
    'game.multiplication.desc': 'Practice multiplication tables and improve calculation speed through play.',
    'game.addition.title': 'Addition Speed Run',
    'game.addition.desc': 'Mental math addition challenge to sharpen your mathematical thinking.',
    'game.geometry.title': 'Geometry Identification',
    'game.geometry.desc': 'Identify various geometric shapes and learn their defining features.',
    'game.even_bubble.title': 'Even Bubble Blast',
    'game.even_bubble.desc': 'Pop all colorful bubbles divisible by 2 and protect your five hearts!',
    'game.math_race.title': 'Math Race',
    'game.math_race.desc': 'Drive your race car to collect stars and use arithmetic to gain fuel.',
    'game.spin_wheel.title': 'Multiplication Spin Wheel',
    'game.spin_wheel.desc': 'Spin the wheel to solve multiplication problems and unlock bonus mini-games!',
    'game.treasure.title': 'Treasure Hunter',
    'game.treasure.desc': 'Explore mysterious lands, use fractions to break seals, and collect sacred weapons!',
    'game.palace.title': 'Palace Duel',
    'game.palace.desc': 'Side-scrolling action! Control Harry to fight royal guards with attack and block skills.',
    'game.rescue.title': 'Revolution Rescue',
    'game.rescue.desc': 'Apply math and logic to complete heroic rescue missions in this adventure.',
    'common.loading': 'Loading...',
    'common.no_content': 'No content found',
    'common.explore': 'Explore Courses',
    'common.back_to_games': 'Back to Games',
    'common.start_game': 'Start Game',
    'common.instructions': 'Instructions',
    'common.related_games': 'Related Games',
    'common.questions': 'Questions',
    'common.seconds': 'Seconds',
    'common.easy': 'Easy',
    'common.medium': 'Medium',
    'common.hard': 'Hard',
    'common.creator': 'Creator',
    'common.new_window': 'Open in new window',
    'games.create.title': 'CREATE CUSTOM MATH GAME',
    'games.create.subtitle': 'Describe the game you want in natural language, and AI will generate a personalized learning game for you.',
    'games.create.label.desc': 'Describe your game *',
    'games.create.placeholder.desc': 'e.g., Create a multiplication game focusing on 6-9, suitable for 3rd grade...',
    'games.create.hint.desc': '💡 Tip: Be as detailed as possible about game type, difficulty, and grade level.',
    'games.create.label.difficulty': 'Difficulty Level',
    'games.create.label.age': 'Target Age Group (Optional)',
    'games.create.placeholder.age': 'e.g., 3rd Grade, 7-9 years old',
    'games.create.examples': 'Example Prompts',
    'games.create.submit': 'Generate Game ✨',
    'games.create.loading': 'Generating... ✨',
    'footer.desc': 'A student-built learning platform for the AI era, created to inspire better learning and unlimited potential.',
    'footer.links': 'Quick Links',
    'footer.about': 'About Us',
    'footer.contact': 'Contact',
    'footer.rights': 'All Rights Reserved.',
    'about.title': 'ABOUT ACADEMY',
    'about.mission': 'Our Mission',
    'about.mission.p1': 'We believe every child has a unique way of learning, and great educational tools should adapt to their needs.',
    'about.mission.p2': 'By combining video instruction, 3D printed tools, and interactive games, we provide a multi-dimensional learning experience.',
    'about.offer.title': 'What We Offer',
    'about.charity.title': 'Our Charity Commitment',
    'about.contact.title': 'Contact Us',
    'tools.title': '3D PRINTING TOOLS',
    'tools.subtitle': 'Transforming abstract math concepts into tangible physical models.',
    'tools.why': 'Why 3D Printed Tools?',
    'tools.get': 'How to Get These Tools?',
    'profile.title': 'PROFILE',
    'profile.stats.enrolled': 'Enrolled',
    'profile.stats.completed': 'Completed',
    'profile.stats.games': 'Games',
    'profile.stats.time': 'Learning Time (h)',
    'profile.quick': 'Quick Actions',
    'profile.logout': 'Logout'
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
      setLocaleState(savedLocale)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const t = (key: string) => {
    return translations[locale][key as keyof typeof translations['en']] || key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
