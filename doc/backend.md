# Backend overview

Node.js **Express** API under `backend/`. JSON bodies are validated with **Zod**; persistence uses **Mongoose** (MongoDB). The HTTP layer follows **routes → controllers → services → repositories → models**.

## Base URL and auth

- Default local server port comes from env (see `backend/src/config/env.ts`).
- **CORS** allows credentials; the SPA sets `VITE_API_URL` and uses a shared Axios client (`frontend/src/api/client.ts`) with `withCredentials: true`.
- **JWT**: sent as `Authorization: Bearer <token>` (token in `localStorage`) and/or session cookies where applicable—see auth middleware in `backend/src/middleware/`.

## Architecture (request flow)

1. **Routes** (`backend/src/routes/*.routes.ts`) — mount paths, middleware (login, roles, upload, validation).
2. **Controllers** (`backend/src/controllers/`) — parse request, call services, shape HTTP responses.
3. **Services** (`backend/src/services/`) — business rules and orchestration.
4. **Repositories** (`backend/src/repositories/`) — query/aggregate Mongoose models.
5. **Models** (`backend/src/models/`) — Mongoose schemas.

Global middleware is wired in `backend/src/app.ts`: `cors`, JSON/urlencoded limits, static files, `cookie-parser`, login rate limiter, then route mounts, then `notFoundHandler` and `errorHandler`.

## API surface (mount prefixes)

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Registration, login, logout, profile, bootstrap |
| `/api/user` | User CRUD-adjacent ops (create, freeze, passwords, …) |
| `/api/transaction` | Credit / debit balance |
| `/api/news` | News CRUD (admin) |
| `/api/campaigns` | Create campaign, update campaign stats |
| `/api/dashboard` | Aggregated dashboard reads + Excel export |
| `/api/complaints` | Complaints CRUD |
| `/api/support` | Support form submission |

## Route inventory (37 handlers)

Counts below are **distinct HTTP route registrations** (method + path).

### `/api/auth` — 7

| Method | Path |
|--------|------|
| POST | `/register` |
| POST | `/login` |
| GET | `/bootstrap-status` |
| POST | `/bootstrap-admin` |
| POST | `/logout` |
| PUT | `/update-profile` |

### `/api/user` — 7

| Method | Path |
|--------|------|
| POST | `/create` |
| DELETE | `/delete/:userId` |
| PUT | `/freeze/:userId` |
| PUT | `/unfreeze/:userId` |
| PUT | `/update/:userId` |
| PUT | `/change-password/:userId` |
| PUT | `/change-own-password` |

### `/api/transaction` — 2

| Method | Path |
|--------|------|
| POST | `/credit` |
| POST | `/debit` |

### `/api/news` — 3

| Method | Path |
|--------|------|
| POST | `/create` |
| PUT | `/update/:newsId` |
| DELETE | `/delete/:newsId` |

### `/api/campaigns` — 2

| Method | Path |
|--------|------|
| POST | `/` |
| PUT | `/stats/:campaignId` |

### `/api/dashboard` — 12

| Method | Path |
|--------|------|
| GET | `/manage-business` |
| GET | `/home` |
| GET | `/transaction` |
| GET | `/news` |
| GET | `/complaints` |
| GET | `/manage-reseller` |
| GET | `/manage-user` |
| GET | `/tree-view` |
| GET | `/whatsapp-reports` |
| GET | `/export-campaign/:campaignId` |
| GET | `/all-campaigns` |
| GET | `/support` |

### `/api/complaints` — 3

| Method | Path |
|--------|------|
| POST | `/create` |
| DELETE | `/delete/:complaintId` |
| PUT | `/update/:complaintId` |

### `/api/support` — 1

| Method | Path |
|--------|------|
| POST | `/` |

## Frontend integration

The React app calls these endpoints via **Axios** (`api` instance), not raw `fetch`, for same-origin API traffic. **Binary exports** (e.g. Excel) use `responseType: 'blob'`. Downloading arbitrary **external image URLs** (e.g. CDN) may still use `fetch` in the browser when those URLs are not on the API origin.

## Configuration

See `backend/src/config/env.ts` for required environment variables (database URI, secrets, CORS origin, Cloudinary, etc.) and defaults.

## Message queue (RabbitMQ)

Campaign send is **asynchronous**. The HTTP `POST /api/campaigns` handler validates, debits balance, persists the campaign in `status: pending`, then publishes a job to RabbitMQ and returns 201 immediately. A worker consumes the job, marks the campaign `processing`, iterates `mobileNumbers` calling the WhatsApp gateway, and finishes by marking `delivered` or `failed`.

### Topology

| Object | Name | Purpose |
|--------|------|---------|
| Exchange | `campaign.exchange` (direct, durable) | All campaign-related publishes |
| Queue | `campaign.send.queue` (durable, DLX-wired) | Send jobs |
| Routing key | `campaign.send` | Producer → send queue |
| DLX | `campaign.dlx` (direct, durable) | Dead-letter for permanent failures |
| DLQ | `campaign.dlq` (durable) | Inspect failures |

### Files

- `src/config/rabbitmq.ts` — shared connection + channel, auto-reconnect with backoff.
- `src/queue/topology.ts` — exchange/queue declarations (idempotent, asserted on every connect).
- `src/queue/campaign.producer.ts` — `publishCampaignJob(campaignId)`.
- `src/queue/campaign.consumer.ts` — `prefetch=1`, retries via header (`x-retry-count`) up to `WORKER_MAX_RETRIES`, DLQ on permanent failure.
- `src/services/whatsapp-gateway.service.ts` — **stub**: replace `sendOneMessage(...)` with a real provider call (Meta Cloud API / Twilio / Gupshup).
- `src/server.ts` — `bootstrap()` connects RabbitMQ, asserts topology, starts the in-process consumer when `WORKER_ENABLED=true`.

### Env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Broker connection string |
| `WORKER_ENABLED` | `true` | Run consumer in same process as API. Set to `false` on the API box and run a separate worker container when scaling out. |
| `WORKER_SEND_DELAY_MS` | `50` | Stub send delay (simulates per-number gateway latency) |
| `WORKER_MAX_RETRIES` | `3` | Retry transient errors this many times before nack→DLQ |

### Local dev

```bash
docker compose up -d           # mongodb + rabbitmq
pnpm --filter backend dev      # API + worker (in-process)
```

RabbitMQ management UI: <http://localhost:15672> (guest/guest).

### Scaling out

Run the same backend image as additional worker-only processes (set `WORKER_ENABLED=true`, point them at the same `RABBITMQ_URL`). The API container can flip `WORKER_ENABLED=false` so it only produces. Each worker has `prefetch=1`, so adding workers linearly increases concurrent campaign throughput.
