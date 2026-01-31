import { Router } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import validator = require('express-validator');
import { registerAdmin, registerParent, registerStudent, login } from './auth.controller';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { body } = validator as any;
import { validate } from '../../middleware/validate';
import { requireAuth, requireRole } from './auth.middleware';

const router = Router();

router.post(
  '/register-student',
  [
    body('name').isString().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    // For new registrations, require board and standard
    body('boardCode').isString().notEmpty(),
    body('standard').isInt({ min: 1, max: 12 }),
    body('parentEmail').isEmail(),
    body('parentName').isString().notEmpty(),
  ],
  validate,
  registerStudent
);

router.post(
  '/register-admin',
  [
    body('name').isString().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  validate,
  registerAdmin
);

router.post(
  '/register-parent',
  [
    body('parentId').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('email').optional().isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  validate,
  // Keep this endpoint but protect it so only admins can create parents directly if needed
  requireAuth,
  requireRole(['admin']),
  registerParent
);

router.post(
  '/login',
  [
    body('identifier').isString().notEmpty(),
    body('password').isString().notEmpty(),
    body('role').isIn(['student', 'admin', 'parent']),
  ],
  validate,
  login
);

export default router;
