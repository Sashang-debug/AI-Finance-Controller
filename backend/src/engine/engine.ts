import { prisma } from '../prisma.js';
import { matchRecords } from './matcher.js';

export async function runReconciliation() {
  console.log('Starting reconciliation run...');
  
  // 1. Create a Run record
  const run = await prisma.reconciliationRun.create({
    data: {
      status: 'PENDING'
    }
  });

  try {
    // 2. Fetch all records
    const ledgers = await prisma.ledgerRecord.findMany();
    const settlements = await prisma.settlementRecord.findMany();
    const banks = await prisma.bankRecord.findMany();

    // 3. Match
    const results = matchRecords(ledgers, settlements, banks);

    // 4. Save results (Chunking would be better for scale, but this is fine for 100 records)
    let exactMatches = 0;
    let exceptions = 0;

    // We can use a transaction or createMany, but createMany on SQLite 
    // doesn't return the inserted rows. But we just need them in DB.
    // However, createMany doesn't support nested relations if needed.
    // Let's just create them one by one for simplicity and safety.
    for (const result of results) {
      if (result.classification === 'EXACT_MATCH') exactMatches++;
      else exceptions++;

      await prisma.reconciliationResult.create({
        data: {
          runId: run.id,
          classification: result.classification,
          ruleUsed: result.ruleUsed,
          amountDifference: result.amountDifference ?? null,
          notes: result.notes ?? null,
          ledgerRecordId: result.ledgerId ?? null,
          settlementRecordId: result.settlementId ?? null,
          bankRecordId: result.bankId ?? null,
        }
      });
    }

    // 5. Update Run metrics
    const totalProcessed = ledgers.length;
    const matchRate = totalProcessed > 0 ? (exactMatches / totalProcessed) * 100 : 0;

    await prisma.reconciliationRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        metrics: JSON.stringify({
          totalProcessed,
          exactMatches,
          exceptions,
          matchRate: matchRate.toFixed(2)
        })
      }
    });

    console.log(`Reconciliation run ${run.id} completed. Match rate: ${matchRate.toFixed(2)}%`);
    return run.id;
  } catch (error) {
    console.error('Reconciliation run failed:', error);
    await prisma.reconciliationRun.update({
      where: { id: run.id },
      data: { status: 'FAILED' }
    });
    throw error;
  }
}
