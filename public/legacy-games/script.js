// ===== 语言切换系统 =====
let currentLang = localStorage.getItem('language') || 'zh';

// 初始化语言
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});

// 设置语言
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    
    // 更新HTML lang属性
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    
    // 更新所有带有data-i18n属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const keys = element.getAttribute('data-i18n').split('.');
        let translation = translations[lang];
        
        for (const key of keys) {
            translation = translation[key];
        }
        
        if (translation) {
            element.textContent = translation;
        }
    });
    
    // 更新所有带有data-i18n-html属性的元素（支持HTML标签）
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
        const keys = element.getAttribute('data-i18n-html').split('.');
        let translation = translations[lang];
        
        for (const key of keys) {
            translation = translation[key];
        }
        
        if (translation) {
            element.innerHTML = translation;
        }
    });
    
    // 更新所有带有data-i18n-placeholder属性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const keys = element.getAttribute('data-i18n-placeholder').split('.');
        let translation = translations[lang];
        
        for (const key of keys) {
            translation = translation[key];
        }
        
        if (translation) {
            element.placeholder = translation;
        }
    });
    
    // 更新语言切换按钮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
}

// 语言切换按钮事件
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        setLanguage(lang);
    });
});

// ===== 移动端导航菜单 =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        // 汉堡菜单动画
        const spans = hamburger.querySelectorAll('span');
        spans.forEach((span, index) => {
            if (navLinks.classList.contains('active')) {
                if (index === 0) span.style.transform = 'rotate(45deg) translate(5px, 5px)';
                if (index === 1) span.style.opacity = '0';
                if (index === 2) span.style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                span.style.transform = 'none';
                span.style.opacity = '1';
            }
        });
    });

    // 点击导航链接后关闭菜单
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const spans = hamburger.querySelectorAll('span');
            spans.forEach(span => {
                span.style.transform = 'none';
                span.style.opacity = '1';
            });
        });
    });
}

// ===== 课程筛选功能 =====
const courseFilters = document.querySelectorAll('.filter-tabs .filter-btn');
const courseCategories = document.querySelectorAll('.courses-category');

courseFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        // 移除所有活动状态
        courseFilters.forEach(f => f.classList.remove('active'));
        // 添加当前活动状态
        filter.classList.add('active');
        
        const category = filter.dataset.category;
        
        courseCategories.forEach(cat => {
            if (category === 'all') {
                cat.style.display = 'block';
            } else if (cat.dataset.category === category) {
                cat.style.display = 'block';
            } else {
                cat.style.display = 'none';
            }
        });
    });
});

// ===== 商店筛选功能 =====
const shopFilters = document.querySelectorAll('.shop-filters .filter-btn');
const productCategories = document.querySelectorAll('.products-category');

shopFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        // 移除所有活动状态
        shopFilters.forEach(f => f.classList.remove('active'));
        // 添加当前活动状态
        filter.classList.add('active');
        
        const category = filter.dataset.filter;
        
        productCategories.forEach(cat => {
            if (category === 'all') {
                cat.style.display = 'block';
            } else if (cat.dataset.category === category) {
                cat.style.display = 'block';
            } else {
                cat.style.display = 'none';
            }
        });
    });
});

// ===== 3D工具演示模态框 =====
const demoModal = document.getElementById('demoModal');
const closeButtons = document.querySelectorAll('.close');

function openDemo(toolType) {
    if (demoModal) {
        demoModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        const modalTitle = document.getElementById('modalTitle');
        const demoDescription = document.getElementById('demoDescription');
        
        // 根据工具类型显示不同内容
        const toolInfo = {
            'geometry-basic': {
                title: '基础立体图形套装演示',
                description: '这个套装包含了所有基础的立体几何形状。学生可以通过触摸和操作这些模型，直观地理解体积、表面积等概念。'
            },
            'pythagorean': {
                title: '勾股定理演示器',
                description: '通过可拼接的模块，学生可以亲手验证勾股定理的正确性，深入理解a²+b²=c²的几何意义。'
            },
            'polyhedra': {
                title: '多面体探索套装',
                description: '包含柏拉图立体和阿基米德立体等特殊多面体，帮助学生探索对称性和欧拉公式。'
            },
            'algebra-tiles': {
                title: '代数块演示',
                description: '用不同颜色和大小的方块代表x²、x和常数，直观展示因式分解和方程求解的过程。'
            },
            'functions': {
                title: '函数图像模型',
                description: '3D打印的函数曲线让学生能够触摸和观察函数的形状，理解函数的性质和变换。'
            },
            'quadratic': {
                title: '二次方程完全平方模型',
                description: '通过可拼接的模块展示配方法的几何意义，让代数运算变得可视化。'
            },
            'surface': {
                title: '三维函数曲面',
                description: '二元函数的立体模型帮助学生理解多元函数、偏导数和梯度等高级概念。'
            },
            'calculus': {
                title: '微积分概念模型',
                description: '用实物模型展示导数的几何意义和积分的面积意义，让抽象概念变得具体。'
            },
            'topology': {
                title: '拓扑结构模型',
                description: '莫比乌斯带、克莱因瓶等神奇的拓扑结构，激发学生对高等数学的兴趣。'
            }
        };
        
        if (toolInfo[toolType]) {
            modalTitle.textContent = toolInfo[toolType].title;
            demoDescription.innerHTML = `<p>${toolInfo[toolType].description}</p>`;
        }
    }
}

// ===== 游戏模态框 =====
const gameModal = document.getElementById('gameModal');
const bubbleGameModal = document.getElementById('bubbleGameModal');
const bubbleCanvas = bubbleGameModal ? document.getElementById('bubbleCanvas') : null;
const bubbleScoreElement = bubbleGameModal ? document.getElementById('bubbleScore') : null;
const bubbleLivesContainer = bubbleGameModal ? document.getElementById('bubbleLives') : null;
const bubbleGameOverPanel = bubbleGameModal ? document.getElementById('bubbleGameOver') : null;
const bubbleFinalScoreElement = bubbleGameModal ? document.getElementById('bubbleFinalScore') : null;

const bubbleGameState = bubbleGameModal ? {
    canvas: bubbleCanvas,
    ctx: null,
    animationId: null,
    isRunning: false,
    bubbles: [],
    particles: [],
    pointerTrail: [],
    score: 0,
    lives: 5,
    maxLives: 5,
    spawnInterval: 1400,
    timeSinceSpawn: 0,
    lastTimestamp: 0,
    pointerActive: false
} : null;

const bubbleColors = [
    '#ff6b6b',
    '#ff9f1c',
    '#6bcdfd',
    '#9b6bff',
    '#4ed1a1',
    '#f368e0',
    '#ff8fab'
];

function playGame(gameType) {
    if (gameType === 'even-bubble-blast') {
        startBubbleGame();
        return;
    }

    if (gameModal) {
        gameModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        const gameTitle = document.getElementById('gameTitle');
        
        const gameInfo = {
            'number-kingdom': '数字王国大冒险',
            'multiplication': '乘法速算挑战',
            'shape-puzzle': '图形拼拼乐',
            '3d-geometry': '3D几何探险',
            'pythagorean-master': '勾股定理大师',
            'area-perimeter': '面积与周长挑战',
            'equation-solver': '方程式解密',
            'function-adventure': '函数图像大冒险',
            'inequality-balance': '不等式天平',
            'trig-adventure': '三角函数冒险',
            'calculus-quest': '微积分探索',
            'logic-puzzle': '数学逻辑谜题'
        };
        
        if (gameInfo[gameType]) {
            gameTitle.textContent = gameInfo[gameType];
        }
    }
}

function startBubbleGame() {
    if (!bubbleGameModal || !bubbleGameState) return;
    bubbleGameModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    initialiseBubbleGame();
}

function closeBubbleGame() {
    if (!bubbleGameModal || !bubbleGameState) return;
    stopBubbleGame();
    bubbleGameModal.classList.remove('show');
    if (bubbleGameOverPanel) {
        bubbleGameOverPanel.classList.add('bubble-hidden');
    }
    document.body.style.overflow = 'auto';
}

function restartBubbleGame() {
    if (!bubbleGameModal || !bubbleGameState) return;
    stopBubbleGame();
    initialiseBubbleGame();
}

function initialiseBubbleGame() {
    bubbleGameState.ctx = bubbleGameState.canvas.getContext('2d');
    bubbleGameState.bubbles = [];
    bubbleGameState.particles = [];
    bubbleGameState.pointerTrail = [];
    bubbleGameState.score = 0;
    bubbleGameState.lives = bubbleGameState.maxLives;
    bubbleGameState.spawnInterval = 1400;
    bubbleGameState.timeSinceSpawn = 0;
    bubbleGameState.lastTimestamp = 0;
    bubbleGameState.pointerActive = false;

    updateBubbleScore();
    updateBubbleLives();

    if (bubbleGameOverPanel) {
        bubbleGameOverPanel.classList.add('bubble-hidden');
    }

    resizeBubbleCanvas();
    window.addEventListener('resize', resizeBubbleCanvas);

    bubbleCanvas.addEventListener('pointerdown', handleBubblePointerDown);
    bubbleCanvas.addEventListener('pointermove', handleBubblePointerMove);
    bubbleCanvas.addEventListener('pointerup', handleBubblePointerUp);
    bubbleCanvas.addEventListener('pointerleave', handleBubblePointerUp);
    bubbleCanvas.addEventListener('pointercancel', handleBubblePointerUp);

    bubbleGameState.isRunning = true;
    bubbleGameState.animationId = requestAnimationFrame(runBubbleGame);
}

function stopBubbleGame() {
    if (!bubbleGameState) return;
    bubbleGameState.isRunning = false;
    if (bubbleGameState.animationId) {
        cancelAnimationFrame(bubbleGameState.animationId);
        bubbleGameState.animationId = null;
    }

    window.removeEventListener('resize', resizeBubbleCanvas);

    if (bubbleCanvas) {
        bubbleCanvas.removeEventListener('pointerdown', handleBubblePointerDown);
        bubbleCanvas.removeEventListener('pointermove', handleBubblePointerMove);
        bubbleCanvas.removeEventListener('pointerup', handleBubblePointerUp);
        bubbleCanvas.removeEventListener('pointerleave', handleBubblePointerUp);
        bubbleCanvas.removeEventListener('pointercancel', handleBubblePointerUp);
    }
}

function resizeBubbleCanvas() {
    if (!bubbleGameModal || !bubbleCanvas) return;
    const content = bubbleGameModal.querySelector('.bubble-modal-content');
    if (!content) return;
    const availableWidth = content.clientWidth - 40;
    const width = Math.max(Math.min(availableWidth, 820), 320);
    const height = Math.floor(width * 9 / 16);
    bubbleCanvas.width = width;
    bubbleCanvas.height = height;
}

function runBubbleGame(timestamp) {
    if (!bubbleGameState || !bubbleGameState.isRunning) return;

    if (!bubbleGameState.lastTimestamp) {
        bubbleGameState.lastTimestamp = timestamp;
    }

    const delta = timestamp - bubbleGameState.lastTimestamp;
    bubbleGameState.lastTimestamp = timestamp;
    bubbleGameState.timeSinceSpawn += delta;

    const adaptiveInterval = Math.max(650, bubbleGameState.spawnInterval - bubbleGameState.score * 3);
    if (bubbleGameState.timeSinceSpawn >= adaptiveInterval) {
        spawnBubble();
        bubbleGameState.timeSinceSpawn = 0;
    }

    updateBubbles(delta);
    updateParticles(delta);
    updatePointerTrail(delta);
    drawBubbleScene();

    if (bubbleGameState.isRunning) {
        bubbleGameState.animationId = requestAnimationFrame(runBubbleGame);
    }
}

function spawnBubble() {
    if (!bubbleGameState || !bubbleGameState.canvas) return;

    const { canvas } = bubbleGameState;
    const radius = Math.random() * 22 + 36; // 36 - 58
    const x = radius + Math.random() * (canvas.width - radius * 2);
    const value = Math.floor(Math.random() * 49) + 2; // 2 - 50
    const isEven = value % 2 === 0;
    const speed = Math.random() * 60 + 110 + bubbleGameState.score * 0.4;
    const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];

    bubbleGameState.bubbles.push({
        x,
        y: -radius,
        radius,
        value,
        isEven,
        color,
        speed,
        popped: false,
        opacity: 1,
        scale: 1
    });
}

function updateBubbles(delta) {
    const bubbles = bubbleGameState.bubbles;
    const canvas = bubbleGameState.canvas;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        bubble.y += bubble.speed * (delta / 1000);

        if (bubble.y + bubble.radius >= canvas.height - 10) {
            handleBubbleMiss(i);
            continue;
        }

        if (bubble.opacity <= 0) {
            bubbles.splice(i, 1);
        }
    }
}

function handleBubbleMiss(index) {
    const bubble = bubbleGameState.bubbles[index];
    bubbleGameState.bubbles.splice(index, 1);
    spawnPopParticles(bubble, true);

    if (bubble.isEven) {
        loseBubbleLife();
    }
}

function handleBubblePointerDown(event) {
    event.preventDefault();
    bubbleGameState.pointerActive = true;
    processBubblePointer(event);
}

function handleBubblePointerMove(event) {
    event.preventDefault();
    if (!bubbleGameState.pointerActive) return;
    processBubblePointer(event);
}

function handleBubblePointerUp() {
    bubbleGameState.pointerActive = false;
}

function processBubblePointer(event) {
    const rect = bubbleCanvas.getBoundingClientRect();
    const scaleX = bubbleCanvas.width / rect.width;
    const scaleY = bubbleCanvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    bubbleGameState.pointerTrail.push({ x, y, alpha: 1 });
    if (bubbleGameState.pointerTrail.length > 25) {
        bubbleGameState.pointerTrail.shift();
    }

    detectBubbleHit(x, y);
}

function detectBubbleHit(x, y) {
    for (let i = bubbleGameState.bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbleGameState.bubbles[i];
        if (bubble.popped) continue;
        const distance = Math.hypot(bubble.x - x, bubble.y - y);
        if (distance <= bubble.radius) {
            bubble.popped = true;
            bubble.opacity = 0;
            bubbleGameState.bubbles.splice(i, 1);

            if (bubble.isEven) {
                bubbleGameState.score += 10;
                updateBubbleScore();
                spawnPopParticles(bubble);
            } else {
                spawnPopParticles(bubble, true);
                loseBubbleLife();
            }
            break;
        }
    }
}

function updateParticles(delta) {
    const particles = bubbleGameState.particles;
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.life -= delta;
        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        particle.x += particle.vx * (delta / 1000);
        particle.y += particle.vy * (delta / 1000);
        particle.vy += 18 * (delta / 1000);
    }
}

function updatePointerTrail(delta) {
    bubbleGameState.pointerTrail.forEach(point => {
        point.alpha -= delta / 600;
    });
    bubbleGameState.pointerTrail = bubbleGameState.pointerTrail.filter(point => point.alpha > 0);
}

function spawnPopParticles(bubble, isPenalty = false) {
    if (!bubble) return;
    const count = isPenalty ? 8 : 14;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = isPenalty ? Math.random() * 80 + 40 : Math.random() * 140 + 60;
        bubbleGameState.particles.push({
            x: bubble.x,
            y: bubble.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 4 + 3,
            color: isPenalty ? '#ff4d6d' : bubble.color,
            life: isPenalty ? 420 : 680
        });
    }
}

function drawBubbleScene() {
    const ctx = bubbleGameState.ctx;
    const canvas = bubbleGameState.canvas;
    if (!ctx || !canvas) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e0c3d');
    gradient.addColorStop(0.5, '#281763');
    gradient.addColorStop(1, '#140a25');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, canvas.height - 12, canvas.width, 12);

    bubbleGameState.bubbles.forEach(bubble => {
        ctx.save();
        ctx.globalAlpha = bubble.opacity;
        const bubbleGradient = ctx.createRadialGradient(
            bubble.x - bubble.radius / 3,
            bubble.y - bubble.radius / 3,
            bubble.radius / 6,
            bubble.x,
            bubble.y,
            bubble.radius
        );
        bubbleGradient.addColorStop(0, 'rgba(255,255,255,0.95)');
        bubbleGradient.addColorStop(0.4, bubble.color);
        bubbleGradient.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(22, bubble.radius * 0.75)}px "Poppins", "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bubble.value, bubble.x, bubble.y);
        ctx.restore();
    });

    bubbleGameState.particles.forEach(particle => {
        ctx.globalAlpha = Math.max(particle.life / 680, 0);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
    if (bubbleGameState.pointerTrail.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        bubbleGameState.pointerTrail.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    }
}

function updateBubbleScore() {
    if (bubbleScoreElement) {
        bubbleScoreElement.textContent = bubbleGameState.score;
    }
}

function updateBubbleLives() {
    if (!bubbleLivesContainer) return;
    bubbleLivesContainer.innerHTML = '';
    for (let i = 0; i < bubbleGameState.maxLives; i++) {
        const heart = document.createElement('span');
        heart.className = `bubble-heart${i < bubbleGameState.lives ? ' alive' : ''}`;
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        bubbleLivesContainer.appendChild(heart);
    }
}

function loseBubbleLife() {
    bubbleGameState.lives = Math.max(0, bubbleGameState.lives - 1);
    updateBubbleLives();
    if (bubbleGameState.lives <= 0) {
        endBubbleGame();
    }
}

function endBubbleGame() {
    stopBubbleGame();
    if (bubbleFinalScoreElement) {
        bubbleFinalScoreElement.textContent = bubbleGameState.score;
    }
    if (bubbleGameOverPanel) {
        bubbleGameOverPanel.classList.remove('bubble-hidden');
    }
}

// ===== 关闭模态框 =====
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (demoModal) demoModal.style.display = 'none';
        if (gameModal) gameModal.style.display = 'none';
        if (bubbleGameModal) closeBubbleGame();
        document.body.style.overflow = 'auto';
    });
});

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    if (e.target === demoModal || e.target === gameModal) {
        if (demoModal) demoModal.style.display = 'none';
        if (gameModal) gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    if (e.target === bubbleGameModal) {
        closeBubbleGame();
    }
});

// ===== 购物车功能 =====
let cartCount = 0;
const cartCountElement = document.querySelector('.cart-count');

function addToCart(productId) {
    cartCount++;
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.animation = 'none';
        setTimeout(() => {
            cartCountElement.style.animation = 'pulse 0.5s ease';
        }, 10);
    }
    
    // 显示提示消息
    showNotification('商品已添加到购物车！', 'success');
}

// ===== 通知提示 =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#667eea'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 添加通知动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
        }
    }
`;
document.head.appendChild(style);

// ===== 表单提交 =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 模拟表单提交
        showNotification('消息已发送！我们会尽快回复您。', 'success');
        contactForm.reset();
    });
}

// ===== 平滑滚动 =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ===== 滚动动画 =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// 观察需要动画的元素
document.querySelectorAll('.feature-card, .product-card, .course-card, .tool-card, .game-card, .shop-card, .mission-card, .team-member').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// ===== 统计数字动画 =====
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// 当统计数据进入视口时触发动画
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number, .impact-number');
            if (statNumber && !statNumber.dataset.animated) {
                const text = statNumber.textContent;
                const number = parseInt(text.replace(/[^0-9]/g, ''));
                if (number) {
                    statNumber.dataset.animated = 'true';
                    animateCounter(statNumber, number);
                }
            }
            statObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item, .impact-item').forEach(el => {
    statObserver.observe(el);
});

// ===== 页面加载完成 =====
window.addEventListener('load', () => {
    // 移除加载动画或执行其他初始化操作
    console.log('Larry Academy 网站加载完成！');
});

// ===== 返回顶部按钮 =====
const backToTopBtn = document.createElement('button');
backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTopBtn.className = 'back-to-top';
backToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
`;

document.body.appendChild(backToTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.visibility = 'visible';
    } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.visibility = 'hidden';
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

backToTopBtn.addEventListener('mouseenter', () => {
    backToTopBtn.style.transform = 'translateY(-5px)';
});

backToTopBtn.addEventListener('mouseleave', () => {
    backToTopBtn.style.transform = 'translateY(0)';
});

// ===== 慈善捐赠计算器 =====
function calculateDonation(amount) {
    return (amount * 0.05).toFixed(2);
}

// 如果在商店页面，显示实时捐赠计算
const priceElements = document.querySelectorAll('.current-price');
priceElements.forEach(priceEl => {
    const price = parseFloat(priceEl.textContent.replace('¥', '').replace(',', ''));
    if (price) {
        const donation = calculateDonation(price);
        const donationNote = document.createElement('p');
        donationNote.style.cssText = 'font-size: 0.85rem; color: #f5576c; margin-top: 0.5rem;';
        donationNote.innerHTML = `<i class="fas fa-heart"></i> 含${donation}元慈善捐赠`;
        priceEl.parentElement.appendChild(donationNote);
    }
});

// ===== 键盘导航支持 =====
document.addEventListener('keydown', (e) => {
    // ESC键关闭模态框
    if (e.key === 'Escape') {
        if (demoModal && demoModal.style.display === 'block') {
            demoModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (gameModal && gameModal.style.display === 'block') {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (bubbleGameModal && bubbleGameModal.classList.contains('show')) {
            closeBubbleGame();
        }
    }
});

// ===== 性能优化：懒加载图片 =====
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

console.log('🎓 欢迎来到 Larry Academy！');
console.log('💜 用科技创新改变数学教育');

