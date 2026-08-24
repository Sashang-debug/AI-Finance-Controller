import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { runReconciliation } from '../engine/engine.js';
import { prisma } from '../prisma.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.post('/run', asyncHandler(async (req, res) => {
  const runId = await runReconciliation();
  res.json({
    message: 'Reconciliation run completed successfully',
    runId
  });
}));

router.get('/runs', asyncHandler(async (req, res) => {
  const runs = await prisma.reconciliationRun.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(runs);
}));

router.get('/runs/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const run = await prisma.reconciliationRun.findUnique({
    where: { id }
  });
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }
  res.json(run);
}));

router.get('/runs/:id/results', asyncHandler(async (req, res) => {
  const runId = req.params.id as string;
  const results = await prisma.reconciliationResult.findMany({
    where: { runId },
    include: {
      ledgerRecord: true,
      settlementRecord: true,
      bankRecord: true
    }
  });
  res.json(results);
}));

router.get('/runs/:id/exceptions', asyncHandler(async (req, res) => {
  const runId = req.params.id as string;
  const exceptions = await prisma.reconciliationResult.findMany({
    where: {
      runId,
      classification: {
        not: 'EXACT_MATCH'
      }
    },
    include: {
      ledgerRecord: true,
      settlementRecord: true,
      bankRecord: true
    }
  });
  res.json(exceptions);
}));

export default router;
