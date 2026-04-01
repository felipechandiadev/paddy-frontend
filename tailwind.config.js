/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/providers/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        success: 'var(--color-success)',
        info: 'var(--color-info)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        neutral: 'var(--color-neutral)',
      },
      fontFamily: {
        sans: ['Inter', 'System UI', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
