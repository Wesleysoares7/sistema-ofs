/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f7efe3",
          100: "#efe2cf",
          200: "#e2ccb0",
          300: "#d2b18b",
          400: "#c1976a",
          500: "#aa7a4c",
          600: "#8f613a",
          700: "#734a2d",
          800: "#583722",
          900: "#3d2617",
        },
      },
    },
  },
  plugins: [],
};
