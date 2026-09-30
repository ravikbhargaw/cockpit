export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyPassword, createSessionToken, isAuthConfigured } from '@/lib/auth';
import { DAL } from '@/lib/db/dal';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: 'Authentication not configured on server. Check environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { password, email } = body;

    // Check user record by email (defaults to Ravi admin)
    const userEmail = email && typeof email === 'string' ? email.trim() : 'ravi@meaven.in';
    const user = await DAL.getUserByEmail(userEmail);

    const storedHash = user?.passwordHash;
    const isValid = await verifyPassword(password, storedHash);

    if (!password || !isValid) {
      return NextResponse.json(
        { error: 'Invalid password. Access denied.' },
        { status: 401 }
      );
    }

    const userId = user?.id || 'usr-1';
    const sessionVersion = user?.sessionVersion || 1;
    const sessionToken = await createSessionToken(userId, sessionVersion);

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Failed to generate secure session.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: user?.name || 'Ravi',
        email: user?.email || 'ravi@meaven.in',
        role: user?.role || 'ADMIN',
      },
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
