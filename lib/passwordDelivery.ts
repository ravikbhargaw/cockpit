export interface PasswordResetPayload {
  email: string;
  resetUrl: string;
  tokenExpiresAt: string;
}

export interface PasswordResetDeliveryResult {
  success: boolean;
  provider: 'resend' | 'local';
  messageId?: string;
  error?: string;
}

export interface IPasswordResetDelivery {
  sendResetLink(payload: PasswordResetPayload): Promise<PasswordResetDeliveryResult>;
}

/**
 * Builds the Meaven-branded HTML email for password resets.
 * Compatible with mobile, desktop, and webmail clients.
 */
export function buildPasswordResetEmailHtml(payload: PasswordResetPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Meaven Founder Cockpit password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
    .container { max-width: 560px; margin: 40px auto; background-color: #111827; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1e293b; background: linear-gradient(180deg, #162032 0%, #111827 100%); }
    .brand-tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #38bdf8; margin-bottom: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .brand-title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.1em; color: #ffffff; text-transform: uppercase; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .content { padding: 32px; }
    .heading { font-size: 18px; font-weight: 700; color: #f8fafc; margin-top: 0; margin-bottom: 12px; }
    .paragraph { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #36668d; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 10px 15px -3px rgba(54, 102, 141, 0.3); }
    .url-box { background-color: #0b1120; border: 1px solid #1e293b; border-radius: 8px; padding: 12px 14px; font-size: 12px; word-break: break-all; color: #38bdf8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 20px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #1e293b; font-size: 11px; line-height: 1.5; color: #64748b; background-color: #0b1120; text-align: center; }
    .expiry-badge { display: inline-block; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); color: #fbbf24; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-tag">Private Founder Workspace</div>
      <h1 class="brand-title">MEAVEN FOUNDER COCKPIT</h1>
    </div>

    <div class="content">
      <div class="expiry-badge">⏱ VALID FOR 1 HOUR</div>
      <h2 class="heading">Password Reset Request</h2>
      <p class="paragraph">
        A password reset was requested for your Meaven Founder Cockpit account (<strong>${payload.email}</strong>).
      </p>
      <p class="paragraph">
        To set a new password and access your executive workspace, click the button below:
      </p>

      <div class="btn-container">
        <a href="${payload.resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          RESET PASSWORD
        </a>
      </div>

      <p class="paragraph" style="font-size: 12px; margin-bottom: 8px;">
        If the button above does not work, copy and paste this direct link into your browser:
      </p>
      <div class="url-box">${payload.resetUrl}</div>

      <p class="paragraph" style="font-size: 12px; color: #64748b; margin-top: 24px;">
        <strong>Security Notice:</strong> If you did not request this password reset, you can safely ignore this email. Your existing password will remain active and unchanged.
      </p>
    </div>

    <div class="footer">
      Meaven Designs Pvt Ltd • Founder Executive Cockpit<br>
      Automated security notification • Do not reply directly to this email
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds the plain text fallback for the password reset email.
 */
export function buildPasswordResetEmailText(payload: PasswordResetPayload): string {
  return `MEAVEN FOUNDER COCKPIT — PASSWORD RESET

A password reset was requested for your Meaven Founder Cockpit account (${payload.email}).

To reset your password, visit the link below:
${payload.resetUrl}

This link is valid for 1 hour.

Security Notice:
If you did not request this password reset, you can safely ignore this email. Your password will remain active and unchanged.

--
Meaven Designs Pvt Ltd
Founder Executive Cockpit`;
}

/**
 * Production Resend Email Delivery:
 * - Direct HTTP fetch to Resend API (https://api.resend.com/emails)
 * - 100% native Edge/Cloudflare Workers compatible (zero Node dependencies)
 * - Controlled via RESEND_API_KEY and PASSWORD_RESET_FROM_EMAIL
 */
export class ResendPasswordResetDelivery implements IPasswordResetDelivery {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail?: string) {
    this.apiKey = apiKey.trim();
    // Default to verified custom domain or fallback
    this.fromEmail = fromEmail && fromEmail.trim().length > 0
      ? fromEmail.trim()
      : 'Meaven Founder Cockpit <notifications@meaven.in>';
  }

  async sendResetLink(payload: PasswordResetPayload): Promise<PasswordResetDeliveryResult> {
    const subject = 'Reset your Meaven Founder Cockpit password';
    const html = buildPasswordResetEmailHtml(payload);
    const text = buildPasswordResetEmailText(payload);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [payload.email],
          subject,
          html,
          text,
        }),
      });

      const responseText = await response.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        const errorMsg = responseJson?.message || responseText || `HTTP ${response.status}`;
        console.error('[ResendDelivery] Outbound delivery failed:', {
          status: response.status,
          error: errorMsg,
          recipient: payload.email,
        });
        return {
          success: false,
          provider: 'resend',
          error: `Resend error (${response.status}): ${errorMsg}`,
        };
      }

      return {
        success: true,
        provider: 'resend',
        messageId: responseJson?.id,
      };
    } catch (err: any) {
      console.error('[ResendDelivery] Network/Fetch exception during send:', err?.message);
      return {
        success: false,
        provider: 'resend',
        error: `Network failure delivering email: ${err?.message}`,
      };
    }
  }
}

/**
 * Local Development Password Reset Delivery:
 * - Logs reset URL to server stdout
 * - Safely appends delivery payload to data/dev_email_outbox.log when running in Node.js
 */
export class LocalPasswordResetDelivery implements IPasswordResetDelivery {
  async sendResetLink(payload: PasswordResetPayload): Promise<PasswordResetDeliveryResult> {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [LOCAL RESET LINK] To: ${payload.email} | URL: ${payload.resetUrl} (Expires: ${payload.tokenExpiresAt})\n`;

    // 1. Output to server console stdout for developer visibility
    console.log('\n==================================================');
    console.log(`[LOCAL DEV PASSWORD RESET]`);
    console.log(`To: ${payload.email}`);
    console.log(`Reset URL: ${payload.resetUrl}`);
    console.log(`Expires At: ${payload.tokenExpiresAt}`);
    console.log('==================================================\n');

    // 2. Safely persist to local outbox log when running in Node.js runtime
    try {
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const fs = eval("require('fs')");
        const path = eval("require('path')");
        const outboxPath = path.join(process.cwd(), 'data', 'dev_email_outbox.log');
        fs.appendFileSync(outboxPath, logLine, 'utf8');
      }
    } catch {
      // Ignore filesystem write errors in edge environments
    }

    return {
      success: true,
      provider: 'local',
    };
  }
}

/**
 * Resolves the appropriate email delivery provider based on environment.
 * In production: Enforces Resend. Fails safely if unconfigured (never silently fakes delivery).
 * In local development: Uses Resend if RESEND_API_KEY is present; otherwise falls back to LocalPasswordResetDelivery.
 */
export function getPasswordResetDelivery(): IPasswordResetDelivery {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.PASSWORD_RESET_FROM_EMAIL;
  const isProduction = process.env.NODE_ENV === 'production';

  if (resendApiKey && resendApiKey.trim().length > 0) {
    return new ResendPasswordResetDelivery(resendApiKey, fromEmail);
  }

  if (isProduction) {
    // Production without RESEND_API_KEY must not pretend delivery succeeded
    return {
      async sendResetLink(payload: PasswordResetPayload): Promise<PasswordResetDeliveryResult> {
        console.error('[PasswordResetDelivery] CRITICAL: RESEND_API_KEY is not configured in production environment.');
        return {
          success: false,
          provider: 'resend',
          error: 'Transactional email provider (RESEND_API_KEY) is not configured in production environment.',
        };
      },
    };
  }

  // Local development fallback
  return new LocalPasswordResetDelivery();
}

// Default export instance
export const passwordResetDelivery: IPasswordResetDelivery = {
  sendResetLink: (payload: PasswordResetPayload) => getPasswordResetDelivery().sendResetLink(payload),
};
