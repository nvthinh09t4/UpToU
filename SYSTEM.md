# UpToU — System Documentation

## Overview

**UpToU** is a full-stack content discovery and social engagement platform where users read stories organized by category, interact socially, and earn credits through engagement. It consists of three applications:

| App | Purpose | Path |
|-----|---------|------|
| **Client** | Public-facing reader portal | `/client` |
| **CRM** | Admin management portal | `/crm` |
| **API** | ASP.NET Core 8 backend | `/src` |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 8 Web API (C#) |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| CRM | React 18 + Material-UI + TanStack Query |
| Database | SQL Server + Entity Framework Core |
| Auth | JWT Bearer tokens + HTTP-only refresh cookies |
| ORM | Entity Framework Core (CQRS via MediatR) |

---

## System Features

### Content
- **Stories** — Articles with markdown content, cover images, tags, author attribution, and revision history
- **Categories** — Hierarchical (unlimited nesting). Root categories contain sub-categories. Each category has a score weight affecting story prominence
- **Tags** — Many-to-many relationship with stories for filtering/discovery
- **Featured Stories** — Pinned at the top of category feeds
- **Sorting** — Newest, Oldest, Most Upvoted, Most Downvoted, Most Viewed

### Social Engagement
- **Comments** — Threaded (unlimited nesting), soft-deleted, with reply support
- **Reactions** — Story reactions: Like, Love, Laugh (toggle-based, one per user)
- **Votes** — Up/Down voting on both stories and comments (toggle-based)
- **@Mentions** — Users can be mentioned in comments via their `MentionHandle`
- **Notifications** — Bell notification for replies and @mentions; polls every 30 seconds

### User Features
- **Bookmarks** — Save stories to a personal reading list
- **Credit System** — Earn credits for engagement actions; spend on cosmetic rewards
- **Rewards** — Unlock titles, avatar frames, custom avatars using credits
- **Profile** — Avatar, active title, active avatar frame displayed throughout the UI

### Credit Earning Events
| Action | Type |
|--------|------|
| Daily login | `DailyLogin` |
| Reading a story | `StoryRead` |
| Posting a comment | `CommentPost` |
| Receiving an upvote | `ReceiveUpvote` |

### CRM / Admin Features
- **Dashboard** — Platform stats: total users, stories, comments, daily logins
- **User Management** — List, search, edit, delete users; assign roles
- **Story Management** — Full CRUD with revision history, scoring weights, tags
- **Category Management** — CRUD with hierarchy and score weighting
- **Role Management** — Create and delete authorization roles
- **Reports** — Platform analytics

---

## API Reference (Base: `/api/v1`)

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Register a new account |
| `POST` | `/auth/confirm-email` | — | Confirm email address |
| `POST` | `/auth/resend-confirmation` | — | Resend confirmation email |
| `POST` | `/auth/login` | — | Login → returns JWT + refresh cookie |
| `POST` | `/auth/refresh` | — | Refresh JWT using cookie |
| `POST` | `/auth/logout` | ✓ | Revoke refresh token |
| `GET` | `/auth/external-login?provider=` | — | OAuth challenge (Google, etc.) |
| `GET` | `/auth/external-callback?returnUrl=` | — | OAuth callback handler |
| `GET` | `/auth/me` | ✓ | Current user profile |

### Stories & Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/categories` | — | List active categories |
| `GET` | `/categories/{id}` | — | Category detail |
| `GET` | `/categories/{id}/stories` | — | Stories in category (sortable) |
| `GET` | `/stories/{id}` | — | Story detail (increments view count) |
| `GET` | `/bookmarks` | ✓ | User's bookmarked stories |
| `POST` | `/stories/{id}/bookmark` | ✓ | Toggle bookmark |
| `POST` | `/stories/{id}/vote` | ✓ | Vote on story (Up/Down) |
| `GET` | `/tags` | — | All tags |

### Comments & Reactions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/stories/{storyId}/comments` | — | Comment tree (sortable) |
| `POST` | `/stories/{storyId}/comments` | ✓ | Post comment or reply |
| `DELETE` | `/stories/{storyId}/comments/{id}` | ✓ | Soft-delete comment |
| `POST` | `/stories/{storyId}/comments/{id}/vote` | ✓ | Vote on comment |
| `GET` | `/stories/{storyId}/reactions` | — | Reaction summary |
| `POST` | `/stories/{storyId}/reactions` | ✓ | Toggle reaction (Like/Love/Laugh) |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | ✓ | Paginated notifications |
| `GET` | `/notifications/unread-count` | ✓ | Unread count |
| `POST` | `/notifications/mark-read` | ✓ | Mark notifications as read |

### Credits & Rewards
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/credits/balance` | ✓ | Current credit balance |
| `GET` | `/credits/history` | ✓ | Transaction history (paginated) |
| `GET` | `/credits/rewards` | — | Available rewards (filterable by category) |
| `POST` | `/credits/rewards/{id}/unlock` | ✓ | Unlock a reward |
| `POST` | `/credits/rewards/{id}/activate` | ✓ | Equip/unequip a reward |
| `POST` | `/credits/claim/daily-login` | ✓ | Claim daily login credits |
| `POST` | `/credits/claim/story-read/{storyId}` | ✓ | Claim story read credits |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/search?q=` | ✓ | Search users by MentionHandle (@mention autocomplete) |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/dashboard` | Admin | Platform stats |
| `GET` | `/admin/users` | Admin | List users (paginated, searchable) |
| `GET` | `/admin/users/{id}` | Admin | User detail |
| `PUT` | `/admin/users/{id}` | Admin | Update user |
| `DELETE` | `/admin/users/{id}` | Admin | Delete user |
| `GET` | `/admin/roles` | Admin | List roles |
| `POST` | `/admin/roles` | Admin | Create role |
| `DELETE` | `/admin/roles/{name}` | Admin | Delete role |
| `GET` | `/admin/stories` | Admin | All stories |
| `POST` | `/admin/stories` | Admin | Create story |
| `PUT` | `/admin/stories/{id}` | Admin | Update story |
| `DELETE` | `/admin/stories/{id}` | Admin | Delete story |
| `GET` | `/admin/stories/{id}/details` | Admin | Story revision history |
| `POST` | `/admin/stories/{id}/details` | Admin | Add revision |
| `GET` | `/admin/categories` | Admin | All categories |
| `POST` | `/admin/categories` | Admin | Create category |
| `PUT` | `/admin/categories/{id}` | Admin | Update category |
| `DELETE` | `/admin/categories/{id}` | Admin | Delete category |
| `POST` | `/admin/tags` | Admin | Create tag |
| `DELETE` | `/admin/tags/{id}` | Admin | Delete tag |
| `GET` | `/admin/reports` | Admin | Analytics reports |

**Legend:** `✓` = JWT required · `Admin` = Admin role required

---

## Test Accounts

### Admin Accounts (full CRM access)

| Email | Password | Name | MentionHandle |
|-------|----------|------|---------------|
| `admin@uptou.local` | `Admin@12345!` | System Admin | `@system.admin` |
| `admintest@uptou.local` | `123456aA@` | Admin Test | `@admin.test` |

### Regular User Account

| Email | Password | Name | MentionHandle |
|-------|----------|------|---------------|
| `user01@uptou.local` | `123456aA@` | User 01 | `@user.01` |

> All accounts are seeded automatically on first run via database migrations/seed.

---

## Seeded Content

### Categories (Hierarchical)

```
Finance (1.5x)
├── Investment (1.4x)
├── Budgeting (1.2x)
└── Tax & Accounting (1.0x)

Technology (1.4x)
├── Programming (1.4x)
├── AI & Machine Learning (1.5x)
└── Gadgets (0.9x)

Self Improvement (1.3x)
├── Productivity (1.3x)
└── Mindset (1.2x)

Real Life (1.3x)
├── Health & Wellness (1.3x)
├── Career (1.2x)
└── Relationships (1.1x)

Fiction (1.0x)
├── Fantasy (1.0x)
├── Sci-Fi (1.0x)
└── Thriller (0.9x)
```

### Tags
`beginner` · `advanced` · `guide` · `tips` · `analysis` · `investing` · `savings` · `productivity` · `mindset` · `health` · `coding` · `ai` · `career` · `fiction` · `sci-fi`

### Sample Stories (12 seeded)
| Title | Category | Featured |
|-------|----------|---------|
| Index Funds vs. Active Management | Finance / Investment | Yes |
| Getting Started with ETFs | Finance / Investment | — |
| The 50/30/20 Rule: Does It Still Work in 2026? | Finance / Budgeting | — |
| Clean Architecture in .NET 8 | Technology / Programming | Yes |
| React 19 Features Every Developer Should Know | Technology / Programming | — |
| How Large Language Models Actually Work | Technology / AI & ML | Yes |
| Deep Work in the Age of Notifications | Self Improvement / Productivity | — |
| The Science Behind Growth Mindset | Self Improvement / Mindset | — |
| Negotiating Your Salary | Real Life / Career | — |
| Sleep Optimization | Real Life / Health & Wellness | — |
| The Last Upload | Fiction / Sci-Fi | — (draft) |

---

## Running the Application

### Backend
```bash
cd src/UpToU.API
dotnet watch run
```
API runs at: `https://localhost:5001`

### Client (Reader Portal)
```bash
cd client
npm install
npm run dev
```
Client runs at: `http://localhost:5173`

### CRM (Admin Portal)
```bash
cd crm
npm install
npm run dev
```
CRM runs at: `http://localhost:5174`

### Database
```bash
cd src/UpToU.API
dotnet ef database update
```
Seed data is applied automatically on first run.

---

## Authorization Roles

| Role | Access |
|------|--------|
| `User` | Read stories, comment, react, vote, bookmark, earn/spend credits |
| `Admin` | All User actions + full CRM access (manage users, content, reports) |
