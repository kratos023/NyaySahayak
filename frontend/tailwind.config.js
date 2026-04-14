/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["'Sora'", "sans-serif"],
        display: ["'Cormorant Garamond'", "serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        gold: { DEFAULT: "#c9920a", light: "#f0b429", dim: "rgba(201,146,10,0.15)" },
      },
      animation: {
        "fade-up":  "fadeUp 0.35s ease forwards",
        "fade-in":  "fadeIn 0.25s ease forwards",
        "scale-in": "scaleIn 0.25s ease forwards",
        "pulse2":   "pulse2 2.5s ease infinite",
      },
      keyframes: {
        fadeUp:   { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        fadeIn:   { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        scaleIn:  { "0%": { opacity: 0, transform: "scale(0.96)" }, "100%": { opacity: 1, transform: "scale(1)" } },
        pulse2:   { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } },
      },
    },
  },
  plugins: [],
}
