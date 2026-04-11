/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#15aa9a",
          light: "#3fc3b5",
          dark: "#0e7c72",
        },
        secondary: {
          DEFAULT: "#e4f3fa",
          dark: "#cde7f2",
        },
      },
    },
  },
  plugins: [],
};
