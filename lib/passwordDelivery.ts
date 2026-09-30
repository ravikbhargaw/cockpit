import fs from 'fs';
import path from 'path';

export interface PasswordResetPayload {
  email: string;
  resetUrl: string;
  tokenExpiresAt: string;
}

export interface IPasswordResetDelivery {
  sendResetLink(payload: PasswordResetPayload): Promise<boolean>;
}

/**
 * Local Development Password Reset Delivery:
 * - Logs reset URL to server stdout
 * - Appends delivery payload to data/dev_email_outbox.log for local testing
 */
export class LocalPasswordResetDelivery implements IPasswordResetDelivery {
  async sendResetLink(payload: PasswordResetPayload): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [LOCAL RESET LINK] To: ${payload.email} | URL: ${payload.resetUrl} (Expires: ${payload.tokenExpiresAt})\n`;

    // 1. Output to server console stdout
    console.log('\n==================================================');
    console.log(`[LOCAL DEV PASSWORD RESET]`);
    console.log(`To: ${payload.email}`);
    console.log(`Reset URL: ${payload.resetUrl}`);
    console.log(`Expires At: ${payload.tokenExpiresAt}`);
    console.log('==================================================\n');

    // 2. Persist to local outbox log
    try {
      const outboxPath = path.join(process.cwd(), 'data', 'dev_email_outbox.log');
      fs.appendFileSync(outboxPath, logLine, 'utf8');
    } catch (err) {
      console.error('Failed to write to dev_email_outbox.log:', err);
    }

    return true;
  }
}

// Default delivery instance
export const passwordResetDelivery: IPasswordResetDelivery = new LocalPasswordResetDelivery();
