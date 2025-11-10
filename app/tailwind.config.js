/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"], // habilita dark mode por classe
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
