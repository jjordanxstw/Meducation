# 🏥 Medical Learning Portal

A production-ready monorepo for a Medical Learning Portal built with modern web technologies.

## 📁 Project Structure

```
webpi/
├── apps/
│   ├── web-client/       # Student-facing Vite + React + Hero UI app
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
| **Web Client** | Vite + React 18 + TypeScript + Hero UI + Tailwind CSS |
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
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**apps/web-admin/.env**
```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
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

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Get current user |

### Subjects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | List all subjects |
| GET | `/api/subjects/:id` | Get subject with sections |
| POST | `/api/subjects` | Create subject (admin) |
| PATCH | `/api/subjects/:id` | Update subject (admin) |
| DELETE | `/api/subjects/:id` | Delete subject (admin) |
| PATCH | `/api/subjects/reorder` | Reorder subjects (admin) |

### Sections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sections` | List all sections |
| POST | `/api/sections` | Create section (admin) |
| PATCH | `/api/sections/:id` | Update section (admin) |
| DELETE | `/api/sections/:id` | Delete section (admin) |
| PATCH | `/api/sections/reorder` | Reorder sections (admin) |

### Lectures
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lectures` | List all lectures |
| POST | `/api/lectures` | Create lecture (admin) |
| PATCH | `/api/lectures/:id` | Update lecture (admin) |
| DELETE | `/api/lectures/:id` | Delete lecture (admin) |
| PATCH | `/api/lectures/reorder` | Reorder lectures (admin) |

### Resources (Dynamic Buttons)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources` | List all resources |
| GET | `/api/resources/lecture/:id` | Get resources by lecture |
| POST | `/api/resources` | Create resource (admin) |
| PATCH | `/api/resources/:id` | Update resource (admin) |
| DELETE | `/api/resources/:id` | Delete resource (admin) |

### Calendar Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar` | List all events |
| POST | `/api/calendar` | Create event (admin) |
| PATCH | `/api/calendar/:id` | Update event (admin) |
| DELETE | `/api/calendar/:id` | Delete event (admin) |

### Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List all profiles (admin) |
| GET | `/api/profiles/:id` | Get profile |
| PATCH | `/api/profiles/:id` | Update profile |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs` | List audit logs (admin) |

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
