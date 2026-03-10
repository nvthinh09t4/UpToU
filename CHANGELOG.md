# Changelog

## [Unreleased] — 2026-03-09

### Overview
This release introduces the full **social engagement layer** for UpToU: users can now comment on stories, reply to any comment (unlimited nesting), react with emoji, up/down vote stories and comments, and receive real-time notifications when mentioned or replied to.

---

### New Features

#### Comments
- Users can post top-level comments on any published story
- Replies are supported at **unlimited depth** — any comment or reply can be replied to
- Reply form auto-prefills `@mention` of the person being replied to
- Comments support `@handle` mentions with a live autocomplete dropdown (searches by `MentionHandle`)
- Admins can delete any comment; authors can delete their own
- Comment bodies highlight `@mention` references in the rendered view
- Deep reply threads visually indent up to 4 levels, then stack flat to prevent overflow
- Sort comments by: **Newest**, **Oldest**, **Most Upvoted**, **Most Downvoted**

#### Reactions
- Users can react to stories with 👍 Like, ❤️ Love, 😂 Laugh
- Reactions are toggled: clicking the active reaction removes it; clicking a different one replaces it
- Reaction counts are visible to all users; voting requires authentication

#### Votes
- Up/Down voting on both **stories** and **individual comments**
- Toggle behaviour: same vote removes it; different vote replaces it
- Story and category pages show live vote counts
- Stories sortable by: **Most Upvoted**, **Most Downvoted**, **Most Viewed**, **Newest**, **Oldest**
- Vote state updates optimistically in the UI without a full refetch

#### View Count
- Every `GET /api/v1/stories/{id}` visit atomically increments `Story.ViewCount`
- View counts displayed in story hero and category card listings

#### Notifications
- Users receive a `Reply` notification when someone replies to their comment
- Users receive a `Mention` notification when tagged with `@handle` in a comment
- `NotificationBell` in the header polls for unread count every 30 seconds
- Clicking a notification navigates directly to the comment anchor (`#comment-{id}`)
- Opening the notification panel marks all visible notifications as read
- Notification panel shows: actor name, type, and relative timestamp

#### `MentionHandle`
- `ApplicationUser` gains a `MentionHandle` column (`{firstname}.{lastname}`, lowercased, deduplicated with numeric suffix)
- Assigned automatically at registration via `BuildUniqueMentionHandleAsync`
- Seeded for all built-in users: `system.admin`, `admin.test`, `user.01`
- Existing users without a handle are backfilled on next startup

#### Authentication Bootstrap
- `AuthBootstrap` component silently attempts `POST /auth/refresh` on app load
- Restores the session from the HTTP-only cookie without requiring a new login
- Uses `_skipRetry` flag to prevent the 401 interceptor from retrying the bootstrap call

---

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/stories/{id}/comments?sortBy=` | — | List comments (nested tree) |
| `POST` | `/api/v1/stories/{storyId}/comments` | ✓ | Post a comment or reply |
| `DELETE` | `/api/v1/stories/{storyId}/comments/{id}` | ✓ | Soft-delete a comment |
| `POST` | `/api/v1/stories/{storyId}/comments/{id}/vote` | ✓ | Up/down vote a comment |
| `GET` | `/api/v1/stories/{storyId}/reactions` | — | Get reaction summary |
| `POST` | `/api/v1/stories/{storyId}/reactions` | ✓ | Toggle a reaction |
| `POST` | `/api/v1/stories/{id}/vote` | ✓ | Up/down vote a story |
| `GET` | `/api/v1/categories/{id}/stories?sortBy=` | — | List stories with sort |
| `GET` | `/api/v1/notifications` | ✓ | List notifications |
| `GET` | `/api/v1/notifications/unread-count` | ✓ | Get unread count |
| `POST` | `/api/v1/notifications/mark-read` | ✓ | Mark notifications as read |
| `GET` | `/api/v1/users/search?q=` | ✓ | Search users by mention handle |

---

### Database Migrations

| Migration | Description |
|-----------|-------------|
| `AddStoryAndTags` | Story, Tag, StoryDetail entities |
| `AddStoryFields` | Slug, excerpt, score weight fields |
| `AddCommentsReactionsNotifications` | Comment, Reaction, Notification entities; MentionHandle on ApplicationUser |
| `AddVotesAndViewCount` | StoryVote, CommentVote, Story.ViewCount |

---

### Bug Fixes

- **DataGrid cell overflow (CRM)**: Removed `height:'100%'` from all `renderCell` containers in `UsersPage`, `StoriesPage`, and `CategoriesPage` — MUI DataGrid cells already apply `align-items:center` so adding a full-height container pushed content to the top of the row
- **Auth session not restored on refresh**: Added `AuthBootstrap` to call `/auth/refresh` on app startup; without this, page refreshes always showed "Sign in" even for active sessions
- **401 console noise on unauthenticated visits**: Added `_skipRetry` flag to Axios 401 interceptor; the bootstrap refresh no longer triggers a redundant retry that floods the console
- **Reply notification for deleted comments**: `PostCommentHandler` now skips the Reply notification if the parent comment has been soft-deleted
- **Vote handlers missing existence check**: `VoteStoryHandler` and `VoteCommentHandler` now return 404 if the story/comment does not exist before writing a vote record

---

### Performance Improvements

- **O(n²) → O(1) vote count lookups**: `GetCommentsHandler` and `GetStoriesByCategoryHandler` previously called `List.FirstOrDefault` for every comment/story when resolving vote counts (O(n) per item). Replaced with `Dictionary<id, Dictionary<voteType, count>>` for O(1) lookups per item.

---

### Unit Tests Added

- `CreateStoryHandlerTests` — 4 tests (category not found, revision, tags, category title)
- `UpdateStoryHandlerTests` — 4 tests (not found, category not found, field update, tag replacement)
- `DeleteStoryHandlerTests` — 4 tests (not found, soft-delete, already-deleted, query filter)
- `GetStoriesByCategoryHandlerTests` — 6 tests (published only, featured first, date order, revision, empty, isolation)
- `GetStoryByIdHandlerTests` — 5 tests (not found, unpublished, latest revision, null detail, category title)
- `AddStoryDetailHandlerTests` — 6 tests (not found, revision increment, score history, unchanged, soft-deleted, publish flag)
- `TagHandlerTests` — 7 tests (duplicate tag, create, delete not found, delete, get empty, alphabetical order)
- Fixed `RegisterCommandHandlerTests` to match updated handler constructor signature

---

### CRM Updates

- **Users page**: Full name, role badge, email, registration date with correct cell alignment
- **Stories page**: Title with tag chips, published/draft status badge, featured badge, category, actions
- **Categories page**: Active/inactive status, story count, actions
- **Stories admin**: Full CRUD with revision history and score weight management
