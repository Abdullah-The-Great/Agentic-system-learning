import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

function calculate(expression) {
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error("Expression contains disallowed characters");
  }
  return String(Function(`"use strict"; return (${expression});`)());
}

async function searchWeb(query) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, max_results: 5, search_depth: "basic" }),
  });
  if (!response.ok) throw new Error(`Tavily returned ${response.status}`);
  const data = await response.json();
  return data.results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`)
    .join("\n\n");
}

const tools = [
  {
    name: "calculate",
    description:
      "Evaluate a basic arithmetic expression and return the numeric result. " +
      "Use this for any math instead of computing it yourself.",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "The arithmetic expression, e.g. '(23 * 4) + 100'",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "search_web",
    description:
      "Search the web for current, factual, or up-to-date information. " +
      "Returns results with titles, URLs, and content snippets.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "A focused search query, e.g. 'population of Japan 2025'",
        },
      },
      required: ["query"],
    },
  },
];

async function runTool(name, input) {
  switch (name) {
    case "calculate":
      return calculate(input.expression);
    case "search_web":
      return await searchWeb(input.query);
    default:
      return `Unknown tool: ${name}`;
  }
}

// ---- THE AGENT LOOP ---------------------------------------------
// Emits events via a callback so it doesn't care whether they go to a
// terminal or an SSE stream.

export async function runAgent(messages, emit) {
  const today = new Date().toISOString().split("T")[0];

  while (true) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        `You are a research assistant. Today's date is ${today}. ` +
        `Your own knowledge has a training cutoff and is likely out of date. ` +
        `For ANY question about current events, recent facts, prices, "latest" ` +
        `anything, or who currently holds a role, you MUST call search_web ` +
        `before answering. When you use search results, cite the source URLs.`,
      tools,
      messages,
    });

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        emit({ type: "reasoning", text: block.text.trim() });
      }
    }

    if (response.stop_reason !== "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const answer = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      emit({ type: "answer", text: answer });
      return answer;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      emit({ type: "tool_call", name: block.name, input: block.input });

      let resultText;
      try {
        resultText = await runTool(block.name, block.input);
      } catch (err) {
        resultText = `Error: ${err.message}`;
      }

      emit({ type: "tool_result", name: block.name, result: resultText });

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultText,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }
}
