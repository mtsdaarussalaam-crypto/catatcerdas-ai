import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth exchange error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    // Optional check: restrict to @gmail.com if configured
    if (process.env.NEXT_PUBLIC_RESTRICT_GMAIL_ONLY === 'true') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && !user.email.endsWith('@gmail.com')) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(
              'Akses dibatasi. Hanya akun Google dengan alamat @gmail.com yang diizinkan.'
            )}`,
            request.url
          )
        );
      }
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  // No code returned
  return NextResponse.redirect(new URL('/login?error=Invalid_OAuth_Response', request.url));
}
