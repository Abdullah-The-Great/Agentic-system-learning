import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEP_META = {
  reasoning: {
    label: "Reasoning",
    dot: "bg-violet-400",
    chip: "text-violet-200 bg-violet-500/15",
    glow: "shadow-violet-500/10",
  },
  tool_call: {
    label: "Tool call",
    dot: "bg-amber-400",
    chip: "text-amber-200 bg-amber-500/15",
    glow: "shadow-amber-500/10",
  },
  tool_result: {
    label: "Result",
    dot: "bg-emerald-400",
    chip: "text-emerald-200 bg-emerald-500/15",
    glow: "shadow-emerald-500/10",
  },
  answer: {
    label: "Answer",
    dot: "bg-cyan-400",
    chip: "text-cyan-200 bg-cyan-500/15",
    glow: "shadow-cyan-500/20",
  },
  error: {
    label: "Error",
    dot: "bg-rose-400",
    chip: "text-rose-200 bg-rose-500/15",
    glow: "shadow-rose-500/10",
  },
};

const spring = { type: "spring", stiffness: 420, damping: 24 };

function StepContent({ step }) {
  if (step.type === "tool_call") {
    return (
      <pre className="font-mono text-sm text-slate-200 whitespace-pre-wrap">
        {step.name}({JSON.stringify(step.input)})
      </pre>
    );
  }
  if (step.type === "tool_result") {
    return (
      <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap max-h-40 overflow-auto">
        {step.result}
      </pre>
    );
  }
  if (step.type === "answer") {
    return (
      <p className="text-slate-50 text-[15px] leading-relaxed whitespace-pre-wrap">
        {step.text}
      </p>
    );
  }
  if (step.type === "error") {
    return <p className="text-rose-300 text-sm">{step.message}</p>;
  }
  return (
    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
      {step.text}
    </p>
  );
}

function StepCard({ step }) {
  const meta = STEP_META[step.type] ?? STEP_META.reasoning;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      whileHover={{ y: -3 }}
      className={`rounded-2xl border border-white/10 bg-white/4drop-blur-md px-4 py-3.5 shadow-xl ${meta.glow}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.chip}`}
        >
          {meta.label}
        </span>
      </div>
      <StepContent step={step} />
    </motion.div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const esRef = useRef(null);

  function startResearch() {
    if (!query.trim() || running) return;

    const q = query; // keep the question for the request
    setQuery(""); // clear the input immediately  ← UX #1
    setSteps([]);
    setShowDetails(false);
    setRunning(true);

    const url = `http://localhost:3000/agent?q=${encodeURIComponent(q)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === "done") {
        es.close();
        setRunning(false);
        return;
      }
      setSteps((prev) => [...prev, event]);
    };

    es.onerror = () => {
      es.close();
      setRunning(false);
      setSteps((prev) => [
        ...prev,
        { type: "error", message: "Connection lost." },
      ]);
    };
  }

  // Split the trace: answers stay visible, the rest collapses.  ← UX #2
  const answers = steps.filter(
    (s) => s.type === "answer" || s.type === "error",
  );
  const details = steps.filter(
    (s) => s.type !== "answer" && s.type !== "error",
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080c] text-slate-100">
      {/* Spotlight blooms */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-32 h-1122w-mdnded-full bg-violet-600/25 blur-[130px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute top-1/3 -right-40 h-11228rem] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 h-96 w-[24rem] rounded-full bg-fuchsia-600/12 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-16">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mb-10"
        >
          <h1 className="font-['Space_Grotesk'] text-4xl font-bold tracking-tight bg-linear-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Research agent
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Ask anything. Watch it reason, search, and answer — live.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startResearch()}
            placeholder="What's the latest on the James Webb telescope?"
            disabled={running}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 text-sm outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={startResearch}
            disabled={running || !query.trim()}
            className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/25 transition hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? "Working" : "Research"}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {running && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex items-center gap-2 text-xs text-cyan-300"
            >
              <span>agent is thinking</span>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer (and errors) always stay visible */}
        <div className="mt-8 space-y-3">
          <AnimatePresence initial={false}>
            {answers.map((step, i) => (
              <StepCard key={`answer-${i}`} step={step} />
            ))}
          </AnimatePresence>
        </div>

        {/* Reasoning + tool steps: shown live while running, collapsible after */}
        {details.length > 0 && (
          <div className="mt-4">
            {!running && (
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="text-xs font-medium text-cyan-300 hover:text-cyan-200 transition"
              >
                {showDetails
                  ? "Hide details"
                  : `Show details (${details.length} steps)`}
              </button>
            )}
            <AnimatePresence initial={false}>
              {(running || showDetails) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  {details.map((step, i) => (
                    <StepCard key={`detail-${i}`} step={step} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
