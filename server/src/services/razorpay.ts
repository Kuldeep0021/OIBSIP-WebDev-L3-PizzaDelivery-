import Razorpay from 'razorpay';
import crypto from 'crypto';

// ── Razorpay instance ─────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// ── Create Order ──────────────────────────────────────────────────────────────
/**
 * Creates a Razorpay order.
 * @param amount   Amount in the smallest currency unit (paise for INR).
 * @param currency ISO 4217 currency code (default 'INR').
 * @param receipt  Your internal order reference (e.g. "ORD-00042").
 */
export async function createRazorpayOrder(
  amount: number,
  currency = 'INR',
  receipt: string
): Promise<{ id: string; amount: number; currency: string }> {
  const order = await razorpay.orders.create({
    amount,       // already in paise
    currency,
    receipt,
    payment_capture: true,
  } as Parameters<typeof razorpay.orders.create>[0]);

  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
  };
}

// ── Verify Payment Signature ──────────────────────────────────────────────────
/**
 * Verifies the Razorpay payment signature using HMAC-SHA256.
 * The expected signature is HMAC(razorpayOrderId + '|' + razorpayPaymentId, KEY_SECRET).
 * @returns true if signature is valid, false otherwise.
 */
export function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
}

export { razorpay };
