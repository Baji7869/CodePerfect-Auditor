from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, Boolean, ForeignKey
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime
from config import settings

Base = declarative_base()

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


class AuditCase(Base):
    __tablename__ = "audit_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True)
    patient_id = Column(String(50), nullable=True)
    chart_filename = Column(String(255))
    chart_text = Column(Text)
    status = Column(String(20), default="pending")  # pending, processing, completed, error
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    audit_results = relationship("AuditResult", back_populates="case", cascade="all, delete-orphan")
    human_codes = relationship("HumanCode", back_populates="case", cascade="all, delete-orphan")


class HumanCode(Base):
    __tablename__ = "human_codes"

    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("audit_cases.id"))
    code_type = Column(String(10))  # ICD10 or CPT
    code = Column(String(20))
    description = Column(String(500), nullable=True)

    case = relationship("AuditCase", back_populates="human_codes")


class AuditResult(Base):
    __tablename__ = "audit_results"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("audit_cases.id"))
    
    # Clinical extraction
    clinical_facts = Column(JSON)
    
    # AI generated codes
    ai_icd10_codes = Column(JSON)
    ai_cpt_codes = Column(JSON)
    
    # Discrepancies
    discrepancies = Column(JSON)
    discrepancy_count = Column(Integer, default=0)
    
    # Financial impact
    estimated_revenue_impact = Column(Float, default=0.0)
    
    # Risk level
    risk_level = Column(String(20))  # low, medium, high, critical
    
    # Full audit report
    audit_report = Column(JSON)
    
    # Processing metadata
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("AuditCase", back_populates="audit_results")


class AuditStats(Base):
    __tablename__ = "audit_stats"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    total_audits = Column(Integer, default=0)
    discrepancies_found = Column(Integer, default=0)
    revenue_recovered = Column(Float, default=0.0)
    accuracy_rate = Column(Float, default=0.0)
