"""
Run with: python debug_groq.py
"""
from config import settings

print("=" * 50)
print("Groq Debug Test")
print("=" * 50)
print(f"GROQ_API_KEY set: {bool(settings.GROQ_API_KEY)}")
print(f"GROQ_KEY preview: {settings.GROQ_API_KEY[:15] if settings.GROQ_API_KEY else 'EMPTY'}...")
print(f"GROQ_MODEL: {settings.GROQ_MODEL}")
print()

if not settings.GROQ_API_KEY:
    print("❌ GROQ_API_KEY is empty in your .env file!")
    print("   Add: GROQ_API_KEY=gsk_ygsk_JIsW4JU27dZTFsKz7pqlWGdyb3FYG9Rl8nogb6K2b0ZJhspICCJCour_key_here")
    exit(1)

try:
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    r = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        max_tokens=50,
        messages=[{"role": "user", "content": "Say: GROQ OK"}]
    )
    print(f"✅ Groq API works: {r.choices[0].message.content.strip()}")
except Exception as e:
    print(f"❌ Groq failed: {e}")
    exit(1)

try:
    from agents.clinical_reader import clinical_reader_agent
    facts = clinical_reader_agent("Patient: 65yo male. Diagnosis: Hypertension, Type 2 Diabetes. Procedure: Blood pressure monitoring.")
    print(f"✅ Clinical Reader works: {facts.primary_diagnosis}")
except Exception as e:
    print(f"❌ Clinical Reader failed: {e}")
    import traceback; traceback.print_exc()
    exit(1)

try:
    from agents.coding_agent import coding_logic_agent
    codes = coding_logic_agent(facts, "Patient has hypertension and diabetes.")
    print(f"✅ Coding Agent works: {len(codes['icd10_codes'])} ICD-10 codes")
except Exception as e:
    print(f"❌ Coding Agent failed: {e}")
    import traceback; traceback.print_exc()
    exit(1)

try:
    from agents.auditor import auditor_agent
    report = auditor_agent(
        chart_text="Patient: 65yo male. Hypertension, Type 2 Diabetes.",
        clinical_facts=facts,
        ai_codes=codes,
        human_icd10_codes=["I10"],
        human_cpt_codes=["99223"],
        case_id="TEST-001"
    )
    print(f"✅ Auditor works: {report.total_discrepancies} discrepancies, risk={report.risk_level}")
except Exception as e:
    print(f"❌ Auditor failed: {e}")
    import traceback; traceback.print_exc()
    exit(1)

print()
print("✅ ALL TESTS PASSED — pipeline is working!")
print("=" * 50)
