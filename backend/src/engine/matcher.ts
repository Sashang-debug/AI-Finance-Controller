import type { LedgerRecord, SettlementRecord, BankRecord } from '@prisma/client';

export type Classification = 
  | 'EXACT_MATCH'
  | 'AMOUNT_MISMATCH'
  | 'DATE_MISMATCH'
  | 'MISSING_SETTLEMENT'
  | 'MISSING_BANK_TRANSACTION'
  | 'ORPHAN_BANK_TRANSACTION'
  | 'UNRESOLVED';

export interface MatchResult {
  ledgerId?: string;
  settlementId?: string;
  bankId?: string;
  classification: Classification;
  ruleUsed: string;
  amountDifference?: number;
  notes?: string;
}

export function matchRecords(
  ledgers: LedgerRecord[], 
  settlements: SettlementRecord[], 
  banks: BankRecord[]
): MatchResult[] {
  const results: MatchResult[] = [];
  const processedSettlements = new Set<string>();
  const processedBanks = new Set<string>();

  // Map for quick lookups
  const settlementsByOrderId = new Map<string, SettlementRecord>();
  for (const s of settlements) {
    settlementsByOrderId.set(s.orderId, s);
  }

  const banksByUtr = new Map<string, BankRecord>();
  for (const b of banks) {
    banksByUtr.set(b.utr, b);
  }

  // 1. Ledger -> Settlement -> Bank
  for (const ledger of ledgers) {
    const settlement = settlementsByOrderId.get(ledger.orderId);
    
    if (!settlement) {
      results.push({
        ledgerId: ledger.id,
        classification: 'MISSING_SETTLEMENT',
        ruleUsed: 'LEDGER_NO_SETTLEMENT',
        notes: `No settlement found for order ${ledger.orderId}`
      });
      continue;
    }

    processedSettlements.add(settlement.id);

    const bank = banksByUtr.get(settlement.utr);
    
    if (!bank) {
      results.push({
        ledgerId: ledger.id,
        settlementId: settlement.id,
        classification: 'MISSING_BANK_TRANSACTION',
        ruleUsed: 'SETTLEMENT_NO_BANK',
        notes: `No bank transaction found for UTR ${settlement.utr}`
      });
      continue;
    }

    processedBanks.add(bank.id);

    // We have all three. Compare amounts and dates.
    // Amounts
    const expectedBankAmount = settlement.settlementAmount;
    const amountDifference = Math.abs(bank.amount - expectedBankAmount);

    if (amountDifference > 0.01) { // Floating point tolerance
      results.push({
        ledgerId: ledger.id,
        settlementId: settlement.id,
        bankId: bank.id,
        classification: 'AMOUNT_MISMATCH',
        ruleUsed: 'BANK_AMOUNT_DIFFERS_SETTLEMENT',
        amountDifference,
        notes: `Bank amount ${bank.amount} differs from settlement amount ${expectedBankAmount}`
      });
      continue;
    }

    // Dates
    const settlementDate = new Date(settlement.settlementDate).getTime();
    const bankDate = new Date(bank.transactionDate).getTime();
    const diffDays = Math.abs(bankDate - settlementDate) / (1000 * 60 * 60 * 24);

    if (diffDays > 3) {
      results.push({
        ledgerId: ledger.id,
        settlementId: settlement.id,
        bankId: bank.id,
        classification: 'DATE_MISMATCH',
        ruleUsed: 'BANK_DATE_TOO_LATE',
        amountDifference: 0,
        notes: `Bank date is ${diffDays.toFixed(1)} days apart from settlement`
      });
      continue;
    }

    // Exact Match
    results.push({
      ledgerId: ledger.id,
      settlementId: settlement.id,
      bankId: bank.id,
      classification: 'EXACT_MATCH',
      ruleUsed: 'EXACT_MATCH_ALL_RULES',
      amountDifference: 0,
      notes: 'Fully matched across ledger, settlement, and bank'
    });
  }

  // 2. Identify Orphaned Settlements
  for (const s of settlements) {
    if (!processedSettlements.has(s.id)) {
      results.push({
        settlementId: s.id,
        classification: 'UNRESOLVED',
        ruleUsed: 'ORPHAN_SETTLEMENT',
        notes: `Settlement found without matching ledger orderId: ${s.orderId}`
      });
    }
  }

  // 3. Identify Orphaned Bank Records
  for (const b of banks) {
    if (!processedBanks.has(b.id)) {
      results.push({
        bankId: b.id,
        classification: 'ORPHAN_BANK_TRANSACTION',
        ruleUsed: 'ORPHAN_BANK',
        notes: `Bank transaction found without matching settlement UTR: ${b.utr}`
      });
    }
  }

  return results;
}
