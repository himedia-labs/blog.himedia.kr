import localFont from 'next/font/local';

export const notoSansKr = localFont({
  display: 'swap',
  preload: true,
  src: [
    {
      path: '../shared/fonts/NotoSansKR-VariableFont_wght.ttf',
      style: 'normal',
      weight: '100 900',
    },
  ],
  variable: '--font-sans',
});
