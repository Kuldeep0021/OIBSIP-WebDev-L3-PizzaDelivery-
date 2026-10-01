import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import InventoryItem from '../models/InventoryItem';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// ── GET / — List all inventory items (authenticated) ─────────────────────────
router.get(
  '/',
  authenticate,
  [
    query('category')
      .optional()
      .isIn(['base', 'sauce', 'cheese', 'vegetable'])
      .withMessage('Category must be one of: base, sauce, cheese, vegetable'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const filter: Record<string, unknown> = {};
      if (req.query.category) {
        filter.category = req.query.category;
      }

      const inventoryItems = await InventoryItem.find(filter).sort({ category: 1, name: 1 });
      res.json({ inventoryItems, total: inventoryItems.length });
    } catch (err) {
      console.error('[Inventory/GET /]', err);
      res.status(500).json({ error: 'Failed to fetch inventory items' });
    }
  }
);

// ── POST / — Create item (admin only) ─────────────────────────────────────────
router.post(
  '/',
  authenticate,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('category')
      .isIn(['base', 'sauce', 'cheese', 'vegetable'])
      .withMessage('Category must be one of: base, sauce, cheese, vegetable'),
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    body('threshold')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Threshold must be a positive integer'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a non-negative number'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { name, category, stockQuantity, threshold, price } = req.body as {
        name: string;
        category: 'base' | 'sauce' | 'cheese' | 'vegetable';
        stockQuantity?: number;
        threshold?: number;
        price?: number;
      };

      const item = await InventoryItem.create({
        name,
        category,
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(threshold !== undefined && { threshold }),
        ...(price !== undefined && { price }),
      });

      res.status(201).json({ message: 'Inventory item created', inventoryItem: item });
    } catch (err) {
      console.error('[Inventory/POST /]', err);
      res.status(500).json({ error: 'Failed to create inventory item' });
    }
  }
);

// ── PUT /:id — Update item (admin only) ───────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid item ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('category')
      .optional()
      .isIn(['base', 'sauce', 'cheese', 'vegetable'])
      .withMessage('Category must be one of: base, sauce, cheese, vegetable'),
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    body('threshold')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Threshold must be a positive integer'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a non-negative number'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const item = await InventoryItem.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!item) {
        res.status(404).json({ error: 'Inventory item not found' });
        return;
      }

      res.json({ message: 'Inventory item updated', inventoryItem: item });
    } catch (err) {
      console.error('[Inventory/PUT /:id]', err);
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  }
);

// ── DELETE /:id — Delete item (admin only) ────────────────────────────────────
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid item ID')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const item = await InventoryItem.findByIdAndDelete(req.params.id);
      if (!item) {
        res.status(404).json({ error: 'Inventory item not found' });
        return;
      }
      res.json({ message: 'Inventory item deleted' });
    } catch (err) {
      console.error('[Inventory/DELETE /:id]', err);
      res.status(500).json({ error: 'Failed to delete inventory item' });
    }
  }
);

// ── PATCH /:id/adjust — Adjust stock by delta (admin only) ───────────────────
router.patch(
  '/:id/adjust',
  authenticate,
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid item ID'),
    body('delta')
      .isInt()
      .withMessage('Delta must be an integer (positive to add, negative to subtract)'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const delta: number = Number(req.body.delta);

    try {
      // Prevent stock from going below 0
      const item = await InventoryItem.findById(req.params.id);
      if (!item) {
        res.status(404).json({ error: 'Inventory item not found' });
        return;
      }

      const newQuantity = item.stockQuantity + delta;
      if (newQuantity < 0) {
        res.status(400).json({
          error: `Cannot reduce stock below 0. Current: ${item.stockQuantity}, requested delta: ${delta}`,
        });
        return;
      }

      item.stockQuantity = newQuantity;
      await item.save();

      res.json({
        message: `Stock adjusted by ${delta}`,
        item,
        previousQuantity: item.stockQuantity - delta,
        newQuantity,
      });
    } catch (err) {
      console.error('[Inventory/PATCH /:id/adjust]', err);
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  }
);

// ── GET /alerts — Recent stock alerts (admin only) ───────────────────────────
import StockAlert from '../models/StockAlert';

router.get(
  '/alerts',
  authenticate,
  adminOnly,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const alerts = await StockAlert.find()
        .sort({ sentAt: -1 })
        .limit(limit);
      res.json({ alerts });
    } catch (err) {
      console.error('[Inventory/GET /alerts]', err);
      res.status(500).json({ error: 'Failed to fetch stock alerts' });
    }
  }
);

export default router;
