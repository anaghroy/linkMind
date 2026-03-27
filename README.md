# 🧠 LinkMind — Personal Knowledge Management System

> Save anything from the internet. AI organizes, connects, and resurfaces it for you.

![LinkMind](https://img.shields.io/badge/LinkMind-v1.0.0-6366f1?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-ESM-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Browser Extension Setup](#browser-extension-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Architecture](#architecture)

---

## Overview

LinkMind is a full-stack personal knowledge management app where users save articles, tweets, YouTube videos, and PDFs. The system automatically tags, summarizes, clusters, and resurfaces saved content using AI.

---

## Features

| Feature | Description |
|---|---|
| 🔗 **Save Anything** | Articles, YouTube, Tweets, PDFs via URL paste or browser extension |
| 🤖 **AI Tagging** | Gemini auto-generates 3-7 tags per item |
| 📝 **AI Summary** | 2-3 sentence summary generated automatically |
| 🔍 **Semantic Search** | Search by meaning using Atlas Vector Search |
| 🕸️ **Knowledge Graph** | d3.js visualization of item relationships |
| 🧩 **Topic Clustering** | Items grouped by dominant AI tags |
| 🧠 **Memory Resurfacing** | Daily cron resurfaces forgotten items |
| 📁 **Collections** | Nested collections with item counts |
| 🖊️ **Highlights** | Save text highlights with color + notes |
| 🔌 **Browser Extension** | Chrome + Firefox one-click save |

---

## Tech Stack

### Backend
- **Runtime** — Node.js (ESM)
- **Framework** — Express.js
- **Database** — MongoDB Atlas + Mongoose
- **Cache/Queue** — Redis + BullMQ
- **AI** — Google Gemini API (`gemini-2.5-flash` + `gemini-embedding-001`)
- **Vector Search** — MongoDB Atlas Vector Search
- **Auth** — JWT + bcrypt + email verification
- **Email** — Nodemailer
- **Scheduler** — node-cron

### Frontend
- **Framework** — React 19 + Vite
- **Styling** — SCSS modules
- **State** — Zustand
- **Graph** — d3.js
- **HTTP** — Axios
- **Routing** — React Router v6

### Browser Extension
- **Manifest** — v3 (Chrome + Firefox)
- **Storage** — chrome.storage.local

---

## Project Structure

```
LinkMind/
├── backend/
│   └── src/
│       ├── ai/
│       │   ├── ai.queue.js          # BullMQ queue setup
│       │   └── ai.worker.js         # Job processor
│       ├── config/
│       │   ├── database.js          # MongoDB connection
│       │   ├── logger.js            # Winston logger
│       │   └── redis.js             # Redis connection
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── clustering.controller.js
│       │   ├── collection.controller.js
│       │   ├── graph.controller.js
│       │   ├── item.controller.js
│       │   ├── resurfacing.controller.js
│       │   └── search.controller.js
│       ├── jobs/
│       │   └── cron.js              # Daily resurfacing cron
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── error.middleware.js
│       │   └── validate.middleware.js
│       ├── models/
│       │   ├── auth.model.js
│       │   ├── collection.model.js
│       │   ├── graph.model.js       # GraphEdge schema
│       │   └── item.model.js
│       ├── resurfacing/
│       │   └── resurfacing.job.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── clustering.routes.js
│       │   ├── collection.routes.js
│       │   ├── graph.routes.js
│       │   ├── index.routes.js
│       │   ├── item.routes.js
│       │   ├── resurfacing.routes.js
│       │   └── search.routes.js
│       ├── services/
│       │   ├── ai.service.js        # Gemini API wrapper
│       │   ├── auth.service.js
│       │   ├── clustering.service.js
│       │   ├── collection.service.js
│       │   ├── graph.service.js
│       │   ├── item.service.js
│       │   ├── mail.service.js
│       │   ├── resurfacing.service.js
│       │   └── search.service.js
│       ├── utils/
│       │   ├── apiResponse.js
│       │   ├── asyncHandler.js
│       │   ├── metadata.fetcher.js  # Auto-fetch URL metadata
│       │   └── storage.js
│       └── app.js
├── frontend/
│   └── src/
│       ├── api/                     # All API call functions
│       ├── components/              # Reusable UI components
│       ├── hooks/                   # Custom React hooks
│       ├── pages/                   # Route-level pages
│       ├── routes/                  # AppRouter + ProtectedRoute
│       ├── store/                   # Zustand stores
│       ├── styles/                  # SCSS files
│       └── utils/                   # Frontend utilities
└── linkmind-extension/              # Browser extension
    ├── manifest.json
    ├── popup/
    ├── background/
    └── content/
```

---

## Backend Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Redis (RedisLabs or local)
- Google AI Studio API key

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create `.env` in the `backend/` folder:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/LinkMind

# Redis
REDIS_URL=redis://default:password@host:port

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@linkmind.app

# Frontend URL (for email links)
CLIENT_URL=http://localhost:5173
```

### MongoDB Atlas Vector Search Index

Create a vector search index on the `items` collection named `vector_index`:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding.vector",
      "numDimensions": 3072,
      "similarity": "cosine"
    },
    { "type": "filter", "path": "user" },
    { "type": "filter", "path": "isArchived" },
    { "type": "filter", "path": "type" }
  ]
}
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

---

## Frontend Setup

### Prerequisites
- Node.js 18+

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env` in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:3000/api
```

### Run

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Browser Extension Setup

### Install in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `linkmind-extension/` folder
5. The LinkMind icon appears in your toolbar 

### Install in Firefox

1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `linkmind-extension/manifest.json`

### Update API URL

In `linkmind-extension/popup/popup.js` and `background/background.js`:

```js
const API_BASE = "http://localhost:3000/api"; // change for production
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Items
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/items` | Save new item |
| GET | `/api/items` | Get items (with filters) |
| GET | `/api/items/stats` | Get item stats |
| GET | `/api/items/:id` | Get single item |
| PATCH | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| PATCH | `/api/items/:id/read` | Mark as read |
| POST | `/api/items/:id/highlights` | Add highlight |
| DELETE | `/api/items/:id/highlights/:hid` | Remove highlight |

### Collections
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/collections` | Create collection |
| GET | `/api/collections` | Get all collections |
| GET | `/api/collections/:id` | Get collection + items |
| PATCH | `/api/collections/:id` | Update collection |
| DELETE | `/api/collections/:id` | Delete collection |
| POST | `/api/collections/:id/items/:itemId` | Add item to collection |
| DELETE | `/api/collections/:id/items/:itemId` | Remove item from collection |

### Search
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/search?q=...&mode=hybrid` | Search items |
| GET | `/api/search/similar/:itemId` | Find similar items |

### Graph
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/graph` | Get graph nodes + edges |
| POST | `/api/graph/build` | Build/update graph |
| DELETE | `/api/graph` | Rebuild graph from scratch |
| GET | `/api/graph/stats` | Graph statistics |
| GET | `/api/graph/item/:itemId` | Item connections (backlinks) |

### Clusters
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/clusters` | Get topic clusters |
| GET | `/api/clusters/:tag` | Get items in a cluster |

### Resurfacing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resurfacing` | Get resurfaced items |
| POST | `/api/resurfacing/seen` | Mark items as seen |
| GET | `/api/resurfacing/stats` | Resurfacing stats |

---

## Architecture

### How an item gets saved

```
User pastes URL
      ↓
POST /api/items
      ↓
metadata.fetcher.js → auto-fetches title, thumbnail, author
      ↓
Item saved to MongoDB (aiProcessingStatus: "pending")
      ↓
BullMQ job queued → "ai-process-item"
      ↓
ai.worker.js picks up job
      ↓
Gemini API runs 3 tasks in parallel:
  ├── generateEmbedding()  → 3072-dim vector
  ├── generateTags()       → ["javascript", "react", ...]
  └── generateSummary()    → 2-3 sentence summary
      ↓
Item updated (aiProcessingStatus: "done")
      ↓
graph.service.js builds edges automatically
```

### How semantic search works

```
User types query
      ↓
generateEmbedding(query) → 3072-dim vector
      ↓
MongoDB Atlas $vectorSearch
      ↓
Cosine similarity against all item embeddings
      ↓
Returns items sorted by semantic relevance score
```

### How resurfacing works

```
Daily at 8:00 AM (node-cron)
      ↓
queueResurfacingForAllUsers()
      ↓
For each user → score all candidate items:
  - Days since saved (older = boost)
  - Surface count (less surfaced = boost)
  - Read status (unread = boost)
  - Random factor (variety)
      ↓
Top 5 items returned with context message:
"You saved this 47 days ago — you haven't read this yet"
```

### Frontend State Architecture

```
API Layer        Store (Zustand)       Hook              Component
─────────        ───────────────       ────              ─────────
auth.api    →   auth.store       →    useAuth      →   LoginPage
items.api   →   items.store      →    useItems     →   LibraryPage
search.api  →   search.store     →    useSearch    →   SearchPage
graph.api   →   graph.store      →    useGraph     →   GraphPage
clusters.api →  clusters.store   →    useClusters  →   ClustersPage
resurfacing.api → resurfacing.store → useResurfacing → Dashboard
collections.api → collections.store → useCollections → CollectionsPage
            →   ui.store         →    useToast     →   Any component
```

---

## Scripts

### Backend
```bash
npm run dev      # nodemon development server
npm start        # production server
```

### Frontend
```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT License — feel free to use this project for learning and personal use.

---

Built with ❤️ using Node.js, React, MongoDB Atlas, and Google Gemini AI.
