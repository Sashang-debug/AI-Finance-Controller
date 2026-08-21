import fs from 'fs';
import path from 'path';
import seedrandom from 'seedrandom';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility to write CSV
function writeCsv(filename: string, headers: string[], data: any[][]) {
  const filepath = path.join(__dirname, '..', '..', 'data', filename);
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  fs.writeFileSync(filepath, csvContent);
  console.log(`Generated ${filename}`);
}

export function generateSyntheticData(count = 100) {
  const ledgerData: any[][] = [];
  const settlementData: any[][] = [];
  const bankData: any[][] = [];
  const groundTruthData: any[][] = [];

  const baseDate = new Date("2026-08-01T00:00:00.000Z"); // Fixed base date
  const rng = seedrandom('buildathon-seed-v1');

  for (let i = 0; i < count; i++) {
    const orderId = `ORD-${1000 + i}`;
    
    // Deterministic random replacements for UUIDs
    const uniqueString = () => Math.abs(rng.int32()).toString(16);
    
    const paymentId = `pay_${uniqueString()}`;
    const transactionId = `txn_${uniqueString()}`;
    const utr = `UTR${Math.floor(rng() * 1000000000000).toString().padStart(12, '0')}`;
    const bankTransactionId = `btxn_${uniqueString()}`;
    const settlementId = `setl_${uniqueString()}`;
    
    let baseAmount = Math.floor(rng() * 9000) + 1000; // 1000 to 10000
    let fee = parseFloat((baseAmount * 0.02).toFixed(2)); // 2% fee
    let tax = parseFloat((fee * 0.18).toFixed(2)); // 18% GST on fee
    let expectedSettlement = parseFloat((baseAmount - fee - tax).toFixed(2));

    const scenarioRoll = rng();
    let scenario = "EXACT_MATCH";

    if (scenarioRoll < 0.6) {
      scenario = "EXACT_MATCH";
    } else if (scenarioRoll < 0.7) {
      scenario = "AMOUNT_MISMATCH"; // Bank amount doesn't match expected settlement
    } else if (scenarioRoll < 0.8) {
      scenario = "MISSING_BANK_TRANSACTION";
    } else if (scenarioRoll < 0.9) {
      scenario = "MISSING_SETTLEMENT";
    } else {
      scenario = "DATE_MISMATCH"; // Date drift
    }

    const tDate = new Date(baseDate);
    tDate.setDate(tDate.getDate() - Math.floor(rng() * 30));
    
    const sDate = new Date(tDate);
    sDate.setDate(sDate.getDate() + 1);

    const bDate = new Date(sDate);
    if (scenario === "DATE_MISMATCH") {
      bDate.setDate(bDate.getDate() + 5); // delay
    }

    // Always create Ledger
    ledgerData.push([
      transactionId, orderId, paymentId, baseAmount, 'INR', tDate.toISOString(), `CUST-${i}`, 'CAPTURED'
    ]);

    // Settlement
    if (scenario !== "MISSING_SETTLEMENT") {
      settlementData.push([
        paymentId, orderId, settlementId, utr, baseAmount, fee, tax, 0, expectedSettlement, sDate.toISOString(), 'PROCESSED'
      ]);
    }

    // Bank
    if (scenario !== "MISSING_BANK_TRANSACTION") {
      let bankAmount = expectedSettlement;
      if (scenario === "AMOUNT_MISMATCH") {
        bankAmount = parseFloat((expectedSettlement - 100).toFixed(2)); // short by 100
      }
      bankData.push([
        bankTransactionId, utr, bankAmount, bDate.toISOString(), `Razorpay Settlement ${settlementId}`, 'CREDIT', 'CLEARED'
      ]);
    }

    groundTruthData.push([
      orderId, scenario
    ]);
  }

  writeCsv('ledger.csv', [
    'transaction_id', 'order_id', 'payment_id', 'amount', 'currency', 'transaction_date', 'customer_reference', 'status'
  ], ledgerData);

  writeCsv('settlements.csv', [
    'payment_id', 'order_id', 'settlement_id', 'utr', 'gross_amount', 'fee', 'tax', 'adjustment', 'settlement_amount', 'settlement_date', 'status'
  ], settlementData);

  writeCsv('bank_statement.csv', [
    'bank_transaction_id', 'utr', 'amount', 'transaction_date', 'description', 'credit_debit', 'status'
  ], bankData);

  writeCsv('ground_truth.csv', [
    'order_id', 'expected_classification'
  ], groundTruthData);
}

// Since "type": "module" is set, process.argv comparison with file url is used
import { fileURLToPath as fu2p } from 'url';
if (process.argv[1] === fu2p(import.meta.url)) {
  generateSyntheticData(100);
}
