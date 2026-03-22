"""
Local CMS 2024 code database — used as fallback by realtime_codes.py.
"""
import json, re
from pathlib import Path

_db_path = Path(__file__).parent.parent / "medical_codes.json"
with open(_db_path) as f:
    _DB = json.load(f)

ICD10_DB = _DB["icd10"]
CPT_DB   = _DB["cpt"]

_STOP = {'the','a','an','and','or','of','with','without','in','on','at','to',
         'for','is','are','was','due','other','specified','unspecified','type',
         'disease','chronic','acute','not','nos','history','patient'}

def db_lookup(code: str, ctype: str) -> dict | None:
    code = code.strip().upper()
    if ctype == "CPT":
        return CPT_DB.get(code)
    result = ICD10_DB.get(code)
    if result:
        return result
    matches = [v for k, v in ICD10_DB.items() if k.startswith(code)]
    return matches[0] if matches else None

def db_search(text: str, ctype: str, limit: int = 6) -> list:
    words = [w for w in re.findall(r'\b[a-z]+\b', text.lower())
             if w not in _STOP and len(w) > 2]
    source = ICD10_DB if ctype == "ICD10" else CPT_DB
    scored = []
    for code, entry in source.items():
        dl = entry["description"].lower()
        score = sum(3 + (2 if dl.find(w) < 30 else 0) for w in words if w in dl)
        if score > 0:
            scored.append((score, entry))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [e for _, e in scored[:limit]]
