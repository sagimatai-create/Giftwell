/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Baloo 2'", "sans-serif"],
        body: ["Quicksand", "sans-serif"],
      },
      colors: {
        lilac: { DEFAULT: "#E4DEF7", ring: "#B9A8F0", text: "#5A4A8C" },
        cotton: { DEFAULT: "#FBE0EA", ring: "#F5A8C4", text: "#8C4A66" },
        mint: { DEFAULT: "#DAF3E6", ring: "#8FD9B3", text: "#2E7A56" },
        butter: { DEFAULT: "#FFF1BF", ring: "#F0D06A", text: "#8C6E1F" },
        sky: { DEFAULT: "#D9EEFB", ring: "#9AC9EE", text: "#2E5F8C" },
        ink: "#4A3D5C",
        muted: "#9186A3",
        coral: "#FF7A9C",
      },
    },
  },
  plugins: [],
};
