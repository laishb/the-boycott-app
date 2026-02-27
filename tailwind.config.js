/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],   // 15px at 20px base
        sm: ['0.875rem', { lineHeight: '1.5' }],  // 17.5px
        base: ['1rem', { lineHeight: '1.6' }],    // 20px
      },
      lineHeight: {
        relaxed: '1.6',
      },
    },
  },
  plugins: [],
}
