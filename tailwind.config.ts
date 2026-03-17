import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: "#0D1117",
        gold: "#C8A96E",
        "gold-text": "#E8D8A8",
        "text-1": "#E2E4EA",
        "text-2": "#8B909C",
        "text-3": "#4A5060",
        "status-green": "#3EB489",
        "status-amber": "#C9933A",
        "status-red": "#B85555",
      },
      fontFamily: {
        serif: ["EB Garamond", "Georgia", "serif"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      backdropBlur: {
        glass: "20px",
      },
      transitionDuration: {
        "380": "380ms",
        "480": "480ms",
        "900": "900ms",
      },
      transitionTimingFunction: {
        settle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      animation: {
        "cosmic-drift": "cosmicDrift 90s linear infinite",
        "pulse-dot": "pulseDot 2.5s ease-in-out infinite",
        "card-enter": "cardEnter 380ms ease-out",
      },
      keyframes: {
        cosmicDrift: {
          "0%": { transform: "translateX(0) translateY(0)" },
          "25%": { transform: "translateX(-8px) translateY(-4px)" },
          "50%": { transform: "translateX(-12px) translateY(6px)" },
          "75%": { transform: "translateX(-4px) translateY(10px)" },
          "100%": { transform: "translateX(0) translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        cardEnter: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
