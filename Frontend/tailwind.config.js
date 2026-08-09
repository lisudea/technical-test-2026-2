/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1615",
        panel: "#101f1e",
        panel2: "#132725",
        border: "#1e3735",
        teal: { DEFAULT: "#4fd1c5", dim: "#2c6e66" },
        amber: "#f5a623",
        rose: "#ef5b5b",
        okgreen: "#3ddc84",
        textdim: "#7fa39c",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
