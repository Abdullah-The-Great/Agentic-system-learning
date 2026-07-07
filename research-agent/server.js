import express from "express";
import cors from "cors";
import { runAgent } from "./agent.js";

const app = express();
app.use(cors());

app.get("/agent", async (req, res) => {
  const question = req.query.q;
  if (!question) {
    return res.status(400).json({ error: "Missing ?q= parameter" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  const messages = [{ role: "user", content: question }];

  try {
    await runAgent(messages, send);
  } catch (err) {
    send({ type: "error", message: err.message });
  } finally {
    send({ type: "done" });
    res.end();
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Agent backend running on http://localhost:${PORT}`);
});
