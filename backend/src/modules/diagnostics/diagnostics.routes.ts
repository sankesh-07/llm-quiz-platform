import { Router } from 'express';
import { isLlmConfigured } from '../../services/llm.service';

const router = Router();

router.get('/llm', (_req, res) => {
  const configured = isLlmConfigured();
  res.json({ configured });
});

export default router;
