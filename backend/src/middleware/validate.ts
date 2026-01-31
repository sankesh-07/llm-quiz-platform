import { NextFunction, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import validator = require('express-validator');

// express-validator typings are not fully compatible; cast to any to access helpers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { validationResult } = validator as any;

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
