from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Float, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class DocumentType(str, enum.Enum):
    BILL = "bill"
    ID_DOCUMENT = "id_document"
    CERTIFICATE = "certificate"
    OFFER_LETTER = "offer_letter"
    BANK_STATEMENT = "bank_statement"
    CONTRACT = "contract"
    RECEIPT = "receipt"
    OTHER = "other"


class PIIType(str, enum.Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    PASSPORT = "passport"
    DRIVING_LICENSE = "driving_license"
    VOTER_ID = "voter_id"
    BANK_ACCOUNT = "bank_account"
    IFSC = "ifsc"
    CREDIT_CARD = "credit_card"
    PHONE = "phone"
    EMAIL = "email"
    PASSWORD = "password"
    ADDRESS = "address"
    NAME = "name"
    DATE_OF_BIRTH = "date_of_birth"
    OTHER = "other"


class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100))

    doc_type = Column(Enum(DocumentType), default=DocumentType.OTHER)
    raw_text = Column(Text)
    sanitized_text = Column(Text)
    page_count = Column(Integer, default=1)

    pii_detected = Column(Boolean, default=False)
    pii_details = Column(JSON, default=list)
    pii_severity = Column(Enum(SeverityLevel), default=SeverityLevel.LOW)

    classification_confidence = Column(Float, default=0.0)
    key_dates = Column(JSON, default=list)
    key_amounts = Column(JSON, default=list)
    summary = Column(Text)

    faiss_index_id = Column(Integer, default=-1)
    chunk_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="document", cascade="all, delete-orphan")
    pii_flags = relationship("PIIFlag", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    sanitized_content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    embedding_id = Column(Integer, default=-1)

    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")


class PIIFlag(Base):
    __tablename__ = "pii_flags"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_id = Column(Integer, ForeignKey("document_chunks.id"), nullable=True)
    pii_type = Column(Enum(PIIType), nullable=False)
    matched_text = Column(String(500), nullable=False)
    start_pos = Column(Integer, nullable=False)
    end_pos = Column(Integer, nullable=False)
    confidence = Column(Float, default=0.0)
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.MEDIUM)
    redacted = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="pii_flags")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    due_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=True)
    currency = Column(String(10), default="INR")
    reminder_type = Column(String(50), default="deadline")
    status = Column(String(20), default="pending")
    source_text = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="reminders")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list)
    tool_calls = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)


class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    stage = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    message = Column(Text)
    details = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)