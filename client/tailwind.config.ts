import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FDDCAB',
          300: '#FFC478',
          400: '#FFA43C',
          500: '#F07D1A',
          600: '#D66A10',
          700: '#B3520D',
          800: '#8C3F0A',
          900: '#6B3008',
        },
        gold: {
          300: '#FFD666',
          400: '#FFC21A',
          500: '#E5A800',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#FFFAF3',
        },
        muted: '#7A6E62',
        border: {
          DEFAULT: '#EDE5DA',
          strong: '#D4C9BB',
        },
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(31,23,16,0.06)',
        md: '0 4px 12px rgba(31,23,16,0.08)',
        lg: '0 8px 24px rgba(31,23,16,0.1)',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
