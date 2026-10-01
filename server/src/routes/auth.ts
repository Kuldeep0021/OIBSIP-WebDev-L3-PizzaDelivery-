import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

function signJwt(payload: {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}): string {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

// ── POST /register ────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password, phone } = req.body as {
      name: string;
      email: string;
      password: string;
      phone?: string;
    };

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(409).json({ error: 'Email is already registered' });
        return;
      }

      const verificationToken = generateToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

      const user = await User.create({
        name,
        email,
        password,
        phone,
        isEmailVerified: true, // Auto-verify for easy testing
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // Fire-and-forget — do not block the response
      sendVerificationEmail(email, name, verificationToken).catch((err) =>
        console.error('[Auth] Failed to send verification email:', err.message)
      );

      res.status(201).json({
        message:
          'Registration successful. Please check your email to verify your account.',
        userId: user._id,
      });
    } catch (err) {
      console.error('[Auth/register]', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

// ── GET /verify-email?token=xxx ───────────────────────────────────────────────
router.get(
  '/verify-email',
  [query('token').notEmpty().withMessage('Token is required')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { token } = req.query as { token: string };

    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      }).select('+emailVerificationToken +emailVerificationExpires');

      if (!user) {
        res
          .status(400)
          .json({ error: 'Invalid or expired verification token' });
        return;
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
      console.error('[Auth/verify-email]', err);
      res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
  }
);

// ── POST /login ───────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (!user.isEmailVerified) {
        res.status(401).json({
          error:
            'Please verify your email address before logging in. Check your inbox.',
        });
        return;
      }

      const token = signJwt({
        userId: String(user._id),
        email: user.email,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (err) {
      console.error('[Auth/login]', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

// ── POST /admin-login ─────────────────────────────────────────────────────────
router.post(
  '/admin-login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied: Admins only' });
        return;
      }

      if (!user.isEmailVerified) {
        res.status(401).json({
          error: 'Please verify your email address before logging in.',
        });
        return;
      }

      const token = signJwt({
        userId: String(user._id),
        email: user.email,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (err) {
      console.error('[Auth/admin-login]', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

// ── POST /forgot-password ─────────────────────────────────────────────────────
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email } = req.body as { email: string };

    // Always respond with 200 to avoid user enumeration
    const genericMessage =
      'If an account with that email exists, a password reset link has been sent.';

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.json({ message: genericMessage });
        return;
      }

      const resetToken = generateToken();
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 h
      await user.save();

      sendPasswordResetEmail(email, user.name, resetToken).catch((err) =>
        console.error('[Auth] Failed to send reset email:', err.message)
      );

      res.json({ message: genericMessage });
    } catch (err) {
      console.error('[Auth/forgot-password]', err);
      res.status(500).json({ error: 'Request failed. Please try again.' });
    }
  }
);

// ── POST /reset-password ──────────────────────────────────────────────────────
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { token, newPassword } = req.body as {
      token: string;
      newPassword: string;
    };

    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      }).select('+passwordResetToken +passwordResetExpires +password');

      if (!user) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }

      user.password = newPassword; // pre-save hook will hash
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      console.error('[Auth/reset-password]', err);
      res.status(500).json({ error: 'Reset failed. Please try again.' });
    }
  }
);

// ── GET /me — Get current user profile ───────────────────────────────────────
import { authenticate } from '../middleware/auth';

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('[Auth/me]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
