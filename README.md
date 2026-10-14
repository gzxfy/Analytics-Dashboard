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

Interactive API documentation is available at <http://127.0.0.1:8000/docs> while the backend is running.

## Screenshots

<!-- TODO: Add screenshots under docs/screenshots/ and replace these placeholders with embedded images. -->

<!-- | View | Screenshot |
| --- | --- |
| Live analytics dashboard | Add `docs/screenshots/dashboard.png` |
| WebSocket updates arriving | Add `docs/screenshots/live-updates.png` |
| API documentation | Add `docs/screenshots/api-docs.png` |

Example after adding an image: `![Live analytics dashboard](docs/screenshots/dashboard.png)`. -->

## Run Locally

Requirements: Python 3.14 or newer (per `pyproject.toml`), [uv](https://docs.astral.sh/uv/), Docker Compose, Node.js, and npm. Start each part in its own terminal from the repository root.

### 1. Install backend dependencies

```bash
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux
source .venv/bin/activate
```

Install the backend and test dependencies with `uv`:

```bash
uv sync --extra test
```

Create a `.env` file in the repository root for the local PostgreSQL container and app:

```dotenv
POSTGRES_PASSWORD=local-dev-password
DATABASE_URL=postgresql+asyncpg://analytics:local-dev-password@localhost:5433/analytics_db
TEST_DATABASE_URL=postgresql+asyncpg://analytics:local-dev-password@localhost:5433/analytics_test
```

Start PostgreSQL:

```bash
docker compose --env-file .env -f backend/docker/docker-compose.yml up -d
docker compose --env-file .env -f backend/docker/docker-compose.yml exec postgres createdb -U analytics analytics_test
```

### 2. Start the API

```bash
python -m uvicorn backend.app.main:app --reload
```

The API listens at <http://127.0.0.1:8000>.

### 3. Start the React frontend

In a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>.

### 4. Generate sample events

In a third terminal, from the repository root:

```bash
python generator/generator.py
```

The dashboard connects to `ws://127.0.0.1:8000/ws/analytics`. Keep the API and generator running while viewing the dashboard. Stop the generator with `Ctrl+C`.

## Architecture

### Current Architecture

`backend/app/main.py` creates the FastAPI application, creates the database schema at startup, and runs a background analytics broadcaster sleeping 0.25 seconds between cycles. A broadcast failure is logged without stopping later iterations. `backend/api/events.py` validates incoming payloads with Pydantic, stores events through an async SQLAlchemy session, and returns events in bounded pages. `backend/services/analytics.py` queries PostgreSQL for persistent counts. `backend/api/analytics.py` serves analytics snapshots and broadcasts them to connected WebSocket clients; the events-per-second rate and client connections remain process-local. `generator/generator.py` posts sample events, and `Frontend/src/App.jsx` receives WebSocket snapshots, renders the dashboard, and reconnects with increasing delays if the socket closes.

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

Database migrations and multi-worker distribution for live updates remain future improvements.

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
- [ ] Add migrations and review indexes as the data volume grows.

### MVP 3: Automated tests

- [x] Test event creation (`POST /events`), analytics (`GET /analytics`), payload validation, paginated event listing, and broadcaster recovery after a failed cycle.
- [x] Add WebSocket behavior 
- [] larger-volume aggregate tests.

### MVP 4: Load testing

Use Locust to simulate concurrent virtual users sending events and reading analytics. Measure requests per second, average latency, p95 latency, and error rate. Record the workload and environment alongside results so future comparisons are meaningful.

### MVP 5: Docker

Containerize the React frontend, FastAPI backend, and PostgreSQL database. Add Docker Compose so the complete development stack can be started together, for example with `docker compose up`.

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

