import { importLedger, importSettlements, importBankStatement } from '../services/importService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Importing ledger...');
  await importLedger(path.join(__dirname, '../../data/ledger.csv'));
  
  console.log('Importing settlements...');
  await importSettlements(path.join(__dirname, '../../data/settlements.csv'));
  
  console.log('Importing bank statements...');
  await importBankStatement(path.join(__dirname, '../../data/bank_statement.csv'));
  
  console.log('Data import complete!');
}

run();
