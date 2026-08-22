import { runReconciliation } from '../engine/engine.js';
import { prisma } from '../prisma.js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function evaluate() {
  console.log('Running evaluation...');
  
  const runId = await runReconciliation();
  
  console.log('Fetching results...');
  const results = await prisma.reconciliationResult.findMany({
    where: { runId },
    include: { ledgerRecord: true }
  });

  const engineResultsMap = new Map<string, string>();
  for (const r of results) {
    if (r.ledgerRecord) {
      engineResultsMap.set(r.ledgerRecord.orderId, r.classification);
    }
  }

  console.log('Loading ground truth...');
  const groundTruthPath = path.join(__dirname, '../../data/ground_truth.csv');
  let correct = 0;
  let total = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(groundTruthPath)
      .pipe(csv())
      .on('data', (data) => {
        const orderId = data.order_id;
        const expected = data.expected_classification;
        const actual = engineResultsMap.get(orderId) || 'UNRESOLVED';
        
        total++;
        if (expected === actual) {
          correct++;
        } else {
          console.log(`MISMATCH for ${orderId}: Expected ${expected}, got ${actual}`);
        }
      })
      .on('end', () => {
        const accuracy = (correct / total) * 100;
        console.log(`\nEvaluation complete!`);
        console.log(`Accuracy: ${accuracy.toFixed(2)}% (${correct}/${total})`);
        resolve(true);
      })
      .on('error', reject);
  });
}

evaluate().catch(console.error).finally(() => prisma.$disconnect());
