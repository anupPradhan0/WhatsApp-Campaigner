# 📱 WhatsApp Campaigner

A comprehensive full-stack WhatsApp campaign management system built with the MERN stack, featuring role-based access control, campaign management, credit systems, and real-time reporting.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://whats-app-campaigner.vercel.app/)
[![GitHub](https://img.shields.io/badge/github-repository-blue)](https://github.com/M0rs-Ruki/WhatsApp-Campaigner)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Build & Deployment](#️-build--deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Functionality

- **Campaign Management** - Create, manage, and track WhatsApp campaigns with detailed analytics
- **Asynchronous Send Pipeline** - Campaigns are queued in **RabbitMQ** and processed by a worker (DLQ on permanent failure); the HTTP API returns immediately and survives restarts
- **Redis-Backed Shared State** - Distributed login rate-limiting, JWT denylist for real logout invalidation, and `Idempotency-Key` support on campaign creation — all with safe fail-open fallbacks
- **Credit System** - Flexible credit management for campaign operations and user balance tracking
- **Role-Based Access Control** - Three-tier system (Admin, Reseller, User) with granular permissions
- **Real-time Reports** - Comprehensive WhatsApp campaign analytics with exportable data
- **User Management** - Complete user and reseller administration dashboard
- **Complaint System** - Built-in ticketing for complaint handling and resolution
- **Business Profiles** - Account and business profile management capabilities
- **News Feed** - Platform announcements managed by admins

### 🔒 Technical Features

- ✅ JWT-based authentication with secure HTTP-only cookies
- ✅ File upload support with Cloudinary CDN integration
- ✅ Excel export functionality for comprehensive reports
- ✅ API rate limiting for DDoS protection
- ✅ Fully responsive UI with Tailwind CSS
- ✅ Type-safe development with TypeScript
- ✅ RESTful API architecture
- ✅ MongoDB database with Mongoose ODM
- ✅ Automated tasks with node-cron scheduler

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| Tailwind CSS | 4.1.14 | Styling |
| React Router DOM | 7.9.4 | Routing |
| Recharts | 3.2.1 | Data Visualization |
| React Quill | 3.6.0 | Rich Text Editor |
| Lucide React | 0.545.0 | Icons |
| Vite | Latest | Build Tool |
| date-fns | 4.1.0 | Date Utilities |
| jwt-decode | 4.0.0 | JWT Handling |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.15.0 | Runtime |
| Express | 5.1.0 | Web Framework |
| TypeScript | 5.9.3 | Type Safety |
| MongoDB | Latest | Database |
| Mongoose | 8.19.0 | ODM |
| jsonwebtoken | 9.0.2 | Authentication |
| bcrypt | 6.0.0 | Password Hashing |
| Multer | 2.0.2 | File Upload |
| Cloudinary | 2.7.0 | Cloud Storage |
| ExcelJS | 4.4.0 | Excel Generation |
| node-cron | 4.2.1 | Task Scheduling |
| express-rate-limit | 8.1.0 | Rate Limiting |
| RabbitMQ | 3 (management) | Async Campaign Send Queue |
| amqplib | 0.10.x | RabbitMQ Client |
| Redis | 7 (alpine) | Rate-limit / Denylist / Idempotency |
| ioredis | 5.x | Redis Client |
| rate-limit-redis | 4.x | Shared rate-limit store |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                           │
│         (React + TypeScript + Tailwind CSS)                  │
│                   Hosted on Vercel                           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / REST (Axios, withCredentials)
┌────────────────────▼────────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│          (Express + Rate Limiting + CORS)                    │
│                   Hosted on Render                           │
└────────────────────┬────────────────────────────────────────┘
                     │
       ┌─────────────┼─────────────┬──────────────────┐
       │             │             │                  │
┌──────▼──────┐ ┌────▼───────┐ ┌──▼─────────┐ ┌──────▼──────┐
│ Auth Service│ │  Campaign  │ │File Service│ │  Producer   │
│(JWT/bcrypt) │ │  Service   │ │(Cloudinary)│ │ (publishes  │
└──────┬──────┘ └────┬───────┘ └────────────┘ │ to RabbitMQ)│
       │             │                         └──────┬──────┘
       │             │ Mongo txn:                     │
       │             │ debit + persist                │
       │             ▼                                ▼
       │    ┌────────────────┐         ┌──────────────────────────┐
       │    │   MongoDB      │         │   RabbitMQ (durable)     │
       │    │  (Mongoose)    │         │ campaign.exchange ─┐     │
       │    └────────────────┘         │ campaign.send.queue│     │
       │             ▲                 │ campaign.dlx → dlq │     │
       │             │                 └──────────┬─────────┘     │
       │             │ status updates             │ prefetch=1    │
       │             │ pending → processing       ▼               │
       │             │ → delivered / failed   ┌─────────────────┐ │
       │             └────────────────────────│  Worker (in-    │ │
       │                                      │  process or     │ │
       │                                      │  separate)      │ │
       │                                      │  → WhatsApp     │ │
       │                                      │  gateway stub   │ │
       │                                      └─────────────────┘ │
       │                                                          │
       │ rate-limit / denylist / idempotency      (scale workers  │
       ▼                                           horizontally)──┘
┌──────────────────┐
│  Redis           │
│  rl:login:*      │
│  denylist:jwt:*  │
│  idem:*          │
└──────────────────┘
```

**Async-send flow:** `POST /api/campaigns` validates → debits balance → persists `Campaign{status: pending}` → publishes job → returns 201 in ~ms. A worker (in-process by default; can be a separate container) consumes, marks `processing`, iterates recipients, then sets `delivered` or `failed`. Permanent failures go to the dead-letter queue for inspection. See `doc/backend.md` for full lifecycle, retries, and shutdown semantics.

### Database Schema

**Collections:**
- `users` - User accounts with role-based permissions
- `campaigns` - WhatsApp campaign data and metadata (lifecycle: `pending` → `processing` → `delivered` / `failed`, driven by the queue worker)
- `complaints` - Support tickets and resolutions
- `transactions` - Credit transactions and history
- `news` - Platform announcements

**Queue topology (RabbitMQ):**
- `campaign.exchange` (direct, durable) — all campaign publishes
- `campaign.send.queue` (durable, DLX-wired) — active send jobs, routing key `campaign.send`
- `campaign.dlx` → `campaign.dlq` — permanent failures for inspection / replay

**Redis keyspaces (cache & shared state):**
- `rl:login:*` — distributed rate-limit counters for the login endpoint
- `denylist:jwt:<sha256(token)>` — revoked tokens, TTL = remaining JWT lifetime
- `idem:campaigns.create:<userId>:<key>` — `Idempotency-Key` response cache

---

## 📋 Prerequisites

Ensure you have the following installed before proceeding:

### Required Software

```bash
# Node.js (v20.15.0 or higher, but below v21.0.0)
node --version  # Should output v20.x.x

# pnpm (v9.0.0 or higher) — enable via: corepack enable
pnpm --version

# MongoDB (v6.0 or higher - local or Atlas)
mongod --version

# Docker + Docker Compose (recommended — runs MongoDB + RabbitMQ locally)
docker --version
docker compose version

# Git
git --version
```

> **Note:** RabbitMQ is required (the campaign send pipeline publishes to it). The provided `docker-compose.yml` spins up both MongoDB and RabbitMQ — see Step 4 below.

### Recommended Tools

- **Code Editor**: VS Code with ESLint and TypeScript extensions
- **API Testing**: Postman or Thunder Client
- **Database GUI**: MongoDB Compass
- **Terminal**: iTerm2 (Mac) or Windows Terminal or GNOME Terminal (Linux)

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/M0rs-Ruki/WhatsApp-Campaigner.git
cd WhatsApp-Campaigner
```

### Step 2: Install dependencies (workspace)

From the repository root:

```bash
pnpm install
```

### Step 3: Backend and frontend environment files

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### Step 4: Database + Queue Setup

**Option A: Docker Compose (recommended)** — brings up MongoDB, RabbitMQ and Redis together:

```bash
# From repo root:
docker compose up -d
# Verify:
docker compose ps
# RabbitMQ management UI: http://localhost:15672  (guest / guest)
# Redis on localhost:6379  (inspect with: docker exec -it whatsapp-campaigner-redis redis-cli)
```

**Option B: Local MongoDB + standalone RabbitMQ + standalone Redis**
```bash
# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # Mac

# Start RabbitMQ (with management plugin)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option C: MongoDB Atlas + CloudAMQP / managed RabbitMQ + managed Redis**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a cluster, copy the connection string into `MONGO_URI`.
2. Provision a RabbitMQ instance (e.g. [CloudAMQP](https://www.cloudamqp.com/)) and put its `amqp(s)://...` URL into `RABBITMQ_URL`.
3. Provision a Redis instance (e.g. [Upstash](https://upstash.com/), [Redis Cloud](https://redis.com/cloud/)) and put its connection string into `REDIS_URL`.

---

## 🔐 Environment Variables

### Backend Configuration

Create `backend/.env`:

```env
# Server Configuration
PORT=8080
CORS_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/whatsapp-campaigner
DB_NAME=whatsapp-campaigner

# Message Queue (RabbitMQ) — required for campaign send pipeline
RABBITMQ_URL=amqp://guest:guest@localhost:5672
WORKER_ENABLED=true              # Run the consumer in this process. Set to "false" on API-only nodes when scaling out workers separately.
WORKER_SEND_DELAY_MS=50          # Stub gateway delay (simulates per-recipient send latency)
WORKER_MAX_RETRIES=3             # Retry transient send errors this many times before DLQ

# Redis — backs distributed rate-limit, JWT denylist, and idempotency keys.
# All consumers fail open if Redis is down, so the API stays usable.
REDIS_URL=redis://localhost:6379
IDEMPOTENCY_TTL_SECONDS=600      # How long a cached Idempotency-Key response stays valid (the in-flight sentinel uses a separate short 60s TTL so silent handler crashes recover quickly — see doc/backend.md)

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters_long

# Cloudinary (media storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Support email (nodemailer) — the /api/support form sends to EMAIL_RECEIVER
EMAIL_USER=your_smtp_user@example.com
EMAIL_PASS=your_smtp_app_password
EMAIL_RECEIVER=support@yourcompany.com

# Rate Limiting (both optional — must be plain integers, not expressions)
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes in ms
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

Create `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:8080
```

---

## 💻 Running the Application

### Development Mode

#### Option 1: Run Separately (Recommended)

**Terminal 1 - Backend:**
```bash
pnpm --filter ./backend run dev
# Server starts at http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
pnpm --filter ./frontend run dev
# Application starts at http://localhost:5173
```

#### Option 2: Run concurrently from the repo root

The root `package.json` already includes a `dev` script using `concurrently`. From the repository root:

```bash
pnpm install
pnpm run dev
```

### Accessing the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

---

## 🏗️ Build & Deployment

### Building for Production

#### Backend Build

```bash
pnpm --filter ./backend run clean
pnpm --filter ./backend run build

# Test production build locally
pnpm --filter ./backend start
```

#### Frontend Build

```bash
pnpm --filter ./frontend run lint
pnpm --filter ./frontend run build

# Preview production build
pnpm --filter ./frontend run preview
```

---

## 🌐 Deployment Guide

### Backend Deployment (Render)

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect GitHub repository

2. **Configure Settings**
   ```
   Build Command: pnpm install && pnpm --filter ./backend run build
   Start Command: pnpm --filter ./backend start
   ```

3. **Environment Variables**
   - Add all variables from backend `.env`
   - Set `NODE_ENV=production`
   - Set `CORS_ORIGIN` to your Vercel domain

4. **Deploy**
   - Auto-deploys on push to main
   - Note your URL: `https://your-app.onrender.com`

### Frontend Deployment (Vercel)

1. **Via Vercel Dashboard**
   - Go to [Vercel](https://vercel.com/dashboard)
   - Import GitHub repository
   - Configure:
     ```
     Framework: Vite
     Root Directory: frontend
     Build Command: pnpm run build
     Output Directory: dist
     ```

2. **Environment Variables**
   - Add frontend `.env` variables
   - Update `VITE_API_URL` to Render backend URL

3. **Deploy**
   - Click "Deploy"
   - Live at `https://your-app.vercel.app`

**OR via CLI:**
```bash
cd frontend
vercel --prod
```

### Post-Deployment Checklist

- [ ] Update CORS settings with production URLs
- [ ] Test authentication flow
- [ ] Verify database connections
- [ ] Check API endpoints
- [ ] Monitor error logs
- [ ] Test file uploads
- [ ] Verify email notifications (if any)

---

## 📁 Project Structure

The backend follows a layered architecture (**routes → middleware → controllers → services → repositories → models**); the frontend is a Vite + React SPA. Only representative files are shown.

```
WhatsApp-Campaigner/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app + route mounting
│   │   ├── server.ts              # Entry point (DB/Redis/RabbitMQ + worker bootstrap)
│   │   ├── config/                # env, database, redis, rabbitmq
│   │   ├── models/                # user, campaign, complaint, transaction, news
│   │   ├── routes/                # auth, user, campaign, transaction, news,
│   │   │                          #   complaint, dashboard, support
│   │   ├── controllers/           # one per route group (incl. export, dashboard)
│   │   ├── services/              # business logic (auth, campaign, transaction,
│   │   │                          #   user, complaint, support, whatsapp-gateway*)
│   │   ├── repositories/          # data-access layer (Mongoose queries)
│   │   ├── middleware/            # auth guards, validation, rate-limit,
│   │   │                          #   idempotency, role checks, upload
│   │   ├── queue/                 # RabbitMQ topology, producer, consumer
│   │   ├── jobs/                  # node-cron cleanup scheduler
│   │   ├── validation/            # Zod request schemas
│   │   └── utils/                 # tokens, hashing, cookies, cloudinary, upload
│   ├── public/uploads/            # transient local upload dir (pre-Cloudinary)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # App entry point
│   │   ├── App.tsx                # Routes + providers + ErrorBoundary
│   │   ├── pages/                 # Dashboard, SendWhatsapp, AllCampaigns,
│   │   │                          #   WhatsAppReports, ManageUser, ManageReseller,
│   │   │                          #   ManageBusiness, CreditReports, News,
│   │   │                          #   Complaints, Support, TreeView, Documentation,
│   │   │                          #   Login, NotFound
│   │   ├── components/            # layout/, auth/ (ProtectedRoute), ui/ (shadcn)
│   │   ├── hooks/                 # useDashboard, useCampaigns, useBusiness,
│   │   │                          #   useUserManagement
│   │   ├── api/client.ts          # Axios instance (cookies + 401 handling)
│   │   ├── lib/                   # queryClient, queryKeys, utils
│   │   ├── constants/Roles.ts     # role → menu config
│   │   └── theme/tokens.ts        # shared design tokens
│   ├── public/                    # static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── docker-compose.yml             # MongoDB + RabbitMQ + Redis
├── doc/backend.md                 # async send pipeline & shared-state details
├── screenshots/
├── README.md
└── LICENSE
```

> \* `whatsapp-gateway.service.ts` is currently a **stub** that simulates sending. Swap in a real provider (Meta Cloud API, Twilio, Gupshup, …) without changing the rest of the pipeline.

---

## 📡 API Documentation

> 🔒 = requires authentication (JWT sent via HTTP-only cookie or `Authorization: Bearer <token>`).
> Reads/aggregations are served from `/api/dashboard/*`; writes live on their resource routers.

### Authentication — `/api/auth`

```
POST   /api/auth/register          Public self-registration (always creates a USER)
POST   /api/auth/login             Log in (sets JWT cookie)
POST   /api/auth/logout            Log out (revokes the token)                🔒
GET    /api/auth/bootstrap-status  Whether any users exist yet
POST   /api/auth/bootstrap-admin   Create the first admin (only on an empty DB)
PUT    /api/auth/update-profile    Update your own profile                    🔒
```

### Campaigns — `/api/campaigns`

```
POST   /api/campaigns              Create + queue a campaign (multipart: media + fields)  🔒
PUT    /api/campaigns/stats/:campaignId   Update a campaign's send status               🔒
```

### User Management — `/api/user` (admin / reseller) 🔒

```
POST   /api/user/create                   Create a managed user or reseller
PUT    /api/user/update/:userId           Update a managed account
DELETE /api/user/delete/:userId           Soft-delete an account
PUT    /api/user/freeze/:userId           Freeze (deactivate) an account
PUT    /api/user/unfreeze/:userId         Reactivate an account
PUT    /api/user/change-password/:userId  Reset a managed account's password
PUT    /api/user/change-own-password      Change your own password
```

### Credits / Transactions — `/api/transaction` 🔒

```
POST   /api/transaction/credit     Credit balance to a managed account
POST   /api/transaction/debit      Debit balance from a managed account
```

### Complaints — `/api/complaints` 🔒

```
POST   /api/complaints/create              Raise a complaint
PUT    /api/complaints/update/:complaintId Update status / add an admin response
DELETE /api/complaints/delete/:complaintId Delete a complaint
```

### News — `/api/news` (admin) 🔒

```
POST   /api/news/create            Publish a news item
PUT    /api/news/update/:newsId    Edit a news item
DELETE /api/news/delete/:newsId    Remove a news item
```

### Support — `/api/support`

```
POST   /api/support                Send a support message (emails the team)
```

### Dashboard reads & reports — `/api/dashboard` 🔒

```
GET    /api/dashboard/home                       Dashboard stats
GET    /api/dashboard/manage-business            Your business profile
GET    /api/dashboard/manage-user                Managed users
GET    /api/dashboard/manage-reseller            Managed resellers
GET    /api/dashboard/tree-view                  Downline tree
GET    /api/dashboard/transaction                Transaction history
GET    /api/dashboard/news                        News feed
GET    /api/dashboard/complaints                  Complaints (scoped by role)
GET    /api/dashboard/whatsapp-reports            Campaign delivery reports
GET    /api/dashboard/all-campaigns               All campaigns
GET    /api/dashboard/export-campaign/:campaignId Export a campaign's recipients to Excel
GET    /api/dashboard/support                     Support page data
```

---

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)
*Main dashboard with campaign analytics and statistics*

### Send WhatsApp Campaign
![Send WhatsApp](./screenshots/send-whatsapp.png)
*Create and send WhatsApp campaigns to targeted users*

### Credit Management
![Credit Management](./screenshots/credit.png)
*Manage user credits and transaction history*

### Manage Reseller
![Manage Reseller](./screenshots/manage-reseller.png)
*Admin panel for reseller management and oversight*

### Manage User
![Manage User](./screenshots/manage-user.png)
*User management dashboard with role assignments*

### WhatsApp Report
![WhatsApp Report](./screenshots/whatsapp-report.png)
*Detailed campaign reports with delivery status and analytics*

### All Campaigns
![All Campaigns](./screenshots/all-campaign.png)
*View all campaigns with filtering and sorting options*

### News
![News](./screenshots/news.png)
*Platform news and announcements feed*

### Tree View
![Tree View](./screenshots/tree-view.png)
*User can see there created User and Reseller in tree view*

### Complaints
![Complaints](./screenshots/complaints.png)
*Complaint tracking and resolution system*

### Manage Business
![Manage Business](./screenshots/manage-business.png)
*Business profile and account settings management*

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::8080
```
**Solution:**
```bash
# Find and kill process
lsof -i :8080
kill -9 <PID>

# Or use different port in .env
PORT=8081
```

#### TypeScript Compilation Errors
```bash
# Clear cache and reinstall (from repo root)
rm -rf node_modules backend/node_modules frontend/node_modules
pnpm install

# Rebuild
rm -rf backend/dist
pnpm --filter ./backend run build
```

#### CORS Errors
- Verify `CORS_ORIGIN` in backend `.env` matches your frontend origin exactly
- Check CORS middleware allows your origin
- Ensure `credentials: true` in frontend API calls

#### Environment Variables Not Loading
- Restart dev server after changing `.env`
- Check variable names (case-sensitive)
- Verify `.env` file location
- Don't commit `.env` to version control

---

## 🧪 Testing

### Manual Testing

```bash
# Check whether the instance has been bootstrapped yet
curl http://localhost:8080/api/auth/bootstrap-status

# Test authentication (use -c to capture the auth cookie)
curl -X POST http://localhost:8080/api/auth/login \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Type Checking

```bash
# Frontend
pnpm --filter ./frontend exec tsc --noEmit

# Backend
pnpm --filter ./backend exec tsc --noEmit
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add: amazing new feature"
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style Guidelines

- ✅ Use TypeScript for all code
- ✅ Follow ESLint configuration
- ✅ Write meaningful commit messages
- ✅ Add comments for complex logic
- ✅ Keep components small and focused
- ✅ Write unit tests for new features

### Commit Message Format

```
Type: Brief description

Types: Add, Update, Fix, Remove, Refactor, Docs, Style, Test
```

---

## 📄 License

This project is licensed under the ProMinds Digital (formerly Prolific IDEAS) License - see the [LICENSE](LICENSE) file for details.

---

## 🏢 Created By

### ProMinds Digital
**Formerly Prolific IDEAS**

*Digital Marketing & IT Solutions Company*

ProMinds Digital is a leading brand-driven performance marketing company that specializes in delivering comprehensive digital marketing and technology solutions. With expertise in Digital Marketing, WhatsApp Marketing, SEO, and cutting-edge web/app development, ProMinds empowers businesses to enhance their online presence and drive sustainable growth.

#### 🎯 Core Services
- 📱 Digital Marketing
- 💬 WhatsApp Marketing
- 🔍 SEO Services
- 🌐 Web Development
- 📲 App Development
- 📊 Performance Marketing

#### 🌐 Connect with ProMinds Digital
- **Website**: [prominds.digital](https://prominds.digital)
- **Legacy Site**: [prolificideas.in](https://prolificideas.in)
- **Facebook**: [Follow for updates](https://facebook.com/promindsdigital)
- **WhatsApp**: [Marketing Expert](https://wa.me/your-number)

---

## 👨‍💻 Author

**Anup Pradhan (M0rs)**

- GitHub: [@M0rs-Ruki](https://github.com/M0rs-Ruki)
- Project: [WhatsApp Campaigner](https://github.com/M0rs-Ruki/WhatsApp-Campaigner)
- Live Demo: [whats-app-campaigner.vercel.app](https://whats-app-campaigner.vercel.app/)

---

## 🙏 Acknowledgments

- React Team for the powerful UI framework
- MongoDB for the flexible database solution
- Vercel and Render for excellent hosting services
- Open source community for amazing libraries
- All contributors and users of this project

---

## 📞 Support

Need help? Here's how to get support:

- 📖 Check the [Documentation](#-table-of-contents)
- 🐛 [Open an Issue](https://github.com/M0rs-Ruki/WhatsApp-Campaigner/issues)
- 💬 Use the in-app support page
- 📧 Contact the development team

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] Email notifications for campaigns
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Bulk operations for campaigns
- [ ] API rate limiting per user
- [ ] Two-factor authentication
- [ ] Mobile app (React Native)
- [ ] Webhook integrations

---

## 📊 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/M0rs-Ruki/WhatsApp-Campaigner?style=social)
![GitHub Forks](https://img.shields.io/github/forks/M0rs-Ruki/WhatsApp-Campaigner?style=social)
![GitHub Issues](https://img.shields.io/github/issues/M0rs-Ruki/WhatsApp-Campaigner)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/M0rs-Ruki/WhatsApp-Campaigner)

---

**Made with ❤️ by M0rs-Ruki**

*Last Updated: October 2025*