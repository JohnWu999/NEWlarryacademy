// ===== 语言翻译数据 =====
const translations = {
    zh: {
        // 导航栏
        nav: {
            home: '首页',
            courses: '视频课程',
            tools: '3D工具',
            games: '互动游戏',
            shop: '在线商店',
            about: '关于我们'
        },
        
        // 主页
        home: {
            title: '欢迎来到 Larry Academy',
            subtitle: '用创新的3D技术和互动游戏，让数学学习变得生动有趣',
            startLearning: '开始学习',
            visitShop: '访问商店',
            ourFeatures: '我们的特色',
            
            feature1Title: '视频课程',
            feature1Desc: '涵盖多个学科的高质量视频教学，帮助学生深入理解各个知识点',
            feature1Link: '了解更多',
            
            feature2Title: '3D打印工具',
            feature2Desc: '创新的3D打印教具，将抽象的数学概念转化为可触摸的实物模型',
            feature2Link: '查看演示',
            
            feature3Title: '互动游戏',
            feature3Desc: '将数学概念融入有趣的在线游戏，让学习过程充满乐趣和挑战',
            feature3Link: '开始游戏',
            
            charityTitle: '我们的慈善承诺',
            charityText: '每100元人民币收入中，我们将捐赠5元给<strong>Free Sky Fund</strong>，帮助更多孩子获得优质教育机会',
            
            popularProducts: '热门3D工具套装',
            product1: '几何基础套装',
            product1Desc: '包含立方体、圆柱体、球体等基础几何模型',
            product2: '代数可视化套装',
            product2Desc: '用3D模型演示方程式和函数关系',
            product3: '高级数学套装',
            product3Desc: '适合高中及以上学生的高级数学概念模型',
            viewDetails: '查看详情',
            
            stat1: '学习用户',
            stat2: '视频课程',
            stat3: '3D工具模型',
            stat4: '互动游戏'
        },
        
        // 课程页面
        courses: {
            pageTitle: '视频课程',
            pageSubtitle: '高质量的教学视频，涵盖多个学科领域',
            allCourses: '全部课程',
            elementary: '小学数学',
            middle: '初中数学',
            high: '高中数学',
            advanced: '高等数学',
            startLearning: '开始学习',
            students: '人学习'
        },
        
        // 3D工具页面
        tools: {
            pageTitle: '3D打印工具演示',
            pageSubtitle: '将抽象的数学概念转化为可触摸的实物模型',
            whyTitle: '为什么选择3D打印工具？',
            whyText: '传统的数学教学往往停留在纸面上，学生难以直观理解抽象的数学概念。Larry Academy创新性地采用3D打印技术，将数学概念实体化，让学生能够亲手触摸、操作和观察，从而深化理解。',
            benefit1: '直观可视化：将抽象概念变成具体模型',
            benefit2: '动手操作：增强学习体验和记忆',
            benefit3: '高质量打印：精准展现数学关系',
            benefit4: '配套课程：结合视频教学效果更佳',
            ourTools: '我们的3D工具',
            geometryTools: '几何学工具',
            algebraTools: '代数工具',
            advancedTools: '高级数学工具',
            viewDemo: '查看演示',
            ctaTitle: '想要拥有这些神奇的学习工具？',
            ctaText: '访问我们的在线商店，选购适合您的3D工具套装',
            goToShop: '前往商店'
        },
        
        // 游戏页面
        games: {
            pageTitle: '互动游戏',
            pageSubtitle: '在游戏中学习，让数学概念变得生动有趣',
            intro1: '寓教于乐',
            intro1Desc: '将数学知识融入趣味游戏',
            intro2: '挑战成长',
            intro2Desc: '闯关模式激发学习动力',
            intro3: '互动竞技',
            intro3Desc: '与其他玩家一起学习进步',
            intro4: '奖励系统',
            intro4Desc: '完成任务获得成就徽章',
            basicGames: '基础数学游戏',
            geometryGames: '几何游戏',
            algebraGames: '代数游戏',
            advancedGames: '高级挑战游戏',
            easy: '简单',
            medium: '中等',
            hard: '困难',
            playGame: '开始游戏',
            players: '玩家',
            leaderboard: '本周排行榜'
        },
        
        // 商店页面
        shop: {
            pageTitle: '在线商店',
            pageSubtitle: '选购优质3D打印工具套装，让数学学习更有趣',
            charityNotice: '您的每一笔消费都在帮助他人！每100元收入中，我们将捐赠5元给<strong>Free Sky Fund</strong>',
            allProducts: '全部产品',
            elementarySet: '小学套装',
            middleSet: '初中套装',
            highSet: '高中套装',
            advancedSet: '高级套装',
            addToCart: '加入购物车',
            includes: '包含',
            donation: '含{amount}元慈善捐赠'
        },
        
        // 关于页面
        about: {
            pageTitle: '关于Larry Academy',
            pageSubtitle: '用科技创新改变数学教育',
            ourStory: '我们的故事',
            mission: '使命',
            missionText: '通过创新技术和优质内容，让每个学生都能享受数学学习的乐趣，建立坚实的数学基础。',
            vision: '愿景',
            visionText: '成为全球领先的数学教育科技平台，让数学学习不再困难，让创新教育触手可及。',
            values: '价值观',
            valuesText: '创新、专注、品质、分享。我们相信教育的力量，致力于为社会创造价值。',
            charityTitle: 'Free Sky Fund 慈善项目',
            charitySubtitle: '让每个孩子都能拥有优质的教育机会',
            ourCommitment: '我们的承诺',
            commitmentText: '我们承诺将<strong>每100元人民币收入中的5元</strong>捐赠给Free Sky Fund，用于：',
            use1: '为贫困地区学校提供免费3D教具',
            use2: '资助优秀但经济困难的学生',
            use3: '支持乡村教师培训项目',
            use4: '开发免费在线教育资源',
            ourImpact: '我们的影响',
            totalDonation: '累计捐赠金额',
            schools: '受助学校',
            students: '受益学生',
            teachers: '培训教师',
            stories: '受助者故事',
            transparency: '资金使用透明度',
            transparencyText: '我们承诺保持完全的透明度。每季度我们都会发布详细的资金使用报告，让每一位支持者都能清楚地了解捐款的去向和影响。',
            viewReport: '查看最新报告',
            ourTeam: '我们的团队',
            contactUs: '联系我们',
            contactText: '如果您有任何问题、建议或合作意向，欢迎随时与我们联系。我们期待听到您的声音！',
            email: '邮箱',
            phone: '电话',
            address: '地址',
            workingHours: '工作时间',
            sendMessage: '发送消息',
            yourName: '您的姓名',
            yourEmail: '您的邮箱',
            subject: '主题',
            yourMessage: '您的消息'
        },
        
        // 页脚
        footer: {
            tagline: '用创新科技让数学学习更有趣',
            quickLinks: '快速链接',
            aboutUs: '关于我们',
            aboutLarry: '关于Larry Academy',
            charityProject: '慈善项目',
            contactUs: '联系我们',
            faq: '常见问题',
            contactInfo: '联系方式',
            location: '中国·上海',
            copyright: '保留所有权利。'
        },
        
        // 通用
        common: {
            hot: '热销',
            new: '新品',
            recommended: '推荐',
            limited: '限量',
            loading: '加载中...',
            close: '关闭',
            confirm: '确认',
            cancel: '取消',
            more: '更多',
            readMore: '了解更多'
        },
        
        // 通知消息
        notifications: {
            addedToCart: '商品已添加到购物车！',
            messageSent: '消息已发送！我们会尽快回复您。',
            error: '发生错误，请稍后再试。'
        }
    },
    
    en: {
        // Navigation
        nav: {
            home: 'Home',
            courses: 'Courses',
            tools: '3D Tools',
            games: 'Games',
            shop: 'Shop',
            about: 'About'
        },
        
        // Home Page
        home: {
            title: 'Welcome to Larry Academy',
            subtitle: 'Making math learning fun and engaging with innovative 3D technology and interactive games',
            startLearning: 'Start Learning',
            visitShop: 'Visit Shop',
            ourFeatures: 'Our Features',
            
            feature1Title: 'Video Courses',
            feature1Desc: 'High-quality video lessons covering multiple subjects to help students understand key concepts',
            feature1Link: 'Learn More',
            
            feature2Title: '3D Printed Tools',
            feature2Desc: 'Innovative 3D printed teaching tools that transform abstract math concepts into tangible models',
            feature2Link: 'View Demo',
            
            feature3Title: 'Interactive Games',
            feature3Desc: 'Math concepts integrated into fun online games, making learning exciting and challenging',
            feature3Link: 'Start Gaming',
            
            charityTitle: 'Our Charity Commitment',
            charityText: 'For every 100 RMB of revenue, we donate 5 RMB to <strong>Free Sky Fund</strong>, helping more children access quality education',
            
            popularProducts: 'Popular 3D Tool Sets',
            product1: 'Basic Geometry Set',
            product1Desc: 'Includes cubes, cylinders, spheres and other basic geometric models',
            product2: 'Algebra Visualization Set',
            product2Desc: 'Demonstrate equations and function relationships with 3D models',
            product3: 'Advanced Math Set',
            product3Desc: 'Advanced mathematical concept models for high school and above',
            viewDetails: 'View Details',
            
            stat1: 'Learning Users',
            stat2: 'Video Courses',
            stat3: '3D Tool Models',
            stat4: 'Interactive Games'
        },
        
        // Courses Page
        courses: {
            pageTitle: 'Video Courses',
            pageSubtitle: 'High-quality teaching videos covering multiple subject areas',
            allCourses: 'All Courses',
            elementary: 'Elementary Math',
            middle: 'Middle School Math',
            high: 'High School Math',
            advanced: 'Advanced Math',
            startLearning: 'Start Learning',
            students: 'students'
        },
        
        // 3D Tools Page
        tools: {
            pageTitle: '3D Printed Tools Demo',
            pageSubtitle: 'Transform abstract math concepts into tangible models',
            whyTitle: 'Why Choose 3D Printed Tools?',
            whyText: 'Traditional math teaching often stays on paper, making it difficult for students to intuitively understand abstract concepts. Larry Academy innovatively uses 3D printing technology to materialize mathematical concepts, allowing students to touch, operate, and observe, thereby deepening understanding.',
            benefit1: 'Visual: Transform abstract concepts into concrete models',
            benefit2: 'Hands-on: Enhance learning experience and memory',
            benefit3: 'High Quality: Accurately present mathematical relationships',
            benefit4: 'Integrated Courses: Better results with video teaching',
            ourTools: 'Our 3D Tools',
            geometryTools: 'Geometry Tools',
            algebraTools: 'Algebra Tools',
            advancedTools: 'Advanced Math Tools',
            viewDemo: 'View Demo',
            ctaTitle: 'Want to Own These Amazing Learning Tools?',
            ctaText: 'Visit our online store to select the 3D tool set that suits you',
            goToShop: 'Go to Shop'
        },
        
        // Games Page
        games: {
            pageTitle: 'Interactive Games',
            pageSubtitle: 'Learn through play, making math concepts fun and engaging',
            intro1: 'Edutainment',
            intro1Desc: 'Integrate math knowledge into fun games',
            intro2: 'Challenge & Grow',
            intro2Desc: 'Level-based mode motivates learning',
            intro3: 'Interactive Competition',
            intro3Desc: 'Learn and progress with other players',
            intro4: 'Reward System',
            intro4Desc: 'Earn achievement badges for completing tasks',
            basicGames: 'Basic Math Games',
            geometryGames: 'Geometry Games',
            algebraGames: 'Algebra Games',
            advancedGames: 'Advanced Challenge Games',
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            playGame: 'Play Game',
            players: 'players',
            leaderboard: 'Weekly Leaderboard'
        },
        
        // Shop Page
        shop: {
            pageTitle: 'Online Shop',
            pageSubtitle: 'Shop quality 3D printed tool sets to make math learning more fun',
            charityNotice: 'Every purchase helps others! For every 100 RMB of revenue, we donate 5 RMB to <strong>Free Sky Fund</strong>',
            allProducts: 'All Products',
            elementarySet: 'Elementary Sets',
            middleSet: 'Middle School Sets',
            highSet: 'High School Sets',
            advancedSet: 'Advanced Sets',
            addToCart: 'Add to Cart',
            includes: 'Includes',
            donation: '{amount} RMB charity donation included'
        },
        
        // About Page
        about: {
            pageTitle: 'About Larry Academy',
            pageSubtitle: 'Transforming math education through technological innovation',
            ourStory: 'Our Story',
            mission: 'Mission',
            missionText: 'Through innovative technology and quality content, enable every student to enjoy the fun of learning math and build a solid mathematical foundation.',
            vision: 'Vision',
            visionText: 'To become the world\'s leading math education technology platform, making math learning no longer difficult and innovative education accessible.',
            values: 'Values',
            valuesText: 'Innovation, Focus, Quality, Sharing. We believe in the power of education and are committed to creating value for society.',
            charityTitle: 'Free Sky Fund Charity Project',
            charitySubtitle: 'Ensuring every child has access to quality education',
            ourCommitment: 'Our Commitment',
            commitmentText: 'We commit to donating <strong>5 RMB out of every 100 RMB</strong> of revenue to Free Sky Fund for:',
            use1: 'Providing free 3D teaching tools to schools in poor areas',
            use2: 'Supporting excellent but financially disadvantaged students',
            use3: 'Supporting rural teacher training programs',
            use4: 'Developing free online educational resources',
            ourImpact: 'Our Impact',
            totalDonation: 'Total Donations',
            schools: 'Schools Helped',
            students: 'Students Benefited',
            teachers: 'Teachers Trained',
            stories: 'Beneficiary Stories',
            transparency: 'Fund Usage Transparency',
            transparencyText: 'We are committed to complete transparency. Every quarter we publish detailed fund usage reports so every supporter can clearly understand where donations go and their impact.',
            viewReport: 'View Latest Report',
            ourTeam: 'Our Team',
            contactUs: 'Contact Us',
            contactText: 'If you have any questions, suggestions, or partnership inquiries, feel free to contact us anytime. We look forward to hearing from you!',
            email: 'Email',
            phone: 'Phone',
            address: 'Address',
            workingHours: 'Working Hours',
            sendMessage: 'Send Message',
            yourName: 'Your Name',
            yourEmail: 'Your Email',
            subject: 'Subject',
            yourMessage: 'Your Message'
        },
        
        // Footer
        footer: {
            tagline: 'Making math learning more fun through innovative technology',
            quickLinks: 'Quick Links',
            aboutUs: 'About Us',
            aboutLarry: 'About Larry Academy',
            charityProject: 'Charity Project',
            contactUs: 'Contact Us',
            faq: 'FAQ',
            contactInfo: 'Contact Info',
            location: 'Shanghai, China',
            copyright: 'All rights reserved.'
        },
        
        // Common
        common: {
            hot: 'Hot',
            new: 'New',
            recommended: 'Recommended',
            limited: 'Limited',
            loading: 'Loading...',
            close: 'Close',
            confirm: 'Confirm',
            cancel: 'Cancel',
            more: 'More',
            readMore: 'Read More'
        },
        
        // Notifications
        notifications: {
            addedToCart: 'Item added to cart!',
            messageSent: 'Message sent! We will reply as soon as possible.',
            error: 'An error occurred, please try again later.'
        }
    }
};

// 导出翻译对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = translations;
}


