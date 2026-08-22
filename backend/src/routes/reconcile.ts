import { Router } from 'express';
import { runReconciliation } from '../engine/engine.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const runId = await runReconciliation();
    res.json({
      message: 'Reconciliation run completed successfully',
      runId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;
