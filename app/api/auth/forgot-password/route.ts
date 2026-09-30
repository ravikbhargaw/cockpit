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

    const user = await DAL.getUserByEmail(email);
    if (!user) {
      // Do not reveal account non-existence (Account Enumeration Prevention)
      return genericResponse;
    }

    // Generate secure reset token
    const { rawToken, expiresAt } = await DAL.createPasswordResetToken(user.id);

    // Derive base URL from host header or environment
    const host = request.headers.get('host') || 'localhost:3001';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const resetUrl = `${protocol}://${host}/reset-password?token=${rawToken}`;

    // Trigger local delivery abstraction (logs to stdout and data/dev_email_outbox.log)
    await passwordResetDelivery.sendResetLink({
      email: user.email,
      resetUrl,
      tokenExpiresAt: expiresAt,
    });

    return genericResponse;
  } catch (error) {
    console.error('Error handling forgot-password request:', error);
    // Generic error response to prevent leaking internal information
    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been prepared.',
    });
  }
}
