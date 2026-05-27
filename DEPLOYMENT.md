# Larry Academy V2 部署指南

## 推荐部署方案：Vercel

### 优势
- 与Next.js深度集成
- 自动CI/CD
- 边缘函数支持
- 免费SSL证书
- 全球CDN分发

### 部署步骤

#### 1. 准备数据库

**选项 A: Vercel Postgres（推荐）**
```bash
# 在Vercel仪表板中创建Postgres数据库
# 获取DATABASE_URL连接字符串
```

**选项 B: Supabase**
```bash
# 访问 https://supabase.com
# 创建新项目
# 获取数据库连接字符串
```

**选项 C: Railway**
```bash
# 访问 https://railway.app
# 创建PostgreSQL数据库
# 获取连接字符串
```

#### 2. 配置环境变量

在Vercel项目设置中添加以下环境变量：

```env
# 数据库
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 支付宝（可选）
ALIPAY_APP_ID=""
ALIPAY_PRIVATE_KEY=""
ALIPAY_PUBLIC_KEY=""

# 微信支付（可选）
WECHAT_PAY_APP_ID=""
WECHAT_PAY_MERCHANT_ID=""
WECHAT_PAY_API_KEY=""

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4"
```

#### 3. 推送代码到GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/larry-academy-v2.git
git push -u origin main
```

#### 4. 连接Vercel

1. 访问 https://vercel.com
2. 点击 "New Project"
3. 导入您的GitHub仓库
4. 配置环境变量
5. 点击 "Deploy"

#### 5. 运行数据库迁移

部署后，在Vercel控制台运行：

```bash
npx prisma migrate deploy
npx prisma db seed
```

或者在本地运行迁移后推送到远程数据库：

```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
DATABASE_URL="your-production-database-url" npx prisma db seed
```

#### 6. 配置Stripe Webhook

1. 访问 Stripe Dashboard
2. 进入 Developers > Webhooks
3. 添加端点：`https://your-domain.vercel.app/api/payments/webhook/stripe`
4. 选择事件：
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. 复制webhook签名密钥到环境变量

#### 7. 配置自定义域名（可选）

1. 在Vercel项目设置中添加自定义域名
2. 更新DNS记录指向Vercel
3. 更新 `NEXTAUTH_URL` 环境变量

## 替代方案：自建服务器

### 系统要求
- Node.js 18+
- PostgreSQL 14+
- Nginx（反向代理）
- PM2（进程管理）

### 部署步骤

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib

# 安装Nginx
sudo apt install nginx

# 安装PM2
sudo npm install -g pm2
```

#### 2. 克隆代码

```bash
cd /var/www
git clone https://github.com/your-username/larry-academy-v2.git
cd larry-academy-v2
```

#### 3. 安装依赖并构建

```bash
npm install
npm run build
```

#### 4. 配置环境变量

```bash
cp .env.example .env
nano .env
# 编辑环境变量
```

#### 5. 运行数据库迁移

```bash
npm run db:migrate
npm run db:seed
```

#### 6. 使用PM2启动应用

```bash
pm2 start npm --name "larry-academy" -- start
pm2 save
pm2 startup
```

#### 7. 配置Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/larry-academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. 配置SSL证书（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## CI/CD配置

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 监控与维护

### 1. 日志监控

```bash
# Vercel控制台查看实时日志
# 或本地使用PM2
pm2 logs larry-academy
```

### 2. 性能监控

- 使用Vercel Analytics
- 集成Sentry进行错误追踪
- 使用Google Analytics追踪用户行为

### 3. 数据库备份

```bash
# 自动备份脚本
pg_dump -U username -d larry_academy > backup_$(date +%Y%m%d).sql
```

### 4. 更新部署

```bash
# Vercel自动部署
git push origin main

# 自建服务器
cd /var/www/larry-academy-v2
git pull
npm install
npm run build
pm2 restart larry-academy
```

## 故障排除

### 数据库连接失败
- 检查DATABASE_URL格式
- 确认数据库服务运行正常
- 检查防火墙设置

### 构建失败
- 清除缓存：`rm -rf .next node_modules`
- 重新安装：`npm install`
- 检查环境变量是否完整

### API错误
- 查看服务器日志
- 检查API密钥是否有效
- 确认第三方服务状态

## 安全最佳实践

1. **环境变量**: 绝不在代码中硬编码密钥
2. **HTTPS**: 始终使用SSL证书
3. **CORS**: 配置合适的CORS策略
4. **速率限制**: 实施API速率限制
5. **定期更新**: 保持依赖包更新
6. **备份**: 定期备份数据库
7. **监控**: 设置错误和性能监控

## 扩展建议

### 水平扩展
- 使用Vercel的边缘函数
- 配置CDN缓存静态资源
- 数据库读写分离

### 缓存策略
- Redis缓存热点数据
- CDN缓存静态资源
- 浏览器缓存策略

### 负载均衡
- Vercel自动处理
- 自建服务器使用Nginx负载均衡

## 支持

如有问题，请访问：
- GitHub Issues
- 项目文档
- 技术支持邮箱：support@larryacademy.com
