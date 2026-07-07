# AND.e Insurance Customer 360 — 20-Minute Demo Script

## Pre-Demo Setup

- Ensure `ADHOC_WH` is running: `ALTER WAREHOUSE ADHOC_WH RESUME`
- Open the app: https://edgb-sfseeurope-ie-demo10.snowflakecomputing.app
- Logged-in user shows "Colm Moynihan" with date/time and version in the top-left corner
- Have Snowsight open as backup

---

## Demo Flow (20 minutes)

### 1. Opening — Context Setting (2 minutes)

> "What you're looking at is a production Customer 360 application built entirely on Snowflake. It's deployed as a Next.js app on Snowpark Container Services — no external hosting, no third-party infrastructure.
>
> This is an insurance company demo — AND.e Insurance — that unifies customer identity across three source systems:
>
> - **Salesforce CRM** — 6.5 million contacts
> - **SAP Customer Master (KNA1)** — 1,197 business accounts
> - **Web interactions** — form submissions, live chat, website activity
>
> The system uses Jaro-Winkler fuzzy matching to resolve duplicates — even when names are misspelled or data is incomplete — and presents a single golden record for each customer.
>
> Notice in the top-left: the logged-in user, today's date and time, and the app version. This is a fully authenticated app running on SPCS."

**Point out the nav tabs:** Home, Customer, Call Analytics, Calls by Agent, Red Flags, Policies, Claims, Agent

---

### 2. Customer Search — Identity Resolution (3 minutes)

**Action:** Click **Customer** tab. The email field is pre-filled with `colm.moynihan@snowflake.com`. Click **Search**.

> "I'll search for myself by email. The system resolves my identity across all source systems and shows the golden record — the best version of my data selected from 61 different records across Salesforce, SAP, and web forms."

**Point out:**
- Multiple name variants found: "Colm Moynihan", "Colm W Moynihan", "Moynihan Colm"
- RECORD_COUNT showing how many source records were linked
- Customer Summary: Total premiums, churn score, tier

**Action:** Click a customer row to see the full summary with churn analysis.

> "The churn score is calculated from five factors — call sentiment, number of policies, spend, tenure, and age. Each is weighted and scored out of 100. This customer is low risk with a score of 28."

**Show:** Premium breakdown pie chart, dependents table, churn factor bar chart.

**Action:** Scroll down to see **Duplicates Found** section.

> "Below the summary, we see all the source system records that were fuzzy-matched into this cluster. Notice SAP has 'Collum Moynihan' — a misspelling — but the system still matched it with a 96% Jaro-Winkler similarity score."

---

### 3. Motor Policies — PDF Downloads (3 minutes)

**Action:** Click **Policies** tab. Email is pre-filled with `colm.moynihan@snowflake.com`. Results load automatically.

> "Here are Colm's motor insurance policies. Two Toyota policies — a Corolla Comprehensive at EUR 1,245 and a RAV4 Third-Party Fire & Theft at EUR 890. Both are active."

**Point out:**
- Policy values bar chart
- Signature details (customer + provider signatures)
- Status badges (Active/Expired)
- **Download PDF** button on each policy

**Action:** Click **Download PDF** on the Toyota Corolla policy.

> "Each policy is stored as a full-text document on a Snowflake stage. We generate a presigned URL and the PDF downloads directly — no external file storage needed. The full policy text is also searchable by our AI agent."

---

### 4. Claims Search — Date Filtering and PDF Export (3 minutes)

**Action:** Click **Claims** tab. Email defaults to `colm.moynihan@snowflake.com`. Adjust the **Claim Date From** to `2025-01-01` and click **Search**.

> "The Claims panel lets us search by Claim ID, customer name, email, or date range. Let me broaden the date range to see all of Colm's claims."

**Results show 4 claims:**
- CLM-001: Reinsurance — EUR 4,200 (Approved)
- CLM-002: PPI — EUR 12,500 (Approved)
- CLM-003: Private Motor Insurance — EUR 8,900 (Pending)
- CLM-026: Commercial Motor Fleet — EUR 42,000 (Pending)

**Point out:**
- Colour-coded claim types (Motor = blue, Commercial = orange, PPI = green, Reinsurance = purple)
- Status badges (Approved/Pending)
- Stats: Total claims count, total EUR value, approved count, pending count

**Action:** Click **Download PDF** on CLM-003.

> "Each claim can be exported as a PDF report — generated on the fly from the claim data. It includes all details: claim ID, customer, type, amount, status, and full description. Useful for compliance, audit trails, or sharing with adjusters."

---

### 5. Call Analytics — Contact Centre Overview (2 minutes)

**Action:** Click **Call Analytics** tab.

> "This is the contact centre dashboard. We're looking at aggregate call data across all agents — sentiment distribution, average call duration, calls per agent, and top keywords detected by AI."

**Point out:**
- Sentiment breakdown chart (Positive/Neutral/Negative split)
- Calls per agent ranking
- Top AI-detected keywords
- Average handle time

> "All sentiment analysis is done using Cortex AI functions — no external ML services or GPU infrastructure. The keywords are extracted from call transcripts using AI_EXTRACT."

---

### 6. Calls by Agent — Audio Playback and Download (3 minutes)

**Action:** Click **Calls by Agent** tab. The Agent dropdown shows `<All>` by default.

> "We can filter calls by agent using this dropdown. Let me select a specific agent."

**Action:** Select an agent from the dropdown (e.g., "Patrick Murphy"). The call list filters instantly.

> "Now I can see just Patrick Murphy's calls. Let me click on one with negative sentiment."

**Action:** Click on a call with "Negative" sentiment (e.g., CALL-197).

> "Here's the full call detail — agent, date, duration, type, and the AI-generated summary. The key thing here is we can actually **play the recording** directly in the browser."

**Action:** Click play on the audio player.

> "The audio is stored on a Snowflake internal stage. We fetch it via a presigned URL and stream it with full seeking support. There's also a **Download Recording** button if you need the file offline."

**Action:** Scroll down to show the transcript and sentiment analysis.

> "Below we have the full transcript and sentiment breakdown. The transcript was generated using Cortex AI_TRANSCRIBE, and the sentiment scored automatically."

---

### 7. Red Flag Words — Call Governance (2 minutes)

**Action:** Click **Red Flags** tab.

> "This is the call governance panel. The system scans every call transcript for red-flag words across four categories: Profanity, Legal threats, Financial terms, and GDPR-related language."

**Point out:**
- Summary stats: total flagged calls, pending review, escalated
- Word category breakdown
- Individual flagged calls with context snippets
- Review status (Pending/Reviewed/Escalated)

> "When a flag is detected, it shows the exact word matched, the category, and the surrounding context from the transcript. Compliance teams can review and mark as Reviewed or Escalate for further action."

**Action:** Click the **Download Word List** button (PDF).

> "The complete red-flag word list is downloadable as a PDF — useful for training new agents or audit documentation."

---

### 8. AI Agent — Natural Language Queries (2 minutes)

**Action:** Click **Agent** tab. Select a model from the dropdown (e.g., "Claude Opus 4-8"). Click a sample question: "What Toyota vehicles does Colm Moynihan have insured?"

> "Our AND-E Agent uses Cortex Agent with both Cortex Search and data table tools. I can ask natural language questions about any customer data."

**Wait for response.** Point out the metadata bar showing model name and timestamp.

> "Notice above the answer — it shows which model answered and exactly when the question was asked. This is important for audit trails and comparing model performance."

**Action:** Ask a follow-up: "What is the excess on the Toyota Corolla policy?"

> "The agent searches the contract text semantically — it's not doing keyword matching, it's understanding the meaning of my question and finding the relevant clause in the policy document."

**Action:** Ask: "Which customers have negative call sentiment?"

> "I can also query structured data. Here it's running SQL against the calls table and returning results in a formatted card layout."

---

### 9. dbt Pipeline — How Matching Works (optional, if time allows)

**Action:** Open Snowsight worksheet.

> "Under the hood, the identity resolution runs as a dbt project deployed natively in Snowflake."

```sql
-- Show the 4-layer architecture
SELECT TABLE_SCHEMA, TABLE_NAME, ROW_COUNT
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_CATALOG = 'ANDE_DB'
  AND TABLE_SCHEMA IN ('RAW', 'CLEANSED', 'MATCHED', 'PUBLIC')
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA;
```

> "RAW landing, CLEANSED standardisation, MATCHED fuzzy clustering, and PUBLIC golden records. The matching uses JAROWINKLER_SIMILARITY with weighted scoring across name (30%), email (30%), phone (20%), and address (20%)."

---

### 10. Wrap-Up (1 minute)

> "So what you've seen in 20 minutes is a complete insurance Customer 360:
>
> - **Identity resolution** across 6.5M records using fuzzy matching
> - **Motor policies** with PDF documents and presigned downloads
> - **Claims management** with date filtering and on-the-fly PDF export
> - **Call recordings** — play, download, transcribe, and score sentiment
> - **Red-flag governance** — automated compliance scanning of every call
> - **AI agent** — natural language access to all customer data
> - **dbt pipeline** — auditable, column-level lineage from source to golden record
>
> All running entirely within Snowflake. No external ETL, no third-party hosting, no separate ML infrastructure. The app is a single Next.js container on SPCS."

---

## Key Data Points for Q&A

| Metric | Value |
|--------|-------|
| Total unified records | 6,520,240+ |
| Salesforce contacts | 6,519,018 |
| SAP customers (KNA1) | 1,199 |
| Web interactions | 28 |
| Cross-system matches | 24,505+ |
| Golden records | ~6,496,731 |
| Match threshold | 60% weighted similarity |
| Query performance | <1 second on golden table |
| Deployment | SPCS (CPU_X64_XS, 1 node) |
| App framework | Next.js 16 + React 19 |
| AI Services | Cortex Agent, Cortex Search, AI_TRANSCRIBE, AI_EXTRACT |

## Demo Customers

| Customer | Key Demo Points |
|----------|----------------|
| Colm Moynihan (colm.moynihan@snowflake.com) | 2 Toyota policies, 4 claims, fuzzy matching, 61 versions |
| Dan Jones (dan.jones@snowflake.com) | 2 Lexus policies, email+phone linking, contract growth |

---

## FAQ

**Q: Where is this running?**
A: Entirely on Snowflake — SPCS for the app, Cortex for AI, stages for documents/audio. No external services.

**Q: How does fuzzy matching work?**
A: Jaro-Winkler similarity across name, email, phone, and address with weighted scoring. Threshold is 60%.

**Q: What about real-time data?**
A: The architecture supports Snowpipe Streaming for sub-second ingestion. The demo shows batch-loaded data.

**Q: How is the AI agent built?**
A: It's a Cortex Agent with two tools — Cortex Search (semantic document search) and a data table tool (structured SQL queries). No custom model training.

**Q: Can I download policy/claim documents?**
A: Yes — policies have pre-generated PDFs on a Snowflake stage (presigned URLs). Claims generate PDFs on-the-fly from the claim data via a server-side API route.
