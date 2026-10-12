import { NextResponse } from 'next/server';

const protectedRoutes = ['/chat', '/dashboard', '/profile'];
const publicRoutes = ['/login', '/signup'];


export function proxy(request:any) {
  const token = request.cookies.get('jwt')?.value;
  const { pathname } = request.nextUrl;
  const isBaseUrl = pathname === '/'; // 👈 Check if user is at the root domain
  
  // 1. Base URL Logic
  if (isBaseUrl) {
    if (token) {
      return NextResponse.redirect(new URL('/chat', request.url)); // Logged in -> Chat
    } else {
      return NextResponse.redirect(new URL('/login', request.url)); // Logged out -> Login
    }
  }

  // 2. Protected Routes Logic
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

   // trying to access public after being logged in
  if(isPublicRoute && token){
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }



  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};