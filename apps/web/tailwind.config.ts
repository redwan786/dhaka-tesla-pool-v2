import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14231d',
        leaf: '#177245',
        mint: '#a9dfb5',
        paper: '#f5f7f1',
        sand: '#e7dfcf',
        signal: '#efb33d',
      },
      boxShadow: {
        card: '0 22px 60px rgba(20, 35, 29, 0.10)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
