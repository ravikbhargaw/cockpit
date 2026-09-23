import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyPassword, createSessionToken, isAuthConfigured } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: 'Authentication not configured on server. Check environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || !verifyPassword(password)) {
      return NextResponse.json(
        { error: 'Invalid password. Access denied.' },
        { status: 401 }
      );
    }

    const sessionToken = await createSessionToken();
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Failed to generate secure session.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: { name: 'Ravi', role: 'Founder & CEO' },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
