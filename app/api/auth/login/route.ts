export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { COOKIE_NAME, verifyUserCredentials, createSessionToken, isAuthConfigured } from '@/lib/auth';
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

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Database User Lookup
    const cleanEmail = email.trim().toLowerCase();
    const user = await DAL.getUserByEmail(cleanEmail);

    // CRITICAL: Unknown email must always fail closed
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Access denied.' },
        { status: 401 }
      );
    }

    // 2. Validate Password Credential for this specific registered user
    const isValid = await verifyUserCredentials(password, user);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password. Access denied.' },
        { status: 401 }
      );
    }

    // 3. Issue Session Token with trusted User ID and Session Version
    const userId = user.id;
    const sessionVersion = user.sessionVersion || 1;
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
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // Authoritative role from trusted database
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
