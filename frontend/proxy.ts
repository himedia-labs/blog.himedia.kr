// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// const PRIVATE_PATHS = ['/mypage', '/posts/new', '/posts/drafts'];

// export function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const isPrivateRoute = PRIVATE_PATHS.some(path => pathname.startsWith(path));

//   if (!isPrivateRoute) {
//     return NextResponse.next();
//   }

//   if (request.cookies.has('refreshToken')) {
//     return NextResponse.next();
//   }

//   const loginUrl = request.nextUrl.clone();
//   loginUrl.pathname = '/login';
//   loginUrl.searchParams.set('reason', 'auth');
//   loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);

//   return NextResponse.redirect(loginUrl);
// }

// export const config = {
//   matcher: ['/mypage/:path*', '/posts/new/:path*', '/posts/drafts/:path*'],
// };
