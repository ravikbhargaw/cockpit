import { NextResponse } from 'next/server';
import { db } from './db';
import { COOKIE_NAME, verifySessionToken, isAuthConfigured, CurrentUser } from './auth';

export interface SessionValidationResult {
  valid: boolean;
  user?: CurrentUser;
  reason?:
    | 'missing_token'
    | 'auth_not_configured'
    | 'unsupported_format'
    | 'malformed_token'
    | 'expired_token'
    | 'invalid_signature'
    | 'user_not_found'
    | 'session_version_mismatch'
    | 'database_error';
}

/**
 * Authoritative session verification with database session_version validation.
 * Ensures revoked sessions are immediately rejected after password reset.
 */
export async function validateSessionToken(token: string | null | undefined): Promise<SessionValidationResult> {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' };
  }
  if (!isAuthConfigured()) {
    return { valid: false, reason: 'auth_not_configured' };
  }

  // 1. Fast cryptographic HMAC and structure validation
  const isSignatureValid = await verifySessionToken(token);
  if (!isSignatureValid) {
    return { valid: false, reason: 'invalid_signature' };
  }

  const parts = token.split('.');
  if (parts.length !== 4) {
    return { valid: false, reason: 'unsupported_format' };
  }

  const [, userId, versionStr] = parts;
  const tokenVersion = parseInt(versionStr, 10);

  if (isNaN(tokenVersion) || !userId) {
    return { valid: false, reason: 'malformed_token' };
  }

  // 2. Database validation: check user existence and active session version
  try {
    const userRow = (await db
      .prepare('SELECT id, name, email, role, session_version FROM users WHERE id = ?')
      .get(userId)) as any;

    if (!userRow) {
      return { valid: false, reason: 'user_not_found' };
    }

    const activeSessionVersion = userRow.session_version ?? 1;
    if (tokenVersion !== activeSessionVersion) {
      return { valid: false, reason: 'session_version_mismatch' };
    }

    return {
      valid: true,
      user: {
        id: userRow.id,
        name: userRow.name || 'User',
        email: userRow.email,
        role: userRow.role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
    };
  } catch (err) {
    console.error('[lib/session.ts] Error validating session in database:', err);
    return { valid: false, reason: 'database_error' };
  }
}

/**
 * Resolves trusted database-backed user identity from request session token.
 * Validates session_version against the database to enforce revocation.
 */
export async function getCurrentUserFromRequest(request: Request): Promise<CurrentUser | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const token = cookies[COOKIE_NAME];
  const result = await validateSessionToken(token);
  if (!result.valid || !result.user) {
    return null;
  }
  return result.user;
}

export type AuthResult =
  | { user: CurrentUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse };

/**
 * Universal server-side authentication guard for protected API endpoints.
 * Validates HMAC signature, validates active session_version against the database,
 * enforces optional role checks, and automatically clears the cookie on revocation.
 */
export async function requireAuth(
  request: Request,
  requiredRole?: 'ADMIN' | 'USER'
): Promise<AuthResult> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const token = cookies[COOKIE_NAME];
  const result = await validateSessionToken(token);

  if (!result.valid || !result.user) {
    const errorMsg =
      result.reason === 'session_version_mismatch'
        ? 'Session has been revoked due to a password reset or security event. Please log in again.'
        : 'Unauthorized. Valid authenticated session required.';

    const response = NextResponse.json(
      { error: errorMsg, code: result.reason || 'unauthorized' },
      { status: 401 }
    );

    // Actively purge the revoked or invalid cookie from the client browser
    response.cookies.set({
      name: COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return { errorResponse: response };
  }

  if (requiredRole === 'ADMIN' && result.user.role !== 'ADMIN') {
    return {
      errorResponse: NextResponse.json(
        { error: 'Forbidden. Administrator privileges required.' },
        { status: 403 }
      ),
    };
  }

  return { user: result.user };
}
