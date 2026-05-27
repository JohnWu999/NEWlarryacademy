# Larry Academy V2 🎓

现代化的在线数学学习平台，集成AI技术、视频课程、互动游戏和3D打印教具。

## ✨ 主要特性

### 🎯 核心功能
- **用户认证系统**: 基于NextAuth.js的安全认证
- **视频课程**: 系统化的数学学习课程
- **学习进度追踪**: 自动保存和追踪学习进度
- **多渠道支付**: 支持Stripe、支付宝、微信支付
- **AI游戏生成**: 使用AI创建个性化学习游戏
- **3D打印工具**: 将数学概念转化为实物模型
- **互动游戏**: 丰富的数学学习游戏

### 🛠️ 技术栈
- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **样式**: Tailwind CSS
- **后端**: Next.js API Routes, Server Actions
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js
- **支付**: Stripe, 支付宝, 微信支付
- **AI**: OpenAI Compatible API
- **部署**: Vercel (推荐) / 自建服务器

## 🚀 快速开始

### 前置要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd larry-academy-v2
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 创建.env文件（参考.env.example）
cp .env.example .env
# 编辑.env并配置数据库等信息
```

4. **设置数据库**
```bash
# 生成Prisma客户端
npm run db:generate

# 运行迁移
npm run db:migrate

# 填充示例数据
npm run db:seed
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000

## 📖 项目结构

```
larry-academy-v2/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (main)/            # 主站页面
│   ├── api/               # API路由
│   └── providers.tsx      # Context Providers
├── components/            # React组件
│   ├── layout/           # 布局组件
│   ├── ui/               # UI组件
│   ├── games/            # 游戏组件
│   └── courses/          # 课程组件
├── lib/                  # 工具库
│   ├── prisma.ts        # Prisma客户端
│   ├── auth.ts          # NextAuth配置
│   ├── payments/        # 支付集成
│   └── ai/              # AI功能
├── prisma/              # 数据库Schema和迁移
├── public/              # 静态资源
└── types/               # TypeScript类型定义
```

## 🔧 可用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行代码检查
npm run db:generate  # 生成Prisma客户端
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 填充示例数据
npm run db:studio    # 打开Prisma Studio
```

## 🌟 核心功能详解

### 用户认证
- 邮箱+密码注册/登录
- 安全的密码加密（bcrypt）
- JWT会话管理
- 路由保护中间件

### 课程系统
- 课程浏览和搜索
- 视频播放
- 自动进度追踪（每30秒）
- 课程完成状态

### 支付系统
- 统一支付接口
- Stripe集成（国际支付）
- 支付宝/微信支付集成（国内支付）
- Webhook处理支付回调
- 订单管理

### AI游戏生成
- 自然语言描述转游戏配置
- 多种游戏类型支持
- 难度自适应
- 个性化题目生成

## 📝 环境变量

必需的环境变量：

```env
DATABASE_URL=          # PostgreSQL连接字符串
NEXTAUTH_URL=          # 应用URL
NEXTAUTH_SECRET=       # NextAuth密钥
STRIPE_SECRET_KEY=     # Stripe密钥
OPENAI_API_KEY=        # OpenAI API密钥
```

可选的环境变量（用于完整功能）：
- 支付宝配置
- 微信支付配置
- 其他第三方服务

详见 `SETUP.md`

## 🚀 部署

### Vercel（推荐）
1. 推送代码到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署

### 自建服务器
参考 `DEPLOYMENT.md` 获取详细步骤

## 📚 文档

- [SETUP.md](SETUP.md) - 详细的设置指南
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [API文档] - API端点文档（待补充）

## 🤝 贡献

欢迎贡献！请先阅读贡献指南。

## 📄 许可证

[MIT License](LICENSE)

## 💖 慈善承诺

我们承诺将5%的收入捐赠给Free Sky Fund，帮助更多孩子获得优质教育机会。

## 📧 联系我们

- 邮箱: info@larryacademy.com
- 电话: 400-123-4567
- 地址: 中国·上海

## 🙏 致谢

感谢所有开源项目和社区的支持：
- Next.js
- React
- Prisma
- Stripe
- OpenAI
- 以及所有其他依赖项

---

Made with ❤️ by Larry Academy Team
