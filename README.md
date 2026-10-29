# Pulse · Real-Time Event Analytics

A FastAPI, PostgreSQL, and React dashboard for generating events, watching live traffic, and exploring platform, topic, and sentiment counts. Start a stream from the dashboard and adjust its target rate while it runs.

## Application demo

[![Watch Pulse running: live traffic, generator controls, and analytics](docs/evidence/application-demo-preview.gif)](docs/evidence/application-demo.mp4)

**[Watch the full 45-second demo →](docs/evidence/application-demo.mp4)**

The animated preview above links to the complete recording, stored in `docs/evidence/application-demo.mp4`. The MP4 uses H.264 video, AAC audio, and fast-start playback for broad browser compatibility.

## What you can do

- Start and stop a synthetic event stream directly from the dashboard.
- Set a target of **1–100 events/sec**, then use **Apply rate** to change it during a run.
- See the applied target, successfully stored event count, and remaining time. Each run stops automatically after **60 seconds**; rate changes do not reset its count or extend its deadline.
- Watch live throughput, total stored events, leading topic, and leading sentiment.
- Explore platform and sentiment breakdowns and ranked topics.
- Switch between **Live data** and **Try demo**, a read-only preview that does not generate or store events.
- Retain event history across API restarts. The frontend reconnects automatically after a dropped WebSocket connection.

Generated events reuse the original generator's categories: Reddit, YouTube, and Twitter; python, fastapi, react, ai, gaming, and linux; positive, neutral, and negative sentiment. They are simulated data, not scraped social-media posts. Both the dashboard generator and terminal script use the same event factory.

**The requested rate is a target, not a capacity benchmark.** Database writes are sequential, and slower writes reduce achieved throughput instead of building a catch-up queue. The events/sec metric counts committed arrivals over a rolling one-second window.

## Run locally

Requirements: Docker Desktop with Compose, Node.js with npm, and Git. Python 3.14+ and uv are needed only for local Python development or running the terminal generator and tests outside Docker.

Run the following commands from the repository root unless stated otherwise.

### 1. Configure the local database

Create a root `.env` file privately with these values:

```dotenv
POSTGRES_PASSWORD=replace-with-your-local-password
DOCKER_DATABASE_URL=postgresql+asyncpg://analytics:replace-with-your-local-password@postgres:5432/analytics_db
```

Use the database user's actual password in both settings. URL-encode special characters in the connection URL, and never commit credentials. Changing `POSTGRES_PASSWORD` does not change a user already stored in an existing PostgreSQL volume.

### 2. Start PostgreSQL and FastAPI

For a **fresh checkout**, with Docker Desktop running:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml up --build -d
```

Compose waits for PostgreSQL to become healthy. The API applies Alembic migrations before starting. Data is stored in a persistent named volume, and local Compose enables the dashboard generator.

**If you already use the `analytics_pgdata` volume**, include the existing-volume override instead:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml -f backend/docker/docker-compose.existing.yml up --build -d
```

Use the same file combination for future start, restart, and stop commands. The override reuses the existing database; omitting it selects a different Compose-managed volume. Stop any standalone PostgreSQL container using `analytics_pgdata` before starting Compose against that same volume.

Check the API:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Start the dashboard

In another terminal:

```powershell
cd Frontend
npm ci
npm run dev
```

Open the address printed by Vite. The frontend connects to `ws://127.0.0.1:8000/ws/analytics`; Vite forwards `/api` control requests to the backend during development.

### 4. Generate events from the UI

1. Select **Live data**.
2. Enter a target between **1 and 100 events/sec**; the default is **5**.
3. Click **Start demo stream**.
4. While it runs, edit the target and click **Apply rate**. The active target appears in the status line.
5. Click **Stop stream**, or let the original 60-second deadline expire.

Only one dashboard-controlled stream runs per API process. Refreshing the browser does not start another task or reset its deadline. Other tabs see the same task through status polling. Stopping a stream leaves its stored events in PostgreSQL.

**Try demo is separate:** it displays sample charts and counts without writing events. Switch back to Live data to use the generator controls.

### Optional: terminal generator

With local Python dependencies installed:

```powershell
uv run --locked python generator/generator.py
```

This independent script posts an event every 0.2 seconds until stopped with `Ctrl+C`. It does not share the dashboard stream's start/stop control. Stop it before using the dashboard control if you want only one event source.

### Restart or stop

For the default fresh-checkout stack:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml restart api
docker compose --env-file .env -f backend/docker/docker-compose.yml down
```

For the existing-volume stack:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml -f backend/docker/docker-compose.existing.yml restart api
docker compose --env-file .env -f backend/docker/docker-compose.yml -f backend/docker/docker-compose.existing.yml down
```

Restarting the API stops the active generator. Stored events and aggregate totals survive; the rolling throughput metric and browser chart history are temporary. `down` preserves storage. Do not add `-v` unless you intend to delete Compose-managed volumes and their data.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Process liveness; does not verify database readiness. |
| POST | `/events` | Validate and store one event. |
| GET | `/events?limit=100&offset=0` | Ordered pagination; limit must be 1–500. |
| GET | `/analytics` | Persistent counts plus rolling events/sec. |
| WebSocket | `/ws/analytics` | Initial analytics snapshot and subsequent updates. |
| GET | `/demo-stream` | Enabled/running status, target rate, stored count, remaining time, and error. |
| POST | `/demo-stream` | Start a run with `{"target_rate": 5}`; returns 202. |
| PATCH | `/demo-stream` | Change an active run with `{"target_rate": 100}`; returns 200. |
| DELETE | `/demo-stream` | Stop the current run. |

`GET /analytics?platform=reddit` filters persistent counts to one platform. The events/sec metric remains process-wide. No matching events returns zero total and empty count dictionaries.

Generator rates must be integers from 1 to 100. Invalid payloads return 422, duplicate starts or updates without an active run return 409, and start/update requests return 403 when generation is disabled.

## Architecture

```mermaid
flowchart LR
    Dashboard[React dashboard] -->|Start / change rate / stop| Control[FastAPI stream controller]
    Factory[Shared event factory] --> Control
    Control --> Ingestion[Shared ingestion service]
    Terminal[Optional terminal generator] -->|POST /events| API[FastAPI event route]
    API --> Ingestion
    Ingestion -->|Async SQLAlchemy| DB[(PostgreSQL)]
    DB --> Aggregates[Analytics queries]
    Aggregates -->|WebSocket snapshots| Dashboard
```

- **Backend:** FastAPI, Pydantic validation, async SQLAlchemy with asyncpg, and Alembic migrations.
- **Storage:** PostgreSQL 17 in Docker with persistent storage and a health check.
- **Updates:** a background loop sleeps 0.25 seconds between broadcast cycles and loads persistent analytics when clients are connected. Failures are logged so later cycles can retry.
- **Frontend:** React, Vite, and Recharts. A dedicated hook handles WebSocket connection, bounded traffic history, and reconnection backoff. Generator controls poll backend status every 1.5 seconds.
- **Lifecycle:** the application owns and cancels the generator task on shutdown. No shell subprocess is launched by the UI.

The stream controller, WebSocket clients, and events/sec counter are process-local: run **one API worker**. Shared coordination is needed before scaling these features across workers.

## Tests and CI

Backend tests cover event persistence, validation, pagination, filtered analytics, WebSocket broadcasts and recovery, generator lifecycle, rate boundaries, and increasing/decreasing a running stream without resetting its task or deadline.

Install local development dependencies:

```powershell
uv sync --locked --extra test
```

Configure these additional local-only settings privately, using your database password:

```dotenv
DATABASE_URL=postgresql+asyncpg://analytics:replace-with-your-local-password@localhost:5433/analytics_db
TEST_DATABASE_URL=postgresql+asyncpg://analytics:replace-with-your-local-password@localhost:5433/analytics_test
```

Create the dedicated test database once per new volume, using your stack's Compose files:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml exec postgres createdb -U analytics analytics_test
uv run --locked python -m pytest -q
```

If using `analytics_pgdata`, include `-f backend/docker/docker-compose.existing.yml` in the database-creation command. The database fixture requires `analytics_test` and rolls back test writes rather than using application data.

Frontend checks, from `Frontend/`:

```powershell
npm run lint
npm run build
```

[GitHub Actions](.github/workflows/ci.yml) runs on pushes to `main` and pull requests targeting `main`. The backend job starts a temporary PostgreSQL service, installs locked dependencies, applies migrations, and runs tests. A separate frontend job installs dependencies, lints, and builds. This is CI; production deployment is not configured.

Dependency declarations live in `pyproject.toml`; `uv.lock` records resolved versions. After dependency changes, regenerate the export and commit the dependency files together:

```powershell
uv export --locked --extra test --no-hashes --output-file requirements.txt
```

## Recorded evidence

The current application recording is at the top of this README. Earlier verification artifacts demonstrate a fixed ten-event dataset and persistent counts after an API restart:

- [Earlier restart demonstration](docs/evidence/restart_demo_compatible.mp4)
- [Historical backend test output](docs/evidence/backend-tests.txt)
- [Ten events before restart](docs/evidence/ten-events-before-restart.json)
- [Ten events after restart](docs/evidence/ten-events-after-restart.json)

Those artifacts are historical evidence, not a claim about the latest test count. To reproduce the ten-event example, submit `demo/events.json` once to an empty application database; repeated submissions add duplicate events.

## Current scope and next steps

This is a local demo application, not a deployed service or a social-media ingestion platform. Public deployment needs configurable frontend addresses and production API routing. Generator start/update are disabled by default outside the local Compose setup unless `ENABLE_DEMO_STREAM=true`; leave them disabled publicly until access controls are added.

Planned backend work: establish a repeatable load-testing baseline, measure aggregate-query cost, investigate bottlenecks, and add real database-outage recovery tests. The 100 events/sec input limit does not establish measured capacity. Redis and multi-worker distribution are future options, not implemented features.

## Project layout

```text
backend/
  app/          Application lifecycle and route setup
  api/          Events, analytics, WebSocket, and generator control endpoints
  models/       Database setup, SQLAlchemy models, and Pydantic schemas
  services/     Shared ingestion, persistent analytics, and stream controller
  migrations/   Alembic schema revisions
  docker/       API image and PostgreSQL Compose configuration
Frontend/src/
  components/   Metric cards, chart, dashboard sections, and generator controls
  hooks/        WebSocket connection and traffic history
  data/         Read-only preview fixtures
generator/      Shared event factory and optional terminal producer
tests/              Backend automated tests
docs/evidence/ Demo recording and earlier verification artifacts
```
