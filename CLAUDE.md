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
