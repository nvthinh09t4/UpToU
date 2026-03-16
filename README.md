# UpToU

A full-stack storytelling platform where contributors create and submit stories, supervisors review them, and readers engage through comments, reactions, and a gamified reward system.

---

## Architecture

| Layer | Technology |
|---|---|
| Backend API | ASP.NET Core 8 — MediatR, FluentValidation, EF Core 8 |
| Database | SQL Server + Entity Framework Core |
| Auth | ASP.NET Core Identity + JWT Bearer + HttpOnly refresh tokens |
| Client (reader) | React 18 + Vite + Tailwind CSS |
| CRM (staff) | React 18 + Vite + MUI (Material UI) |
| Background jobs | Hangfire |
| Cloud | Azure App Service, Blob Storage, Service Bus |

---

## Repository Structure

```
/src
  /UpToU.API            — ASP.NET Core Web API (controllers, middleware, DI)
  /UpToU.Core           — Domain entities, DTOs, command/query interfaces
  /UpToU.Infrastructure — EF Core DbContext, handlers, repositories, jobs, seeding
/client                 — Reader-facing React app (Vite + Tailwind)
/crm                    — Staff CRM React app (Vite + MUI)
/tests                  — xUnit + MSTest test projects
/functions              — Azure Functions (background / event triggers)
```

---

## Role System

| Role | Capabilities |
|---|---|
| **Admin** | Manage platform settings, users, categories, roles; cannot approve/reject stories |
| **Senior Supervisor** | Approve/reject stories; assign Supervisor or Contributor roles to users |
| **Supervisor** | Approve/reject stories assigned to them or unassigned stories |
| **Contributor** | Create and submit stories; optionally assign a supervisor for review |
| *(No role)* | Account exists but cannot access the CRM; must be assigned a role by Admin or Senior Supervisor |

New users registered via the client site have **no CRM role** by default. An Admin or Senior Supervisor must assign them a role before they can log in to the CRM.

---

## Story Workflow

```
Contributor writes → Draft
         ↓ submit
    Submitted (under review)
         ↓ Supervisor/Senior Supervisor reviews
    Approved → scheduled/published
         or
    Rejected → back to Contributor for revision
```

Approved stories can be scheduled for a future publish date or published immediately. A background job (`PublishApprovedStoriesJob`) promotes scheduled stories at the right time.

---

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- SQL Server (local or Azure SQL)

### Backend

```bash
# 1. Copy and fill in your connection string and secrets
cp src/UpToU.API/appsettings.Development.json.example src/UpToU.API/appsettings.Development.json

# 2. Apply migrations and seed the database
cd src/UpToU.API
dotnet ef database update

# 3. Run with hot reload
dotnet watch run
```

The API starts at `http://localhost:5070`. Swagger UI is available at `/swagger`.

### Client (reader site)

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

### CRM (staff site)

```bash
cd crm
npm install
npm run dev        # http://localhost:5174
```

---

## Seed Accounts

After running the seeder, the following accounts are available (password: `123456aA@`):

| Email | Role |
|---|---|
| `admin@uptou.com` | Admin |
| `senior@uptou.com` | Senior Supervisor |
| `supervisor@uptou.com` | Supervisor |
| `contributor@uptou.com` | Contributor |

---

## Common Commands

| Command | Description |
|---|---|
| `dotnet watch run` | Run API with hot reload |
| `dotnet ef migrations add <Name>` | Add a new EF Core migration |
| `dotnet ef database update` | Apply pending migrations |
| `dotnet test` | Run all backend tests |
| `dotnet format` | Auto-format C# code |
| `npm run dev` | Start frontend dev server |
| `npm test` | Run frontend tests |
| `npx eslint . --fix` | Auto-fix JS/TS lint errors |
| `npm run test:e2e` | Run all E2E tests (from project root) |
| `npm run test:e2e:client` | Run client E2E tests only |
| `npm run test:e2e:crm` | Run CRM E2E tests only |
| `npm run test:e2e:headed` | Run E2E tests in headed mode |
| `npm run test:e2e:ui` | Open Playwright interactive UI |
| `npm run test:e2e:report` | Open last Playwright HTML report |

---

## E2E Testing

End-to-end tests are located in the `/e2e` directory and use [Playwright](https://playwright.dev/). They cover the **client** (reader site) and **CRM** (staff site) — not the API itself.

### Prerequisites

The API must be running before the tests execute:

```bash
cd src/UpToU.API
dotnet watch run   # http://localhost:5070
```

### Setup

```bash
cd e2e
npm install
npx playwright install chromium
```

### Run all tests

```bash
cd e2e
npm test                  # all tests (client + CRM)
npm run test:client       # client tests only
npm run test:crm          # CRM tests only
npm run test:headed       # watch tests run in a real browser
npm run test:ui           # Playwright interactive UI
npm run report            # open the last HTML report
```

> **Note:** The dev servers (ports 5173 and 5174) start automatically when `CI` is not set. If they are already running, Playwright will reuse them.

### Test coverage

| Area | Spec file | What is tested |
|---|---|---|
| Client – Auth | `client/auth.spec.ts` | Login, validation, error states, registration, logout |
| Client – Home | `client/home.spec.ts` | Hero, stats, categories, CTA, navigation |
| Client – Stories | `client/stories.spec.ts` | Category page, story page, bookmarks, notifications, progress, rewards |
| Client – Dashboard | `client/dashboard.spec.ts` | Auth guard, user profile, achievements, credits, streak |
| Client – Leaderboard | `client/leaderboard.spec.ts` | Page load, time-period tabs, rank tiers |
| CRM – Auth | `crm/auth.spec.ts` | Login, invalid credentials, auth guard, logout |
| CRM – Dashboard | `crm/dashboard.spec.ts` | Greeting, KPI cards, sidebar nav, recent activity |
| CRM – Stories | `crm/stories.spec.ts` | List, search, Add button, status tabs, import/export, interactive editor |
| CRM – Categories | `crm/categories.spec.ts` | List, search, Add dialog, Users, Roles, Reports, Rewards pages |

### Test accounts

All seed accounts use password `123456aA@`:

| Account | Role | Used in |
|---|---|---|
| `admin@uptou.com` | Admin | Client + CRM admin tests |
| `contributor@uptou.com` | Contributor | CRM contributor tests |

Auth state is saved under `e2e/.auth/` (gitignored) after the setup steps run.

---

## Key Features

- **Story workflow** — Draft → Submit → Review (Approve / Reject) → Publish
- **Interactive stories** — Node-based branching story editor in the CRM
- **Gamification** — Credits, leaderboard, rewards, daily streaks, and badges for reader engagement
- **Story ratings** — 1–5 star ratings with optional comments after completing a story
- **Personalized recommendations** — Rule-based engine suggests unseen stories based on the user's top-earning categories
- **Comments & reactions** — Threaded comments and emoji reactions on stories
- **Ban system** — Admins can ban users with reason, duration, and category scope
- **Session persistence** — JWT access tokens refreshed silently via HttpOnly cookie; CRM session survives page refresh
- **Background jobs** — Scheduled story publishing; display-name expiry cleanup; contributor champion assignment
