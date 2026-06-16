const COLORS = {
  analysis: { fill: "#3B82F6", text: "#93C5FD" },
  hot_take: { fill: "#EF4444", text: "#FCA5A5" },
  reaction: { fill: "#F59E0B", text: "#FCD34D" },
};

export default function ConfidenceBar({ label, score, isTop }) {
  const c = COLORS[label] ?? { fill: "#64748B", text: "#94A3B8" };
  const pct = Math.round(score * 100);
  const barPct = Math.min(pct, 100);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{
          fontWeight: isTop ? 700 : 500,
          color: isTop ? c.text : "#475569",
          textTransform: "capitalize",
          letterSpacing: "0.01em",
        }}>
          {label.replace("_", " ")}
        </span>
        <span style={{ fontWeight: isTop ? 700 : 400, color: isTop ? c.text : "#475569", fontSize: 13 }}>
          {pct}%
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{
          width: `${barPct}%`,
          height: "100%",
          background: isTop ? c.fill : "rgba(255,255,255,0.15)",
          borderRadius: 99,
          transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: isTop ? `0 0 8px ${c.fill}99` : "none",
        }} />
      </div>
    </div>
  );
}
