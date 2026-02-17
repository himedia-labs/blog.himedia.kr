import { cookies } from 'next/headers';

import Footer from '@/app/shared/components/footer/Footer';
import Header from '@/app/shared/components/header/Header';
import ToastProvider from '@/app/shared/components/toast/ToastProvider';
import ScrollTopButton from '@/app/shared/components/scroll-top/ScrollTopButton';
import { notoSansKr } from '@/app/shared/styles/fonts';

import QueryProvider from '@/app/provider/ReactQuery/QueryProvider';
import AuthInitializer from '@/app/provider/AuthProvider/AuthInitializer';

import './globals.css';
import './reset.css';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * header 초기 렌더
   * @description 로그인 후 새로고침 시 `로그인 전 아이콘`으로 보이는 현상을 막기 위함 입니다.
   */
  const cookieStore = await cookies();
  const initialIsLoggedIn = cookieStore.has('refreshToken');

  return (
    <html lang="ko">
      <body className={notoSansKr.variable}>
        <QueryProvider>
          <AuthInitializer />
          <ToastProvider>
            <Header initialIsLoggedIn={initialIsLoggedIn} />
            <div className="layout">{children}</div>
            <Footer />
            <ScrollTopButton />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
