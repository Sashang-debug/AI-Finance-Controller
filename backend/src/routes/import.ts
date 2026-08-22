import { Router } from 'express';
import multer from 'multer';
import { importLedger, importSettlements, importBankStatement } from '../services/importService.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/ledger', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const result = await importLedger(req.file.path);
    res.json({ message: 'Ledger imported successfully', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settlements', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const result = await importSettlements(req.file.path);
    res.json({ message: 'Settlements imported successfully', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bank', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const result = await importBankStatement(req.file.path);
    res.json({ message: 'Bank statement imported successfully', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
