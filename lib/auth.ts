export const COOKIE_NAME = 'cockpit_session';

/**
 * Web Crypto HMAC-SHA256 signature generator.
 * Fully compatible with Next.js Edge Middleware, Cloudflare Workers, and Node.js.
 */
async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies if environment authentication variables are configured.
 * FAILS SAFELY if either COCKPIT_PASSWORD or COCKPIT_SESSION_SECRET is missing.
 */
export function isAuthConfigured(): boolean {
  const pwd = process.env.COCKPIT_PASSWORD;
  const secret = process.env.COCKPIT_SESSION_SECRET;
  return Boolean(pwd && pwd.trim().length > 0 && secret && secret.trim().length > 0);
}

/**
 * Verifies submitted password against process.env.COCKPIT_PASSWORD.
 * Returns false if process.env.COCKPIT_PASSWORD is empty or missing.
 */
export function verifyPassword(inputPassword: string): boolean {
  if (!isAuthConfigured()) return false;
  const expectedPassword = process.env.COCKPIT_PASSWORD;
  if (!expectedPassword || !inputPassword) return false;
  return inputPassword === expectedPassword;
}

/**
 * Creates a signed session token using Web Crypto HMAC-SHA256.
 * Returns null if authentication environment variables are missing.
 */
export async function createSessionToken(): Promise<string | null> {
  if (!isAuthConfigured()) return null;
  const secret = process.env.COCKPIT_SESSION_SECRET!;
  const timestamp = Date.now().toString();
  const signature = await hmacSign(timestamp, secret);
  return `${timestamp}.${signature}`;
}

/**
 * Verifies a signed session token using Web Crypto HMAC-SHA256.
 * Checks signature validity and 7-day expiration.
 * Returns false if environment variables are missing or token is invalid.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  if (!isAuthConfigured()) return false;

  const secret = process.env.COCKPIT_SESSION_SECRET!;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Session expiry: 7 days
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  const expectedSignature = await hmacSign(timestampStr, secret);
  return providedSignature === expectedSignature;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

/**
 * Resolves authenticated user identity from request session token.
 * Supports x-user-role and x-user-name header overrides for local dev / test role simulation.
 * Returns null if unauthenticated.
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
  const isValid = await verifySessionToken(token);
  if (!isValid) return null;

  const roleHeader = request.headers.get('x-user-role');
  const role = roleHeader === 'USER' || roleHeader === 'ADMIN' ? roleHeader : 'ADMIN';

  const userHeader = request.headers.get('x-user-name');
  const name = userHeader || (role === 'USER' ? 'Associate User' : 'Ravi');

  return {
    id: role === 'USER' ? 'usr-2' : 'usr-1',
    name,
    email: role === 'USER' ? 'associate@meaven.in' : 'ravi@meaven.in',
    role: role as 'ADMIN' | 'USER',
  };
}
