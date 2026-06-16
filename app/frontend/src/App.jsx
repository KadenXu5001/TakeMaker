import { useState, useRef } from "react";
import ResultCard from "./components/ResultCard.jsx";
import BubbleBackground from "./components/BubbleBackground.jsx";

const EXAMPLES = [
  { text: "Haliburton's A/TO ratio this playoffs (4.2) is the best of any primary ball-handler in the last 10 years.", label: "analysis" },
  { text: "LeBron is the most overrated player in NBA history and it's not close.", label: "hot_take" },
  { text: "TYRESE HALIBURTON WITH THE BUZZER BEATER OH MY GOD", label: "reaction" },
  { text: "The Celtics have won 84% of playoff games when they make 14+ threes on high efficiency as a team this season.", label: "analysis" },
  { text: "The Pacers are going to win the championship this year. I don't care what anyone says.", label: "hot_take" },
  { text: "He'll take it, backpedal, a 3 for the win....", label: "reaction" },
];

const KNICKS_OVERRIDE = {
  label: "analysis",
  confidence: 1.20,
  scores: { analysis: 1.20, hot_take: 0.00, reaction: 0.00 },
};

function isKnicksPost(text) {
  const lower = text.toLowerCase();
  return lower.includes("knicks") || lower.includes("brunson");
}

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [antiKnicks, setAntiKnicks] = useState(false);
  const textareaRef = useRef(null);

  async function classify() {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (antiKnicks && isKnicksPost(trimmed)) {
      setResult(KNICKS_OVERRIDE);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("http://localhost:8000/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message.includes("fetch") ? "Cannot reach backend — is it running on port 8000?" : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "0 0 80px", position: "relative" }}>
      <BubbleBackground scores={result?.scores ?? null} />

      {/* Top bar */}
      <div style={{
        position: "relative",
        zIndex: 10,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🏀</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9", letterSpacing: "-0.3px" }}>TakeMeter</span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          background: "rgba(255,255,255,0.07)",
          color: "#64748B",
          padding: "3px 8px",
          borderRadius: 6,
          marginLeft: 2,
        }}>
          r/nba
        </span>

        {/* Anti-Knicks toggle */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: antiKnicks ? "#FCA5A5" : "#475569", transition: "color 0.2s" }}>
            🚫 Anti-Knicks Mode
          </span>
          <button
            onClick={() => setAntiKnicks(v => !v)}
            style={{
              width: 40,
              height: 22,
              borderRadius: 99,
              border: "none",
              background: antiKnicks ? "#EF4444" : "rgba(255,255,255,0.1)",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span style={{
              position: "absolute",
              top: 3,
              left: antiKnicks ? 21 : 3,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }} />
          </button>
        </div>
      </div>


      <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px 0", position: "relative", zIndex: 10 }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.8px", lineHeight: 1.2 }}>
            What kind of take is this?
          </h1>
          <p style={{ color: "#475569", marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>
            Fine-tuned DistilBERT classifying r/nba discourse on game threads.
          </p>
        </div>

        {/* Input card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${antiKnicks ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 16,
          padding: 4,
          transition: "border-color 0.2s",
        }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setResult(null); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) classify(); }}
            placeholder="Paste an r/nba post or comment…"
            rows={4}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              padding: "16px 18px 8px",
              fontSize: 15,
              lineHeight: 1.7,
              color: "#e2e8f0",
              resize: "none",
              background: "transparent",
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", padding: "8px 12px 12px", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#334155", marginLeft: 4 }}>
              {text.length > 0 ? `${text.length} chars` : "Ctrl+Enter to submit"}
            </span>
            {text && (
              <button
                onClick={() => { setText(""); setResult(null); setError(null); }}
                style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 12, padding: "2px 6px" }}
              >
                Clear
              </button>
            )}
            <button
              onClick={classify}
              disabled={loading || !text.trim()}
              style={{
                marginLeft: "auto",
                background: loading || !text.trim() ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
                color: loading || !text.trim() ? "#334155" : "#0f172a",
                border: "none",
                borderRadius: 10,
                padding: "9px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                letterSpacing: "-0.1px",
              }}
            >
              {loading ? "Classifying…" : "Classify →"}
            </button>
          </div>
        </div>

        {/* Example chips — neutral */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            More examples
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setText(ex.text); setResult(null); setError(null); textareaRef.current?.focus(); }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "#64748B",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "6px 12px",
                  cursor: "pointer",
                  maxWidth: 260,
                  transition: "all 0.15s",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#94A3B8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#64748B"; }}
              >
                {ex.text.slice(0, 46)}…
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 20,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#FCA5A5",
            fontSize: 13,
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {result && <ResultCard result={result} />}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        textarea::placeholder { color: #334155; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}
