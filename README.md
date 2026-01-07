<p align="center">
  <img src="frontend/public/logo/mylogo.svg" alt="Trivia Spirit Logo" width="120" />
</p>

<h1 align="center">🎮 Trivia Spirit</h1>
<p align="center">
  <a href="https://www.triviaspirit.com">🌐 Live Demo</a> 
  
</p>
<p align="center">
  <strong>The Ultimate Trivia Game for Family & Friends</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#security">Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Django-5.1-092E20?logo=django" alt="Django" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
</p>

---

> **📋 Portfolio Project** – This repository is a code showcase for demonstration purposes. Dependencies and configuration files have been removed. The code is provided for review only and is not intended to be executed.

---

## ✨ Features

### 🎯 Core Gameplay
- **Team-Based Trivia** – Create teams and compete in real-time trivia battles
- **Custom Categories** – Browse, create, and save your favorite trivia categories
- **Thousands of Questions** – Curated questions across history, science, movies, anime, sports & more
- **Turn-Based System** – Fair turn tracking with team rotation

### 👤 User Experience
- **Google OAuth** – One-click sign-in with Google
- **Profile Customization** – Custom avatars with image cropping
- **Game History** – Track your past games and performance
- **Responsive Design** – Seamless experience on mobile, tablet & desktop

### 💎 Premium Features
- **Membership System** – Unlock premium categories and features
- **LemonSqueezy Integration** – Secure payment processing
- **Ad-Free Experience** – No interruptions for premium users

---

## 🛠 Tech Stack

### Frontend

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **State** | Redux Toolkit + TanStack Query |
| **UI Components** | Radix UI + Lucide Icons |
| **Animations** | Framer Motion |
| **Monitoring** | Sentry + Vercel Analytics |

### Backend

| Category | Technology |
|----------|------------|
| **Framework** | Django 5.1 |
| **API** | Django REST Framework 3.15 |
| **Database** | PostgreSQL 16 |
| **Cache** | LocMemCache |
| **Storage** | Cloudflare R2 |
| **Images** | Pillow + PyVips |
| **Payments** | LemonSqueezy |

---

## 🏗 Architecture

### System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Client   │────▶│  Next.js API    │────▶│  Django Backend │
│  (Browser)      │     │  (BFF Proxy)    │     │  (REST API)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │ HttpOnly Cookie       │
        │                       │ (Auth Token)          │
        ▼                       ▼                       ▼
   No token visible      Token attached           PostgreSQL
   to JavaScript         server-side              + Cloudflare R2
```

### Server-Side Session Management

User authentication and premium membership are handled entirely on the server:

| Step | Description |
|------|-------------|
| 1. Root Layout | Server Component calls `getSession()` |
| 2. Session Fetch | `getServerUser()` reads HttpOnly cookie, fetches user from Django |
| 3. Premium Validation | Expiry date checked server-side before rendering |
| 4. Context Injection | Session passed to `SessionProvider` as props |
| 5. Client Access | Components use `useSession()` hook for user data |

**Benefits:**
- ✅ No client-side auth API calls on page load
- ✅ Premium expiry validated server-side
- ✅ Fresh user data on every server render
- ✅ React `cache()` for request deduplication

### Backend Apps

| App | Responsibility |
|-----|----------------|
| **authentication** | Login, Register, OAuth, Profile, Password Reset |
| **content** | Categories, Questions, Collections, User CRUD |
| **gameplay** | Games, Scores, History, Stats |
| **payments** | LemonSqueezy checkout, Webhooks, Subscriptions |

### Frontend Route Groups

| Route Group | Purpose |
|-------------|---------|
| `(auth)` | Login, Signup, Password Reset |
| `(home)` | Dashboard, Categories, Profile, Settings |
| `(game)` | Game Board, Questions, Results |
| `api/` | BFF Proxy Routes, Auth Endpoints |

---

## 📁 Project Structure

```
trivia-spirit/
├── frontend/                      # Next.js Frontend
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── (auth)/            # Auth pages
│   │   │   │   ├── login/         # Login page
│   │   │   │   ├── signup/        # Registration page
│   │   │   │   ├── ForgotPassword/# Password recovery
│   │   │   │   └── ResetPassword/ # Password reset
│   │   │   ├── (game)/            # Game pages
│   │   │   │   └── game/[id]/     # Dynamic game routes
│   │   │   ├── (home)/            # Main app pages
│   │   │   │   ├── categories/    # Browse & create categories
│   │   │   │   ├── dashboard/     # User dashboard
│   │   │   │   ├── history/       # Game history
│   │   │   │   ├── plans/         # Subscription plans
│   │   │   │   ├── profile/       # User profile
│   │   │   │   ├── teams/         # Team setup
│   │   │   │   ├── privacy/       # Privacy policy
│   │   │   │   ├── terms/         # Terms of service
│   │   │   │   └── refund/        # Refund policy
│   │   │   └── api/               # API Routes (BFF)
│   │   │       ├── auth/          # Auth cookie management
│   │   │       ├── backend/       # Catch-all proxy to Django
│   │   │       └── proxy/         # Request proxy utilities
│   │   │
│   │   ├── components/            # React Components
│   │   │   ├── ui/                # Base UI (buttons, dialogs, inputs)
│   │   │   ├── ads/               # Advertisement components (AdUnit)
│   │   │   ├── category/          # Category display & forms
│   │   │   ├── game/              # Game UI (board, answers, teams)
│   │   │   ├── skeletons/         # Loading skeleton components
│   │   │   ├── utils/             # ErrorBoundary, ImageCropModal, ReduxProvider
│   │   │   ├── User/              # Login/signup forms, profile components
│   │   │   ├── Premium/           # Premium dashboard
│   │   │   ├── Header.tsx         # App header
│   │   │   ├── HeaderAvatar.tsx   # User avatar in header
│   │   │   └── HeroCTA.tsx        # Landing page hero
│   │   │
│   │   ├── hooks/                 # Custom React Hooks
│   │   │   ├── useCategoriesData.ts    # Categories fetching
│   │   │   ├── useCategoryActions.ts   # Category CRUD actions
│   │   │   ├── useCategoryData.ts      # Single category data
│   │   │   ├── useGameData.ts          # Game state management
│   │   │   ├── useImageError.ts        # Image loading fallbacks
│   │   │   ├── useNotification.ts      # Toast notifications
│   │   │   ├── useReroll.ts            # Question reroll logic
│   │   │   ├── useSafeAction.ts        # Safe async actions
│   │   │   ├── useSyncTeams.ts         # Team synchronization
│   │   │   ├── useTurnTracking.ts      # Team turn management
│   │   │   └── useUserCategories.ts    # User's saved categories
│   │   │
│   │   ├── lib/                   # Utilities & API
│   │   │   ├── api/               # Axios API clients
│   │   │   │   ├── base.ts        # Axios instance (BFF proxy)
│   │   │   │   ├── auth.ts        # Auth endpoints
│   │   │   │   ├── categories.ts  # Categories CRUD
│   │   │   │   ├── games.ts       # Game management
│   │   │   │   ├── questions.ts   # Question fetching
│   │   │   │   ├── result.ts      # Game results
│   │   │   │   └── user-categories.ts # Saved categories
│   │   │   ├── auth/              # Server-side auth
│   │   │   │   ├── session.ts     # getSession(), getServerUser()
│   │   │   │   ├── actions.ts     # Server actions
│   │   │   │   └── types.ts       # Session & auth types
│   │   │   ├── config/            # Configuration
│   │   │   │   └── constants.ts   # Centralized app constants
│   │   │   └── utils/             # Utility functions
│   │   │       ├── auth-utils.ts  # Auth helpers
│   │   │       ├── errorTracking.ts # Sentry integration
│   │   │       ├── google-oauth.ts  # Google OAuth utils
│   │   │       ├── imageUtils.ts    # Image processing
│   │   │       ├── logger.ts        # Structured logging
│   │   │       ├── notificationService.ts # Toast service
│   │   │       ├── payments.ts      # Payment utilities
│   │   │       └── utils.ts         # General utilities
│   │   │
│   │   ├── providers/             # React Context Providers
│   │   │   ├── Providers.tsx      # Unified provider wrapper
│   │   │   ├── SessionProvider.tsx # Server → Client session
│   │   │   ├── QueryProvider.tsx  # TanStack Query
│   │   │   └── NotificationProvider.tsx
│   │   │
│   │   ├── contexts/              # React Contexts
│   │   │   └── HeaderContext.tsx  # Header state context
│   │   │
│   │   ├── store/                 # Redux Store
│   │   │   ├── index.ts           # Store configuration
│   │   │   ├── authSlice.ts       # Auth state
│   │   │   ├── gameSlice.ts       # Game state
│   │   │   └── hooks.ts           # Typed Redux hooks
│   │   │
│   │   └── types/                 # TypeScript Definitions
│   │       └── game.ts            # Game, User, Category types
│   │
│   └── public/                    # Static assets
│       ├── avatars/               # Avatar images
│       ├── icons/                 # App icons
│       └── logo/                  # Logo assets
│
└── backend/                       # Django Backend
    ├── authentication/            # User auth & profiles
    │   ├── models.py              # User, UserProfile
    │   ├── views.py               # Login, Register, OAuth, Profile
    │   ├── serializers.py         # DRF serializers
    │   └── urls.py                # Auth endpoints
    ├── content/                   # Trivia content management
    │   ├── models.py              # Category, Question, Collection
    │   ├── views.py               # Categories CRUD, Questions
    │   ├── serializers.py         # Content serializers
    │   ├── permissions.py         # Custom permissions
    │   └── image_optimizer.py     # WebP conversion
    ├── gameplay/                  # Game logic
    │   ├── models.py              # Game, PlayedQuestion
    │   ├── views.py               # Game creation, scoring
    │   └── serializers.py         # Game serializers
    ├── payments/                  # Payment processing
    │   ├── views.py               # Checkout, webhooks
    │   └── lemonsqueezy_client.py # LemonSqueezy API
    ├── middleware/                # Custom middleware
    │   └── logging_middleware.py  # Request logging
    ├── helpers/                   # External services
    │   └── cloudflare/            # R2 storage utilities
    ├── utils/                     # Shared utilities
    │   ├── responses.py           # Standard API responses
    │   └── zeptomail_backend.py   # Email service
    └── trivia_spirit/             # Django project config
        ├── settings.py            # Django settings
        ├── urls.py                # Root URL config
        ├── celery.py              # Celery configuration
        └── wsgi.py                # WSGI entry point
```

---

##  API Reference

### Authentication (`/api/auth/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login/` | POST | ❌ | Login with username/password |
| `/register/` | POST | ❌ | Create new account |
| `/google-oauth/` | POST | ❌ | Login/register with Google |
| `/profile/` | GET | ✅ | Get current user profile |
| `/profile/update/` | PATCH | ✅ | Update profile |
| `/profile/avatar/` | POST | ✅ | Upload profile avatar |
| `/change-password/` | POST | ✅ | Change password |
| `/password-reset/` | POST | ❌ | Request password reset |

**Login Example:**

```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "player1",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "token": "abc123...",
  "user": {
    "id": 1,
    "username": "player1",
    "email": "player1@example.com",
    "avatar_url": "https://cdn.triviaspirit.com/avatars/user1.webp",
    "is_premium": false
  }
}
```

### Content (`/api/content/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/collections/` | GET | ❌ | List all collections |
| `/categories/` | GET | ❌ | List public categories |
| `/categories/` | POST | ✅ | Create custom category |
| `/categories/{id}/` | GET/PATCH/DELETE | ✅ | Category CRUD |
| `/categories/{id}/like/` | POST | ✅ | Like/unlike category |
| `/user-categories/` | GET/POST | ✅ | Saved categories |

**List Categories:**

```http
GET /api/content/categories/?collection=1&search=anime
```

**Response:**
```json
{
  "count": 42,
  "results": [
    {
      "id": 1,
      "name": "Anime Classics",
      "description": "Questions about classic anime series",
      "image": "https://cdn.triviaspirit.com/categories/anime.webp",
      "locked": false,
      "question_count": 50,
      "like_count": 234
    }
  ]
}
```

### Gameplay (`/api/gameplay/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/games/` | POST | ✅ | Create new game |
| `/games/{id}/` | GET/DELETE | ✅ | Get/delete game |
| `/games/{id}/answer/` | POST | ✅ | Submit answer |
| `/games/{id}/end/` | POST | ✅ | End game & save scores |
| `/stats/` | GET | ✅ | Get user statistics |
| `/recent/` | GET | ✅ | Get recent games |

**Create Game:**

```http
POST /api/gameplay/games/
Content-Type: application/json

{
  "mode": "offline",
  "category_ids": [1, 5, 12],
  "teams": [
    {"name": "Team Alpha", "avatar": "👑"},
    {"name": "Team Beta", "avatar": "🔥"}
  ]
}
```

**Response:**
```json
{
  "id": 175,
  "mode": "offline",
  "teams": [...],
  "categories": [...],
  "questions": [
    {
      "id": 101,
      "category_id": 1,
      "difficulty": "200",
      "text": "What anime features a boy who finds a notebook...",
      "choices": ["Death Note", "Naruto", "One Piece", "Bleach"]
    }
  ]
}
```

### Payments (`/api/payments/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/checkout/` | POST | ✅ | Create checkout session |
| `/webhook/` | POST | ❌ | LemonSqueezy webhook |
| `/history/` | GET | ✅ | Payment history |

---

## 📊 Data Models

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │   UserProfile   │       │    Category     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │──────▶│ user_id (FK)    │       │ id              │
│ username        │       │ avatar          │       │ name            │
│ email           │       │ is_premium      │       │ image           │
│ password        │       │ premium_expiry  │       │ locked          │
└─────────────────┘       └─────────────────┘       │ is_custom       │
        │                                           │ created_by (FK) │
        │                                           └────────┬────────┘
        ▼                                                    │
┌─────────────────┐       ┌─────────────────┐       ┌────────▼────────┐
│      Game       │       │ PlayedQuestion  │       │    Question     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │──────▶│ game_id (FK)    │       │ id              │
│ player_id (FK)  │       │ question_id(FK) │◀──────│ category_id     │
│ mode            │       │ team_index      │       │ text            │
│ teams (JSON)    │       │ is_correct      │       │ answer          │
│ categories (M2M)│       │ points          │       │ choices         │
│ date_played     │       └─────────────────┘       │ difficulty      │
└─────────────────┘                                 └─────────────────┘
```

---

## 🔐 Security

### Authentication Flow

```
1. User logs in → Django returns token
2. Frontend calls POST /api/auth/set-cookie with token
3. Next.js sets HttpOnly cookie (token never exposed to JS)
4. Root layout calls getSession() → fetches user server-side
5. Premium expiry validated server-side before rendering
6. Session passed to SessionProvider → available via useSession()
7. All API calls go through /api/backend/* proxy
8. On logout, cookie is cleared server-side
```

### Security Features

| Feature | Implementation |
|---------|----------------|
| **HttpOnly Cookies** | Auth tokens inaccessible to JavaScript |
| **Server-Side Auth** | User/premium status fetched in Server Components |
| **Premium Validation** | Expiry checked server-side, not client |
| **BFF Proxy** | Backend URL hidden from client |
| **Token Auth** | DRF TokenAuthentication |
| **CORS** | Strict origin validation |
| **CSRF** | Protected with trusted origins |
| **SQL Injection** | Django ORM parameterized queries |
| **File Uploads** | Validated & sanitized |

---

##  Performance

### Caching

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `game_{id}_board_{hash}` | 10 min | Question board per game |
| `user_{id}_stats` | 5 min | User statistics |
| `categories_list` | 5 min | Public categories |

### Image Optimization

All uploaded images are automatically:
- Converted to WebP format
- Resized to max 1920px
- Compressed with quality 85

### Frontend Optimization

- TanStack Query caching (5 min stale time)
- Redux Persist for offline state
- Bundle analysis with `npm run analyze`

---

## 📄 License

This project is proprietary software. See LICENSE files in frontend and backend directories.

---

<p align="center">
  Built with ❤️ using Next.js, React, Django & TypeScript
</p>


