"""Run: python full_test.py"""
import asyncio
import sys

async def main():
    print("Testing full pipeline...")
    try:
        from pipeline.audit_pipeline import run_audit_pipeline
        
        chart = """
DISCHARGE SUMMARY
Patient: John M., 67-year-old male
Admission Date: 2024-11-10

CHIEF COMPLAINT: Chest pain

PRIMARY DIAGNOSIS: Acute inferior STEMI

COMORBIDITIES:
- Type 2 diabetes mellitus, on insulin
- Hypertension, well-controlled on lisinopril  
- Chronic kidney disease, stage 3
- Morbid obesity, BMI 42

PROCEDURES:
- Emergency PCI with drug-eluting stent placement to RCA
- Echocardiogram showing EF 45%
- Cardiac catheterization

DISCHARGE MEDICATIONS: Aspirin 81mg, Clopidogrel 75mg, Atorvastatin 80mg
"""
        report = await run_audit_pipeline(
            chart_text=chart,
            human_icd10_codes=["I21.9", "I10", "E11.9"],
            human_cpt_codes=["99223", "93306"],
            case_id="TEST-FULL"
        )
        print(f"\n✅ SUCCESS!")
        print(f"Risk: {report.risk_level}")
        print(f"Discrepancies: {report.total_discrepancies}")
        print(f"Revenue impact: ${report.total_revenue_impact_usd}")
        
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

asyncio.run(main())
