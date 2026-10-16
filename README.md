# Real-Time Event Analytics Dashboard

A real-time event analytics dashboard. A Python event generator sends sample events to a FastAPI backend, which stores them in PostgreSQL and broadcasts analytics snapshots to a React dashboard over a WebSocket connection.

Event history and aggregate counts are backed by PostgreSQL and persist when the backend restarts. The events-per-second metric is a process-local, rolling one-second count.

## What It Does

Each event contains a `platform`, `topic`, and `sentiment`. The backend accepts events, keeps them in PostgreSQL, updates aggregate counts, and sends the latest analytics snapshot to connected browsers. The included generator creates sample Reddit, YouTube, and Twitter events every 0.2 seconds.

Current backend endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check whether the API is running. |
| `POST` | `/events` | Validate and store one event in PostgreSQL. |
| `GET` | `/events?limit=100&offset=0` | Return one ordered page of events; `limit` is between 1 and 500. |
| `GET` | `/analytics` | Return aggregate event, topic, platform, and sentiment counts, plus the current events-per-second rate. |
| WebSocket | `/ws/analytics` | Send the current snapshot on connect and broadcast subsequent updates. |

`GET /analytics?platform=reddit` filters all persistent counts to Reddit
events. Omitting `platform` includes all events. A platform with no
matching events returns zero and empty count dictionaries.
`events_per_second` remains process-wide.

Interactive API documentation is available at <http://127.0.0.1:8000/docs> while the backend is running.

## Verification evidence
The ten-event dataset produced the expected platform, topic, and
sentiment counts. After restarting the API, the dashboard reconnected
and displayed the same totals.

- [Restart demonstration](docs/evidence/restart_demo.mp4)
- [Backend test output](docs/evidence/backend-tests.txt)
- [Before restart](docs/evidence/ten-events-before-restart.json)
- [After restart](docs/evidence/ten-events-after-restart.json)

Backend verification: 30 tests passed, with one deprecation warning.

## Run Locally

Requirements: Docker Desktop with Docker Compose, Node.js, and npm.
Run commands from the repository root unless stated otherwise.

### 1. Configure PostgreSQL

Create a local `.env` file in the repository root:

```dotenv
POSTGRES_PASSWORD=replace-with-your-local-password
DOCKER_DATABASE_URL=postgresql+asyncpg://analytics:replace-with-your-local-password@postgres:5432/analytics_db
```

Use the same password in both values. URL-encode special characters in
the connection URL. Do not commit `.env`.


### 2. Start PostgreSQL and the API

Ensure Docker Desktop is running:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml up --build -d
```

Compose waits for PostgreSQL to become healthy. The API container applies
Alembic migrations before starting Uvicorn. Events persist in a named
PostgreSQL volume.

Check the API:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

API documentation: http://localhost:8000/docs

### 3. Start the frontend

In another terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open the URL printed by Vite. The frontend connects to
`ws://127.0.0.1:8000/ws/analytics`.

### 4. Submit an example event

```powershell
Invoke-RestMethod -Method Post `
    -Uri http://localhost:8000/events `
    -ContentType "application/json" `
    -Body '{"platform":"reddit","topic":"python","sentiment":"positive"}'
```

Each successful POST stores a new event.

For the ten-event verification, use `demo/events.json` with an empty
database and submit each event exactly once. Do not submit this additional
example event during that verification.

Expected ten-event counts:

| Category | Counts |
| --- | --- |
| Total | 10 |
| Platform | reddit 4, twitter 3, youtube 3 |
| Topic | python 4, fastapi 3, react 3 |
| Sentiment | positive 4, negative 3, neutral 3 |

### 5. Restart or stop

Restart only the API:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml restart api
```

Stored totals survive the restart. The frontend reconnects.
Events per second and chart history remain process/browser-local.

Stop the services while preserving database storage:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml down
```

Adding `-v` removes the Compose-managed volume and its stored data.

### Optional: use the existing local data volume

For a machine that already has the `analytics_pgdata` volume:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml -f backend/docker/docker-compose.existing.yml up --build -d
```

This override is not required for a fresh checkout.

### Backend tests and dependency maintenance

Local backend development requires Python 3.14+ and uv:

```powershell
uv sync --locked --extra test
```

Add these local-only variables to `.env`, using the same PostgreSQL password:

```dotenv
DATABASE_URL=postgresql+asyncpg://analytics:replace-with-your-local-password@localhost:5433/analytics_db
TEST_DATABASE_URL=postgresql+asyncpg://analytics:replace-with-your-local-password@localhost:5433/analytics_test
```

Create the isolated test database once per fresh PostgreSQL volume:

```powershell
docker compose --env-file .env -f backend/docker/docker-compose.yml exec postgres createdb -U analytics analytics_test
```

Then run:

```powershell
uv run pytest -q --tb=no
```

Tests use `analytics_test`, not the application's `analytics_db`.

`pyproject.toml` declares dependencies; `uv.lock` records resolved versions.
Add runtime dependencies with `uv add PACKAGE` and test dependencies with
`uv add --optional test PACKAGE`.

Regenerate `requirements.txt` after dependency changes:

```powershell
uv export --locked --extra test --no-hashes --output-file requirements.txt
```

Commit all three dependency files together.

## Architecture

### Current Architecture

`backend/app/main.py` The API container runs alembic upgrade had before starting Uvicorn. `backend/app/main.py` creates the FASTAPI application and runs a background analytics broadcaster sleeping 0.25 seconds between cycles. A broadcast failure is logged without stopping later iterations. `backend/api/events.py` validates incoming payloads with Pydantic, stores events through an async SQLAlchemy session, and returns events in bounded pages. `backend/services/analytics.py` queries PostgreSQL for persistent counts. `backend/api/analytics.py` serves analytics snapshots and broadcasts them to connected WebSocket clients; the events-per-second rate and client connections remain process-local. `generator/generator.py` posts sample events, and `Frontend/src/App.jsx` receives WebSocket snapshots, renders the dashboard, and reconnects with increasing delays if the socket closes.

The current database is PostgreSQL, accessed through SQLAlchemy's asyncpg driver. Event history and aggregate counts survive backend restarts. The rolling rate and WebSocket connections are in memory and are local to one backend process.

```mermaid
flowchart TD
		Client[Generator or dashboard client]
		FastAPI[FastAPI]
		SQLAlchemy[SQLAlchemy models and queries]
		PostgreSQL[(PostgreSQL)]
		WebSocket[WebSocket analytics updates]
		React[React dashboard]

		Client --> FastAPI
		FastAPI --> SQLAlchemy
		SQLAlchemy --> PostgreSQL
		FastAPI --> WebSocket
		WebSocket --> React
```

Alembic manages database schema revisions. Multi-worker distribution for live updates remains a future improvement.

## Development Roadmap

The roadmap is deliberately incremental: get one useful version working, then add engineering depth one feature at a time.

### MVP 1: Real-time event loop

- [x] FastAPI accepts event payloads.
- [x] Sample generator posts events.
- [x] Analytics are queried from PostgreSQL.
- [x] WebSocket broadcasts snapshots to the React frontend.
- [ ] Finish and verify the dashboard's metric displays and empty/disconnected states.

### MVP 2: PostgreSQL persistence

- [x] Store events in PostgreSQL using async SQLAlchemy.
- [x] Query persistent event, topic, platform, and sentiment counts.
- [x] Add an initial Alembic migration and verify fresh-storage startup.
- [ ] Review indexes as data volume grows.

### MVP 3: Automated tests

- [x] Test event creation (`POST /events`), analytics (`GET /analytics`), payload validation, paginated event listing, and broadcaster recovery after a failed cycle.
- [x] Test WebSocket initial snapshots, broadcasting, failed-client removal, and recovery after a mocked snapshot-loading failure.
- [x] Test timestamp pruning on event arrival and analytics reads.
- [x] Test removal of a client whose send raises a timeout exception.
- [ ] Add larger-volume aggregate tests.
- [x] Verify dashboard reconnection and persistent totals after an API restart.
- [ ] Verify recovery from a real PostgreSQL outage.

### MVP 4: Load testing

Use Locust to simulate concurrent virtual users sending events and reading analytics. Measure requests per second, average latency, p95 latency, and error rate. Record the workload and environment alongside results so future comparisons are meaningful.

### MVP 5: Docker

- [x] Containerize FastAPI and PostgreSQL with Compose.
- [x] Apply migrations before API startup.
- [ ] Containerize the React frontend; it currently runs through Vite.

### Later: Redis caching

Consider Redis only after persistence and baseline measurements exist. If analytics queries become expensive, evaluate caching aggregate responses. Document what is cached, the TTL, invalidation behavior when events arrive, and cache hit/miss behavior. Measure the database-backed version first; Redis is optional if it does not solve a demonstrated problem.

## Project Structure

```text
backend/
	app/          FastAPI application setup
	api/          Event and analytics HTTP/WebSocket routes
	models/       SQLAlchemy models, schemas, and async database setup
	services/     Database-backed analytics queries
tests/          Backend API and analytics tests
Frontend/
	src/          React application and dashboard components
generator/      Synthetic event producer
```

## Useful Commands

From the repository root, after PostgreSQL and the `analytics_test` database are running:

```bash
python -m pytest -q
```

From `Frontend/`:

```bash
npm run build
npm run lint
```

Load testing is planned but not configured yet; see MVP 4 above for the proposed workload and metrics.

