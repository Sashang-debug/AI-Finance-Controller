import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma.js';
import { explainException } from '../services/aiService.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.post('/:id/explain', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  
  const result = await prisma.reconciliationResult.findUnique({
    where: { id }
  });

  if (!result) {
    res.status(404).json({ error: 'Exception not found' });
    return;
  }

  if (result.classification === 'EXACT_MATCH') {
    res.status(400).json({ error: 'Cannot explain an EXACT_MATCH' });
    return;
  }

  const explanationResult = await explainException(id);
  
  if (explanationResult.error) {
    res.status(500).json({ error: explanationResult.error });
    return;
  }

  res.json({
    message: 'Explanation generated successfully',
    aiExplanation: explanationResult.explanation,
    aiRecommendation: explanationResult.recommendation
  });
}));

router.post('/:id/review', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  
  const result = await prisma.reconciliationResult.findUnique({
    where: { id }
  });

  if (!result) {
    res.status(404).json({ error: 'Exception not found' });
    return;
  }

  const updated = await prisma.reconciliationResult.update({
    where: { id },
    data: { reviewStatus: 'RESOLVED' }
  });

  res.json({
    message: 'Exception marked as RESOLVED',
    result: updated
  });
}));

export default router;
