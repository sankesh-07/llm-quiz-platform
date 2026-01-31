import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { ParentModel } from './parent.model';

const router = Router();

router.get('/me', requireAuth, requireRole(['parent']), async (req: AuthRequest, res, next) => {
  try {
    const parent = await ParentModel.findById(req.user!.userId).populate('children');
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    res.json(parent);
  } catch (err) {
    next(err);
  }
});

export default router;
