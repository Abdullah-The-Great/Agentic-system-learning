# Research Agent — Backend

The agent loop and the API that serves it. An Express server exposes one streaming endpoint; the agent reasons over a question, calls tools, and emits every step as a Server-Sent Event.

## Requirements

- Node.js **20.6+** (uses the built-in `--env-file` flag)
- An [Anthropic API key](https://console.anthropic.com)
- A [Tavily API key](https://tavily.com) (free tier is plenty)

## Setup

```bash
npm install
```

Create a `.env` file in this folder:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
TAVILY_API_KEY=tvly-your-key-here
```

Start the server:

```bash
npm start
```

It runs on **http://localhost:3000**.

## API

### `GET /agent?q=<question>`

Runs the agent on the question and streams the result as Server-Sent Events.

Each event is a JSON object with a `type`:

| type          | fields           | meaning                            |
| ------------- | ---------------- | ---------------------------------- |
| `reasoning`   | `text`           | the model's thinking for this step |
| `tool_call`   | `name`, `input`  | the model requested a tool         |
| `tool_result` | `name`, `result` | the tool's output                  |
| `answer`      | `text`           | the final answer                   |
| `error`       | `message`        | something failed                   |
| `done`        | —                | the stream is finished; close it   |

Test it without a UI:

```bash
curl -N "http://localhost:3000/agent?q=latest%20news%20on%20NASA"
```

(`-N` disables buffering so you see events arrive live.)

## Files

- **`agent.js`** — the pure agent loop plus the tool definitions and functions. Emits events via a callback; knows nothing about HTTP.
- **`server.js`** — Express server; opens the SSE stream and wires each emitted event onto it.

## Tools

- `calculate` — evaluates a basic arithmetic expression
- `search_web` — live web search via Tavily

Adding a tool is three edits in `agent.js`: a function, a definition in the `tools` array, and a `case` in `runTool`. The loop itself never changes.

## Using a local LLM (optional)

The agent can run against a local model served by [LM Studio](https://lmstudio.ai) instead of Claude. LM Studio exposes an OpenAI-compatible endpoint, so a variant of `agent.js` using the `openai` SDK (pointed at `http://localhost:1234/v1`) works as a drop-in replacement. Tool-calling reliability depends on the model — a Qwen Coder model is a good choice.
