/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      colors: {
        green: {
          400: "#4ade80", 500: "#22c55e", 600: "#16a34a",
        },
        zinc: {
          850: "#1f1f23",
          925: "#111114",
        },
      },
    },
  },
  plugins: [],
};
