import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../services/razorpay';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── POST /create-order — Create Razorpay order ────────────────────────────────
router.post(
  '/create-order',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number (in INR)'),
    body('receipt').optional().trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { amount, receipt } = req.body as {
      amount: number;
      receipt?: string;
    };

    try {
      // Razorpay expects amount in paise (1 INR = 100 paise)
      const amountInPaise = Math.round(amount * 100);
      const orderReceipt =
        receipt || `receipt_${req.user!.userId}_${Date.now()}`;

      const razorpayOrder = await createRazorpayOrder(
        amountInPaise,
        'INR',
        orderReceipt
      );

      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.error('[Payment/create-order]', err);
      res
        .status(500)
        .json({ error: 'Failed to create payment order. Please try again.' });
    }
  }
);

// ── POST /verify — Verify Razorpay payment signature ─────────────────────────
router.post(
  '/verify',
  authenticate,
  [
    body('razorpayOrderId')
      .trim()
      .notEmpty()
      .withMessage('razorpayOrderId is required'),
    body('razorpayPaymentId')
      .trim()
      .notEmpty()
      .withMessage('razorpayPaymentId is required'),
    body('razorpaySignature')
      .trim()
      .notEmpty()
      .withMessage('razorpaySignature is required'),
    body('orderId').trim().notEmpty().withMessage('orderId is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = req.body as {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      orderId: string;
    };

    try {
      const isValid = verifyRazorpayPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValid) {
        res
          .status(400)
          .json({ success: false, error: 'Payment verification failed: Invalid signature' });
        return;
      }

      // Update the order in the database
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      // Ensure the order belongs to the requesting user (unless admin)
      if (
        req.user!.role !== 'admin' &&
        order.userId.toString() !== req.user!.userId
      ) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      order.paymentStatus = 'paid';
      order.paymentId = razorpayPaymentId;
      await order.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          paymentId: order.paymentId,
        },
      });
    } catch (err) {
      console.error('[Payment/verify]', err);
      res
        .status(500)
        .json({ success: false, error: 'Payment verification failed' });
    }
  }
);

export default router;
