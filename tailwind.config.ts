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
          50:  "#FAF7F2",  // warm background
          100: "#E8F5F4",  // very light teal
          200: "#C4E8E5",
          300: "#7DCEC9",
          400: "#16A394",  // primary light
          500: "#0F5C56",  // primary dark
          600: "#0D4F4A",
          700: "#0A4440",  // primary-dark
          800: "#073530",
          900: "#052825",
          950: "#031A17",  // deep dark (nav/footer bg)
        },
        coral: {
          300: "#FFB09D",
          400: "#FF8A6A",
          500: "#FF6B4A",  // CTA / action
          600: "#E05030",
          700: "#C04020",
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
          50:  "#FAF7F2",
          100: "#E8F5F4",
          300: "#16A394",
          400: "#0F5C56",
          500: "#073530",
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
