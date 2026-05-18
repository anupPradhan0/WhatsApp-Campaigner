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

### Why a queue

- API stays responsive: the POST returns in ~ms regardless of how many recipients the campaign has.
- Send work survives an API restart — jobs are durable on disk in RabbitMQ.
- Workers scale horizontally: more worker processes = more concurrent campaigns.
- Permanent failures land in a Dead-Letter Queue for inspection / replay.

### End-to-end lifecycle

```
┌──────────────┐  HTTP POST /api/campaigns
│ Client (SPA) │ ────────────────────────────────────────────────┐
└──────────────┘                                                  │
                                                                  ▼
                  ┌─────────────────────────────────────────────────────┐
                  │ campaign.service.createCampaignForUser              │
                  │  1. Validate, debit balance (Mongo txn)             │
                  │  2. Save Campaign { status: pending }               │
                  │  3. Commit txn                                      │
                  │  4. publishCampaignJob(id)  ──┐                     │
                  └───────────────────────────────┼─────────────────────┘
                                                  ▼
                                  ┌──────────────────────────┐
                                  │   campaign.exchange      │
                                  │   (direct, durable)      │
                                  └──────────┬───────────────┘
                                             │ routing key: campaign.send
                                             ▼
                                  ┌──────────────────────────┐
                                  │  campaign.send.queue     │  (durable, DLX-wired)
                                  └──────────┬───────────────┘
                                             │ prefetch=1
                                             ▼
                  ┌─────────────────────────────────────────────────────┐
                  │ campaign.consumer.processCampaignJob                │
                  │  1. Load Campaign by id                             │
                  │  2. Skip if status is DELIVERED or FAILED           │
                  │  3. Mark processing                                 │
                  │  4. for number of mobileNumbers:                    │
                  │       sendOneMessage(campaign, number) (gateway)    │
                  │  5. Mark delivered / failed (with counts)           │
                  └─────────────────────────────────────────────────────┘
                                  │              │
                       success ack │              │ retries exhausted → nack(no-requeue)
                                   │              ▼
                                   │   ┌──────────────────────────┐
                                   │   │   campaign.dlx → dlq     │  (inspect / replay)
                                   │   └──────────────────────────┘
                                   ▼
                            (message removed)
```

### Campaign status state machine

| From       | To         | Trigger                                       |
|------------|------------|-----------------------------------------------|
| —          | `pending`  | Campaign created, job published               |
| `pending`  | `failed`   | Producer could not enqueue (no MQ channel)    |
| `pending`  | `processing` | Worker picked up the job                    |
| `processing` | `delivered` | All sends OK (or partial with note)       |
| `processing` | `failed`  | All sends failed, or retries exhausted       |
| `delivered` / `failed` | (terminal) | Re-delivery is a no-op (idempotent)|

Admins can still flip status manually via `PUT /api/campaigns/stats/:campaignId` — that endpoint is unchanged.

### Topology

| Object | Name | Purpose |
|--------|------|---------|
| Exchange | `campaign.exchange` (direct, durable) | All campaign-related publishes |
| Queue | `campaign.send.queue` (durable, DLX-wired) | Send jobs |
| Routing key | `campaign.send` | Producer → send queue |
| DLX | `campaign.dlx` (direct, durable) | Dead-letter for permanent failures |
| DLQ | `campaign.dlq` (durable) | Inspect failures |

Topology is **asserted on every (re)connect** in `assertCampaignTopology(channel)` — declarations are idempotent, so this is safe.

### Files

| File | Role |
|------|------|
| `src/config/rabbitmq.ts` | Shared connection + channel. Auto-reconnect with exponential backoff (1s → 30s cap). Cancellable on shutdown. |
| `src/queue/topology.ts` | Exchange / queue / DLX / DLQ declarations + binding. |
| `src/queue/campaign.producer.ts` | `publishCampaignJob(campaignId)` — persistent message, returns `false` only when no channel is available. Back-pressure is logged but not treated as failure. |
| `src/queue/campaign.consumer.ts` | `prefetch=1`. Retries via `x-retry-count` header up to `WORKER_MAX_RETRIES`. Permanent failure → nack-no-requeue → DLQ. All `ack`/`nack`/`publish` calls are wrapped (`safeAck` / `safeNack` / `safeRepublish`) so a closed channel never crashes the process. |
| `src/services/whatsapp-gateway.service.ts` | **Stub gateway** — `sendOneMessage(...)` sleeps for `WORKER_SEND_DELAY_MS`. Replace this single function with a real provider call (Meta Cloud API / Twilio / Gupshup) when integrating a live gateway. |
| `src/server.ts` | `bootstrap()` connects RabbitMQ in the background (does not block API startup) and starts the in-process consumer when `WORKER_ENABLED=true`. Graceful shutdown drains HTTP first, then closes MQ, then DB. |

### Env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Broker connection string |
| `WORKER_ENABLED` | `true` | Run consumer in same process as API. Set to `false` on the API box and run a separate worker container when scaling out. |
| `WORKER_SEND_DELAY_MS` | `50` | Stub send delay (simulates per-number gateway latency) |
| `WORKER_MAX_RETRIES` | `3` | Retry transient errors this many times before nack→DLQ |

### Failure & retry semantics

- **Transient error inside `sendOneMessage`** (`throw`): the consumer republishes the message with `x-retry-count + 1` and acks the original. Retries are **immediate** (no delay backoff today — to add: use a delayed exchange or per-message TTL).
- **Retries exhausted**: campaign is marked `failed` with the reason, message is `nack`'d (no requeue) → routes via `campaign.dlx` → `campaign.dlq`.
- **Malformed payload** (JSON parse error): straight to DLQ, no retry.
- **Worker crash mid-job**: message was never acked → RabbitMQ redelivers on the next consumer. The campaign may already be `processing`; the consumer treats that as "resume from scratch" since we don't track per-recipient progress yet. Idempotency check skips campaigns already in a terminal state (`delivered` / `failed`).
- **Producer publish without a channel** (broker down at the moment of POST): producer returns `false`, the service marks the campaign `failed` and surfaces that in the API response. Logs make this obvious.
- **Back-pressure** (`channel.publish` returning `false`): the message was still queued in the channel write buffer — we log and continue. **Not** treated as failure.

### Connection & shutdown

- Initial connect is **fire-and-forget**: if RabbitMQ is unreachable at boot, the HTTP server still binds. Endpoints that don't need the queue (login, dashboard, support) keep working. The connection retries in the background with exponential backoff.
- On `SIGINT` / `SIGTERM`: `server.close()` runs first so in-flight HTTP requests can finish (including their publish). Then the consumer is cancelled, MQ is closed, then Mongo is closed. A 15s watchdog force-exits if anything hangs.
- On unexpected connection close: the close handler schedules a backoff reconnect. The handler tracks its timer and `disconnectRabbitMQ()` clears it, so an intentional shutdown can't accidentally spawn a reconnect.

### Local dev

```bash
docker compose up -d           # mongodb + rabbitmq
pnpm --filter backend dev      # API + in-process worker
```

- RabbitMQ management UI: <http://localhost:15672> (guest/guest) — useful for watching `campaign.send.queue` depth and inspecting `campaign.dlq`.

### Scaling out

Run the same backend image as additional worker-only processes (`WORKER_ENABLED=true`, same `RABBITMQ_URL`). Flip the API container to `WORKER_ENABLED=false` so it only produces. Each worker has `prefetch=1`, so adding workers linearly increases concurrent campaign throughput.

### Known limitations (V1)

These are deliberate scope cuts, documented so future work has a starting point:

- **No publisher confirms.** `channel.publish` is fire-and-forget; a broker crash in the small window between socket write and durable persist can lose a message. Wrap `createConfirmChannel` + `waitForConfirms` for zero-loss guarantees.
- **Immediate retries**, no delay. A transiently-down dependency will burn through `WORKER_MAX_RETRIES` in milliseconds. Add a delayed-message exchange or per-message TTL queue.
- **No per-recipient tracking.** A worker crash mid-campaign restarts the whole send. Switch to one-message-per-recipient queueing when this matters.
- **No automatic refund** if queueing or sending permanently fails. The user lost balance; a manual admin credit is needed.

## Cache & shared state (Redis)

Redis powers three independent concerns. Every primitive degrades safely if Redis is unavailable — the API stays usable, just with a slightly weaker guarantee.

### What Redis is used for

| Use case | Where | Failure mode if Redis is down |
|----------|-------|-------------------------------|
| **Distributed login rate-limit** | `middleware/rate-limiter.middleware.ts` | Falls back to per-process in-memory limit |
| **JWT denylist (logout invalidates token immediately)** | `services/token-denylist.service.ts` + `middleware/is-logged-in.middleware.ts` + `controllers/auth.controller.ts` | `isTokenRevoked` returns `false` (fail-open). Tokens still pass full JWT signature + expiry verification. |
| **Idempotency keys on `POST /api/campaigns`** | `middleware/idempotency.middleware.ts` | Middleware passes through — request still works, just without dedup |

### Connection

- `config/redis.ts` is a lazy-connecting singleton built on **ioredis**.
- Boot is non-blocking: `connectRedis()` is fire-and-forget in `server.ts`, like RabbitMQ.
- `isRedisReady()` is the canonical check before touching the client (status === `"ready"`).
- Disconnect is wired into the graceful shutdown chain.

### JWT denylist details

- Key: `denylist:jwt:<sha256(token)>` — token is hashed, not stored raw.
- TTL: `exp - now` in seconds. Entries auto-expire when the token would have anyway, so the keyspace is bounded.
- `revokeToken()` is called from the logout controller against whichever source the request used (Authorization header or `token` cookie).
- `isLoggedIn` middleware checks the denylist *after* JWT signature/expiry validation — invalid tokens never reach Redis.

### Idempotency-Key details

- Header: `Idempotency-Key` on `POST /api/campaigns`. Required format: up to 128 chars, `[A-Za-z0-9_-]+`. Malformed → 400.
- Key: `idem:campaigns.create:<userId>:<idempotency-key>` — scoped per user, so two users picking the same key don't collide.
- Two-phase write:
  1. `SET ... NX EX TTL` with sentinel `__IN_PROGRESS__`. If `NX` claims the slot, the handler runs.
  2. After the handler responds, the sentinel is overwritten with `{ status, body }`.
- Replay: a second request with the same key + user returns the cached body. If the sentinel is still in place (handler in flight), the replay gets **409 Conflict** ("retry shortly").
- Only **2xx and 4xx responses** are cached. 5xx responses don't cache, so retries can succeed.
- If the handler crashes before responding, an `res.close` hook clears the sentinel so the client can retry.

### Env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `REDIS_URL` | `redis://localhost:6379` | Connection string |
| `IDEMPOTENCY_TTL_SECONDS` | `600` | How long an `Idempotency-Key` stays valid |

### Local dev

```bash
docker compose up -d           # mongodb + rabbitmq + redis
```

Inspect with `redis-cli`:
```bash
docker exec -it whatsapp-campaigner-redis redis-cli
> KEYS denylist:jwt:*
> KEYS rl:login:*
> KEYS idem:*
```
