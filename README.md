<p align="center">
  <img src="frontend/public/logo/mylogo.svg" alt="Trivia Spirit Logo" width="120" />
</p>

<h1 align="center">🎮 Trivia Spirit</h1>
<p align="center">
  <a href="https://www.triviaspirit.com">🌐 Live Demo</a> •
  
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
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/              # App Router (pages & API routes)
│   │   │   ├── (auth)/       # Auth pages
│   │   │   ├── (game)/       # Game pages
│   │   │   ├── (home)/       # Dashboard, categories, profile
│   │   │   └── api/          # BFF proxy routes
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # API clients & utilities
│   │   ├── store/            # Redux store
│   │   └── types/            # TypeScript definitions
│   └── public/               # Static assets
│
└── backend/                  # Django Backend
    ├── authentication/       # User auth & profiles
    ├── content/              # Trivia content management
    ├── gameplay/             # Game logic
    ├── payments/             # Payment processing
    ├── middleware/           # Custom middleware
    ├── helpers/              # Cloudflare utilities
    ├── utils/                # Shared utilities
    └── trivia_spirit/        # Django project config
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
4. All API calls go through /api/backend/* proxy
5. Proxy reads cookie, attaches token to Django requests
6. On logout, cookie is cleared server-side
```

### Security Features

| Feature | Implementation |
|---------|----------------|
| **HttpOnly Cookies** | Auth tokens inaccessible to JavaScript |
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


