# CodePerfect Auditor
### AI-Powered Medical Coding Audit System

> Real-time pre-submission audit that reads clinical charts, generates verified ICD-10-CM and CPT codes, and flags every discrepancy with exact chart evidence — before claims are submitted.

---

## What It Does

Hospitals lose millions annually to coding errors — missed comorbidities, wrong specificity, and upcoding. CodePerfect Auditor runs 3 AI agents on any clinical chart in under 20 seconds:

1. **Clinical Reader Agent** — extracts diagnoses, comorbidities, procedures from unstructured text
2. **Coding Logic Agent** — generates ICD-10-CM and CPT codes, validated against NIH NLM API (70,000+ codes)
3. **Auditor Agent** — compares human codes vs AI codes, flags discrepancies with exact chart quotes

Every AI-generated code is validated against the **CMS ICD-10-CM 2024** database via the NIH NLM Clinical Tables API. No hallucinated codes ever reach the user.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.12 |
| AI | Groq (llama-3.1-8b-instant) |
| ICD-10 Database | NIH NLM Clinical Tables API (70,000+ real codes) |
| CPT Database | AMA CPT 2024 (local, 225 codes) |
| Database | SQLite + SQLAlchemy async |
| Frontend | React + Vite + TailwindCSS |
| PDF Export | ReportLab |

---

## Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- Groq API key (free at https://console.groq.com)

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install fastapi uvicorn[standard] groq sqlalchemy aiosqlite \
    python-multipart httpx reportlab pydantic-settings python-dotenv

cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

**.env file:**
```
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

```bash
python main.py
# Server starts at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:5173
```

---

## How to Use

1. Open **http://localhost:5173**
2. Click **New Audit**
3. Select a demo case or paste your own chart in **Manual Input**
4. Enter the human coder's ICD-10 and CPT codes (or leave blank to see full AI audit)
5. Click **Run AI Audit**
6. View discrepancies with chart evidence, revenue impact, and recommendations
7. Click **Export PDF** to download the audit defense report

---

## Standards Followed

| Standard | Description |
|---|---|
| CMS ICD-10-CM 2024 | All diagnosis codes validated against official CMS code set |
| AMA CPT 2024 | All procedure codes validated against AMA CPT database |
| MS-DRG | Revenue impact based on Medicare Severity DRG weight changes |
| CMS CCI | Upcoding detection per Correct Coding Initiative guidelines |
| HIPAA 45 CFR Part 162 | Ensures standard code sets for all electronic health transactions |

---

## Discrepancy Types Detected

| Type | Description | Avg Revenue Impact |
|---|---|---|
| Missed code | Diagnosis documented but not coded | $750–$850 |
| Missed comorbidity | Secondary diagnosis not coded (affects DRG) | $750 |
| Wrong specificity | Generic code used when specific supported | $450 |
| Incorrect code | Invalid code not in CMS/AMA database | $1,200–$1,500 |
| Upcoding | E/M level higher than chart complexity supports | −$85–$425 |

---

## Test Cases

Run these to verify the system:

| Case | Human Codes | Expected Result |
|---|---|---|
| Appendicitis (clean) | K37, 44970, 74177 | 0 discrepancies, LOW |
| Hypertension follow-up | I10, 99215 | Upcoding flagged, ~$255 |
| Cardiac STEMI | I21.9, I10, E11.9, 99223, 93306 | ~$4,550, CRITICAL |
| COPD + comorbidities | J44.1, 99222 | ~$5,350, CRITICAL |
| Sepsis E. coli | A41.9, I10, 99291 | ~$6,600, CRITICAL |

---

## Architecture

```
Clinical Chart (PDF / DOCX / TXT / Manual Input)
        │
        ▼
┌─────────────────────┐
│  Agent 1            │  AI reads unstructured chart text
│  Clinical Reader    │  → extracts diagnoses, comorbidities, procedures
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Agent 2            │  AI generates ICD-10 + CPT codes freely
│  Coding Agent       │  → every code validated vs NIH NLM API (70k+ codes)
│  + NLM Validation   │  → invalid codes corrected or rejected
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Agent 3            │  Rule-based deterministic comparison
│  Auditor Agent      │  → missed codes, wrong specificity, upcoding
│  (Deterministic)    │  → chart evidence quotes for every finding
└─────────┬───────────┘
          │
          ▼
   Audit Report + PDF Export
   (discrepancies, revenue impact, compliance flags)
```

---

## Project Structure

```
codeperfect-auditor/
├── backend/
│   ├── main.py                 # FastAPI app + all 3 agents + API routes
│   ├── medical_codes.json      # Local CMS 2024 + AMA CPT fallback database
│   ├── models/
│   │   ├── database.py         # SQLAlchemy models
│   │   └── schemas.py          # Pydantic schemas
│   └── utils/
│       ├── document_parser.py  # PDF/DOCX/TXT parser
│       ├── knowledge_base.py   # ChromaDB knowledge base
│       ├── realtime_codes.py   # NIH NLM API integration
│       └── code_db.py          # Local CMS fallback database
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Dashboard.jsx
│       │   ├── NewAudit.jsx
│       │   ├── AuditReport.jsx
│       │   └── Cases.jsx
│       └── components/
└── README.md
```

---

## Built By

**Team: The Boys**
Powered by Groq AI · CMS ICD-10-CM 2024 · AMA CPT 2024 · NIH NLM Clinical Tables API