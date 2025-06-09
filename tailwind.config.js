/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "#F7B54F",
        primary: "#3E97FF",
        "primary-light": "#E1F0FF",
        "primary-2": "#18c553",
        success: "#1BC5BD",
        "success-light": "#C9F7F5",
        warning: "#FFA800",
        "warning-light": "#FFF4DE",
        danger: "#f1416c",
        "danger-light": "#FFE2E5",
        light: "#F9F9F9",
        muted: "#B5B5C3",
        info: "#8950FC",
        gray: {
          200: '#ebedf3',
          700: "#4B5675"
        }
      },
      fontFamily: {
        'sans': ['Be Vietnam Pro', 'sans-serif'],
        'lato': ['Lato','Be Vietnam Pro', 'sans-serif'],
      },
      fontSize: {
        input: ['15px', '20px']
      },
      boxShadow: {
        lg: '0px 0px 50px 0px rgba(82, 63, 105, 0.15)',
        sm: '0px 0px 20px 0px rgba(76, 87, 125, 0.02)',
        '3xl': 'rgba(0, 0, 0, 0.16) 0px 3px 6px',
        'input': '0 4px 6px 0 rgba(16,25,40,.06)'
      },
      padding: {
        "safe-t": "var(--ezs-safe-area-top, 0px)",
        "safe-b": "var(--ezs-safe-area-bottom, 0px)",
      },
      height: {
        'toolbar': '50px',
        'navbar': '48px'
      },
      animation: {
        'ezs-fadeIn': 'fadeIn .3s ease-in',
      },
      keyframes: {
        fadeIn: {
          "from": {
            opacity: 0
          },
          "to": {
            opacity: 1
          }
        }
      }
    },

  },
  plugins: [
    function ({
      addVariant
    }) {
      addVariant('child', '& > *');
      addVariant('child-hover', '& > *:hover');
    },
    // require('@tailwindcss/line-clamp')
  ]
}