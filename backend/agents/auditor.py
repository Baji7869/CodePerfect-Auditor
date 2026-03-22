import json
import logging
from groq import Groq
from config import settings
from models.schemas import AuditReport, Discrepancy, ClinicalFacts
from datetime import datetime

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a Senior Medical Coding Auditor. Compare human codes vs AI codes and find discrepancies.
Return ONLY valid JSON, no other text:
{
  "risk_level": "low|medium|high|critical",
  "summary": "2-3 sentence executive summary",
  "critical_findings": ["finding1", "finding2"],
  "discrepancies": [
    {
      "discrepancy_type": "missed_code|incorrect_code|upcoding|undercoding|missed_comorbidity|wrong_specificity",
      "severity": "critical|high|medium|low",
      "human_code": "code or null",
      "ai_code": "correct code or null",
      "code_type": "ICD10|CPT",
      "description": "what is wrong",
      "chart_evidence": "exact quote from chart",
      "clinical_justification": "why AI code is correct",
      "financial_impact": "revenue impact description",
      "estimated_revenue_impact_usd": 500.0,
      "recommendation": "action to take"
    }
  ],
  "total_revenue_impact_usd": 1500.0,
  "revenue_impact_direction": "under-billed|over-billed|accurate",
  "compliance_flags": ["flag1"],
  "audit_defense_strength": "strong|moderate|weak"
}"""


def auditor_agent(chart_text, clinical_facts, ai_codes, human_icd10_codes, human_cpt_codes, case_id, processing_time_ms=0):
    logger.info("🔍 Auditor Agent: Comparing codes...")
    client = Groq(api_key=settings.GROQ_API_KEY)
    ai_icd10 = ai_codes.get("icd10_codes", [])
    ai_cpt = ai_codes.get("cpt_codes", [])
    ai_str = "\n".join([f"  {c.code}: {c.description}" for c in ai_icd10 + ai_cpt])

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        max_tokens=2500,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"""Audit this case. Find ALL discrepancies with chart evidence.

CHART: {chart_text[:2000]}

CLINICAL FACTS:
Primary: {clinical_facts.primary_diagnosis}
Comorbidities: {', '.join(clinical_facts.comorbidities)}
Procedures: {', '.join(clinical_facts.procedures_performed)}

HUMAN CODES — ICD-10: {', '.join(human_icd10_codes) or 'None'} | CPT: {', '.join(human_cpt_codes) or 'None'}

AI REFERENCE CODES:
{ai_str or 'None'}"""}
        ]
    )
    raw = response.choices[0].message.content.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"): raw = raw[4:]
    data = json.loads(raw.strip())
    discrepancies = [Discrepancy(**d) for d in data.get("discrepancies", [])]
    logger.info(f"✅ Audit done: {len(discrepancies)} discrepancies, risk={data.get('risk_level')}")

    return AuditReport(
        case_id=case_id, risk_level=data.get("risk_level", "low"),
        summary=data.get("summary", ""), total_discrepancies=len(discrepancies),
        critical_findings=data.get("critical_findings", []),
        human_icd10_codes=human_icd10_codes, human_cpt_codes=human_cpt_codes,
        ai_icd10_codes=ai_icd10, ai_cpt_codes=ai_cpt, clinical_facts=clinical_facts,
        discrepancies=discrepancies, total_revenue_impact_usd=data.get("total_revenue_impact_usd", 0.0),
        revenue_impact_direction=data.get("revenue_impact_direction", "accurate"),
        compliance_flags=data.get("compliance_flags", []),
        audit_defense_strength=data.get("audit_defense_strength", "moderate"),
        processing_time_ms=processing_time_ms, created_at=datetime.utcnow()
    )