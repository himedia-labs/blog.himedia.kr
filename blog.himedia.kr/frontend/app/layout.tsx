import { cookies } from 'next/headers';
import QueryProvider from './provider/ReactQuery/QueryProvider';
import ClientProvider from './provider/ClientProvider/ClientProvider';
import Header from './shared/components/header/Header';
import Footer from './shared/components/footer/Footer';
import ToastProvider from './shared/components/toast/toast';
import ScrollTopButton from './shared/components/scroll-top/ScrollTopButton';

import './globals.css';
import './reset.css';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 서버에서 refreshToken 쿠키 확인
  const cookieStore = await cookies();
  const initialIsLoggedIn = cookieStore.has('refreshToken');

  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <ClientProvider>
            <ToastProvider>
              <Header initialIsLoggedIn={initialIsLoggedIn} />
              <div className="layout">{children}</div>
              <Footer />
              <ScrollTopButton />
            </ToastProvider>
          </ClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
