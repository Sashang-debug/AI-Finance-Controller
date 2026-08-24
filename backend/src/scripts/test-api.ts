import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

async function testApi() {
  try {
    console.log('Testing /api/reconciliation/run...');
    const runRes = await fetch(`${BASE_URL}/reconciliation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!runRes.ok) throw new Error(`Run failed: ${await runRes.text()}`);
    const runData = await runRes.json();
    console.log('Run successful, Run ID:', runData.runId);

    console.log('\nTesting /api/reconciliation/runs...');
    const runsRes = await fetch(`${BASE_URL}/reconciliation/runs`);
    const runsData = await runsRes.json();
    console.log(`Found ${runsData.length} runs.`);

    console.log(`\nTesting /api/reconciliation/runs/${runData.runId}/exceptions...`);
    const exceptionsRes = await fetch(`${BASE_URL}/reconciliation/runs/${runData.runId}/exceptions`);
    const exceptionsData = await exceptionsRes.json();
    console.log(`Found ${exceptionsData.length} exceptions.`);

    if (exceptionsData.length > 0) {
      const exceptionId = exceptionsData[0].id;
      console.log(`\nTesting /api/exceptions/${exceptionId}/explain...`);
      const explainRes = await fetch(`${BASE_URL}/exceptions/${exceptionId}/explain`, {
        method: 'POST'
      });
      const explainData = await explainRes.json();
      console.log('Explanation result:', JSON.stringify(explainData, null, 2));

      console.log(`\nTesting /api/exceptions/${exceptionId}/review...`);
      const reviewRes = await fetch(`${BASE_URL}/exceptions/${exceptionId}/review`, {
        method: 'POST'
      });
      const reviewData = await reviewRes.json();
      console.log('Review result:', reviewData.message);
    } else {
      console.log('No exceptions found to test explanation.');
    }

    console.log('\nAll tests completed.');
  } catch (err) {
    console.error('API Test Error:', err);
  }
}

testApi();
