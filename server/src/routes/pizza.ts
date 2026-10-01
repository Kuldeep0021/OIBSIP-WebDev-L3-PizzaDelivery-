import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import PizzaVariety from '../models/PizzaVariety';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// ── GET / — List available pizza varieties (authenticated) ───────────────────
router.get(
  '/',
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const pizzas = await PizzaVariety.find({ isAvailable: true }).sort({
        name: 1,
      });
      res.json({ pizzas, total: pizzas.length });
    } catch (err) {
      console.error('[Pizza/GET /]', err);
      res.status(500).json({ error: 'Failed to fetch pizza varieties' });
    }
  }
);

// ── POST / — Create pizza variety (admin only) ────────────────────────────────
router.post(
  '/',
  authenticate,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Pizza name is required'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a non-negative number'),
    body('description').optional().trim(),
    body('imageUrl').optional().trim().isURL().withMessage('Invalid image URL'),
    body('isAvailable').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, price, description, imageUrl, isAvailable } = req.body as {
      name: string;
      price: number;
      description?: string;
      imageUrl?: string;
      isAvailable?: boolean;
    };

    try {
      const pizza = await PizzaVariety.create({
        name,
        price,
        description: description ?? '',
        imageUrl: imageUrl ?? '',
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      });

      res.status(201).json({ message: 'Pizza variety created', pizza });
    } catch (err) {
      console.error('[Pizza/POST /]', err);
      res.status(500).json({ error: 'Failed to create pizza variety' });
    }
  }
);

// ── PUT /:id — Update pizza variety (admin only) ──────────────────────────────
router.put(
  '/:id',
  authenticate,
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid pizza ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Invalid price'),
    body('description').optional().trim(),
    body('imageUrl').optional().trim().isURL().withMessage('Invalid image URL'),
    body('isAvailable').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const pizza = await PizzaVariety.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!pizza) {
        res.status(404).json({ error: 'Pizza variety not found' });
        return;
      }

      res.json({ message: 'Pizza variety updated', pizza });
    } catch (err) {
      console.error('[Pizza/PUT /:id]', err);
      res.status(500).json({ error: 'Failed to update pizza variety' });
    }
  }
);

// ── DELETE /:id — Delete pizza variety (admin only) ───────────────────────────
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid pizza ID')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const pizza = await PizzaVariety.findByIdAndDelete(req.params.id);
      if (!pizza) {
        res.status(404).json({ error: 'Pizza variety not found' });
        return;
      }
      res.json({ message: 'Pizza variety deleted' });
    } catch (err) {
      console.error('[Pizza/DELETE /:id]', err);
      res.status(500).json({ error: 'Failed to delete pizza variety' });
    }
  }
);

export default router;
