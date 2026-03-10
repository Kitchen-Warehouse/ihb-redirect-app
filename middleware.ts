import { NextRequest, NextResponse } from 'next/server';
import redirectMap from './redirect-map.json';

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, '');
}

export default function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = normalizePath(url.pathname);

  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (pathname.includes('.') && !pathname.endsWith('.html')) {
    return NextResponse.next();
  }

  const hostname = req.headers.get('host')?.replace(/:\d+$/, '') ?? '';
  const hostMap = (redirectMap as unknown as Record<string, Record<string, string>>)[hostname];

  if (!hostMap) {
    return NextResponse.next();
  }

  /* 1️⃣ Exact match */
  const exact = hostMap[pathname];

  if (exact) {
    const redirectUrl = exact.startsWith('http') ? exact : `https://${exact}`;
    console.log('Redirecting:', url.toString(), '->', redirectUrl);
    return NextResponse.redirect(redirectUrl, 301);
  }

  /* 2️⃣ .html stripping */
  if (pathname.endsWith('.html')) {
    const stripped = pathname.replace(/\.html$/, '');
    const htmlMatch = hostMap[stripped];

    if (htmlMatch) {
      const redirectUrl = htmlMatch.startsWith('http') ? htmlMatch : `https://${htmlMatch}`;
      console.log('Redirecting:', url.toString(), '->', redirectUrl);
      return NextResponse.redirect(redirectUrl, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
