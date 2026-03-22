"""
Knowledge Base Builder
Uses ChromaDB's built-in default embeddings — no sentence-transformers needed.
"""
import chromadb
from chromadb.utils import embedding_functions
from config import settings
import logging

logger = logging.getLogger(__name__)

SAMPLE_ICD10_CODES = [
    ("I10", "Essential (primary) hypertension"),
    ("I25.10", "Atherosclerotic heart disease of native coronary artery without angina pectoris"),
    ("I21.9", "Acute myocardial infarction, unspecified"),
    ("I21.4", "Non-ST elevation myocardial infarction"),
    ("I50.9", "Heart failure, unspecified"),
    ("I48.91", "Unspecified atrial fibrillation"),
    ("I63.9", "Cerebral infarction, unspecified"),
    ("I26.99", "Other pulmonary embolism without acute cor pulmonale"),
    ("J18.9", "Pneumonia, unspecified organism"),
    ("J44.1", "Chronic obstructive pulmonary disease with acute exacerbation"),
    ("J96.00", "Acute respiratory failure, unspecified"),
    ("J45.20", "Mild intermittent asthma, uncomplicated"),
    ("J15.9", "Unspecified bacterial pneumonia"),
    ("E11.9", "Type 2 diabetes mellitus without complications"),
    ("E11.65", "Type 2 diabetes mellitus with hyperglycemia"),
    ("E11.40", "Type 2 diabetes mellitus with diabetic neuropathy, unspecified"),
    ("E11.22", "Type 2 diabetes mellitus with diabetic chronic kidney disease stage 3"),
    ("E10.9", "Type 1 diabetes mellitus without complications"),
    ("E66.01", "Morbid (severe) obesity due to excess calories"),
    ("E66.09", "Other obesity due to excess calories"),
    ("A41.9", "Sepsis, unspecified organism"),
    ("A41.01", "Sepsis due to Methicillin susceptible Staphylococcus aureus"),
    ("N17.9", "Acute kidney failure, unspecified"),
    ("N18.3", "Chronic kidney disease, stage 3"),
    ("N18.6", "End stage renal disease"),
    ("N39.0", "Urinary tract infection, site not specified"),
    ("T81.40XA", "Infection following a procedure, unspecified, initial encounter"),
    ("M16.11", "Primary osteoarthritis, right hip"),
    ("M17.11", "Primary osteoarthritis, right knee"),
    ("M54.50", "Low back pain, unspecified"),
    ("S72.001A", "Fracture of unspecified part of neck of right femur, initial encounter"),
    ("K92.1", "Melena"),
    ("K57.30", "Diverticulosis of large intestine without perforation or abscess"),
    ("K21.0", "Gastro-esophageal reflux disease with esophagitis"),
    ("G35", "Multiple sclerosis"),
    ("G20", "Parkinson's disease"),
    ("G30.9", "Alzheimer's disease, unspecified"),
    ("F32.9", "Major depressive disorder, single episode, unspecified"),
    ("F41.1", "Generalized anxiety disorder"),
    ("F10.20", "Alcohol dependence, uncomplicated"),
    ("D50.9", "Iron deficiency anemia, unspecified"),
    ("D64.9", "Anemia, unspecified"),
    ("C34.10", "Malignant neoplasm of upper lobe, unspecified bronchus or lung"),
    ("C50.911", "Malignant neoplasm of unspecified site of right female breast"),
    ("C18.9", "Malignant neoplasm of colon, unspecified"),
    ("E87.1", "Hypo-osmolality and hyponatremia"),
    ("I87.2", "Venous insufficiency chronic peripheral"),
    ("Z96.641", "Presence of right artificial hip joint"),
    ("Z48.812", "Encounter for surgical aftercare following surgery on circulatory system"),
]

SAMPLE_CPT_CODES = [
    ("99221", "Initial hospital care, low complexity medical decision making"),
    ("99222", "Initial hospital care, moderate complexity medical decision making"),
    ("99223", "Initial hospital care, high complexity medical decision making"),
    ("99231", "Subsequent hospital care, low complexity"),
    ("99232", "Subsequent hospital care, moderate complexity"),
    ("99233", "Subsequent hospital care, high complexity"),
    ("99238", "Hospital discharge management, 30 minutes or less"),
    ("99239", "Hospital discharge management, more than 30 minutes"),
    ("99291", "Critical care, first 30-74 minutes"),
    ("27447", "Total knee arthroplasty"),
    ("27130", "Total hip arthroplasty"),
    ("33533", "Coronary artery bypass, arterial, single"),
    ("47562", "Laparoscopic cholecystectomy"),
    ("49505", "Repair initial inguinal hernia, reducible"),
    ("43239", "Upper GI endoscopy with biopsy"),
    ("45378", "Colonoscopy, diagnostic"),
    ("33208", "Insertion of permanent pacemaker, dual chamber"),
    ("71046", "Chest X-ray, 2 views"),
    ("70553", "MRI brain with and without contrast"),
    ("71250", "CT thorax without contrast"),
    ("74178", "CT abdomen and pelvis without and with contrast"),
    ("93306", "Echocardiography, transthoracic"),
    ("80048", "Basic metabolic panel"),
    ("80053", "Comprehensive metabolic panel"),
    ("85025", "Blood count complete CBC with differential"),
    ("93000", "Electrocardiogram routine with interpretation"),
    ("36415", "Venipuncture for collection of specimen"),
    ("31500", "Intubation endotracheal emergency procedure"),
    ("36620", "Arterial catheterization for blood pressure monitoring"),
    ("36556", "Insertion of central venous catheter age 5 or older"),
    ("92928", "Percutaneous transcatheter placement of intracoronary stent"),
    ("93458", "Catheter placement in coronary artery for coronary angiography"),
]


def get_chroma_client():
    return chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)


def get_embedding_function():
    """Use ChromaDB's built-in default embeddings — no extra ML packages needed."""
    return embedding_functions.DefaultEmbeddingFunction()


def build_knowledge_base(force_rebuild: bool = False):
    client = get_chroma_client()
    ef = get_embedding_function()

    existing = [c.name for c in client.list_collections()]

    if settings.CHROMA_COLLECTION_NAME in existing and not force_rebuild:
        logger.info("✅ Knowledge base already exists, loading...")
        collection = client.get_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            embedding_function=ef
        )
        return collection

    if settings.CHROMA_COLLECTION_NAME in existing:
        client.delete_collection(settings.CHROMA_COLLECTION_NAME)

    logger.info("🔨 Building medical codes knowledge base...")
    collection = client.create_collection(
        name=settings.CHROMA_COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )

    ids, docs, metas = [], [], []
    for code, description in SAMPLE_ICD10_CODES:
        ids.append(f"icd10_{code.replace('.','_')}")
        docs.append(f"ICD-10 Code {code}: {description}")
        metas.append({"code": code, "type": "ICD10", "description": description})

    for code, description in SAMPLE_CPT_CODES:
        ids.append(f"cpt_{code}")
        docs.append(f"CPT Code {code}: {description}")
        metas.append({"code": code, "type": "CPT", "description": description})

    collection.add(documents=docs, metadatas=metas, ids=ids)
    logger.info(f"✅ Knowledge base built: {len(docs)} codes indexed")
    return collection


_collection_cache = None

def get_or_load_collection():
    global _collection_cache
    if _collection_cache is None:
        _collection_cache = build_knowledge_base()
    return _collection_cache


def search_codes(query: str, code_type: str = None, n_results: int = 15):
    collection = get_or_load_collection()
    where = {"type": code_type} if code_type else None
    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, 10),
        where=where
    )
    codes = []
    if results["metadatas"] and results["metadatas"][0]:
        for meta, doc in zip(results["metadatas"][0], results["documents"][0]):
            codes.append({
                "code": meta["code"],
                "type": meta["type"],
                "description": meta["description"],
                "context": doc
            })
    return codes