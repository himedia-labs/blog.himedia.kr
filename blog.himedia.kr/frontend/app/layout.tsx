import QueryProvider from './provider/QueryProvider';

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
          <div className="layout">{children}</div>
        </QueryProvider>
      </body>
    </html>
  );
}
