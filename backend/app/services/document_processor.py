import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import re
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.database import (
    Document, DocumentChunk, PIIFlag, Reminder, ProcessingLog,
    DocumentType, PIIType, SeverityLevel
)
from app.services.ocr import OCRService, create_ocr_service
from app.services.pii_detector import PIIDetector, create_pii_detector, PIIMatch
from app.services.rag import RAGService, EmbeddingService, create_rag_service, create_embedding_service

logger = logging.getLogger(__name__)


class DocumentProcessor:
    def __init__(
        self,
        ocr_service: Optional[OCRService] = None,
        pii_detector: Optional[PIIDetector] = None,
        rag_service: Optional[RAGService] = None,
        embedding_service: Optional[EmbeddingService] = None,
    ):
        self.ocr_service = ocr_service or create_ocr_service(settings.tesseract_cmd)
        self.pii_detector = pii_detector or create_pii_detector(
            settings.enable_indian_pii, settings.pii_confidence_threshold
        )
        self.rag = rag_service or create_rag_service()
        self.embeddings = embedding_service or create_embedding_service()
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_upload(self, file_content: bytes, filename: str) -> Tuple[str, str]:
        file_id = str(uuid.uuid4())
        ext = Path(filename).suffix.lower()
        saved_filename = f"{file_id}{ext}"
        file_path = self.upload_dir / saved_filename
        with open(file_path, "wb") as f:
            f.write(file_content)
        return str(file_path), saved_filename

    def process_document(
        self,
        file_content: bytes,
        filename: str,
        mime_type: str,
        db: Session
    ) -> Document:
        file_path, saved_filename = self.save_upload(file_content, filename)

        doc = Document(
            filename=saved_filename,
            original_filename=filename,
            file_path=file_path,
            file_type=Path(filename).suffix.lower().lstrip("."),
            file_size=len(file_content),
            mime_type=mime_type,
        )
        db.add(doc)
        db.flush()

        self._log(db, doc.id, "ingestion", "started", f"Processing {filename}")

        try:
            raw_text, page_count = self.ocr_service.extract_text(file_path, mime_type)
            doc.raw_text = raw_text
            doc.page_count = page_count
            self._log(db, doc.id, "ocr", "completed", f"Extracted {len(raw_text)} chars from {page_count} pages")

            pii_matches = self.pii_detector.detect(raw_text)
            doc.pii_detected = len(pii_matches) > 0
            doc.pii_severity = self.pii_detector.analyze_severity(pii_matches)

            sanitized_text = self.pii_detector.redact(raw_text, pii_matches)
            doc.sanitized_text = sanitized_text

            for match in pii_matches:
                flag = PIIFlag(
                    document_id=doc.id,
                    pii_type=match.pii_type,
                    matched_text=match.matched_text,
                    start_pos=match.start_pos,
                    end_pos=match.end_pos,
                    confidence=match.confidence,
                    severity=match.severity,
                    redacted=True,
                )
                db.add(flag)

            self._log(db, doc.id, "pii_detection", "completed",
                     f"Found {len(pii_matches)} PII matches, severity: {doc.pii_severity.value}")

            chunks = self._chunk_text(sanitized_text, doc.id)
            doc.chunk_count = len(chunks)
            for i, chunk in enumerate(chunks):
                chunk_obj = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=chunk,
                    sanitized_content=chunk,
                    token_count=len(chunk.split()),
                )
                db.add(chunk_obj)

            self._log(db, doc.id, "chunking", "completed", f"Created {len(chunks)} chunks")

            # Add chunks to FAISS index
            if chunks:
                # Flush to get chunk IDs
                db.flush()
                chunk_objs = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
                chunk_texts = [c.sanitized_content for c in chunk_objs]
                if chunk_texts:
                    embeddings = self.embeddings.get_embeddings(chunk_texts)
                    self.rag.add_chunks(chunk_objs, embeddings)
                    self._log(db, doc.id, "indexing", "completed", f"Indexed {len(chunk_objs)} chunks in FAISS")

            classification = self._classify_document(raw_text)
            doc.doc_type = classification["type"]
            doc.classification_confidence = classification["confidence"]
            doc.key_dates = classification["key_dates"]
            doc.key_amounts = classification["key_amounts"]
            doc.summary = classification["summary"]

            reminders = self._extract_reminders(raw_text, doc.id)
            for rem in reminders:
                db.add(rem)

            doc.processed_at = datetime.utcnow()
            self._log(db, doc.id, "classification", "completed",
                     f"Type: {doc.doc_type.value}, Reminders: {len(reminders)}")

            db.commit()
            return doc

        except Exception as e:
            self._log(db, doc.id, "processing", "failed", str(e))
            db.rollback()
            raise

    def _chunk_text(self, text: str, document_id: int) -> List[str]:
        chunk_size = settings.chunk_size
        overlap = settings.chunk_overlap
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            if chunk_words:
                chunks.append(" ".join(chunk_words))
        return chunks

    def _classify_document(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        type_keywords = {
            DocumentType.BILL: ["bill", "invoice", "receipt", "payment", "due", "amount due"],
            DocumentType.ID_DOCUMENT: ["aadhaar", "pan card", "passport", "driving license", "voter id", "identity"],
            DocumentType.CERTIFICATE: ["certificate", "certified", "award", "diploma", "degree", "completion"],
            DocumentType.OFFER_LETTER: ["offer letter", "appointment letter", "joining", "salary", "ctc", "employment"],
            DocumentType.BANK_STATEMENT: ["bank statement", "account statement", "transaction", "balance", "credited", "debited"],
            DocumentType.CONTRACT: ["contract", "agreement", "terms", "conditions", "party", "whereas"],
            DocumentType.RECEIPT: ["receipt", "received", "paid", "transaction id", "order id"],
        }

        scores = {}
        for doc_type, keywords in type_keywords.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[doc_type] = score

        best_type = max(scores, key=scores.get) if scores else DocumentType.OTHER
        confidence = min(scores.get(best_type, 0) / 5.0, 1.0)

        key_dates = self._extract_dates(text)
        key_amounts = self._extract_amounts(text)
        summary = self._generate_summary(text, best_type)

        return {
            "type": best_type,
            "confidence": confidence,
            "key_dates": key_dates,
            "key_amounts": key_amounts,
            "summary": summary,
        }

    def _extract_dates(self, text: str) -> List[Dict[str, Any]]:
        date_patterns = [
            r'\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b',
            r'\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b',
            r'\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b',
        ]
        dates = []
        for pattern in date_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                dates.append({"raw": match.group(), "position": match.start()})
        return dates[:10]

    def _extract_amounts(self, text: str) -> List[Dict[str, Any]]:
        amount_pattern = r'(?:Rs\.?|INR|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        amounts = []
        for match in re.finditer(amount_pattern, text, re.IGNORECASE):
            amounts.append({
                "raw": match.group(),
                "value": float(match.group(1).replace(",", "")),
                "currency": "INR",
                "position": match.start(),
            })
        return amounts[:10]

    def _generate_summary(self, text: str, doc_type: DocumentType) -> str:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        return " ".join(lines[:3])[:500] if lines else "No content extracted"

    def _extract_reminders(self, text: str, document_id: int) -> List[Reminder]:
        from datetime import timedelta
        reminders = []
        date_pattern = r'\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b'
        for match in re.finditer(date_pattern, text):
            try:
                day, month, year = map(int, match.groups())
                due_date = datetime(year, month, day)
                if due_date >= datetime.now() and due_date <= datetime.now() + timedelta(days=365):
                    context_start = max(0, match.start() - 100)
                    context_end = min(len(text), match.end() + 100)
                    context = text[context_start:context_end].strip()
                    reminders.append(Reminder(
                        document_id=document_id,
                        title=f"Deadline from {context[:50]}...",
                        description=context,
                        due_date=due_date,
                        reminder_type="deadline",
                        source_text=context,
                    ))
            except ValueError:
                continue
        return reminders[:5]

    def _log(self, db: Session, document_id: Optional[int], stage: str, status: str, message: str, details: Dict = None):
        log = ProcessingLog(
            document_id=document_id,
            stage=stage,
            status=status,
            message=message,
            details=details or {},
        )
        db.add(log)


def create_document_processor() -> DocumentProcessor:
    return DocumentProcessor()