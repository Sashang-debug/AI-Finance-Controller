# AI Finance Controller — Implementation Plan

## 1. Project Objective

Build an AI-assisted multi-source financial reconciliation system for Razorpay AI Buildathon Track 04 — AI Finance Controller.

The system will reconcile financial records from:
1. Internal merchant ledger
2. Razorpay-style settlement records
3. Bank statement records

It will determine which transactions match exactly, match with discrepancies, or cannot be confidently matched. It will calculate measurable reconciliation metrics and use an LLM to explain exceptions in plain language.

The core financial matching decision must remain deterministic and auditable. AI must not independently decide whether money matches.

---

## 2. Buildathon Alignment

The implementation must satisfy the Track 04 requirements:

- Close one finance-operations loop
- Operate over a 50+ record synthetic-data batch
- Report measured match/reconciliation accuracy
- Report unresolved exceptions honestly
- Demonstrate throughput
- Provide a reliable and explainable workflow

Chosen direction: **Multi-source reconciliation**

```text
Financial Records
       ↓
Import / Normalize
       ↓
Reconciliation
       ↓
Match / Partial Match / Exception
       ↓
AI Explanation
       ↓
Review / Resolution
       ↓
Metrics + Audit Trail
```

---

## 3. Product Vision

The product should behave like an automated finance controller.

A finance user should be able to:

1. Upload or load financial records.
2. Start a reconciliation run.
3. See the overall reconciliation result.
4. Inspect matches and exceptions.
5. Understand why a transaction was classified a certain way.
6. Ask the AI to explain an exception.
7. Review or resolve exceptions.
8. View final metrics and the audit trail.

The system should optimize for **correctness and explainability**, not artificially maximize the match rate.

An uncertain transaction must remain an exception rather than being incorrectly marked as reconciled.

---

## 4. Scope

### V1 — Mandatory

- Three financial data sources
- Synthetic-data generator
- Data normalization
- Deterministic reconciliation engine
- Exact matching
- Tolerance/fuzzy matching
- Fee and settlement calculations
- Missing-record detection
- Duplicate detection
- Date discrepancy detection
- Exception classification
- Match-rate calculation
- Ground-truth evaluation
- Audit trail
- REST API
- React dashboard
- AI exception explanation
- Tests
- Seed/demo dataset
- README
- Architecture documentation
- Deployment

### V2 — Only if V1 is stable

- PDF bank statement ingestion
- Screenshot bank statement ingestion
- OCR extraction
- UTR extraction from documents
- Natural-language "Ask AI"
- AI-assisted investigation suggestions
- Additional reconciliation rules
- More advanced analytics

V2 must never delay completion of V1.

---

## 5. Core Architecture

```text
                         React Dashboard
                               │
                               ▼
                         Express API
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         Import Service   Reconciliation    Reporting
                              Engine
                               │
                               ▼
                    Deterministic Matching
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
             Exact         Partial        Exception
             Match          Match          Bucket
                                              │
                                              ▼
                                       AI Explanation
                                              │
                                              ▼
                                      Human-readable
                                         diagnosis

                               │
                               ▼
                       PostgreSQL + Prisma
```

The frontend must never contain financial reconciliation logic.

The backend owns:
- Data processing
- Matching
- Financial calculations
- Classification
- Metrics
- Audit information
- AI orchestration

---

## 6. Technology Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS or clean component-based CSS
- Recharts only where charts provide meaningful value

Design inspiration:
- Razorpay fintech aesthetic
- Professional financial dashboards
- Clean typography
- White/dark navy foundation
- Red accent
- Clear status indicators
- Minimal animations

The UI should be inspired by Razorpay, not copied from Razorpay.

### Backend
- Node.js
- Express
- TypeScript

### Database
- PostgreSQL
- Prisma ORM

### AI
- Groq API
- Llama model

AI responsibility: **exception explanation only**.

If AI is unavailable, reconciliation must continue to work.

### Data
- CSV
- Synthetic data generator
- Ground-truth dataset

### Deployment
- Render or another simple reliable deployment platform

Avoid unnecessary infrastructure.

---

## 7. Financial Data Model

### Internal Ledger

Example fields:

```text
transaction_id
order_id
payment_id
amount
currency
transaction_date
customer_reference
status
```

### Razorpay-style Settlement

Example fields:

```text
payment_id
order_id
settlement_id
utr
gross_amount
fee
tax
adjustment
settlement_amount
settlement_date
status
```

### Bank Statement

Example fields:

```text
bank_transaction_id
utr
amount
transaction_date
description
credit_debit
status
```

The exact schema must be finalized before implementation.

---

## 8. Synthetic Dataset

Create a deterministic generator capable of producing 50+ records.

The default development dataset should contain approximately 100 transactions.

The generator must deliberately create known scenarios:

- Exact matches
- Fee differences
- Tax differences
- Date drift
- Missing settlement
- Missing bank transaction
- Duplicate transaction
- Amount mismatch
- Wrong UTR
- Extra bank transaction
- Extra settlement
- Unresolved transaction

The generator must produce a **ground-truth classification** for every test transaction.

Never modify the ground truth just to make the reconciliation engine look better.

---

## 9. Reconciliation Engine

The reconciliation engine is the most important component and must be deterministic.

### Stage 1 — Normalize

Normalize:
- Dates
- Currency
- Amount representation
- UTR
- Transaction IDs
- Payment IDs
- Status values

### Stage 2 — Exact Match

Attempt matching using the strongest identifiers:
1. UTR
2. Payment ID
3. Order/transaction reference

Only use identifiers according to rules defined in the reconciliation specification.

### Stage 3 — Financial Validation

Calculate:

```text
Expected Settlement =
Gross Amount
- Fee
- Tax
+/- Adjustments
```

Compare expected settlement with actual settlement/bank amount.

### Stage 4 — Tolerance Matching

If exact identifiers are unavailable, use controlled matching based on:
- Amount
- Date window
- UTR similarity where appropriate
- Reference information

Tolerance values must be explicit and configurable.

### Stage 5 — Classification

Every transaction must receive a deterministic classification.

Example:

```text
EXACT_MATCH
PARTIAL_MATCH
AMOUNT_MISMATCH
DATE_MISMATCH
MISSING_SETTLEMENT
MISSING_BANK_TRANSACTION
DUPLICATE
UNRESOLVED
```

The final classification taxonomy must be finalized before implementation.

---

## 10. Explainability and Audit Trail

Every reconciliation decision must be traceable.

Example:

```text
Transaction: ORD-1042

Result:
PARTIAL_MATCH

Rule:
UTR_MATCH + SETTLEMENT_AMOUNT_CHECK

Expected:
₹9,764

Actual:
₹9,700

Difference:
₹64
```

The system must store enough information to answer:
- Which records were compared?
- Which rule matched them?
- Why were they classified this way?
- What amount difference existed?
- What date difference existed?
- Why was the transaction unresolved?

No financial decision should depend on an unexplained LLM output.

---

## 11. AI Exception Explanation

The AI receives structured information from the reconciliation engine.

Example input:

```text
Transaction:
ORD-1042

Ledger:
₹10,000

Settlement:
₹9,764

Bank:
₹9,700

Difference:
₹64

Classification:
AMOUNT_MISMATCH
```

The AI should produce:
- Plain-English explanation
- Likely cause
- Recommended investigation step

The AI must not:
- Change the reconciliation result
- Invent financial records
- Invent transaction IDs
- Invent amounts
- Mark an exception as reconciled
- Override deterministic rules

AI output should be clearly labeled as an explanation/recommendation.

---

## 12. Evaluation System

The application must contain a reproducible evaluation process.

The synthetic-data generator provides ground truth.

The reconciliation engine processes the generated dataset.

The evaluation system compares:

```text
Ground Truth
      vs
Engine Result
```

Report:
- Total records
- Exact matches
- Partial matches
- Unresolved records
- Incorrect classifications
- Match rate
- Accuracy
- Processing time
- Throughput

Actual numbers must always come from real execution. Never hardcode metrics.

---

## 13. React Dashboard

### Dashboard

Display:
- Total transactions
- Match rate
- Exact matches
- Partial matches
- Exceptions
- Processing time
- Reconciliation run status

### Reconciliation Results

Provide a table with:
- Transaction ID
- Amount
- Status
- Source comparison
- Difference
- Rule used

### Exception Detail

Display:
- Transaction information
- Ledger values
- Settlement values
- Bank values
- Difference
- Classification
- Matching rule
- AI explanation
- Recommended action
- Review status

### Audit Trail

Show the sequence of decisions made by the engine.

---

## 14. API Structure

Initial API structure:

```text
GET    /api/health

POST   /api/import/ledger
POST   /api/import/settlements
POST   /api/import/bank

POST   /api/reconciliation/run

GET    /api/reconciliation/runs
GET    /api/reconciliation/runs/:id

GET    /api/reconciliation/runs/:id/results
GET    /api/reconciliation/runs/:id/exceptions

POST   /api/exceptions/:id/explain
POST   /api/exceptions/:id/review

GET    /api/metrics
```

The exact API should be finalized during the architecture phase.

Do not create unnecessary endpoints.

---

## 15. Security

Minimum requirements:
- API keys only on backend
- `.env` for secrets
- `.env` excluded from Git
- Input validation
- File validation
- No sensitive data in logs
- No secrets committed to repository
- AI requests contain only required structured data
- Frontend never receives provider API keys

---

## 16. Testing Strategy

### Unit Tests

Test:
- Amount calculations
- Fee calculations
- Date tolerance
- Exact matching
- Partial matching
- Duplicate detection
- Missing records
- Classification
- Metrics

### Integration Tests

```text
CSV
 ↓
Import
 ↓
Database
 ↓
Reconciliation
 ↓
Results
```

### Evaluation Test

Run the full synthetic dataset and compare against ground truth.

### Failure Tests

Explicitly test:
- Missing columns
- Invalid CSV
- Duplicate input
- Invalid amount
- Invalid date
- Missing UTR
- AI API failure
- Database failure

---

## 17. Development Rules for Antigravity

1. Do not change the architecture without documenting the reason.
2. Do not introduce unnecessary dependencies.
3. Do not implement features outside the current phase.
4. Do not use an LLM for deterministic financial matching.
5. Every reconciliation decision must be traceable to a rule.
6. Never hardcode evaluation results.
7. Never modify ground truth to make tests pass.
8. Keep frontend and backend responsibilities separate.
9. Keep AI logic isolated from the reconciliation engine.
10. Write tests for important business logic.
11. Run tests after significant changes.
12. Do not proceed to the next phase if the current phase acceptance criteria fail.
13. Preserve working functionality when adding features.
14. Prefer simple implementations that can be completely explained during an interview.
15. Do not add microservices, queues, Kubernetes, Kafka, Redis, or other infrastructure unless genuinely required.

---

## 18. Implementation Stages

### Stage 1: Foundation & Data
**Goal:** Establish the project skeleton and ensure we have realistic data to work with.

Implement & Deliver:
- Architecture finalization (Schemas, APIs, Engine logic)
- Monorepo/Project setup (React frontend + Node/Express backend + Prisma)
- Database schema and migrations
- Synthetic Data Generator & Data Import Pipeline

**Acceptance:** Architecture is consistent. Backend, frontend, database, and health endpoints work. 100+ synthetic records can be generated and imported successfully.

### Stage 2: Core Deterministic Engine
**Goal:** Build the brain of the reconciliation system without any AI or UI dependencies.

Implement:
- Normalization logic
- Exact Matching & Financial Validation
- Tolerance/Fuzzy Matching
- Exception Classification & Audit trailing
- **Evaluation Module:** Ground-truth comparison and metrics generation

**Acceptance:** All deterministic engine tests pass. Evaluation produces reproducible metrics without hardcoded values.

### Stage 3: AI & API Integration
**Goal:** Connect the engine to the outside world and integrate the AI explanation layer.

Implement:
- Express REST API implementation (connecting DB/Engine)
- AI integration (Groq/Llama) for exception explanation
- Fallback handling for AI services
- API testing

**Acceptance:** A complete reconciliation run can be triggered through the API. AI explains exceptions without changing deterministic results, and system works if AI is unavailable.

### Stage 4: User Experience
**Goal:** Build the React dashboard and wire it up to the backend.

Implement:
- UI components (Dashboard, Results, Exception Detail)
- End-to-end integration (Upload -> Reconcile -> AI Explanation -> View Results)
- Audit trail visualization

**Acceptance:** User can complete the end-to-end workflow through the UI.

### Stage 5: Hardening & Delivery
**Goal:** Finalize the product for the buildathon submission.

Implement & Prepare:
- End-to-end testing (Failure tests, edge cases)
- Deployment (Render/Vercel/etc.)
- Documentation (README, Demo Video, Pitch)
- Final buildathon submission preparation

**Acceptance:** Working production deployment, reproducible metrics, and all submission materials are complete.

---

## 19. Priority System

### P0 — Must Work

```text
Synthetic data
      ↓
Reconciliation
      ↓
Correct results
      ↓
Measured metrics
      ↓
React dashboard
```

### P1 — Important

```text
AI exception explanation
Audit trail
Deployment
Tests
```

### P2 — Nice to Have

```text
OCR
PDF upload
Ask AI
Advanced analytics
Suggested actions
```

Never sacrifice P0 features for P2 features.

---

## 20. Definition of Done

- [ ] 50+ records are processed
- [ ] Synthetic data contains known discrepancies
- [ ] Three financial sources are supported
- [ ] Deterministic reconciliation works
- [ ] Match rate is calculated automatically
- [ ] Ground-truth evaluation exists
- [ ] Unresolved exceptions are surfaced
- [ ] Every result has an explainable rule
- [ ] AI can explain exceptions
- [ ] AI cannot override financial decisions
- [ ] React dashboard works
- [ ] Tests pass
- [ ] Production deployment works
- [ ] README is complete
- [ ] Architecture diagram is complete
- [ ] Demo can be completed in approximately 5 minutes
- [ ] Final metrics are reproducible

---

## 21. Final Product Flow

```text
                USER
                 │
                 ▼
        Upload financial data
                 │
                 ▼
       Start reconciliation
                 │
                 ▼
        Normalize records
                 │
                 ▼
       Deterministic engine
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
      Match   Partial  Exception
        │        │        │
        └────────┼────────┘
                 ▼
           Calculate metrics
                 │
                 ▼
          Generate report
                 │
                 ▼
       AI explains exceptions
                 │
                 ▼
          Human reviews
                 │
                 ▼
       Final finance report
```

## Core Principle

**Automate what can be determined confidently. Explain what cannot. Never pretend an unresolved financial transaction is resolved.**
