// Los morados salen de variables CSS (src/index.css). Fuera del perfil
// profesor valen lo mismo que los de Tailwind; dentro, purple y violet son una
// sola paleta con el tono del menú lateral (pedido del usuario, 2026-11-05).
const TONOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const desdeVariables = (familia) =>
  Object.fromEntries(TONOS.map((tono) => [tono, `rgb(var(--${familia}-${tono}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: desdeVariables("purple"),
        violet: desdeVariables("violet"),
      },
    },
  },
  plugins: [],
}
