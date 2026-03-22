import json
import logging
from groq import Groq
from config import settings
from models.schemas import ClinicalFacts, AIGeneratedCode
from utils.knowledge_base import search_codes

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a medical coder. Return ONLY valid JSON:
{"icd10_codes":[{"code":"","code_type":"ICD10","description":"","confidence":0.9,"rationale":"","supporting_text":""}],"cpt_codes":[{"code":"","code_type":"CPT","description":"","confidence":0.9,"rationale":"","supporting_text":""}]}
Max 5 ICD-10 and 3 CPT. Short descriptions only."""

def coding_logic_agent(clinical_facts: ClinicalFacts, chart_text: str) -> dict:
    logger.info("💊 Coding Agent...")
    client = Groq(api_key=settings.GROQ_API_KEY)
    icd_ref = " | ".join([f"{c['code']}:{c['description']}" for c in search_codes(clinical_facts.primary_diagnosis, "ICD10", 6)])
    cpt_ref = " | ".join([f"{c['code']}:{c['description']}" for c in search_codes(clinical_facts.primary_diagnosis, "CPT", 4)])

    r = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        max_tokens=1200,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"""Primary: {clinical_facts.primary_diagnosis}
Comorbidities: {', '.join(clinical_facts.comorbidities[:3])}
Procedures: {', '.join(clinical_facts.procedures_performed[:3])}
ICD-10: {icd_ref}
CPT: {cpt_ref}
Return complete JSON only."""}
        ]
    )
    raw = r.choices[0].message.content.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"): raw = raw[4:]
    raw = raw.strip()
    if not raw.endswith('}'):
        last = raw.rfind('},')
        raw = (raw[:last+1] + ']}}'  ) if last > 0 else '{"icd10_codes":[],"cpt_codes":[]}'
    data = json.loads(raw)
    icd10 = [AIGeneratedCode(**c) for c in data.get("icd10_codes", [])]
    cpt = [AIGeneratedCode(**c) for c in data.get("cpt_codes", [])]
    logger.info(f"✅ Coding: {len(icd10)} ICD-10, {len(cpt)} CPT")
    return {"icd10_codes": icd10, "cpt_codes": cpt}
