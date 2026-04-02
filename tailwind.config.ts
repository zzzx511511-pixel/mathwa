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
        // Extracted palette from provided docs.
        brand: {
          50: "#F5EDD8", // warm paper
          100: "#F0F7F0", // soft background
          300: "#2E74B5", // primary blue
          400: "#1F4D78", // deep blue
          500: "#0563C1" // accent blue
        },
        gold: {
          400: "#B8860B",
          500: "#E8C96A"
        },
        ink: {
          900: "#2C1F14",
          800: "#3D2B1F"
        },
        sage: {
          DEFAULT: "#2D7A55"
        }
      }
    }
  },
  plugins: []
};

export default config;
