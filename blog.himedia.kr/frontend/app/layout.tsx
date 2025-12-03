import LayoutContent from './shared/layout/LayoutContent';
import QueryProvider from './provider/ReactQuery/QueryProvider';

import './globals.css';
import './reset.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <LayoutContent>{children}</LayoutContent>
        </QueryProvider>
      </body>
    </html>
  );
}
