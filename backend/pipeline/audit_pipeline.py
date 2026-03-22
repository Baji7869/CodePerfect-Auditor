"""
Simplified audit pipeline - runs 3 agents sequentially with WebSocket updates.
"""
import time
import asyncio
import logging
import uuid
from models.schemas import AuditReport
from services.websocket_manager import manager

logger = logging.getLogger(__name__)


async def run_audit_pipeline(chart_text, human_icd10_codes, human_cpt_codes, case_id=None):
    if not case_id:
        case_id = f"CASE-{uuid.uuid4().hex[:8].upper()}"

    start = time.time()

    try:
        # Step 1
        await manager.send_progress(case_id, 1, 5, "Parsing clinical chart...", "Document Parser")

        # Step 2 - Clinical Reader
        await manager.send_progress(case_id, 2, 5, "Extracting diagnoses & comorbidities...", "Clinical Reader Agent")
        loop = asyncio.get_event_loop()

        from agents.clinical_reader import clinical_reader_agent
        clinical_facts = await loop.run_in_executor(None, clinical_reader_agent, chart_text)
        logger.info(f"✅ Step 2 done: {clinical_facts.primary_diagnosis}")

        # Step 3 - Coding Agent
        await manager.send_progress(case_id, 3, 5, "Generating ICD-10 & CPT codes...", "Coding Logic Agent")

        from agents.coding_agent import coding_logic_agent
        ai_codes = await loop.run_in_executor(None, coding_logic_agent, clinical_facts, chart_text)
        logger.info(f"✅ Step 3 done: {len(ai_codes['icd10_codes'])} ICD-10 codes")

        # Step 4 - Auditor
        await manager.send_progress(case_id, 4, 5, "Comparing codes & finding discrepancies...", "Auditor Agent")

        from agents.auditor import auditor_agent
        elapsed_ms = int((time.time() - start) * 1000)

        def run_auditor():
            return auditor_agent(
                chart_text=chart_text,
                clinical_facts=clinical_facts,
                ai_codes=ai_codes,
                human_icd10_codes=human_icd10_codes,
                human_cpt_codes=human_cpt_codes,
                case_id=case_id,
                processing_time_ms=elapsed_ms
            )

        report = await loop.run_in_executor(None, run_auditor)
        logger.info(f"✅ Step 4 done: {report.total_discrepancies} discrepancies")

        # Step 5
        await manager.send_progress(case_id, 5, 5, "Generating final report...", "Report Generator")
        await asyncio.sleep(0.3)
        await manager.send_complete(case_id, report.dict())

        logger.info(f"✅ Audit {case_id} complete in {(time.time()-start):.1f}s")
        return report

    except Exception as e:
        logger.error(f"❌ Pipeline error for {case_id}: {e}", exc_info=True)
        await manager.send_error(case_id, str(e))
        raise
