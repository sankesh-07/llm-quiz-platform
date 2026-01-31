import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import validator = require('express-validator');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { validationResult } = validator as any;
import { UserModel } from '../users/user.model';
import { ParentModel } from '../parents/parent.model';
import { signToken } from './auth.utils';
import { UserRole } from '../common/roles';
import { sendParentWelcomeEmail } from '../../services/email.service';

export const registerStudent = async (req: Request, res: Response) => {
  console.log('[registerStudent] incoming body:', req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[registerStudent] validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, boardCode, standard, parentEmail, parentName } = req.body as {
    name: string;
    email: string;
    password: string;
    boardCode?: string;
    standard?: number;
    parentEmail: string;
    parentName: string;
  };

  console.log('[registerStudent] parsed body:', { name, email, boardCode, standard, parentEmail, parentName });

  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log('[registerStudent] email already registered:', email);
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    name,
    email,
    passwordHash,
    role: 'student',
    boardCode,
    standard,
  });

  console.log('[registerStudent] created student user with _id:', user._id.toString());

  // Link or create parent by email
  console.log('[registerStudent] looking up parent by email:', parentEmail);
  let parent = await ParentModel.findOne({ email: parentEmail });
  console.log('[registerStudent] existing parent found?', !!parent);

  // Helper to generate a reasonably unique parentId
  const generateParentId = async (): Promise<string> => {
    // Try a few times to avoid collision
    for (let i = 0; i < 5; i++) {
      const candidate = `P-${crypto.randomBytes(4).toString('hex')}`;
      // eslint-disable-next-line no-await-in-loop
      const existingParent = await ParentModel.findOne({ parentId: candidate });
      if (!existingParent) return candidate;
    }
    // Fallback with timestamp if somehow collisions keep happening
    return `P-${Date.now().toString(36)}`;
  };

  let generatedPassword: string | null = null;

  if (!parent) {
    const parentId = await generateParentId();
    console.log('[registerStudent] creating new parent with parentId:', parentId);
    generatedPassword = crypto.randomBytes(9).toString('base64url');
    const parentPasswordHash = await bcrypt.hash(generatedPassword, 10);

    parent = await ParentModel.create({
      parentId,
      name: parentName,
      email: parentEmail,
      passwordHash: parentPasswordHash,
      children: [user._id],
    });

    console.log('[registerStudent] created parent with _id:', parent._id.toString());
    console.log('[registerStudent] triggering parent welcome email');

    // Fire-and-forget email; failures are logged but don't block registration
    void sendParentWelcomeEmail({
      parentEmail,
      parentName,
      parentId,
      password: generatedPassword,
      studentName: name,
    });
  } else {
    console.log('[registerStudent] parent already exists, linking child if needed');
    // Ensure child is linked
    if (!parent.children.some((childId) => childId.equals(user._id))) {
      parent.children.push(user._id);
      await parent.save();
      console.log('[registerStudent] added child to existing parent');
    }
  }

  // Store parentId on student record for convenience
  if (parent) {
    user.parentId = parent.parentId;
    await user.save();
  }

  const token = signToken(user._id.toString(), 'student');
  return res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      boardCode: user.boardCode,
      standard: user.standard,
      parentId: user.parentId,
    },
  });
};

export const registerAdmin = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    name,
    email,
    passwordHash,
    role: 'admin',
  });

  const token = signToken(user._id.toString(), 'admin');
  return res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const registerParent = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { parentId, name, email, password } = req.body;

  const existing = await ParentModel.findOne({ parentId });
  if (existing) {
    return res.status(409).json({ error: 'Parent ID already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const parent = await ParentModel.create({
    parentId,
    name,
    email,
    passwordHash,
    children: [],
  });

  const token = signToken(parent._id.toString(), 'parent');
  return res.status(201).json({
    token,
    user: {
      id: parent._id,
      name: parent.name,
      email: parent.email,
      role: 'parent' as UserRole,
      parentId: parent.parentId,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { identifier, password, role } = req.body as {
    identifier: string;
    password: string;
    role: UserRole;
  };

  if (role === 'parent') {
    const parent = await ParentModel.findOne({ parentId: identifier });
    if (!parent) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, parent.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(parent._id.toString(), 'parent');
    return res.json({
      token,
      user: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        role: 'parent' as UserRole,
        parentId: parent.parentId,
      },
    });
  }

  const user = await UserModel.findOne({ email: identifier, role });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user._id.toString(), role);
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      boardCode: user.boardCode,
      standard: user.standard,
      parentId: user.parentId,
    },
  });
};
