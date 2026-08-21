import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/ledger', upload.single('file'), (req, res) => {
  // Stub for processing ledger CSV
  res.json({ message: 'Ledger import endpoint called', file: req.file?.originalname });
});

router.post('/settlements', upload.single('file'), (req, res) => {
  // Stub for processing settlements CSV
  res.json({ message: 'Settlements import endpoint called', file: req.file?.originalname });
});

router.post('/bank', upload.single('file'), (req, res) => {
  // Stub for processing bank statement CSV
  res.json({ message: 'Bank statement import endpoint called', file: req.file?.originalname });
});

export default router;
