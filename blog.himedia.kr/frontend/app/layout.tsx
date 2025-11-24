'use client';

import { usePathname } from 'next/navigation';

import QueryProvider from './provider/ReactQuery/QueryProvider';

import './globals.css';
import './reset.css';
import Header from './shared/components/header/Header';
import Footer from './shared/components/footer/Footer';
import ScrollTopButton from './shared/components/scroll-top/ScrollTopButton';
import ToastProvider from './shared/components/toast/ToastProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Header를 숨길 경로들
  const hideHeaderPaths = [''];
  const hideHeader = hideHeaderPaths.includes(pathname);

  // Footer를 숨길 경로들
  const hideFooterPaths = [''];
  const hideFooter = hideFooterPaths.includes(pathname);

  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <ToastProvider>
            {!hideHeader && <Header />}
            <div className="layout">{children}</div>
            {!hideFooter && <Footer />}
            {!hideFooter && <ScrollTopButton />}
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
