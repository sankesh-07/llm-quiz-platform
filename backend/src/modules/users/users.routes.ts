import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../auth/auth.middleware';
import { UserModel } from './user.model';
import { BoardModel } from '../boards/board.model';
import { ParentModel } from '../parents/parent.model';

const router = Router();

// Get all students (Admin only)
router.get('/', requireAuth, requireRole(['admin']), async (req: AuthRequest, res, next) => {
  try {
    const { boardCode, standard } = req.query as { boardCode?: string; standard?: string };

    // Base query: only list students
    const query: any = { role: 'student' };

    if (boardCode) {
      query.boardCode = boardCode;
    }

    if (standard) {
      // standard usually comes as string from query params, convert to number
      const stdNum = parseInt(standard, 10);
      if (!isNaN(stdNum)) {
        query.standard = stdNum;
      }
    }

    const students = await UserModel.find(query)
      .select('name email boardCode standard role')
      .sort({ createdAt: -1 });

    const response = students.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      boardCode: user.boardCode,
      standard: user.standard
    }));

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Get single student details (Admin only)
router.get('/:id', requireAuth, requireRole(['admin']), async (req: AuthRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let parentDetails = null;
    if (user.parentId) {
      const parent = await ParentModel.findOne({ parentId: user.parentId });
      if (parent) {
        parentDetails = {
          name: parent.name,
          email: parent.email
        };
      }
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      boardCode: user.boardCode,
      standard: user.standard,
      parent: parentDetails
    });
  } catch (err) {
    next(err);
  }
});

// Update current student's education info (board & class)
router.patch('/me/education', requireAuth, requireRole(['student']), async (req: AuthRequest, res, next) => {
  try {
    const { boardCode, standard } = req.body as { boardCode?: string; standard?: number };

    if (!boardCode || typeof boardCode !== 'string' || !standard || typeof standard !== 'number') {
      return res.status(400).json({ error: 'boardCode and standard are required' });
    }

    const board = await BoardModel.findOne({ code: boardCode });
    if (!board) {
      return res.status(400).json({ error: 'Invalid board code' });
    }

    const hasStandard = board.standards.some((s: any) => s.grade === standard);
    if (!hasStandard) {
      return res.status(400).json({ error: 'Invalid standard for selected board' });
    }

    const user = await UserModel.findByIdAndUpdate(
      req.user!.userId,
      { boardCode, standard },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      boardCode: user.boardCode,
      standard: user.standard,
      parentId: user.parentId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
