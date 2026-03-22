import json
import logging
from groq import Groq
from config import settings
from models.schemas import ClinicalFacts

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Extract clinical facts. Return ONLY this JSON structure:
{"primary_diagnosis":"","secondary_diagnoses":[],"comorbidities":[],"procedures_performed":[],"clinical_findings":[],"patient_age":null,"patient_gender":null,"admission_type":null,"discharge_disposition":null,"key_clinical_indicators":[]}"""

def clinical_reader_agent(chart_text: str) -> ClinicalFacts:
    logger.info("🔬 Clinical Reader...")
    client = Groq(api_key=settings.GROQ_API_KEY)
    r = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        max_tokens=600,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Chart:\n{chart_text[:1500]}\nReturn JSON only."}
        ]
    )
    raw = r.choices[0].message.content.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"): raw = raw[4:]
    facts = ClinicalFacts(**json.loads(raw.strip()))
    logger.info(f"✅ Reader: {facts.primary_diagnosis}")
    return facts
