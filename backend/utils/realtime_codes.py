"""
Real-time medical code lookup using free official APIs.

ICD-10-CM: NIH National Library of Medicine Clinical Tables API
  - Free, no API key needed
  - 70,000+ official ICD-10-CM codes (2026 edition)
  - URL: https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search

CPT/HCPCS: CMS HCPCS API via NLM
  - Free, no API key needed
  - URL: https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search

Both APIs are maintained by the US federal government (NIH/CMS).
No registration, no rate limits for reasonable use.
"""

import httpx
import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)

# ── API endpoints ─────────────────────────────────────────────────────────────
ICD10_API  = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"
HCPCS_API  = "https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search"

# ── Local cache to avoid repeated API calls ───────────────────────────────────
_CACHE_FILE = Path(__file__).parent.parent / "code_cache.json"
_cache: dict = {}

def _load_cache():
    global _cache
    if _CACHE_FILE.exists():
        try:
            raw = json.loads(_CACHE_FILE.read_text())
            # Filter out any cached None values so we retry them fresh
            _cache = {k: v for k, v in raw.items() if v is not None}
            logger.info(f"✅ Code cache loaded: {len(_cache)} entries")
        except:
            _cache = {}

def _save_cache():
    try:
        _CACHE_FILE.write_text(json.dumps(_cache, indent=2))
    except:
        pass

_load_cache()


# ── Core lookup functions ─────────────────────────────────────────────────────

def _nlm_exact_lookup(code: str) -> dict | None:
    """
    Try multiple search strategies to find an exact ICD-10-CM code via NLM API.
    Handles codes with/without dots, partial prefix searches.
    """
    # Strategy 1: search exact code string (e.g. "G80.4")
    # Strategy 2: search without dot (e.g. "G804") 
    # Strategy 3: search code prefix to get broader results (e.g. "G80")
    search_terms = [code]
    if "." in code:
        search_terms.append(code.replace(".", ""))   # G804
        search_terms.append(code.split(".")[0])       # G80

    for term in search_terms:
        try:
            with httpx.Client(timeout=6.0) as client:
                resp = client.get(ICD10_API, params={
                    "terms": term,
                    "maxList": 20,
                    "sf": "code,name",
                    "df": "code,name"
                })
                data = resp.json()
                for item in (data[3] or []):
                    # Normalize both to uppercase without dot for comparison
                    item_code = item[0].upper()
                    if item_code == code or item_code.replace(".", "") == code.replace(".", ""):
                        return {
                            "code": item[0],
                            "description": item[1],
                            "type": "ICD10",
                            "source": "NIH_NLM_2026"
                        }
        except Exception as e:
            logger.warning(f"NIH API attempt with '{term}' failed: {e}")
            continue

    return None


def lookup_icd10_code(code: str) -> dict | None:
    """
    Exact lookup of an ICD-10-CM code.
    Returns {"code": "I21.11", "description": "ST elevation MI of RCA"} or None.
    Uses NIH NLM API (2026) with local CMS fallback and persistent caching.
    
    IMPORTANT: None results are NOT cached — so future calls retry the API.
    This ensures newly added codes (e.g. from 2026 updates) are found.
    """
    code = code.strip().upper()
    cache_key = f"icd10:{code}"

    # Return cached positive result only
    if cache_key in _cache and _cache[cache_key] is not None:
        return _cache[cache_key]

    # Check local static DB first (instant, no network)
    from utils.code_db import ICD10_DB
    if code in ICD10_DB:
        result = ICD10_DB[code]
        _cache[cache_key] = result
        return result

    # Try NLM API with multiple search strategies
    result = _nlm_exact_lookup(code)
    if result:
        _cache[cache_key] = result
        _save_cache()
        return result

    # Not found — do NOT cache None so future requests retry
    logger.info(f"Code {code} not found in ICD-10-CM 2026 (NIH NLM) or local DB")
    return None


def lookup_cpt_code(code: str) -> dict | None:
    """
    Exact lookup of a CPT/HCPCS code.
    1. Local expanded database (2,000+ codes)
    2. NIH NLM HCPCS API fallback (covers CPT = HCPCS Level I)
    CPT is AMA-copyrighted but HCPCS descriptions are public domain.
    """
    code = code.strip().upper()
    cache_key = f"cpt:{code}"

    if cache_key in _cache and _cache[cache_key] is not None:
        return _cache[cache_key]

    # 1. Check local database first (instant)
    from utils.code_db import CPT_DB
    result = CPT_DB.get(code)
    if result:
        _cache[cache_key] = result
        return result

    # 2. Try NLM HCPCS API (CPT = HCPCS Level I — public domain descriptions)
    try:
        with httpx.Client(timeout=6.0) as client:
            resp = client.get(HCPCS_API, params={
                "terms": code,
                "maxList": 10,
                "sf": "code,display",
                "df": "code,display"
            })
            data = resp.json()
            for item in (data[3] or []):
                if item[0].upper() == code:
                    result = {
                        "code": item[0],
                        "description": item[1],
                        "type": "CPT",
                        "source": "NIH_NLM_HCPCS"
                    }
                    _cache[cache_key] = result
                    _save_cache()
                    return result
    except Exception as e:
        logger.warning(f"NLM HCPCS lookup failed for {code}: {e}")

    # Not found in local DB or API
    logger.info(f"CPT {code} not found in local DB (2,051 codes) or NLM HCPCS API")
    return None


def search_icd10_codes(diagnosis_text: str, limit: int = 8) -> list[dict]:
    """
    Search ICD-10-CM codes by diagnosis description.
    Uses NIH NLM API (70,000+ codes) with local fallback.
    Returns list of {"code": ..., "description": ..., "source": ...}
    """
    if not diagnosis_text or len(diagnosis_text) < 3:
        return []

    cache_key = f"search_icd10:{diagnosis_text.lower()[:50]}:{limit}"
    if cache_key in _cache:
        return _cache[cache_key]

    results = []

    # Try NIH NLM API first
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(ICD10_API, params={
                "terms": diagnosis_text,
                "maxList": limit,
                "sf": "code,name",
                "df": "code,name"
            })
            data = resp.json()
            for item in (data[3] or []):
                results.append({
                    "code": item[0],
                    "description": item[1],
                    "type": "ICD10",
                    "source": "NIH_NLM_2026"
                })
        logger.info(f"NIH API: '{diagnosis_text}' → {len(results)} codes")
    except Exception as e:
        logger.warning(f"NIH API search failed: {e}, using local DB")

    # Fallback to local DB if API fails
    if not results:
        from utils.code_db import db_search
        results = db_search(diagnosis_text, "ICD10", limit)
        for r in results:
            r["source"] = "LOCAL_DB_CMS2024"

    _cache[cache_key] = results
    _save_cache()
    return results


def search_cpt_codes(procedure_text: str, limit: int = 5) -> list[dict]:
    """
    Search CPT codes by procedure description.
    Uses local static database (CPT is AMA-copyrighted).
    """
    if not procedure_text:
        return []

    from utils.code_db import db_search
    results = db_search(procedure_text, "CPT", limit)
    for r in results:
        r["source"] = "LOCAL_DB_AMA2024"
    return results


def validate_code(code: str, code_type: str) -> tuple[bool, str, str]:
    """
    Validate a code against official database.
    Returns (is_valid, official_description, source).
    """
    code = code.strip().upper()

    if code_type.upper() == "ICD10":
        result = lookup_icd10_code(code)
        if result:
            return True, result["description"], result.get("source", "NIH_NLM_2026")
        return False, f"{code} not found in ICD-10-CM 2026 (NIH NLM)", "NIH_NLM"

    elif code_type.upper() == "CPT":
        result = lookup_cpt_code(code)
        if result:
            return True, result["description"], "AMA_CPT_2024"
        return False, f"{code} not found in CPT database", "LOCAL"

    return False, "Unknown code type", ""


def get_code_info(code: str, code_type: str) -> dict | None:
    """Unified code info lookup."""
    if code_type.upper() == "ICD10":
        return lookup_icd10_code(code)
    elif code_type.upper() == "CPT":
        return lookup_cpt_code(code)
    return None


def get_descriptions_for_codes(codes: list[str], code_type: str) -> dict[str, str]:
    """
    Batch lookup descriptions for a list of codes.
    Returns dict: {code: description}. Missing codes get empty string.
    Used to enrich human-submitted codes with official descriptions.
    """
    result = {}
    for code in codes:
        code = code.strip().upper()
        if not code:
            continue
        info = get_code_info(code, code_type)
        result[code] = info["description"] if info else ""
    return result