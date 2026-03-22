"""
Real-time ICD-10-CM lookup using NLM Clinical Tables API.
Source: https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html
- FREE, no API key required
- 70,000+ official ICD-10-CM codes (CMS 2024)
- Maintained by National Library of Medicine
Falls back to local database if API is unavailable.
"""
import json
import logging
import time
import urllib.request
import urllib.parse
import os
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Local fallback database ──────────────────────────────────────
_db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "medical_codes.json")
with open(_db_path) as _f:
    _LOCAL = json.load(_f)
LOCAL_ICD10 = _LOCAL["icd10"]
LOCAL_CPT   = _LOCAL["cpt"]

NLM_BASE = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"
_api_available = True   # flips to False on repeated failures
_fail_count    = 0


def _nlm_search(term: str, limit: int = 8) -> list[dict]:
    """
    Call NLM ICD-10-CM search API.
    Returns list of {code, description, type} dicts.
    """
    global _api_available, _fail_count
    if not _api_available:
        return []
    try:
        url = f"{NLM_BASE}?sf=code,name&terms={urllib.parse.quote(term)}&maxList={limit}"
        req = urllib.request.urlopen(url, timeout=4)
        data = json.loads(req.read())
        pairs = data[3] or []
        _fail_count = 0  # reset on success
        return [{"code": code, "description": desc, "type": "ICD10", "source": "NLM_API"}
                for code, desc in pairs]
    except Exception as e:
        _fail_count += 1
        if _fail_count >= 3:
            _api_available = False
            logger.warning("NLM API unavailable — using local database only")
        else:
            logger.warning(f"NLM API error: {e}")
        return []


def _nlm_lookup(code: str) -> Optional[dict]:
    """Exact code lookup via NLM API."""
    global _api_available, _fail_count
    if not _api_available:
        return None
    try:
        url = f"{NLM_BASE}?sf=code,name&terms={urllib.parse.quote(code)}&maxList=1"
        req = urllib.request.urlopen(url, timeout=4)
        data = json.loads(req.read())
        pairs = data[3] or []
        for found_code, desc in pairs:
            if found_code.upper() == code.upper():
                return {"code": found_code, "description": desc, "type": "ICD10", "source": "NLM_API"}
        return None
    except Exception:
        return None


# ─── Public API ───────────────────────────────────────────────────

def lookup_icd10(code: str) -> Optional[dict]:
    """
    Look up ICD-10-CM code. Returns official description or None.
    Tries NLM API first, falls back to local database.
    """
    code = code.strip().upper()
    # Try local first (instant) then API for codes not in local DB
    local = LOCAL_ICD10.get(code)
    if local:
        return {**local, "source": "local_db"}
    # Try prefix match in local
    matches = [v for k, v in LOCAL_ICD10.items() if k.startswith(code)]
    if matches:
        return {**matches[0], "source": "local_db"}
    # Try NLM API for codes not in our local subset
    return _nlm_lookup(code)


def lookup_cpt(code: str) -> Optional[dict]:
    """Look up CPT code. Local database only (AMA copyright, no free API)."""
    code = code.strip().upper()
    return LOCAL_CPT.get(code)


def search_icd10(diagnosis_text: str, limit: int = 8) -> list[dict]:
    """
    Search ICD-10-CM codes by diagnosis text.
    Uses NLM API (70k+ codes) with local fallback.
    """
    if not diagnosis_text or len(diagnosis_text.strip()) < 3:
        return []
    # Try NLM API first
    results = _nlm_search(diagnosis_text, limit)
    if results:
        logger.debug(f"NLM API returned {len(results)} results for '{diagnosis_text}'")
        return results
    # Fallback: local keyword search
    return _local_search_icd10(diagnosis_text, limit)


def search_cpt(procedure_text: str, limit: int = 5) -> list[dict]:
    """Search CPT codes by procedure text. Local database only."""
    return _local_search_cpt(procedure_text, limit)


def validate_code(code: str, code_type: str) -> tuple[bool, str]:
    """
    Returns (is_valid, official_description).
    Checks against NLM API + local database.
    """
    if code_type == "CPT":
        entry = lookup_cpt(code)
    else:
        entry = lookup_icd10(code)
    if entry:
        return True, entry["description"]
    return False, f"{code} not found in CMS ICD-10-CM 2024 / AMA CPT 2024"


# ─── Local fallback search ────────────────────────────────────────

import re as _re

_STOPWORDS = {
    'the','a','an','and','or','of','with','without','in','on','at','to',
    'for','is','are','was','due','other','specified','unspecified','type',
    'disease','chronic','acute','not','nos','history','patient','initial',
    'subsequent','encounter','sequela','right','left','bilateral'
}

def _local_search_icd10(text: str, limit: int) -> list[dict]:
    words = [w for w in _re.findall(r'\b[a-z]+\b', text.lower())
             if w not in _STOPWORDS and len(w) > 2]
    scored = []
    for code, entry in LOCAL_ICD10.items():
        dl = entry["description"].lower()
        score = sum(3 + (2 if dl.find(w) < 30 else 0) for w in words if w in dl)
        if score > 0:
            scored.append((score, {**entry, "source": "local_db"}))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [e for _, e in scored[:limit]]


def _local_search_cpt(text: str, limit: int) -> list[dict]:
    words = [w for w in _re.findall(r'\b[a-z]+\b', text.lower())
             if w not in _STOPWORDS and len(w) > 2]
    scored = []
    for code, entry in LOCAL_CPT.items():
        dl = entry["description"].lower()
        score = sum(3 + (2 if dl.find(w) < 30 else 0) for w in words if w in dl)
        if score > 0:
            scored.append((score, {**entry, "source": "local_db"}))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [e for _, e in scored[:limit]]


if __name__ == "__main__":
    print("=== ICD-10 Lookup ===")
    print(lookup_icd10("I21.9"))
    print(lookup_icd10("E11.65"))
    print(lookup_icd10("Z99.99"))  # should return None

    print("\n=== ICD-10 Search (NLM API or local fallback) ===")
    results = search_icd10("acute inferior STEMI right coronary artery", 5)
    for r in results:
        print(f"  [{r.get('source','?')}] {r['code']}: {r['description']}")

    print("\n=== CPT Lookup ===")
    print(lookup_cpt("92928"))
    print(lookup_cpt("99223"))

    print("\n=== Validation ===")
    print(validate_code("I21.9", "ICD10"))
    print(validate_code("FAKE99", "ICD10"))
    print(validate_code("99223", "CPT"))
