/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Pastel Palette
        pastel: {
          peach: '#F7CBCA',
          beige: '#D0D3D4',
          white: '#F1F7F7',
          mistBlue: '#D5E6E5',
          mint: '#8DD7D8',
          slate: '#5D6B6B',
        },
        // Semantic Colors (Muted)
        semantic: {
          success: '#8DD7D8',
          successLight: '#C9ECEC',
          warning: '#E8C9A0',
          warningLight: '#F5E6D3',
          error: '#E8A0A0',
          errorLight: '#F5D5D5',
          info: '#A0C4E8',
          infoLight: '#D5E5F5',
        },
        // Priority Colors
        priority: {
          high: '#E8A0A0',
          medium: '#E8C9A0',
          low: '#8DD7D8',
        },
        // Background Colors
        bg: {
          primary: '#F1F7F7',
          secondary: '#E8F0F0',
          card: '#FFFFFF',
        },
        // Text Colors
        txt: {
          primary: '#5D6B6B',
          secondary: 'rgba(93, 107, 107, 0.7)',
          muted: 'rgba(93, 107, 107, 0.5)',
        },
        // Primary Mint Scale
        primary: {
          50: '#E8F5F5',
          100: '#D5ECEC',
          200: '#C0E3E3',
          300: '#A8D9D9',
          400: '#8DD7D8',
          500: '#6EC5C6',
          600: '#55B3B4',
          700: '#3F9FA0',
          800: '#2E8586',
          900: '#1F6B6C',
        },
        // Accent Peach Scale
        accent: {
          50: '#FEF5F5',
          100: '#FCE8E8',
          200: '#F9D5D4',
          300: '#F7CBCA',
          400: '#F0B5B4',
          500: '#E89E9D',
          600: '#D98887',
        },
        // Neutral Scale (Slate-based)
        dark: {
          50: '#F1F7F7',
          100: '#E8F0F0',
          200: '#D5E6E5',
          300: '#D0D3D4',
          400: '#9BA8A8',
          500: '#7A8989',
          600: '#5D6B6B',
          700: '#4D5858',
          800: '#3D4545',
          900: '#2D3333',
          950: '#1D2222',
        },
      },
      borderRadius: {
        'soft': '16px',
        'softer': '20px',
        'neumorphic': '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(93, 107, 107, 0.08)',
        'medium': '0 4px 12px rgba(93, 107, 107, 0.1)',
        'card': '0 4px 12px rgba(184, 197, 197, 0.15)',
        'neumorphic': '-4px -4px 8px rgba(255, 255, 255, 0.7), 4px 4px 12px rgba(197, 208, 208, 0.25)',
      },
      spacing: {
        'section': '40px',
      },
    },
  },
  plugins: [],
}
