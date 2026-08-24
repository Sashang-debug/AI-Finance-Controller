import Groq from 'groq-sdk';
import { prisma } from '../prisma.js';

let groq: Groq | null = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (e) {
  console.error("Failed to initialize Groq SDK:", e);
}

export async function explainException(resultId: string) {
  try {
    const result = await prisma.reconciliationResult.findUnique({
      where: { id: resultId },
      include: {
        ledgerRecord: true,
        settlementRecord: true,
        bankRecord: true
      }
    });

    if (!result) {
      return { error: 'Result not found' };
    }

    if (!groq) {
      // Fallback handling when AI is unavailable
      const fallbackExplanation = "AI is currently unavailable to explain this exception.";
      const fallbackRecommendation = "Please manually review the discrepancy.";
      
      await prisma.reconciliationResult.update({
        where: { id: resultId },
        data: {
          aiExplanation: fallbackExplanation,
          aiRecommendation: fallbackRecommendation
        }
      });
      
      return { explanation: fallbackExplanation, recommendation: fallbackRecommendation };
    }

    // Construct prompt data
    const dataForAI = {
      classification: result.classification,
      ruleUsed: result.ruleUsed,
      amountDifference: result.amountDifference,
      ledger: result.ledgerRecord ? {
        amount: result.ledgerRecord.amount,
        transactionDate: result.ledgerRecord.transactionDate,
        transactionId: result.ledgerRecord.transactionId
      } : null,
      settlement: result.settlementRecord ? {
        expectedSettlement: result.settlementRecord.settlementAmount,
        grossAmount: result.settlementRecord.grossAmount,
        fee: result.settlementRecord.fee,
        tax: result.settlementRecord.tax,
        date: result.settlementRecord.settlementDate,
        utr: result.settlementRecord.utr
      } : null,
      bank: result.bankRecord ? {
        amount: result.bankRecord.amount,
        date: result.bankRecord.transactionDate,
        utr: result.bankRecord.utr
      } : null
    };

    const prompt = `
You are a financial reconciliation assistant. A transaction exception has occurred.
Analyze the following discrepancy and provide a plain-English explanation and a recommended action for the finance team.

Data:
${JSON.stringify(dataForAI, null, 2)}

Respond ONLY with a JSON object in this exact format, with no markdown formatting or extra text:
{
  "explanation": "A clear, concise, plain-English explanation of why this discrepancy occurred.",
  "recommendation": "A suggested next step to investigate or resolve it."
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content || '{}';
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(aiContent);
    } catch (e) {
      parsedContent = {
        explanation: "Failed to parse AI response. " + aiContent,
        recommendation: "Manual review required."
      };
    }

    const explanation = parsedContent.explanation || "No explanation provided.";
    const recommendation = parsedContent.recommendation || "No recommendation provided.";

    await prisma.reconciliationResult.update({
      where: { id: resultId },
      data: {
        aiExplanation: explanation,
        aiRecommendation: recommendation
      }
    });

    return { explanation, recommendation };

  } catch (error: any) {
    console.error("AI Service Error:", error);
    
    // Graceful fallback on error
    const errorExplanation = "An error occurred while generating the AI explanation.";
    const errorRecommendation = "Please try again later or investigate manually.";
    
    await prisma.reconciliationResult.update({
      where: { id: resultId },
      data: {
        aiExplanation: errorExplanation,
        aiRecommendation: errorRecommendation
      }
    });
    
    return { explanation: errorExplanation, recommendation: errorRecommendation };
  }
}
