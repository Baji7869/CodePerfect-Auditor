"""
Document Parser - Extracts text from PDF, DOCX, and TXT files.
"""
import io
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


async def parse_document(file_bytes: bytes, filename: str) -> Tuple[str, str]:
    """
    Parse uploaded document and return extracted text.
    Returns: (text_content, error_message)
    """
    ext = filename.lower().split(".")[-1]

    try:
        if ext == "pdf":
            return await _parse_pdf(file_bytes), ""
        elif ext in ("docx", "doc"):
            return await _parse_docx(file_bytes), ""
        elif ext == "txt":
            return file_bytes.decode("utf-8", errors="ignore"), ""
        else:
            return "", f"Unsupported file type: .{ext}. Supported: PDF, DOCX, TXT"
    except Exception as e:
        logger.error(f"Document parse error: {e}")
        return "", str(e)


async def _parse_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF."""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n\n".join(text_parts)
    except ImportError:
        # Fallback: try pypdf
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            return "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise Exception(f"PDF parsing failed: {e}")


async def _parse_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX."""
    from docx import Document
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


# ─── Sample Clinical Charts for Demo ─────────────────────────────────────────

SAMPLE_CHARTS = {
    "cardiac_case": """
DISCHARGE SUMMARY

Patient: John M., 67-year-old male
Admission Date: 2024-11-10
Discharge Date: 2024-11-15

CHIEF COMPLAINT: Chest pain and shortness of breath

HISTORY OF PRESENT ILLNESS:
Patient is a 67-year-old male with a history of hypertension and type 2 diabetes mellitus 
who presented to the emergency department with acute onset chest pain radiating to the left arm, 
associated with diaphoresis and shortness of breath for approximately 2 hours. 
EKG showed ST-elevation in leads II, III, and aVF consistent with inferior STEMI.

PAST MEDICAL HISTORY:
1. Hypertension - on lisinopril 10mg daily
2. Type 2 diabetes mellitus - HbA1c 8.2% on last check, on metformin and glipizide
3. Hyperlipidemia - on atorvastatin
4. Obesity - BMI 34.2 (morbid obesity per BMI criteria)
5. Chronic kidney disease stage 3 - baseline creatinine 1.8

HOSPITAL COURSE:
Patient was taken emergently to the cardiac catheterization lab where coronary angiography 
revealed 95% occlusion of the right coronary artery. Successful percutaneous coronary 
intervention (PCI) was performed with placement of a drug-eluting stent. 

Post-procedure, patient developed acute on chronic kidney injury with creatinine rising to 2.4. 
Nephrology was consulted and patient was managed conservatively with IV fluids and holding 
nephrotoxic medications.

Patient also noted to have blood glucose of 380 mg/dL on admission consistent with hyperglycemia.
Endocrinology was consulted and insulin drip was initiated, transitioned to basal-bolus regimen.

DISCHARGE DIAGNOSES:
1. Acute inferior STEMI
2. Hypertension
3. Type 2 diabetes mellitus

DISCHARGE MEDICATIONS:
Aspirin 81mg, Clopidogrel 75mg, Atorvastatin 80mg, Metoprolol 25mg, Lisinopril 5mg, 
Insulin glargine 20 units nightly

ATTENDING PHYSICIAN: Dr. Sarah Chen, MD Cardiology
""",
    "pneumonia_case": """
ADMISSION NOTE

Patient: Maria G., 58-year-old female
Date: 2024-11-12

CHIEF COMPLAINT: Fever, cough, shortness of breath x 5 days

HISTORY:
58-year-old female with known COPD (on home oxygen 2L/min), hypertension, and generalized 
anxiety disorder presenting with 5-day history of productive cough with yellowish sputum, 
fever to 102.4°F, and increasing shortness of breath requiring increased oxygen use.

PHYSICAL EXAM:
Temperature: 102.4°F, BP: 148/92, HR: 104, RR: 24, O2 Sat: 88% on 2L O2
Chest: Decreased breath sounds right lower lobe, dullness to percussion right base
Crackles audible bilateral bases

DIAGNOSTICS:
- Chest X-ray: Right lower lobe infiltrate consistent with pneumonia
- CBC: WBC 18.2 with left shift (bands 22%)
- BMP: Na 132 (hyponatremia), Creatinine 1.2 (baseline 0.9)
- Sputum culture: Pending
- COVID-19: Negative

IMPRESSION:
Community-acquired pneumonia, right lower lobe, in setting of COPD exacerbation.
Patient meets criteria for CURB-65 score of 3, indicating moderate-severe pneumonia 
requiring inpatient admission.

Hyponatremia likely related to pneumonia (SIADH).

PLAN:
1. Admit to medical floor with telemetry
2. IV ceftriaxone and azithromycin
3. Aggressive bronchodilator therapy - albuterol and ipratropium nebs q4h
4. Supplemental oxygen, titrate to keep SpO2 > 92%
5. Monitor sodium, restrict fluids for SIADH management
6. Generalized anxiety - continue home medications

PHYSICIAN: Dr. James Park, MD Hospitalist
"""
}
