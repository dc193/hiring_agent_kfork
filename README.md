# Hiring Agent - AI 招聘助手

一个基于 AI 的候选人评估系统，帮助简化招聘流程。支持简历解析、候选人画像构建、面试管理等功能。

## 核心理念

理解一个候选人需要从两个维度出发：

- **档案画像 (Profile)**：他是谁、能做什么
- **偏好画像 (Preference)**：他要什么、会做什么

```
原始数据（行为、陈述、选择）
        │
        ├──► 向上推断 ──► Profile ──► 预测"能做什么"
        │
        └──► 向下探询 ──► Preference ──► 预测"会做什么"
```

**完整理解 = Profile × Preference**

---

## 功能特性

### 📄 简历管理
- 上传并解析 PDF/Word 简历
- 自动提取候选人信息（教育、工作经历、项目、技能）
- 原文保留，支持随时查看

### 🎯 候选人画像
- **档案画像**：能力图谱、行为模式、社会位置、资源禀赋
- **偏好画像**：价值排序、动机结构、目标图景、风险态度

### 📊 面试流程管理
- 7 阶段标准流程：简历筛选 → 电话面试 → 作业 → Team 面试 → 顾问面试 → 终面 → Offer
- 可自定义流程模板
- 每个阶段支持附件、笔记、AI 分析

### 🤖 AI 分析
- 基于 Claude API 的智能分析
- 可配置 Prompt 和参考材料
- 自动生成候选人评估报告

### 🎤 面试记录
- 面试场次管理
- 问答记录与评分
- 支持录音转录和 AI 分析

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| UI 组件 | shadcn/ui |
| 数据库 | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| AI | Claude API (Anthropic) |
| 文件存储 | Vercel Blob |
| 部署 | Vercel |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/dc193/hiring_agent_kfork.git
cd hiring_agent_kfork
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# 数据库连接（Neon PostgreSQL）
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Claude API 密钥
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Vercel Blob 存储
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
```

### 4. 初始化数据库

```bash
npm run db:push
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器

# 数据库
npm run db:push          # 推送 schema 到数据库
npm run db:generate      # 生成迁移文件
npm run db:migrate       # 运行迁移
npm run db:studio        # 打开 Drizzle Studio

# 构建
npm run build            # 生产构建
npm run lint             # 运行 ESLint
```

---

## 项目结构

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── candidates/       # 候选人 API
│   │   ├── parse-resume/     # 简历解析 API
│   │   └── ...
│   ├── candidates/           # 候选人页面
│   │   └── [id]/
│   │       ├── page.tsx      # 候选人详情
│   │       ├── comprehensive/# 综合视图
│   │       └── stages/       # 阶段详情
│   ├── interviews/           # 面试管理
│   ├── settings/             # 设置页面
│   └── page.tsx              # 首页
├── components/               # React 组件
│   ├── ui/                   # shadcn/ui 组件
│   ├── candidates/           # 候选人相关组件
│   └── interviews/           # 面试相关组件
├── db/
│   ├── schema.ts             # 数据库 Schema
│   └── index.ts              # 数据库连接
└── types/                    # TypeScript 类型
```

---

## 数据库结构

### 核心表

```
candidates           候选人主表
├── work_experiences 工作经历
├── educations       教育经历
├── projects         项目经历
├── attachments      附件文件
├── candidate_profiles    档案画像
└── candidate_preferences 偏好画像
```

### 面试系统

```
interview_sessions   面试场次
├── session_questions    问答记录
├── interview_evaluations 评估打分
└── interview_transcripts 录音转录
```

### 流程配置

```
pipeline_templates   流程模板
└── template_stages  阶段配置
    └── stage_prompts    AI Prompt
        └── prompt_reference_files 参考文件
```

---

## 使用指南

### 添加候选人

1. 点击首页的"上传简历"
2. 选择 PDF 或 Word 文件
3. 系统自动解析并创建候选人

### 查看候选人

1. 在候选人列表点击进入详情页
2. 查看基本信息、工作经历、教育背景
3. 切换到"综合视图"查看完整画像

### 推进流程

1. 在候选人详情页查看当前阶段
2. 点击"Next Stage"推进到下一阶段
3. 每个阶段可以上传附件、添加笔记

### AI 分析

1. 进入阶段详情页
2. 选择要执行的 Prompt
3. 点击"执行"生成 AI 分析报告
4. 报告自动保存为附件

### 配置 Prompt

1. 进入"Settings" → "Pipeline 设置"
2. 选择阶段，添加或编辑 Prompt
3. 可上传参考材料供 AI 参考

---

## 部署

### Vercel 部署

1. Fork 本仓库到你的 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量：
   - `DATABASE_URL`
   - `ANTHROPIC_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`（在 Storage 创建 Blob 后自动添加）
4. 部署完成

### 环境变量获取

- **DATABASE_URL**: 在 [Neon](https://neon.tech) 创建数据库获取
- **ANTHROPIC_API_KEY**: 在 [Anthropic Console](https://console.anthropic.com) 获取
- **BLOB_READ_WRITE_TOKEN**: Vercel 项目 Storage 中创建 Blob 后获取

---

## 版本历史

- v0.1 - 初始版本：简历解析
- v0.2 - 数据库 Schema：Profile/Preference 框架
- v0.3 - UI 组件库：shadcn/ui 集成
- v0.4 - 面试系统：场次管理、问答记录
- v0.5 - AI 分析：Prompt 配置、参考材料

---

## License

MIT
