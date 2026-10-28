/**
 * 人生地图 5.2 — Tailwind 主题
 *
 * 颜色按语义命名，而不是按色相命名：
 *   五行本色  water / wood / fire / earth / metal —— 图表与标签可直接对应五行
 *   命盘      ziwei —— 紫微星曜体系
 *   场        field —— 关系引力场
 *   主强调    gold —— 土金，命盘与关键读数
 *   中性      ink（表面）/ mist（文字）
 */
const INK = {
  900: '#08090b',
  850: '#0c0e11',
  800: '#111418',
  700: '#181c21',
  600: '#22272e',
  500: '#2e343c',
  400: '#3d444d',
}

const MIST = {
  500: '#5f6874',
  400: '#7d8794',
  300: '#a2adb9',
  200: '#c8d1da',
  100: '#e9eef3',
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}',
        './*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                ink: INK,
                mist: MIST,
                gold: {
                    DEFAULT: '#d9bb84',
                    bright: '#f0dcb4',
                    dim: 'rgba(217,187,132,0.32)',
                    soft: 'rgba(217,187,132,0.10)',
                },
                // 五行本色
                water: '#5b8ff0',
                wood: '#3fb98f',
                fire: '#e2604f',
                earth: '#c9a86a',
                metal: '#c8d2de',
                // 命盘 / 场
                ziwei: '#9d8cf0',
                field: '#45b8c9',
            },
            fontFamily: {
                display: ['"Noto Serif SC"', 'Songti SC', 'serif'],
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
                mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'monospace'],
            },
            borderRadius: {
                card: '18px',
                inset: '12px',
            },
            boxShadow: {
                1: '0 1px 2px rgba(0,0,0,0.4)',
                2: '0 8px 28px rgba(0,0,0,0.38), 0 1px 2px rgba(0,0,0,0.3)',
                3: '0 18px 56px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35)',
            },
            transitionTimingFunction: {
                out: 'cubic-bezier(0.16, 1, 0.3, 1)',
                spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            transitionDuration: {
                1: '140ms',
                2: '260ms',
                3: '520ms',
            },
        },
    },
    plugins: [],
}
