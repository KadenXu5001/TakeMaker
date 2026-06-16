import ConfidenceBar from "./ConfidenceBar.jsx";

const LABEL_META = {
  analysis: {
    emoji: "📊",
    label: "Analysis",
    description: "Structured argument backed by stats or historical comparison.",
    accent: "#3B82F6",
    glow: "rgba(59, 130, 246, 0.25)",
  },
  hot_take: {
    emoji: "🔥",
    label: "Hot Take",
    description: "Bold opinion stated without supporting evidence.",
    accent: "#EF4444",
    glow: "rgba(239, 68, 68, 0.25)",
  },
  reaction: {
    emoji: "😱",
    label: "Reaction",
    description: "Immediate emotional response to a game or event.",
    accent: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.25)",
  },
};

export default function ResultCard({ result }) {
  const { label, confidence, scores } = result;
  const meta = LABEL_META[label] ?? {
    emoji: "❓", label, description: "", accent: "#64748B", glow: "rgba(100,116,139,0.2)",
  };
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const pct = Math.round(confidence * 100);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid rgba(255,255,255,0.1)`,
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 24,
      boxShadow: `0 0 40px ${meta.glow}, 0 4px 24px rgba(0,0,0,0.4)`,
      animation: "slideUp 0.35s cubic-bezier(0.34, 1.3, 0.64, 1)",
    }}>
      <div style={{ height: 3, background: meta.accent, boxShadow: `0 0 12px ${meta.accent}` }} />

      <div style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `rgba(255,255,255,0.06)`,
            border: `1px solid rgba(255,255,255,0.08)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            flexShrink: 0,
          }}>
            {meta.emoji}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{meta.label}</span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: meta.accent,
                background: `rgba(255,255,255,0.06)`,
                border: `1px solid ${meta.accent}44`,
                padding: "3px 10px",
                borderRadius: 99,
                letterSpacing: "0.03em",
              }}>
                {pct}% confident
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>
              {meta.description}
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

        <p style={{ fontSize: 11, fontWeight: 600, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
          All scores
        </p>
        {sortedScores.map(([lbl, score]) => (
          <ConfidenceBar key={lbl} label={lbl} score={score} isTop={lbl === label} />
        ))}
      </div>
    </div>
  );
}
