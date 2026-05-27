#!/bin/bash

# Larry Academy V2 快速启动脚本
# 此脚本帮助您快速设置和启动项目

echo "🎓 欢迎使用 Larry Academy V2 快速启动脚本"
echo "================================================"
echo ""

# 检查Node.js版本
echo "✓ 检查Node.js版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误: 需要Node.js 18或更高版本"
    echo "   当前版本: $(node -v)"
    echo "   请访问 https://nodejs.org 安装最新版本"
    exit 1
fi
echo "   Node.js版本: $(node -v) ✓"
echo ""

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
    echo "✓ 依赖安装完成"
    echo ""
else
    echo "✓ 依赖已安装"
    echo ""
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件"
    echo "   正在从.env.example创建..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ .env文件已创建"
        echo "   ⚠️  请编辑.env文件并配置必要的环境变量："
        echo "      - DATABASE_URL"
        echo "      - NEXTAUTH_SECRET (运行: openssl rand -base64 32)"
        echo "      - OPENAI_API_KEY (可选，用于AI功能)"
        echo "      - STRIPE_SECRET_KEY (可选，用于支付)"
        echo ""
        echo "   配置完成后，请重新运行此脚本"
        exit 0
    else
        echo "❌ 错误: .env.example文件不存在"
        exit 1
    fi
else
    echo "✓ .env文件存在"
    echo ""
fi

# 检查DATABASE_URL
if ! grep -q "^DATABASE_URL=" .env || grep -q "^DATABASE_URL=\"postgresql://user:password@localhost:5432" .env; then
    echo "⚠️  DATABASE_URL未配置或使用默认值"
    echo "   请确保已配置正确的数据库连接串（本地默认多为 SQLite 的 file: 路径）"
    echo ""
    read -p "是否继续? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# 生成Prisma客户端（必须使用本项目 node_modules 内的 Prisma 5，勿用全局 prisma）
echo "🔧 生成Prisma客户端..."
if ! npm run db:generate; then
    echo "❌ Prisma 客户端生成失败。请执行: rm -rf node_modules && npm ci && npm run db:generate"
    exit 1
fi
echo "✓ Prisma客户端生成完成"
echo ""

# 询问是否运行数据库迁移
echo "📊 数据库设置"
read -p "是否运行数据库迁移? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   运行数据库迁移..."
    if ! npm run db:migrate; then
        echo "❌ 数据库迁移失败，请根据上方错误信息修复后重试。"
        exit 1
    fi
    echo "   ✓ 迁移完成"
    echo ""
    
    # 询问是否填充示例数据
    read -p "是否填充示例数据（推荐首次使用）? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   填充示例数据..."
        if ! npm run db:seed; then
            echo "❌ 种子数据导入失败（通常需先成功执行 prisma generate）。"
            exit 1
        fi
        echo "   ✓ 示例数据已创建"
        echo ""
        echo "   📝 测试账户信息:"
        echo "      邮箱: demo@larryacademy.com"
        echo "      密码: demo123456"
        echo ""
    fi
fi

# 显示下一步操作
echo "================================================"
echo "✅ 设置完成！"
echo ""
echo "🚀 启动开发服务器:"
echo "   npm run dev"
echo ""
echo "然后访问: http://localhost:3000"
echo ""
echo "📚 更多命令:"
echo "   npm run build        - 构建生产版本"
echo "   npm run db:studio    - 打开Prisma Studio"
echo "   npm run lint         - 代码检查"
echo ""
echo "📖 文档:"
echo "   SETUP.md            - 详细设置指南"
echo "   TESTING.md          - 测试指南"
echo "   DEPLOYMENT.md       - 部署指南"
echo ""
echo "🎉 祝您使用愉快！"
echo "================================================"
