import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        meaven: {
          blue: "#36668d",
          hover: "#2a5273",
          light: "#497ea8",
          glow: "rgba(54, 102, 141, 0.2)",
          border: "rgba(54, 102, 141, 0.35)",
        },
        cockpit: {
          bg: "#080b11",
          surface: "#0e131f",
          card: "#121929",
          hover: "#182236",
          border: "#1c263b",
          borderMuted: "#161e30",
          text: "#f1f5f9",
          muted: "#94a3b8",
          subtle: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "glow-meaven": "0 0 20px -5px rgba(54, 102, 141, 0.35)",
        "cockpit-card": "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
