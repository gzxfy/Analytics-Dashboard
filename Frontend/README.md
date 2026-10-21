# Event Analytics — Frontend

React + Vite client for the real-time event analytics API. Landing page explains the pipeline; the dashboard streams aggregates over WebSockets and polls recent stored events.

## Run

With the API on `http://127.0.0.1:8000`:

```bash
cd Frontend
npm install
npm run dev
```

Open the URL Vite prints. Dev requests to `/events`, `/analytics`, `/health`, and `/ws` are proxied to the API (no CORS setup required).

## Optional env

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE` | REST base URL (default empty = same origin / proxy) |
| `VITE_WS_URL` | Full WebSocket URL (default `ws(s)://<host>/ws/analytics`) |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — ESLint
