<p align="center">
  <img src="../frontend/public/logo/logo.png" alt="Trivia Spirit Logo" width="120" />
</p>

<h1 align="center">🎮 Trivia Spirit Backend</h1>

<p align="center">
  <strong>Django REST API powering the Ultimate Trivia Game</strong>
</p>

<p align="center">
  <a href="#architecture">Architecture</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#data-models">Data Models</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.1-092E20?logo=django" alt="Django" />
  <img src="https://img.shields.io/badge/DRF-3.15-A30000?logo=django" alt="Django REST Framework" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Cloudflare_R2-F38020?logo=cloudflare" alt="Cloudflare R2" />
</p>

---

## 🏗 Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TRIVIA SPIRIT BACKEND                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │              │  │              │  │              │  │              │ │
│  │    AUTH      │  │   CONTENT    │  │   GAMEPLAY   │  │   PAYMENTS   │ │
│  │              │  │              │  │              │  │              │ │
│  │  • Login     │  │  • Categories│  │  • Games     │  │  • Checkout  │ │
│  │  • Register  │  │  • Questions │  │  • Scores    │  │  • Webhooks  │ │
│  │  • OAuth     │  │  • Collections│ │  • History   │  │  • Subs      │ │
│  │  • Profile   │  │  • User CRUD │  │  • Stats     │  │              │ │
│  │              │  │              │  │              │  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │         │
│         └─────────────────┴─────────────────┴─────────────────┘         │
│                                    │                                     │
│                         ┌──────────▼──────────┐                         │
│                         │   Django REST API    │                         │
│                         │   Token Auth + CORS  │                         │
│                         └──────────┬──────────┘                         │
│                                    │                                     │
│    ┌──────────────┐    ┌──────────▼──────────┐    ┌──────────────┐      │
│    │              │    │                      │    │              │      │
│    │  PostgreSQL  │◀───│      MIDDLEWARE      │───▶│  LocMemCache │      │
│    │  (Database)  │    │   Logging • CORS     │    │  (In-Memory) │      │
│    │              │    │                      │    │              │      │
│    └──────────────┘    └──────────────────────┘    └──────────────┘      │
│                                    │                                     │
│                         ┌──────────▼──────────┐                         │
│                         │   Cloudflare R2     │                         │
│                         │   (Media Storage)   │                         │
│                         └─────────────────────┘                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### App Structure

| App | Responsibility | Key Features |
|-----|----------------|--------------|
| **authentication** | User management | Login, Register, OAuth, Profile, Password Reset |
| **content** | Trivia data | Categories, Questions, Collections, User Categories |
| **gameplay** | Game logic | Game creation, Score tracking, History, Stats |
| **payments** | Monetization | LemonSqueezy checkout, Webhooks, Subscriptions |

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Django 5.1 | Web framework |
| **API** | Django REST Framework 3.15 | RESTful API |
| **Database** | PostgreSQL 16 | Primary database |
| **Cache** | LocMemCache | In-memory caching |
| **Storage** | Cloudflare R2 | Media files (S3-compatible) |
| **Images** | Pillow + PyVips | Image processing & optimization |
| **Tasks** | Celery | Background jobs |
| **Auth** | Token Auth + Google OAuth | Authentication |
| **Payments** | LemonSqueezy | Payment processing |

---

## 📡 API Reference

### Base URL

```
Production:
Development: http://127.0.0.1:8000
```

### Authentication

All authenticated endpoints require a Token header:

```http
Authorization: Token <your-auth-token>
```

---

### 🔐 Authentication API (`/api/auth/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login/` | POST | ❌ | Login with username/password |
| `/register/` | POST | ❌ | Create new account |
| `/google-oauth/` | POST | ❌ | Login/register with Google |
| `/profile/` | GET | ✅ | Get current user profile |
| `/profile/update/` | PATCH | ✅ | Update profile (username, email) |
| `/profile/avatar/` | POST | ✅ | Upload profile avatar |
| `/change-password/` | POST | ✅ | Change password |
| `/password-reset/` | POST | ❌ | Request password reset email |
| `/password-reset-confirm/` | POST | ❌ | Confirm password reset |

#### Login

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
    "is_premium": false,
    "premium_expiry": null
  }
}
```

#### Google OAuth

```http
POST /api/auth/google-oauth/
Content-Type: application/json

{
  "credential": "<google-id-token>"
}
```

---

### 📚 Content API (`/api/content/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/collections/` | GET | ❌ | List all collections |
| `/categories/` | GET | ❌ | List public categories |
| `/categories/` | POST | ✅ | Create custom category |
| `/categories/{id}/` | GET | ❌ | Get category details |
| `/categories/{id}/` | PATCH | ✅ | Update own category |
| `/categories/{id}/` | DELETE | ✅ | Delete own category |
| `/categories/{id}/like/` | POST | ✅ | Like/unlike category |
| `/questions/` | GET | ✅ | List questions (admin) |
| `/questions/{id}/` | GET | ✅ | Get question details |
| `/user-categories/` | GET | ✅ | List saved categories |
| `/user-categories/` | POST | ✅ | Save category to library |
| `/user-categories/{id}/` | DELETE | ✅ | Remove from library |

#### List Categories

```http
GET /api/content/categories/?collection=1&search=anime
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `collection` | int | Filter by collection ID |
| `search` | string | Search by name |
| `is_custom` | bool | Filter user-created categories |
| `page` | int | Pagination page |

**Response:**
```json
{
  "count": 42,
  "next": "/api/content/categories/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Anime Classics",
      "description": "Questions about classic anime series",
      "image": "https://cdn.triviaspirit.com/categories/anime.webp",
      "locked": false,
      "is_custom": false,
      "question_count": 50,
      "collection": 1,
      "like_count": 234,
      "is_liked": false
    }
  ]
}
```

#### Create Custom Category

```http
POST /api/content/categories/
Content-Type: multipart/form-data
Authorization: Token <token>

name=My Trivia
description=Custom questions
image=<file>
privacy=public
```

---

### 🎮 Gameplay API (`/api/gameplay/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/games/` | POST | ✅ | Create new game |
| `/games/{id}/` | GET | ✅ | Get game details + questions |
| `/games/{id}/` | DELETE | ✅ | Delete game |
| `/games/{id}/answer/` | POST | ✅ | Submit answer |
| `/games/{id}/end/` | POST | ✅ | End game & save scores |
| `/stats/` | GET | ✅ | Get user statistics |
| `/recent/` | GET | ✅ | Get recent games |

#### Create Game

```http
POST /api/gameplay/games/
Content-Type: application/json
Authorization: Token <token>

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
  "teams": [
    {"name": "Team Alpha", "avatar": "👑"},
    {"name": "Team Beta", "avatar": "🔥"}
  ],
  "categories": [
    {"id": 1, "name": "Anime Classics"},
    {"id": 5, "name": "World History"},
    {"id": 12, "name": "Science"}
  ],
  "questions": [
    {
      "id": 101,
      "category_id": 1,
      "difficulty": "200",
      "text": "What anime features a boy who finds a notebook...",
      "choices": ["Death Note", "Naruto", "One Piece", "Bleach"],
      "image": null
    }
  ],
  "date_played": "2026-01-04T19:30:00Z"
}
```

#### Submit Answer

```http
POST /api/gameplay/games/175/answer/
Content-Type: application/json
Authorization: Token <token>

{
  "question_id": 101,
  "team_index": 0,
  "is_correct": true,
  "points": 200
}
```

#### Get Statistics

```http
GET /api/gameplay/stats/
Authorization: Token <token>
```

**Response:**
```json
{
  "total_games": 42,
  "total_questions_answered": 1250,
  "correct_answers": 980,
  "accuracy": 78.4,
  "favorite_category": "Anime Classics",
  "total_points": 45600
}
```

---

### 💳 Payments API (`/api/payments/`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/checkout/` | POST | ✅ | Create checkout session |
| `/webhook/` | POST | ❌ | LemonSqueezy webhook |
| `/history/` | GET | ✅ | Payment history |

#### Create Checkout

```http
POST /api/payments/checkout/
Content-Type: application/json
Authorization: Token <token>

{
  "variant_id": "123456"
}
```

**Response:**
```json
{
  "checkout_url": "https://triviaspirit.lemonsqueezy.com/checkout/...",
  "order_id": "ord_abc123"
}
```

---

## 📊 Data Models

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │   UserProfile   │       │    Payment      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │───┐   │ id              │       │ id              │
│ username        │   │   │ user_id (FK)  ◀─┼───────│ user_id (FK)    │
│ email           │   │   │ avatar          │       │ order_id        │
│ password        │   └──▶│ bio             │       │ amount          │
│ date_joined     │       │ is_premium      │       │ status          │
└─────────────────┘       │ premium_expiry  │       │ variant_id      │
        │                 └─────────────────┘       └─────────────────┘
        │
        │                 ┌─────────────────┐       ┌─────────────────┐
        │                 │   Collection    │       │   Category      │
        │                 ├─────────────────┤       ├─────────────────┤
        │                 │ id              │───┐   │ id              │
        │                 │ name            │   │   │ name            │
        │                 │ order           │   └──▶│ collection_id   │
        │                 └─────────────────┘       │ image           │
        │                                           │ locked          │
        ▼                                           │ is_custom       │
┌─────────────────┐                                 │ created_by (FK) │
│      Game       │                                 │ privacy         │
├─────────────────┤                                 └────────┬────────┘
│ id              │                                          │
│ player_id (FK)  │◀────────────────────────────────────────┐│
│ mode            │       ┌─────────────────┐       ┌───────▼────────┐
│ teams (JSON)    │       │ PlayedQuestion  │       │    Question    │
│ date_played     │       ├─────────────────┤       ├────────────────┤
│ categories (M2M)│───────│ game_id (FK)  ◀─┼───────│ id             │
└─────────────────┘       │ question_id(FK) │       │ category_id    │
                          │ team_index      │       │ text           │
                          │ is_correct      │       │ answer         │
                          │ points          │       │ choices        │
                          └─────────────────┘       │ difficulty     │
                                                    │ image          │
                                                    └────────────────┘
```

### Model Details

#### User & Profile

```python
class UserProfile(models.Model):
    user = models.OneToOneField(User)
    avatar = models.ImageField(upload_to='avatars/')
    bio = models.TextField(blank=True)
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateField(null=True)
```

#### Category

```python
class Category(models.Model):
    name = models.CharField(max_length=100)
    locked = models.BooleanField(default=False)  # Premium only
    image = models.ImageField(upload_to='categories/')
    collection = models.ForeignKey(Collection)
    
    # User-created categories
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, null=True)
    privacy = models.CharField(choices=['public', 'private'])
```

#### Question

```python
class Question(models.Model):
    category = models.ForeignKey(Category)
    text = models.TextField()
    answer = models.CharField(max_length=200)
    choice_2 = models.CharField(max_length=255)
    choice_3 = models.CharField(max_length=255)
    choice_4 = models.CharField(max_length=255)
    difficulty = models.CharField(choices=['200', '400', '600'])
    image = models.ImageField(upload_to='questions/', null=True)
```

#### Game

```python
class Game(models.Model):
    player = models.ForeignKey(User)
    mode = models.CharField(choices=['offline', 'solo', 'online'])
    categories = models.ManyToManyField(Category)
    teams = models.JSONField(default=list)
    date_played = models.DateTimeField(auto_now_add=True)
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- libvips (for image processing)

### Environment Variables

Create a `.env` file:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/trivia_spirit

# Cloudflare R2 (Media Storage)
CLOUDFLARE_R2_BUCKET=trivia-spirit
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# LemonSqueezy (Payments)
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
LEMONSQUEEZY_STORE_ID=your-store-id

# Email (ZeptoMail)
ZEPTOMAIL_API_KEY=your-zeptomail-key

# CORS
CSRF_TRUSTED_ORIGINS=https://www.triviaspirit.com
CORS_ALLOWED_ORIGINS=https://www.triviaspirit.com
```

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Available Commands

| Command | Description |
|---------|-------------|
| `python manage.py runserver` | Start dev server |
| `python manage.py migrate` | Run database migrations |
| `python manage.py createsuperuser` | Create admin user |
| `python manage.py shell` | Django shell |
| `python manage.py test` | Run tests |
| `celery -A trivia_spirit worker` | Start Celery worker |

---

## 🔧 Configuration

### CORS Settings

```python
CORS_ALLOWED_ORIGINS = [
    "https://www.triviaspirit.com",
    "https://triviaspirit.com",
]

CORS_ALLOW_CREDENTIALS = True
```

### REST Framework

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

### Caching

```python
# In-memory cache (for single-server deployments)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'brainigo-cache',
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        },
        'KEY_PREFIX': 'brainigo',
        'TIMEOUT': 300,  # 5 minutes
    }
}
```

---

## 📁 Project Structure

```
backend/
├── authentication/           # User auth & profiles
│   ├── models.py            # UserProfile model
│   ├── views.py             # Login, register, OAuth, profile
│   ├── serializers.py       # User/Profile serializers
│   └── urls.py              # Auth URL routes
│
├── content/                  # Trivia content management
│   ├── models.py            # Collection, Category, Question
│   ├── views.py             # ViewSets for CRUD
│   ├── serializers.py       # Content serializers
│   ├── permissions.py       # Custom permissions
│   ├── image_optimizer.py   # WebP conversion & optimization
│   └── urls.py              # Content URL routes
│
├── gameplay/                 # Game logic
│   ├── models.py            # Game, PlayedQuestion
│   ├── views.py             # Game ViewSet, stats, history
│   ├── serializers.py       # Game serializers
│   └── urls.py              # Gameplay URL routes
│
├── payments/                 # Payment processing
│   ├── models.py            # Payment, Subscription
│   ├── views.py             # Checkout, webhook handler
│   ├── lemonsqueezy_client.py
│   └── urls.py              # Payment URL routes
│
├── middleware/               # Custom middleware
│   └── logging_middleware.py # Request/response logging
│
├── helpers/                  # Utility modules
│   └── cloudflare/          # R2 storage backend
│
├── utils/                    # Shared utilities
│   ├── responses.py         # Standard API responses
│   └── zeptomail_backend.py # Email backend
│
├── trivia_spirit/            # Django project config
│   ├── settings.py          # Settings
│   ├── urls.py              # Root URL config
│   ├── celery.py            # Celery config
│   └── wsgi.py              # WSGI entry
│
├── manage.py                 # Django CLI
├── requirements.txt          # Python dependencies
├── Procfile                  # Railway deployment
└── runtime.txt               # Python version
```

---

## 🚢 Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Procfile

```procfile
web: gunicorn trivia_spirit.wsgi --log-file -
worker: celery -A trivia_spirit worker --loglevel=info
```

### Production Environment

```env
DEBUG=False
ALLOWED_HOSTS=api.triviaspirit.com
DATABASE_URL=postgres://...
```

---

## 🔒 Security

| Feature | Implementation |
|---------|----------------|
| **Token Auth** | DRF TokenAuthentication |
| **CORS** | django-cors-headers with strict origins |
| **CSRF** | Protected with trusted origins |
| **Passwords** | Django's PBKDF2 hasher |
| **File Uploads** | Validated & sanitized |
| **SQL Injection** | Django ORM (parameterized queries) |
| **XSS** | DRF auto-escaping |

---

## 📈 Performance

### Caching Strategy

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `game_{id}_board_{hash}` | 10 min | Question board per game |
| `user_{id}_stats` | 5 min | User statistics |
| `categories_list` | 5 min | Public categories |

### Database Indexes

```python
class Meta:
    indexes = [
        models.Index(fields=['player', '-date_played']),
        models.Index(fields=['is_custom', 'is_approved', 'privacy']),
        models.Index(fields=['-created_at']),
    ]
```

### Image Optimization

All uploaded images are automatically:
- Converted to WebP format
- Resized to max 1920px
- Compressed with quality 85

---

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ using Django & Django REST Framework
</p>

<p align="center">
  <a href="https://api.triviaspirit.com">🌐 API</a> •
  <a href="https://www.triviaspirit.com">🎮 Play</a>
</p>
