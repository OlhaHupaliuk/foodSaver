/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10B981", // зелений для екологічної тематики
          dark: "#059669",
          light: "#34D399",
        },
        secondary: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          light: "#FBBF24",
        },
      },
    },
  },
  plugins: [],
};
