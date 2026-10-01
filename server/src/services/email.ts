import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'PizzaHub <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Email: Verify Email ────────────────────────────────────────────────────────
export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const link = `${FRONTEND_URL}/#/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: '🍕 Verify your PizzaHub account',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c, #dc2626); padding: 32px 40px; text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 10px;">
            <span style="font-size: 28px;">🍕</span>
            <span style="color: white; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">PizzaHub</span>
          </div>
        </div>
        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="color: #1c1917; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Hello, ${name}! 👋</h2>
          <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Thanks for signing up! Please verify your email address to activate your account and start ordering delicious pizzas.
          </p>
          <a href="${link}" style="display: inline-block; background: #ea580c; color: white; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none;">
            ✅ Verify My Email
          </a>
          <p style="color: #a8a29e; font-size: 13px; margin: 24px 0 0;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        <!-- Footer -->
        <div style="background: #fafaf9; border-top: 1px solid #e7e5e4; padding: 20px 40px; text-align: center;">
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PizzaHub. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

// ── Email: Password Reset ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const link = `${FRONTEND_URL}/#/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: '🔐 Reset your PizzaHub password',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c, #dc2626); padding: 32px 40px; text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 10px;">
            <span style="font-size: 28px;">🍕</span>
            <span style="color: white; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">PizzaHub</span>
          </div>
        </div>
        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="color: #1c1917; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Password Reset Request</h2>
          <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">Hi <strong>${name}</strong>,</p>
          <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${link}" style="display: inline-block; background: #1c1917; color: white; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none;">
            🔑 Reset Password
          </a>
          <p style="color: #a8a29e; font-size: 13px; margin: 24px 0 0;">
            If you didn't request a password reset, please ignore this email. Your password will not change.
          </p>
        </div>
        <!-- Footer -->
        <div style="background: #fafaf9; border-top: 1px solid #e7e5e4; padding: 20px 40px; text-align: center;">
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PizzaHub. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

// ── Email: Low Stock Alert ─────────────────────────────────────────────────────
export interface LowStockItem {
  itemName: string;
  category: string;
  stockQuantity: number;
  threshold: number;
}

export async function sendLowStockAlert(
  to: string,
  items: LowStockItem[]
): Promise<void> {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e7e5e4; font-weight: 500; color: #1c1917;">${item.itemName}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e7e5e4; color: #57534e; text-transform: capitalize;">${item.category}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e7e5e4; text-align: center;">
          <span style="background: #fef2f2; color: #dc2626; font-weight: 700; padding: 4px 10px; border-radius: 9999px; font-size: 13px;">${item.stockQuantity}</span>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e7e5e4; text-align: center; color: #78716c;">${item.threshold}</td>
      </tr>
    `
    )
    .join('');

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Low Stock Alert — ${items.length} item(s) need restocking`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 640px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c, #dc2626); padding: 28px 40px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">🍕</span>
              <span style="color: white; font-size: 20px; font-weight: 800;">PizzaHub</span>
            </div>
            <span style="background: rgba(255,255,255,0.2); color: white; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">⚠️ Stock Alert</span>
          </div>
        </div>
        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="color: #1c1917; font-size: 20px; font-weight: 700; margin: 0 0 8px;">Low Stock Notification</h2>
          <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            The following ${items.length} inventory item(s) have fallen below their minimum threshold and require restocking.
          </p>
          <!-- Table -->
          <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #fafaf9;">
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Category</th>
                  <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current</th>
                  <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Minimum</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 10px; border: 1px solid #fde68a;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
              💡 Please restock these items as soon as possible to avoid disruptions to customer orders.
            </p>
          </div>
        </div>
        <!-- Footer -->
        <div style="background: #fafaf9; border-top: 1px solid #e7e5e4; padding: 20px 40px; text-align: center;">
          <p style="color: #a8a29e; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PizzaHub Admin System · Automated alert</p>
        </div>
      </div>
    `,
  });
}
