/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surf: {
          teal: "#16c38a",
          green: "#0b6f4b",
          sand: "#ffb85c",
          light: "#f5f7fa"
        }
      }
    }
  },
  plugins: []
};
