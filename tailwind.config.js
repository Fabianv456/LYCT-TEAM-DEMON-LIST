/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        accent: {
          blue: "#3b82f6",
          cyan: "#22d3ee",
        },
      },
      fontFamily: {
        display: ["'Rubik'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(59, 130, 246, 0.25)",
        glowRed: "0 0 25px rgba(239, 45, 86, 0.25)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%)",
      },
    },
  },
  plugins: [],
};
