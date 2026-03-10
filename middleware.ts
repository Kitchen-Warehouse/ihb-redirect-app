import { NextRequest, NextResponse } from 'next/server';
import exactMap from './redirect-map.json';

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, '');
}

export default function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = normalizePath(url.pathname);

  // Skip redirect processing for Next.js internals and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Don't skip files with extensions - we want to process .html files
  if (pathname.includes('.') && !pathname.endsWith('.html')) {
    return NextResponse.next();
  }

  /* 1️⃣ Exact match */
  const exact = (exactMap as Record<string, string>)[pathname];

  if (exact && exact !== pathname) {
    const normalizedExact = normalizePath(exact);
    // Double-check to prevent identical redirects
    console.log('Redirecting:', url);
    if (normalizedExact !== pathname) {
      // Check if the redirect URL is absolute (contains domain) or relative
      const redirectUrl = exact.startsWith('http') ? exact : `https://${exact}`;
      return NextResponse.redirect(
        redirectUrl,
        301
      );
    }
  }

  /* 2️⃣ .html stripping */
  if (pathname.endsWith('.html')) {
    const stripped = pathname.replace(/\.html$/, '');
    const htmlMatch =
      (exactMap as Record<string, string>)[stripped];

    if (htmlMatch && htmlMatch !== pathname) {
      const normalizedHtmlMatch = normalizePath(htmlMatch);
      // Prevent redirect loops
      if (normalizedHtmlMatch !== pathname && normalizedHtmlMatch !== stripped) {
        // Check if the redirect URL is absolute (contains domain) or relative
        const redirectUrl = htmlMatch.startsWith('http') ? htmlMatch : `https://${htmlMatch}`;
        return NextResponse.redirect(
          redirectUrl,
          301
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};