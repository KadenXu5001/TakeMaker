const COLORS = {
  analysis: "59, 130, 246",
  hot_take: "239, 68, 68",
  reaction: "245, 158, 11",
};

const ANIM = ["bubbleA", "bubbleB", "bubbleC"];

const BUBBLES = [
  { label: "analysis", x: 10,  y: 20,  size: 420, anim: 0, duration: 18 },
  { label: "analysis", x: 60,  y: 60,  size: 300, anim: 1, duration: 22 },
  { label: "analysis", x: 30,  y: 85,  size: 360, anim: 2, duration: 20 },
  { label: "analysis", x: 75,  y: 40,  size: 250, anim: 0, duration: 26 },
  { label: "analysis", x: 48,  y: 72,  size: 200, anim: 2, duration: 15 },
  { label: "hot_take", x: 80,  y: 10,  size: 380, anim: 1, duration: 21 },
  { label: "hot_take", x: 20,  y: 65,  size: 340, anim: 2, duration: 19 },
  { label: "hot_take", x: 55,  y: 35,  size: 260, anim: 0, duration: 24 },
  { label: "hot_take", x: 92,  y: 55,  size: 220, anim: 2, duration: 16 },
  { label: "hot_take", x: 38,  y: 10,  size: 180, anim: 1, duration: 28 },
  { label: "reaction", x: 45,  y: 15,  size: 310, anim: 2, duration: 20 },
  { label: "reaction", x: 85,  y: 75,  size: 350, anim: 0, duration: 17 },
  { label: "reaction", x: 5,   y: 50,  size: 390, anim: 1, duration: 23 },
  { label: "reaction", x: 68,  y: 90,  size: 230, anim: 0, duration: 25 },
  { label: "reaction", x: 22,  y: 32,  size: 190, anim: 2, duration: 14 },
  { label: "analysis", x: 3,   y: 78,  size: 160, anim: 1, duration: 19 },
  { label: "hot_take", x: 65,  y: 18,  size: 170, anim: 0, duration: 22 },
  { label: "reaction", x: 50,  y: 50,  size: 140, anim: 1, duration: 27 },
];

export default function BubbleBackground({ scores }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}>
      {BUBBLES.map((b, i) => {
        const score = scores ? Math.min(scores[b.label] ?? 0, 1) : 0;
        const opacity = score * 0.55;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${COLORS[b.label]}, 0.85) 0%, rgba(${COLORS[b.label]}, 0) 70%)`,
              filter: "blur(55px)",
              opacity,
              transition: "opacity 1s ease",
              animation: `${ANIM[b.anim]} ${b.duration}s ease-in-out infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
