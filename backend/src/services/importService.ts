import fs from 'fs';
import csv from 'csv-parser';
import { prisma } from '../prisma.js';

export async function importLedger(filePath: string) {
  const records: any[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', async () => {
        try {
          // Bulk create
          await prisma.ledgerRecord.createMany({
            data: records.map(r => ({
              transactionId: r.transaction_id,
              orderId: r.order_id,
              paymentId: r.payment_id || null,
              amount: parseFloat(r.amount),
              currency: r.currency || 'INR',
              transactionDate: new Date(r.transaction_date),
              customerReference: r.customer_reference || null,
              status: r.status,
            })),
          });
          resolve({ count: records.length });
        } catch (e) {
          reject(e);
        }
      })
      .on('error', reject);
  });
}

export async function importSettlements(filePath: string) {
  const records: any[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', async () => {
        try {
          await prisma.settlementRecord.createMany({
            data: records.map(r => ({
              paymentId: r.payment_id,
              orderId: r.order_id,
              settlementId: r.settlement_id,
              utr: r.utr,
              grossAmount: parseFloat(r.gross_amount),
              fee: parseFloat(r.fee),
              tax: parseFloat(r.tax),
              adjustment: parseFloat(r.adjustment),
              settlementAmount: parseFloat(r.settlement_amount),
              settlementDate: new Date(r.settlement_date),
              status: r.status,
            })),
          });
          resolve({ count: records.length });
        } catch (e) {
          reject(e);
        }
      })
      .on('error', reject);
  });
}

export async function importBankStatement(filePath: string) {
  const records: any[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', async () => {
        try {
          await prisma.bankRecord.createMany({
            data: records.map(r => ({
              bankTransactionId: r.bank_transaction_id,
              utr: r.utr,
              amount: parseFloat(r.amount),
              transactionDate: new Date(r.transaction_date),
              description: r.description,
              creditDebit: r.credit_debit,
              status: r.status,
            })),
          });
          resolve({ count: records.length });
        } catch (e) {
          reject(e);
        }
      })
      .on('error', reject);
  });
}
