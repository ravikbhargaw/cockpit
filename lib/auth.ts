export const COOKIE_NAME = 'cockpit_session';

/**
 * Web Crypto HMAC-SHA256 signature generator.
 * Fully compatible with Next.js Edge Middleware, Cloudflare Workers, and Node.js.
 */
async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const subtle = (globalThis.crypto && globalThis.crypto.subtle)
    ? globalThis.crypto.subtle
    : eval("require('crypto').webcrypto.subtle");

  const key = await subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies if environment authentication variables are configured.
 */
export function isAuthConfigured(): boolean {
  const pwd = process.env.COCKPIT_PASSWORD;
  const secret = process.env.COCKPIT_SESSION_SECRET;
  return Boolean(pwd && pwd.trim().length > 0 && secret && secret.trim().length > 0);
}

/**
 * Strong Password Hashing using PBKDF2 with SHA-256 (100,000 iterations).
 * Stored format: pbkdf2:100000:<salt_hex>:<hash_hex>
 */
export function hashPassword(password: string, saltHex?: string): string {
  const nodeCrypto = eval("require('crypto')");
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : nodeCrypto.randomBytes(16);
  const hash = nodeCrypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2:100000:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = parseInt(parts[1], 10);
  const saltHex = parts[2];
  const originalHashHex = parts[3];

  const nodeCrypto = eval("require('crypto')");
  const salt = Buffer.from(saltHex, 'hex');
  const computedHash = nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return nodeCrypto.timingSafeEqual(computedHash, Buffer.from(originalHashHex, 'hex'));
}

/**
 * Hashes a raw reset token using SHA-256 before persisting in DB.
 */
export function hashResetToken(rawToken: string): string {
  const nodeCrypto = eval("require('crypto')");
  return nodeCrypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Validates password strength policy:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number.' };
  }
  return { valid: true };
}

/**
 * Verifies submitted password against stored user hash or env fallback.
 */
export function verifyPassword(inputPassword: string, storedHash?: string | null): boolean {
  if (!inputPassword) return false;
  if (storedHash && storedHash.trim().length > 0) {
    return verifyPasswordHash(inputPassword, storedHash);
  }
  if (!isAuthConfigured()) return false;
  const expectedPassword = process.env.COCKPIT_PASSWORD;
  if (!expectedPassword) return false;
  return inputPassword === expectedPassword;
}

/**
 * Creates a signed session token including timestamp, userId, and sessionVersion.
 * Token format: timestamp.userId.sessionVersion.signature
 */
export async function createSessionToken(userId: string = 'usr-1', sessionVersion: number = 1): Promise<string | null> {
  if (!isAuthConfigured()) return null;
  const secret = process.env.COCKPIT_SESSION_SECRET!;
  const timestamp = Date.now().toString();
  const payload = `${timestamp}:${userId}:${sessionVersion}`;
  const signature = await hmacSign(payload, secret);
  return `${timestamp}.${userId}.${sessionVersion}.${signature}`;
}

/**
 * Verifies a signed session token.
 * Fully Edge-compatible HMAC signature check and 7-day expiration check.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  if (!isAuthConfigured()) return false;

  const secret = process.env.COCKPIT_SESSION_SECRET!;
  const parts = token.split('.');

  // Legacy 2-part tokens (timestamp.signature)
  if (parts.length === 2) {
    const [timestampStr, providedSignature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAgeMs) return false;

    const expectedSignature = await hmacSign(timestampStr, secret);
    return providedSignature === expectedSignature;
  }

  // 4-part tokens (timestamp.userId.version.signature)
  if (parts.length === 4) {
    const [timestampStr, userId, versionStr, providedSignature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    const tokenVersion = parseInt(versionStr, 10);
    if (isNaN(timestamp) || isNaN(tokenVersion)) return false;

    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAgeMs) return false;

    const payload = `${timestampStr}:${userId}:${versionStr}`;
    const expectedSignature = await hmacSign(payload, secret);
    if (providedSignature !== expectedSignature) return false;

    // Optional DB session_version check if running in Node environment
    try {
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const { db } = eval("require('./db')");
        const user = db.prepare('SELECT session_version FROM users WHERE id = ?').get(userId) as any;
        if (user && user.session_version !== undefined && user.session_version !== tokenVersion) {
          return false;
        }
      }
    } catch {
      // In Edge Runtime, fallback to HMAC signature & timestamp verification
    }

    return true;
  }

  return false;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

/**
 * Resolves authenticated user identity from request session token.
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

  let userId = 'usr-1';
  if (token && token.split('.').length === 4) {
    userId = token.split('.')[1];
  }

  const roleHeader = request.headers.get('x-user-role');
  const role = roleHeader === 'USER' || roleHeader === 'ADMIN' ? roleHeader : (userId === 'usr-2' ? 'USER' : 'ADMIN');

  const userHeader = request.headers.get('x-user-name');
  const name = userHeader || (role === 'USER' ? 'Associate User' : 'Ravi');

  return {
    id: userId,
    name,
    email: role === 'USER' ? 'associate@meaven.in' : 'ravi@meaven.in',
    role: role as 'ADMIN' | 'USER',
  };
}
