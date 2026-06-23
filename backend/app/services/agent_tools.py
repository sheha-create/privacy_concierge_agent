import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.database import Document, Reminder, ChatMessage, SeverityLevel
from app.services.rag import RAGService, EmbeddingService, create_rag_service, create_embedding_service
from app.services.pii_detector import PIIDetector, create_pii_detector


class AgentTools:
    def __init__(
        self,
        rag_service: Optional[RAGService] = None,
        embedding_service: Optional[EmbeddingService] = None,
        pii_detector: Optional[PIIDetector] = None,
    ):
        self.rag = rag_service or create_rag_service()
        self.embeddings = embedding_service or create_embedding_service()
        self.pii_detector = pii_detector or create_pii_detector()

    def classify_document(self, text: str) -> Dict[str, Any]:
        type_keywords = {
            "bill": ["bill", "invoice", "payment due", "amount due", "billing cycle"],
            "id_document": ["aadhaar", "pan card", "passport", "voter id", "driving license"],
            "certificate": ["certificate", "certified", "diploma", "degree", "completion"],
            "offer_letter": ["offer letter", "appointment letter", "salary", "ctc", "joining date"],
            "bank_statement": ["bank statement", "account balance", "transactions", "account number"],
            "contract": ["agreement", "terms and conditions", "party of the first part"],
            "receipt": ["receipt", "transaction id", "order confirmation"],
        }

        text_lower = text.lower()
        scores = {}
        for doc_type, keywords in type_keywords.items():
            scores[doc_type] = sum(1 for kw in keywords if kw in text_lower)

        best_type = max(scores, key=scores.get) if scores else "other"
        confidence = min(scores.get(best_type, 0) / 5.0, 1.0)

        return {
            "type": best_type,
            "confidence": round(confidence, 2),
            "key_dates": self._extract_dates(text),
            "key_amounts": self._extract_amounts(text),
        }

    def flag_sensitive(self, text: str) -> Dict[str, Any]:
        matches = self.pii_detector.detect(text)
        return {
            "pii_found": len(matches) > 0,
            "types": [{"type": m.pii_type.value, "text": m.matched_text[:20], "confidence": m.confidence} for m in matches[:10]],
            "severity": self.pii_detector.analyze_severity(matches).value,
            "count": len(matches),
        }

    def add_reminder(
        self,
        title: str,
        due_date: str,
        source_doc_id: int,
        amount: Optional[float] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        if db is None:
            return {"error": "Database session required"}

        try:
            parsed_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
        except ValueError:
            parsed_date = datetime.now() + timedelta(days=30)

        reminder = Reminder(
            document_id=source_doc_id,
            title=title,
            due_date=parsed_date,
            amount=amount,
            status="pending",
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)

        return {
            "reminder_id": reminder.id,
            "title": reminder.title,
            "due_date": reminder.due_date.isoformat(),
            "status": reminder.status,
        }

    def query_documents(self, question: str, db: Session) -> Dict[str, Any]:
        query_embedding = self.embeddings.get_query_embedding(question)
        search_results = self.rag.search(query_embedding, top_k=settings.top_k_retrieval)

        if not search_results:
            return {
                "answer": "No relevant documents found. Please upload documents first.",
                "citations": [],
                "sources": [],
            }

        context_parts = []
        sources = []
        for result in search_results:
            content = self.rag.get_chunk_content(result["chunk_id"], db)
            if content:
                context_parts.append(content)
                sources.append({
                    "document_id": result["document_id"],
                    "chunk_id": result["chunk_id"],
                    "score": round(result["score"], 3),
                })

        context = "\n\n---\n\n".join(context_parts)
        answer = self._generate_answer(question, context)

        return {
            "answer": answer,
            "citations": sources,
            "sources": sources,
        }

    def _generate_answer(self, question: str, context: str) -> str:
        if settings.azure_openai_endpoint and settings.azure_openai_api_key:
            return self._generate_azure_answer(question, context)

        return self._generate_local_answer(question, context)

    def _generate_azure_answer(self, question: str, context: str) -> str:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )

        response = client.chat.completions.create(
            model=settings.azure_openai_chat_deployment,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on the user's documents. Always cite which document your answer comes from. Never share raw PII - only use redacted versions."},
                {"role": "user", "content": f"Context from documents:\n{context}\n\nQuestion: {question}"},
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content

    def _generate_local_answer(self, question: str, context: str) -> str:
        question_lower = question.lower()
        lines = context.split("\n")
        relevant = [l.strip() for l in lines if any(w in l.lower() for w in question_lower.split() if len(w) > 3)]

        if not relevant:
            relevant = lines[:5]

        answer = "Based on the documents:\n\n"
        for line in relevant[:5]:
            if line.strip():
                answer += f"- {line.strip()}\n"

        answer += "\n(Configure Azure OpenAI for more intelligent responses)"
        return answer

    def _extract_dates(self, text: str) -> List[str]:
        import re
        patterns = [
            r'\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b',
            r'\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b',
        ]
        dates = []
        for pattern in patterns:
            for match in re.finditer(pattern, text):
                dates.append(match.group(1))
        return dates[:5]

    def _extract_amounts(self, text: str) -> List[str]:
        import re
        pattern = r'(?:Rs\.?|INR|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        return [match.group() for match in re.finditer(pattern, text, re.IGNORECASE)][:5]


def create_agent_tools() -> AgentTools:
    return AgentTools()