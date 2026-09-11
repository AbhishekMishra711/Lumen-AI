import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    colors: {
      "lumen-yellow": "#FFCC00",
      "lumen-black": "#000000",
      white: "#FFFFFF",
      black: "#000000",
    },
    fontFamily: {
      "press-start": ["var(--font-press-start-2p)", "cursive"],
      mono: ["var(--font-space-mono)", "monospace"],
      sans: ["var(--font-space-mono)", "monospace"],
    },
    boxShadow: {
      brutalist: "4px 4px 0px 0px rgba(0, 0, 0, 1)",
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
    extend: {
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        blink: "blink 1s infinite",
      },
      backgroundImage: {
        "dot-pattern": "radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px)",
      },
      backgroundSize: {
        "dot-pattern": "20px 20px",
      },
    },
  },
  plugins: [],
};

export default config;
