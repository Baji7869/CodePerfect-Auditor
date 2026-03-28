from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum


class CodeType(str, Enum):
    ICD10 = "ICD10"
    CPT = "CPT"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DiscrepancyType(str, Enum):
    MISSED_CODE = "missed_code"
    INCORRECT_CODE = "incorrect_code"
    UPCODING = "upcoding"
    UNDERCODING = "undercoding"
    MISSED_COMORBIDITY = "missed_comorbidity"
    WRONG_SPECIFICITY = "wrong_specificity"


class MedicalCode(BaseModel):
    code: str
    code_type: CodeType
    description: Optional[str] = None


class AuditRequest(BaseModel):
    patient_id: Optional[str] = None
    human_icd10_codes: List[str] = Field(..., description="ICD-10 codes entered by human coder")
    human_cpt_codes: List[str] = Field(..., description="CPT codes entered by human coder")


class ClinicalFacts(BaseModel):
    primary_diagnosis: str
    secondary_diagnoses: List[str] = []
    comorbidities: List[str] = []
    procedures_performed: List[str] = []
    clinical_findings: List[str] = []
    patient_age: Optional[Any] = None
    patient_gender: Optional[str] = None
    admission_type: Optional[str] = None
    discharge_disposition: Optional[str] = None
    key_clinical_indicators: List[str] = []

    @field_validator('patient_age', mode='before')
    @classmethod
    def coerce_age_to_str(cls, v):
        if v is None:
            return None
        return str(v)


class AIGeneratedCode(BaseModel):
    code: str
    code_type: CodeType
    description: str
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    rationale: str = ""
    supporting_text: str = ""


class Discrepancy(BaseModel):
    discrepancy_type: DiscrepancyType
    severity: RiskLevel
    human_code: Optional[str] = None
    ai_code: Optional[str] = None
    code_type: CodeType
    description: str
    chart_evidence: str = ""
    clinical_justification: str = ""
    financial_impact: str = ""
    estimated_revenue_impact_usd: float = 0.0
    recommendation: str = ""


class AuditReport(BaseModel):
    case_id: str
    risk_level: RiskLevel
    summary: str
    total_discrepancies: int
    critical_findings: List[str] = []
    human_icd10_codes: List[str] = []
    human_cpt_codes: List[str] = []
    human_icd10_descriptions: Dict[str, str] = {}   # code -> official description
    human_cpt_descriptions: Dict[str, str] = {}     # code -> official description
    ai_icd10_codes: List[AIGeneratedCode] = []
    ai_cpt_codes: List[AIGeneratedCode] = []
    clinical_facts: ClinicalFacts
    discrepancies: List[Discrepancy] = []
    total_revenue_impact_usd: float = 0.0
    revenue_impact_direction: str = "accurate"
    compliance_flags: List[str] = []
    audit_defense_strength: str = "moderate"
    processing_time_ms: int = 0
    created_at: datetime

    class Config:
        use_enum_values = True


class AuditCaseResponse(BaseModel):
    case_id: str
    patient_id: Optional[str]
    chart_filename: str
    status: str
    created_at: datetime
    risk_level: Optional[str] = None
    discrepancy_count: Optional[int] = None
    revenue_impact: Optional[float] = None


class DashboardStats(BaseModel):
    total_audits: int
    audits_today: int
    total_discrepancies: int
    revenue_recovered: float
    accuracy_rate: float
    high_risk_cases: int
    avg_processing_time_ms: float
    discrepancy_breakdown: Dict[str, int]
    risk_distribution: Dict[str, int]
    recent_audits: List[AuditCaseResponse]