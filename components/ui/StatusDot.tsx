"use client";

type StatusColor = "green" | "amber" | "red";

const COLORS: Record<StatusColor, string> = {
  green: "#3EB489",
  amber: "#C9933A",
  red: "#B85555",
};

export default function StatusDot({ color = "green" }: { color?: StatusColor }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        backgroundColor: COLORS[color],
        animation: "pulseDot 2.5s ease-in-out infinite",
      }}
    />
  );
}
