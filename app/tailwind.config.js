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
      // personalize aqui (cores, fontes, etc.) se quiser
    },
  },
  plugins: [
    // require("tailwindcss-animate"), // descomente se usar shadcn/ui animations
  ],
};
