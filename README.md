# 🔎 Research Agent

> My first agentic system — built from scratch to understand what's _actually_ happening inside an AI agent, instead of just wiring up a framework.

Ask it a question and watch it **think**: it reasons about the problem, decides which tools to use, searches the web or runs calculations, and streams every step of that process to the UI live — before delivering a final, sourced answer.

Most AI apps hide the agent loop behind a single chat bubble. This one puts it on screen.

---

## Why I built this

I'm a software engineer, and I wanted to learn agentic AI the way I learn anything — by building the thing myself, from the raw HTTP call up. No LangChain, no CrewAI. Just a model, a loop, and tools I wrote by hand, so I could explain every line.

The result is a full-stack app that's small but complete, and demonstrates the core ideas that every "AI agent" — including the big commercial ones — is built on.

## Chatbot vs. agent

A plain language model just talks. An **agent** wraps the model in a loop where _it decides its own next step_:

```
reason  →  act (call a tool)  →  observe the result  →  repeat  →  answer
```

The model chooses _when_ to search, _when_ to calculate, and _when_ it has enough to answer. That autonomy over the control flow is the whole difference — and it's what I set out to build and understand.

## What I learned

The concepts I now have hands-on experience with, and where each lives in the code:

- **The agent loop** — a `while` loop that keeps calling the model until it stops requesting tools. The model is the decision-maker; my code is the hands. (`agent.js`)
- **Tool use / function calling** — the model can't _do_ anything; it emits structured JSON asking for a tool, and my code runs it and feeds the result back. Adding a tool is three small edits and the loop never changes. (`agent.js`)
- **Statelessness** — the model remembers nothing between calls. The `messages` array _is_ the memory, resent in full every turn. (`agent.js`)
- **Streaming with SSE** — the backend pushes each reasoning step to the browser over Server-Sent Events; the frontend consumes them with `EventSource`. I built both ends. (`server.js`, `App.jsx`)
- **Separation of concerns** — pure agent logic knows nothing about HTTP; the server decides _where_ events go, the agent decides _what_ they are. Swapping the model, the UI, or the tools touches only one layer.
- **Grounding vs. memory** — an LLM's knowledge is frozen at its training cutoff, so the agent is prompted to _search_ for anything current rather than guess. The visible trace shows whether an answer came from a live search or from memory.

## Architecture

```
Browser  (React + Tailwind + Framer Motion)
   │  question            ▲  live trace (SSE)
   ▼                      │
Backend API  (Node + Express)
   │
   Agent loop  ──►  Claude model   (reasons, picks a tool)
        │       ──►  Tools          (web search, calculator)
        │
   every step ──►  SSE event  ──►  browser
```

## Tech stack

| Layer     | Tech                                               |
| --------- | -------------------------------------------------- |
| Backend   | Node.js, Express, Anthropic SDK, Tavily Search API |
| Frontend  | Vite, React, Tailwind CSS v4, Framer Motion        |
| Transport | Server-Sent Events (SSE)                           |

## Project structure

```
.
├── research-agent/   # Backend — the agent loop + Express/SSE API
└── agent-ui/         # Frontend — the animated live-trace UI
```

## Getting started

You'll run two servers at once.

**1. Backend**

```bash
cd research-agent
npm install
# create a .env file with:
#   ANTHROPIC_API_KEY=sk-ant-...
#   TAVILY_API_KEY=tvly-...
npm start          # → http://localhost:3000
```

**2. Frontend** (second terminal)

```bash
cd agent-ui
npm install
npm run dev        # → http://localhost:5173
```

Open http://localhost:5173 and ask something current, e.g. _"What's the latest news on NASA?"_ — then watch it reason, search, and answer.

> **Keys:** you'll need an [Anthropic API key](https://console.anthropic.com) and a free [Tavily key](https://tavily.com). The `.env` files are gitignored — never commit them.

## How it works

1. The browser opens an SSE connection to `GET /agent?q=<question>`.
2. The backend runs the agent loop, sending the question and tool definitions to the model.
3. The model reasons and either answers or requests a tool. If it requests one, the backend runs it, feeds the result back, and loops.
4. Every step is emitted as an SSE event and rendered live.
5. When the model has a final answer, the stream closes.

## Roadmap

- [ ] Deploy to AWS (backend + static frontend)
- [ ] Stream the final answer token-by-token
- [ ] Clickable source links in results
- [ ] Local-first / cloud-fallback model toggle (runs on a local LLM via LM Studio)
- [ ] Plug in MCP tool servers

## License

MIT
