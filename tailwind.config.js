/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8faf8",
          100: "#eef2ef",
          200: "#d9e1dc",
          300: "#bac8c0",
          400: "#8ca398",
          500: "#5e7e6f",
          600: "#3e5b4d",
          700: "#2b4137",
          800: "#1e2e27",
          900: "#141e19"
        }
      },
      boxShadow: {
        soft: "0 18px 40px rgba(2, 6, 23, 0.35)"
      }
    }
  },
  plugins: []
};
