export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { passwordResetDelivery } from '@/lib/passwordDelivery';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const genericResponse = NextResponse.json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been prepared.',
    });

    if (!email || typeof email !== 'string' || !email.trim()) {
      return genericResponse;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await DAL.getUserByEmail(cleanEmail);

    if (!user) {
      // Do not reveal account non-existence (Account Enumeration Prevention)
      return genericResponse;
    }

    // Generate secure reset token
    const { rawToken, expiresAt } = await DAL.createPasswordResetToken(user.id);

    // Derive canonical base URL:
    // 1. Explicit NEXT_PUBLIC_APP_URL environment variable if set
    // 2. x-forwarded-host / host header with protocol fallback
    let baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/$/, '');
    if (!baseUrl) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
      baseUrl = `${protocol}://${host}`;
    }

    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    // Deliver reset link via Resend (production) or Local delivery (development)
    const deliveryResult = await passwordResetDelivery.sendResetLink({
      email: user.email,
      resetUrl,
      tokenExpiresAt: expiresAt,
    });

    if (!deliveryResult.success) {
      console.error('[auth/forgot-password] Outbound password reset delivery failed:', {
        userId: user.id,
        provider: deliveryResult.provider,
        error: deliveryResult.error,
      });

      return NextResponse.json(
        {
          error: deliveryResult.error || 'Failed to deliver password reset email. Please contact the administrator or verify your mail settings.',
        },
        { status: 500 }
      );
    }

    return genericResponse;
  } catch (error: any) {
    console.error('[auth/forgot-password] Exception handling forgot-password request:', error?.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing password reset. Please try again.' },
      { status: 500 }
    );
  }
}
