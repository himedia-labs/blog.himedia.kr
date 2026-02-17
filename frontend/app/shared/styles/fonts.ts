import localFont from 'next/font/local';

export const notoSansKr = localFont({
  src: [
    {
      path: '../fonts/NotoSansKR-VariableFont_wght.ttf',
      style: 'normal',
      weight: '100 900',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['Apple SD Gothic Neo', 'Malgun Gothic', 'Segoe UI', 'sans-serif'],
});
