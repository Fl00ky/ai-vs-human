import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          green: "var(--matrix-green)",
          dark: "var(--matrix-dark)",
        },
        ai: {
          red: "var(--ai-red)",
          deep: "var(--ai-deep)",
        },
        human: {
          blue: "var(--human-blue)",
          deep: "var(--human-deep)",
        },
        side: {
          DEFAULT: "var(--side-color)",
          glow: "var(--side-glow)",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-display)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "flicker": "flicker 2s linear infinite",
        "glitch": "glitch 1.5s steps(1) infinite",
        "scan": "scan 4s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "41.99%": { opacity: "1" },
          "42%": { opacity: "0.6" },
          "43%": { opacity: "1" },
          "47.99%": { opacity: "1" },
          "48%": { opacity: "0.8" },
          "49%": { opacity: "1" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 1px)" },
          "40%": { transform: "translate(-1px, -2px)" },
          "60%": { transform: "translate(2px, 1px)" },
          "80%": { transform: "translate(1px, -1px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
