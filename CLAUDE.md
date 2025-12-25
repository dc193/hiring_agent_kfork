# Hiring Agent - Project Context

## Overview

Hiring Agent is an AI-powered candidate evaluation system that helps streamline the hiring process. It parses resumes, builds comprehensive candidate profiles, and assists with interview management.

## Core Philosophy

Understanding a candidate requires capturing two dimensions:

- **Profile (档案画像)**: Who they are, what they can do
- **Preference (偏好画像)**: What they want, what they will do

```
Raw Data (behaviors, statements, choices)
        │
        ├──► Upward Inference ──► Profile ──► Predict "what they CAN do"
        │
        └──► Downward Inquiry ──► Preference ──► Predict "what they WILL do"
```

**Complete Understanding = Profile × Preference**

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| AI | Claude API (Anthropic) |
| Auth | Privy (planned) |
| Deployment | Vercel |
| File Storage | Vercel Blob |

---

## Database Schema

### Core Tables

1. **candidates** - Main candidate record
2. **work_experiences** - Job history
3. **educations** - Education records
4. **projects** - Project portfolio

### Evaluation Tables

5. **candidate_profiles** - Profile dimension (capabilities, behaviors, resources)
6. **candidate_preferences** - Preference dimension (values, goals, motivations)

### Process Tables

7. **pipeline_history** - Interview stage tracking
8. **attachments** - Files stored in Blob
9. **interview_notes** - Interviewer feedback

### Interview Pipeline (7 stages)

```
resume_review → phone_screen → homework → team_interview → consultant_review → final_interview → offer
```

---

## Profile Dimensions

| Dimension | Description | Data Source |
|-----------|-------------|-------------|
| Basic Attributes | Age, education, career stage | Resume |
| Capability Map | Hard/soft skills, certifications | Resume, assessments |
| Achievement Track | Projects, career path, milestones | Resume, references |
| Behavior Patterns | Communication, decision, collaboration style | Interviews, 360 feedback |
| Social Position | Network, influence, reputation | LinkedIn, references |
| Resource Endowment | Available time, commitments | Direct communication |

---

## Preference Dimensions

| Dimension | Description | How to Assess |
|-----------|-------------|---------------|
| Value Ranking | What matters most (money, freedom, recognition, etc.) | Key choice analysis |
| Motivation Structure | Intrinsic vs extrinsic drivers | What they do without supervision |
| Goal Picture | Short/mid/long term goals | Future discussions |
| Risk Attitude | Aggressive/moderate/conservative | Past decision patterns |
| Cognitive Style | Analysis vs intuition, global vs detail | How they explain decisions |
| Relationship Style | Depth vs breadth, compete vs cooperate | Social behavior patterns |
| Growth Style | Learning preferences, feedback receptivity | Response to criticism |
| Boundaries | Moral limits, non-negotiables | Rejected opportunities |

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:push          # Push schema to database
npm run db:generate      # Generate migration files
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio

# Build
npm run build            # Production build
npm run lint             # Run ESLint
```

---

## Directory Structure

```
src/
├── app/
│   ├── api/
│   │   └── parse-resume/    # Resume parsing API
│   ├── candidates/          # Candidate pages (planned)
│   │   ├── [id]/
│   │   │   ├── profile/     # Profile page
│   │   │   └── preferences/ # Preferences page
│   │   └── page.tsx         # Candidates list
│   ├── layout.tsx
│   └── page.tsx             # Home / Upload
├── components/
│   ├── ResumeUploader.tsx
│   └── ResumeDisplay.tsx
├── db/
│   ├── schema.ts            # Database schema
│   └── index.ts             # Database connection
└── types/
    └── resume.ts            # TypeScript types
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...   # Claude API key
DATABASE_URL=postgresql://...   # Neon database URL
```

---

## Coding Conventions

1. **TypeScript** - Strict mode, explicit types
2. **Components** - Functional components with hooks
3. **API Routes** - Next.js App Router format
4. **Database** - Drizzle ORM with typed queries
5. **Styling** - Tailwind CSS + shadcn/ui components

---

## UI Component Guidelines

### Use shadcn/ui components instead of raw HTML

| Element | Use This | Not This |
|---------|----------|----------|
| Buttons | `<Button>` | `<button className="...">` |
| Cards | `<Card>`, `<CardHeader>`, `<CardContent>` | `<div className="rounded-xl border...">` |
| Tables | `<Table>`, `<TableRow>`, `<TableCell>` | `<table className="...">` |
| Badges | `<Badge>` | `<span className="px-2 py-1 rounded...">` |
| Icons | `lucide-react` icons | Inline SVG |

### Component File Structure

```
src/components/
├── ui/                    # shadcn/ui components (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── table.tsx
├── layout/                # Layout components
│   ├── header.tsx
│   └── footer.tsx
└── [feature]/             # Feature-specific components
    └── component-name.tsx
```

### Import Pattern

```tsx
// UI components
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Icons from lucide-react
import { FileText, Users, ChevronLeft } from "lucide-react"

// Layout components
import { Header, Footer } from "@/components/layout"
```

### Anti-Patterns to Avoid

- **NO** inline SVG icons - use `lucide-react`
- **NO** raw `<button>`, `<table>`, `<input>` - use shadcn/ui
- **NO** duplicated styling - extract to components
- **NO** long component files - split into focused modules

---

## Version History

- v0.1 - Initial setup with resume parsing
- v0.2 - Database schema with Profile/Preference framework
- v0.3 - Add shadcn/ui component library and coding standards
- v0.4 - Pipeline management, stage-based materials, candidate CRUD
- v0.5 - Interview management system (sessions, questions, evaluations)
- v0.6 - Settings page with stage configurations
- v0.7 - Comprehensive profile view, file preview features

---

## Recent Updates (2024-12)

### Completed Features

1. **外部顾问分析阶段** - Pipeline 增加 consultant_review 阶段
   - 位置：team_interview 和 final_interview 之间
   - 7 阶段流程：简历筛选 → 电话面试 → 作业 → Team面试 → 外部顾问 → 终面 → Offer

2. **文件预览功能** - Pipeline 各阶段附件支持直接预览
   - 支持 PDF（iframe 嵌入）
   - 支持 Markdown、Text、JSON（文本展示）
   - 组件：`src/components/stages/stage-attachments.tsx`

3. **文字输入模式** - 评审意见/转录文本/面试笔记支持直接文字输入
   - 不需要上传文件，直接在页面输入
   - 跳过 AI 分析（人工输入内容）

4. **PDF 分析修复** - Claude API 可以正确分析 PDF 文件内容
   - 使用 document 类型 + base64 编码
   - 组件：`src/lib/processing.ts`

5. **Bug/Feature 显示修复** - 提交后正确显示
   - 添加 `dynamic = "force-dynamic"` 禁用页面缓存

---

## Key Components

| 功能 | 文件路径 |
|------|----------|
| Pipeline 阶段定义 | `src/db/schema.ts` (PIPELINE_STAGES) |
| 阶段附件管理 | `src/components/stages/stage-attachments.tsx` |
| Pipeline 控制器 | `src/components/candidates/pipeline-controls.tsx` |
| 阶段徽章 | `src/components/candidates/stage-badge.tsx` |
| 综合档案页面 | `src/app/candidates/[id]/comprehensive/page.tsx` |
| AI 处理逻辑 | `src/lib/processing.ts` |
| 设置页面 | `src/app/settings/page.tsx` |

---

## Pipeline 阶段配置

每个阶段的附件类型定义在：`src/app/candidates/[id]/stages/[stage]/page.tsx`

```typescript
const STAGE_ATTACHMENT_TYPES = {
  resume_review: ["简历", "筛选备注", "其他"],
  phone_screen: ["通话录音", "转录文本", "面试笔记", "其他"],
  homework: ["作业提交", "评审意见", "其他"],
  team_interview: ["面试录音", "转录文本", "面试笔记", "其他"],
  consultant_review: ["顾问评估报告", "沟通记录", "其他"],
  final_interview: ["面试录音", "转录文本", "面试笔记", "其他"],
  offer: ["Offer Letter", "合同", "备注", "其他"],
};
```

---

## Pending / Future Ideas

- [ ] 自定义流程模版（暂不需要，写死即可）
- [ ] 用户认证 (Privy)
- [ ] 更多 AI 分析维度

