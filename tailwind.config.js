/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--background)',
        'background-high-1': 'var(--background-high-1)',
        'background-high-2': 'var(--background-high-2)',
        'background-low-1': 'var(--background-low-1)',
        'background-low-2': 'var(--background-low-2)',
        'foreground': 'var(--foreground)',
        'foreground-high-1': 'var(--foreground-high-1)',
        'foreground-high-2': 'var(--foreground-high-2)',
        'foreground-low-1': 'var(--foreground-low-1)',
        'foreground-low-2': 'var(--foreground-low-2)',
        'backdrop': 'var(--backdrop)',
        'warn': 'var(--warn)',
        'danger': 'var(--danger)',
        'success': 'var(--success)',
        'info': 'var(--info)',
        'black': '#000000',
        'white': '#ffffff',
        'grey': '#777777',
      },
      // fontFamily: {
      //   'sans': ['Roboto', ...defaultTheme.fontFamily.sans],
      // },
    }
  },
  plugins: [],
}

