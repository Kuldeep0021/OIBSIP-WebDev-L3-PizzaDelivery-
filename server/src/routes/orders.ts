import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Order, { IOrderItem } from '../models/Order';
import InventoryItem from '../models/InventoryItem';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// ── Order number generator ────────────────────────────────────────────────────
async function generateOrderNumber(): Promise<string> {
  const count = await Order.countDocuments();
  const padded = String(count + 1).padStart(5, '0');
  return `ORD-${padded}`;
}

// ── POST / — Create order (authenticated user) ────────────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.itemType')
      .isIn(['pizza_variety', 'custom_pizza'])
      .withMessage('itemType must be pizza_variety or custom_pizza'),
    body('items.*.itemName')
      .trim()
      .notEmpty()
      .withMessage('Item name is required'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('items.*.price')
      .isFloat({ min: 0 })
      .withMessage('Price must be non-negative'),
    body('deliveryAddress')
      .trim()
      .notEmpty()
      .withMessage('Delivery address is required'),
    body('customerName')
      .trim()
      .notEmpty()
      .withMessage('Customer name is required'),
    body('customerPhone')
      .trim()
      .notEmpty()
      .withMessage('Customer phone is required'),
    body('razorpayOrderId')
      .trim()
      .notEmpty()
      .withMessage('Razorpay order ID is required'),
    body('totalAmount')
      .isFloat({ min: 0 })
      .withMessage('Total amount must be non-negative'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      items,
      deliveryAddress,
      customerName,
      customerPhone,
      razorpayOrderId,
      totalAmount,
      notes,
    } = req.body as {
      items: IOrderItem[];
      deliveryAddress: string;
      customerName: string;
      customerPhone: string;
      razorpayOrderId: string;
      totalAmount: number;
      notes?: string;
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Decrement inventory for custom pizzas
      for (const item of items) {
        if (
          item.itemType === 'custom_pizza' &&
          item.details?.inventoryItemIds
        ) {
          const inventoryMap = item.details.inventoryItemIds as Map<
            string,
            string
          >;
          const entries =
            inventoryMap instanceof Map
              ? Array.from(inventoryMap.values())
              : Object.values(inventoryMap as unknown as Record<string, string>);

          for (const invId of entries) {
            const inv = await InventoryItem.findById(invId).session(session);
            if (!inv) continue;

            const decrementQty = item.quantity;
            if (inv.stockQuantity < decrementQty) {
              await session.abortTransaction();
              res.status(400).json({
                error: `Insufficient stock for "${inv.name}". Available: ${inv.stockQuantity}, Requested: ${decrementQty}`,
              });
              return;
            }

            inv.stockQuantity -= decrementQty;
            await inv.save({ session });
          }
        }
      }

      const orderNumber = await generateOrderNumber();

      const [order] = await Order.create(
        [
          {
            userId: req.user!.userId,
            orderNumber,
            items,
            totalAmount,
            deliveryAddress,
            customerName,
            customerPhone,
            razorpayOrderId,
            notes,
            status: 'received',
            paymentStatus: 'pending',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({ message: 'Order placed successfully', order });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('[Orders/POST /]', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

// ── GET / — List orders ───────────────────────────────────────────────────────
// Users see only their own; admins see all
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: Record<string, unknown> =
        req.user!.role === 'admin'
          ? {}
          : { userId: req.user!.userId };

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .populate('userId', 'name email phone');

      res.json({ orders, total: orders.length });
    } catch (err) {
      console.error('[Orders/GET /]', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }
);

// ── GET /:id — Get single order ───────────────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid order ID')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const order = await Order.findById(req.params.id).populate(
        'userId',
        'name email phone'
      );

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Non-admin users can only see their own orders
      if (
        req.user!.role !== 'admin' &&
        order.userId.toString() !== req.user!.userId
      ) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ order });
    } catch (err) {
      console.error('[Orders/GET /:id]', err);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  }
);

// ── PATCH /:id/status — Update order status (admin only) ─────────────────────
router.patch(
  '/:id/status',
  authenticate,
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status')
      .isIn(['received', 'kitchen', 'delivery'])
      .withMessage('Status must be one of: received, kitchen, delivery'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status as string },
        { new: true, runValidators: true }
      );

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json({ message: 'Order status updated', order });
    } catch (err) {
      console.error('[Orders/PATCH /:id/status]', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

export default router;
