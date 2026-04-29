import { NextResponse, type NextRequest } from 'next/server';

// Auth protection desactivada hasta tener UI de login completa.
// Re-activar cuando /login esté implementado.
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/spark/:path*', '/api/spark/:path*'],
};
