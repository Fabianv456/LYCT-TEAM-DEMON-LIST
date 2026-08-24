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
          950: "var(--base-950)",
          900: "var(--base-900)",
          800: "var(--base-800)",
          700: "var(--base-700)",
          600: "var(--base-600)",
        },
        accent: {
          blue: "var(--accent-blue)",
          cyan: "var(--accent-cyan)",
        },
        "accent-red": "var(--accent-red)",
        "accent-emerald": "var(--accent-emerald)",
        "accent-yellow": "var(--accent-yellow)",
        "accent-orange": "var(--accent-orange)",
        "accent-purple": "var(--accent-purple)",
        white: "var(--text-primary)",
        black: "var(--base-950)",
        zinc: {
          50: "var(--base-950)",
          100: "var(--base-900)",
          200: "var(--base-800)",
          300: "var(--base-700)",
          400: "var(--base-600)",
          500: "var(--text-muted)",
          600: "var(--text-secondary)",
          700: "var(--base-700)",
          800: "var(--base-800)",
          900: "var(--text-primary)",
          950: "var(--base-950)",
        },
        slate: {
          400: "var(--text-muted)",
          500: "var(--text-muted)",
          600: "var(--text-secondary)",
          900: "var(--text-primary)",
        },
        emerald: {
          400: "var(--accent-emerald)",
          500: "var(--accent-emerald)",
          600: "var(--accent-emerald)",
        },
        yellow: {
          400: "var(--accent-yellow)",
          500: "var(--accent-yellow)",
        },
        orange: {
          400: "var(--accent-orange)",
          500: "var(--accent-orange)",
        },
        red: {
          400: "var(--accent-red)",
          500: "var(--accent-red)",
          600: "var(--accent-red)",
        },
        purple: {
          400: "var(--accent-purple)",
          500: "var(--accent-purple)",
        },
      },
      fontFamily: {
        display: ["'Rubik'", "sans-serif"],
      },
      boxShadow: {
        glow: "var(--glow)",
        glowRed: "var(--glow-red)",
      },
      backgroundImage: {
        "accent-gradient": "var(--accent-gradient)",
      },
    },
  },
  plugins: [],
};
