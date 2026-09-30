export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { DAL } from '@/lib/db/dal';
import { validatePasswordPolicy, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'This password reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Password and password confirmation are required.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match. Please ensure both passwords match.' },
        { status: 400 }
      );
    }

    const policyCheck = validatePasswordPolicy(password);
    if (!policyCheck.valid) {
      return NextResponse.json(
        { error: policyCheck.error || 'Password does not meet complexity requirements.' },
        { status: 400 }
      );
    }

    // Validate token hash, expiration, and unused status
    const tokenResult = await DAL.validatePasswordResetToken(token);
    if (!tokenResult.valid || !tokenResult.user || !tokenResult.tokenRow) {
      return NextResponse.json(
        { error: 'This password reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    // Hash new password using PBKDF2
    const newPasswordHash = await hashPassword(password);

    // Update password, increment session_version to invalidate old sessions, and mark token used
    await DAL.resetUserPassword(
      tokenResult.user.id,
      newPasswordHash,
      tokenResult.tokenRow.id
    );

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Error handling reset-password request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
