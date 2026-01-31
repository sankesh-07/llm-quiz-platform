import { Router } from 'express';
import { BoardModel } from './board.model';
import { requireAuth, requireRole } from '../auth/auth.middleware';

const router = Router();

// List all boards
router.get('/', async (_req, res, next) => {
  try {
    const boards = await BoardModel.find();
    res.json(boards);
  } catch (err) {
    next(err);
  }
});

// Create a new board (admin only)
router.post('/', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const { name, code, standards } = req.body;
    const existing = await BoardModel.findOne({ code });
    if (existing) {
      return res.status(409).json({ error: 'Board code already exists' });
    }
    const board = await BoardModel.create({ name, code, standards: standards || [] });
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
});

// Get standards for a board
router.get('/:code/standards', async (req, res, next) => {
  try {
    const board = await BoardModel.findOne({ code: req.params.code });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.json(board.standards.map((s) => ({ grade: s.grade })));
  } catch (err) {
    next(err);
  }
});

// Get subjects for a particular standard
router.get('/:code/standards/:grade/subjects', async (req, res, next) => {
  try {
    const grade = parseInt(req.params.grade, 10);
    const board = await BoardModel.findOne({ code: req.params.code });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const std = board.standards.find((s) => s.grade === grade);
    if (!std) {
      return res.status(404).json({ error: 'Standard not found' });
    }
    res.json(std.subjects.map((s) => ({ name: s.name })));
  } catch (err) {
    next(err);
  }
});

// Get chapters for a given subject in a standard
router.get('/:code/standards/:grade/subjects/:subject/chapters', async (req, res, next) => {
  try {
    const grade = parseInt(req.params.grade, 10);
    const { subject } = req.params;
    const board = await BoardModel.findOne({ code: req.params.code });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const std = board.standards.find((s) => s.grade === grade);
    if (!std) {
      return res.status(404).json({ error: 'Standard not found' });
    }
    const subj = std.subjects.find((s) => s.name === subject);
    if (!subj) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subj.chapters.map((c) => ({ name: c.name })));
  } catch (err) {
    next(err);
  }
});

export default router;
