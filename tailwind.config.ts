import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sal: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",  // accent
          500: "#0ea5e9",  // primary
          600: "#0284c7",
          700: "#0369a1",  // primary-dark
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",  // primary-deep (nav/hero bg)
        },
        gold: {
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#f59e0b",
          600: "#D97706",
        },
        ink: {
          900: "#0c1a2e",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          400: "#94a3b8",
        },
        // backward compat
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          300: "#0ea5e9",
          400: "#0369a1",
          500: "#075985",
        },
      },
      fontFamily: {
        tajawal: ["Tajawal", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    }
  },
  plugins: []
};

export default config;
