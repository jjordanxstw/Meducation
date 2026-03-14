# 🏥 Medical Learning Portal

A production-ready monorepo for a Medical Learning Portal built with modern web technologies.

## 📁 Project Structure

```
webpi/
├── apps/
│   ├── web-client/       # Student-facing Next.js app
│   ├── web-admin/        # Admin panel with Refine.dev + Ant Design
│   └── service-api/      # Express + TypeScript REST API
├── packages/
│   └── shared/           # Shared TypeScript types & utilities
└── database/
    ├── schema.sql        # Supabase PostgreSQL schema
    └── seed.sql          # Sample seed data
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Package Manager** | pnpm 8.15.0 with workspaces |
| **Database** | PostgreSQL (Supabase) with Row Level Security |
| **Auth** | Google OAuth 2.0 (restricted to @student.mahidol.ac.th) |
| **API** | Node.js + Express + TypeScript |
| **Web Client** | Next.js + React 18 + TypeScript + Hero UI + Tailwind CSS |
| **Web Admin** | Refine.dev + Ant Design + @dnd-kit |
| **State** | Zustand + TanStack Query |
| **Calendar** | FullCalendar |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase project (or local PostgreSQL)
- Google Cloud Console project with OAuth 2.0 credentials

### 1. Clone & Install

```bash
cd webpi
pnpm install
```

### 2. Setup Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run:

```sql
-- Run database/schema.sql
-- Then run database/seed.sql for sample data
```

### 3. Configure Environment Variables

**apps/service-api/.env**
```env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
WATERMARK_SECRET=your-watermark-secret-key
```

**apps/web-client/.env**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**apps/web-admin/.env**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (web-client)
   - `http://localhost:5174` (web-admin)
   - Your production URLs
6. Add authorized redirect URIs as needed

### 5. Run Development Servers

```bash
# Run all apps in parallel
pnpm dev

# Or run individually:
pnpm --filter service-api dev    # API: http://localhost:3000
pnpm --filter web-client dev     # Client: http://localhost:5173
pnpm --filter web-admin dev      # Admin: http://localhost:5174
```

## 📚 API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | API liveness check |

### Public Authentication (Student)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/verify` | Verify Google token and sign in |
| GET | `/api/v1/auth/me` | Get current student profile |
| POST | `/api/v1/auth/refresh` | Refresh student access token |
| POST | `/api/v1/auth/logout` | Logout student |

### Admin Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/auth/login` | Admin username/password login |
| GET | `/api/v1/admin/auth/me` | Get current admin profile |
| POST | `/api/v1/admin/auth/refresh` | Refresh admin access token |
| POST | `/api/v1/admin/auth/logout` | Logout admin |

### Public Read Resources (Student)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/subjects` | List subjects |
| GET | `/api/v1/subjects/:id` | Subject detail with hierarchy |
| GET | `/api/v1/sections` | List sections |
| GET | `/api/v1/lectures` | List lectures |
| GET | `/api/v1/resources` | List resources |
| GET | `/api/v1/calendar` | List events |
| GET | `/api/v1/profiles/:id` | Student self profile |

### Admin Management Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/subjects` | List subjects |
| POST | `/api/v1/admin/subjects` | Create subject |
| PUT | `/api/v1/admin/subjects/:id` | Update subject |
| DELETE | `/api/v1/admin/subjects/:id` | Delete subject |
| PATCH | `/api/v1/admin/subjects/reorder` | Reorder subjects |
| GET | `/api/v1/admin/sections` | List sections |
| POST | `/api/v1/admin/sections` | Create section |
| PUT | `/api/v1/admin/sections/:id` | Update section |
| DELETE | `/api/v1/admin/sections/:id` | Delete section |
| GET | `/api/v1/admin/lectures` | List lectures |
| POST | `/api/v1/admin/lectures` | Create lecture |
| PUT | `/api/v1/admin/lectures/:id` | Update lecture |
| DELETE | `/api/v1/admin/lectures/:id` | Delete lecture |
| PATCH | `/api/v1/admin/lectures/reorder` | Reorder lectures |
| GET | `/api/v1/admin/resources` | List resources |
| POST | `/api/v1/admin/resources` | Create resource |
| PUT | `/api/v1/admin/resources/:id` | Update resource |
| DELETE | `/api/v1/admin/resources/:id` | Delete resource |
| PATCH | `/api/v1/admin/resources/reorder` | Reorder resources |
| GET | `/api/v1/admin/calendar` | List calendar events |
| POST | `/api/v1/admin/calendar` | Create calendar event |
| PUT | `/api/v1/admin/calendar/:id` | Update calendar event |
| DELETE | `/api/v1/admin/calendar/:id` | Delete calendar event |
| GET | `/api/v1/admin/profiles` | List profiles |
| PATCH | `/api/v1/admin/profiles/:id` | Update profile |
| GET | `/api/v1/admin/audit-logs` | List audit logs |

## 🎨 Design System

### Colors
| Name | Value | Usage |
|------|-------|-------|
| Primary | `#0070F3` | Buttons, Links, Accents |
| Primary Dark | `#1d4ed8` | Hover states |
| White | `#FFFFFF` | Backgrounds |
| Black | `#000000` | Text |

### Typography
- **Headings**: Google Fonts - Kanit
- **Body**: Google Fonts - Prompt

## 🔒 Security Features

### Email Domain Restriction
Only `@student.mahidol.ac.th` emails are allowed to authenticate.

### Video Watermarking
Videos display a floating watermark overlay with:
- User email
- Current timestamp
- Random position animation (anti-screen-capture)

### Row Level Security (RLS)
- Students can only read active content
- Only admins can insert/update/delete

### Audit Logging
All admin actions are logged with:
- User ID
- Action type (INSERT/UPDATE/DELETE)
- Table name
- Old and new data
- Timestamp

## 📦 Build for Production

```bash
# Build all packages
pnpm build

# Build individual apps
pnpm --filter service-api build
pnpm --filter web-client build
pnpm --filter web-admin build
```

## 🧪 Linting

```bash
pnpm lint
```

## 📋 Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to Supabase Auth |
| `subjects` | Academic subjects with year_level |
| `sections` | Sections/blocks within subjects |
| `lectures` | Individual lectures within sections |
| `resources` | Dynamic buttons/links for each lecture |
| `calendar_events` | Exams, holidays, events |
| `audit_logs` | Admin action audit trail |

## 🔄 Content Hierarchy

```
Subject (รายวิชา)
└── Section (หมวดหมู่/Block)
    └── Lecture (บทเรียน)
        └── Resources (ปุ่มต่างๆ: Slide, Video, Summary...)
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for Mahidol University Medical Students
