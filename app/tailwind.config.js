/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}", // opcional
    "./app/**/*.{ts,tsx,js,jsx}",        // opcional
    "./pages/**/*.{ts,tsx,js,jsx}"       // opcional
  ],
  theme: {
    extend: {
      
    },
  },
  plugins: [
    
  ],
};
