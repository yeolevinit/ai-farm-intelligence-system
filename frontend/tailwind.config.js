/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            fontFamily: {
                display: ['Syne', 'sans-serif'],
                body: ['DM Sans', 'sans-serif'],
            },
            colors: {
                farm: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#14532d',
                    900: '#052e16',
                }
            },
            borderRadius: {
                'xl2': '22px',
            },
            backdropBlur: {
                xs: '4px',
            },
            animation: {
                'pulse-dot': 'pulse-dot 2.5s ease-in-out infinite',
            },
            keyframes: {
                'pulse-dot': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.4)', opacity: '0.7' },
                }
            }
        },
    },
    plugins: [],
}