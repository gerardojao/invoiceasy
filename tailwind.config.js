// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   // 1. Contenido: Dónde buscar las clases de Tailwind
//   content: [
//     "./src/**/*.{html,js,jsx,ts,tsx}", // Ejemplo para archivos en "src"
//     "./public/index.html",
//   ],
  
//   // 2. Modo oscuro: Cómo manejar la interfaz de modo oscuro
//   darkMode: 'media', // o 'class' para alternar manualmente
  
//   // 3. Tema: Personalización de estilos (colores, fuentes, espaciados)
//   theme: {
//     extend: {
//       // Aquí extiendes el tema por defecto de Tailwind.
//       // Puedes añadir nuevos colores, fuentes, etc. sin eliminar los existentes.
//       colors: {
//         'custom-blue': '#1da1f2',
//         'primary': 'rgb(249 115 22)', // Ejemplo de un color personalizado
//       },
//       spacing: {
//         '128': '32rem', // Ejemplo de un nuevo valor de espaciado
//       },
//     },
//     // Si defines propiedades directamente aquí (sin 'extend'),
//     // *reemplazarás* completamente los valores por defecto de Tailwind.
//   },
  
//   // 4. Plugins: Funcionalidades adicionales o librerías de componentes
//   plugins: [
//     // require('@tailwindcss/forms'), // Ejemplo de un plugin
//   ],
// }
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};

