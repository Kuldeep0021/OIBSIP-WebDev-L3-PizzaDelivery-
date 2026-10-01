import { Request, Response, NextFunction } from 'express';

/**
 * Must be used AFTER the `authenticate` middleware.
 * Returns HTTP 403 if the authenticated user is not an admin.
 */
export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Not authenticated' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
}
