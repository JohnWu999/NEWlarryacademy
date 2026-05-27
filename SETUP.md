# Larry Academy V2 设置指南

## 1. 环境要求

- Node.js 18+ 
- PostgreSQL 14+
- npm 或 yarn

## 2. 数据库设置

### 选项 A: 本地 PostgreSQL

1. 安装 PostgreSQL (如果还没有安装)
2. 创建数据库:
```bash
createdb larry_academy
```

3. 创建 `.env` 文件并配置数据库连接:
```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/larry_academy?schema=public"
```

### 选项 B: 使用云数据库 (推荐用于开发)

可以使用以下任一服务:
- **Vercel Postgres**: https://vercel.com/storage/postgres
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **Neon**: https://neon.tech

获取 DATABASE_URL 后，添加到 `.env` 文件。

## 3. 安装依赖

```bash
npm install
```

## 4. 生成 Prisma 客户端

```bash
npm run db:generate
```

## 5. 运行数据库迁移

```bash
npm run db:migrate
```

## 6. 填充示例数据 (可选)

```bash
npm run db:seed
```

这将创建:
- 2个演示用户账户 (demo@larryacademy.com / premium@larryacademy.com, 密码: demo123456)
- 3个示例课程
- 3个示例游戏
- 3个示例产品

## 7. 配置其他环境变量

复制 `.env` 文件并添加以下配置:

```env
# NextAuth (生成密钥: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# Stripe (从 https://stripe.com/dashboard 获取)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 支付宝 (从支付宝开放平台获取)
ALIPAY_APP_ID=""
ALIPAY_PRIVATE_KEY=""
ALIPAY_PUBLIC_KEY=""

# 微信支付 (从微信商户平台获取)
WECHAT_PAY_APP_ID=""
WECHAT_PAY_MERCHANT_ID=""
WECHAT_PAY_API_KEY=""

# OpenAI Compatible API
OPENAI_API_KEY="your-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4"
```

## 8. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 9. 可用命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行代码检查
- `npm run db:generate` - 生成 Prisma 客户端
- `npm run db:push` - 推送 schema 变更到数据库
- `npm run db:migrate` - 创建并运行迁移
- `npm run db:seed` - 填充示例数据
- `npm run db:studio` - 打开 Prisma Studio (可视化数据库管理)

## 10. 故障排除

### 数据库连接错误
- 检查 `.env` 中的 DATABASE_URL 是否正确
- 确保 PostgreSQL 服务正在运行
- 检查数据库用户权限

### Prisma 客户端错误
- 运行 `npm run db:generate` 重新生成客户端
- 删除 `node_modules` 和 `package-lock.json`，重新安装依赖

### 端口占用
- 如果 3000 端口被占用，可以指定其他端口: `PORT=3001 npm run dev`

## 下一步

查看 [README.md](README.md) 了解项目架构和功能说明。
