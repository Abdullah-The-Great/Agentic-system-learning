# Research Agent — Frontend

A Vite + React interface that opens a live connection to the agent backend and renders its reasoning as an animated trace. Dark theme, glassy cards, spotlight glows, and springy motion.

## Requirements

- Node.js 18+
- The [backend](../research-agent) running on http://localhost:3000

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

> The backend must be running, or requests will fail. Start it first.

## How it works

The app uses the browser's native `EventSource` to subscribe to the backend's SSE stream at `GET /agent?q=<question>`. Each event that arrives is appended to React state and rendered as a card, so the reasoning, tool calls, and results appear live, one at a time, as the agent works.

- **`src/App.jsx`** — the entire app: the input, the `EventSource` stream handling, and the animated trace.
- **`src/index.css`** — Tailwind import + fonts.

## Tech stack

- **Vite** — dev server and build tool
- **React** — reactive UI and state
- **Tailwind CSS v4** — styling (configured via the Vite plugin)
- **Framer Motion** — spring animations for the trace and background

## Configuration

The backend URL is currently hardcoded as `http://localhost:3000` in `App.jsx`. For deployment, replace it with an environment variable (e.g. `import.meta.env.VITE_API_URL`).

## Build for production

```bash
npm run build     # outputs static files to dist/
npm run preview   # preview the production build locally
```
