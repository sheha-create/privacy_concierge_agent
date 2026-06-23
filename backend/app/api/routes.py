import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import init_db, get_db, get_db_context
from app.models.database import Document, Reminder, ChatMessage, PIIFlag, ProcessingLog, DocumentType
from app.services.document_processor import DocumentProcessor, create_document_processor
from app.services.agent_tools import AgentTools, create_agent_tools

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor: Optional[DocumentProcessor] = None
agent: Optional[AgentTools] = None


@app.on_event("startup")
async def startup():
    global processor, agent
    init_db()
    processor = create_document_processor()
    agent = create_agent_tools()


class QueryRequest(BaseModel):
    question: str


class ReminderCreate(BaseModel):
    title: str
    due_date: str
    source_doc_id: int
    amount: Optional[float] = None


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    allowed = {".pdf", ".png", ".jpg", ".jpeg", ".txt", ".doc", ".docx"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported")

    content = await file.read()
    if len(content) > settings.max_file_size:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    mime = file.content_type or "application/octet-stream"

    try:
        doc = processor.process_document(content, file.filename, mime, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    return {
        "id": doc.id,
        "filename": doc.original_filename,
        "doc_type": doc.doc_type.value,
        "pii_detected": doc.pii_detected,
        "pii_severity": doc.pii_severity.value,
        "chunk_count": doc.chunk_count,
        "key_dates": doc.key_dates,
        "key_amounts": doc.key_amounts,
        "summary": doc.summary,
    }


@app.get("/api/documents")
async def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.original_filename,
            "doc_type": d.doc_type.value,
            "pii_detected": d.pii_detected,
            "pii_severity": d.pii_severity.value,
            "key_dates": d.key_dates,
            "key_amounts": d.key_amounts,
            "chunk_count": d.chunk_count,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    flags = db.query(PIIFlag).filter(PIIFlag.document_id == doc_id).all()
    reminders = db.query(Reminder).filter(Reminder.document_id == doc_id).all()

    return {
        "id": doc.id,
        "filename": doc.original_filename,
        "doc_type": doc.doc_type.value,
        "pii_detected": doc.pii_detected,
        "pii_severity": doc.pii_severity.value,
        "pii_flags": [
            {
                "type": f.pii_type.value,
                "matched_text": f.matched_text[:20] + "...",
                "confidence": f.confidence,
                "severity": f.severity.value,
                "redacted": f.redacted,
            }
            for f in flags
        ],
        "reminders": [
            {
                "id": r.id,
                "title": r.title,
                "due_date": r.due_date.isoformat() if r.due_date else None,
                "amount": r.amount,
                "status": r.status,
            }
            for r in reminders
        ],
        "key_dates": doc.key_dates,
        "key_amounts": doc.key_amounts,
        "summary": doc.summary,
        "chunk_count": doc.chunk_count,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    return {"deleted": True}


@app.post("/api/query")
async def query_documents(request: QueryRequest, db: Session = Depends(get_db)):
    result = agent.query_documents(request.question, db)

    chat = ChatMessage(
        session_id="query",
        role="user",
        content=request.question,
    )
    db.add(chat)

    chat_response = ChatMessage(
        session_id="query",
        role="assistant",
        content=result["answer"],
        citations=result["citations"],
    )
    db.add(chat_response)
    db.commit()

    return result


@app.post("/api/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    user_msg = ChatMessage(
        session_id=request.session_id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    db.commit()

    result = agent.query_documents(request.message, db)

    assistant_msg = ChatMessage(
        session_id=request.session_id,
        role="assistant",
        content=result["answer"],
        citations=result["citations"],
    )
    db.add(assistant_msg)
    db.commit()

    return {
        "response": result["answer"],
        "citations": result["citations"],
        "session_id": request.session_id,
    }


@app.get("/api/reminders")
async def list_reminders(
    status: Optional[str] = Query(None),
    upcoming_days: int = Query(30),
    db: Session = Depends(get_db),
):
    query = db.query(Reminder)
    if status:
        query = query.filter(Reminder.status == status)

    cutoff = datetime.now() + timedelta(days=upcoming_days)
    query = query.filter(Reminder.due_date <= cutoff)

    reminders = query.order_by(Reminder.due_date.asc()).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "amount": r.amount,
            "currency": r.currency,
            "status": r.status,
            "document_id": r.document_id,
        }
        for r in reminders
    ]


@app.post("/api/reminders")
async def create_reminder(request: ReminderCreate, db: Session = Depends(get_db)):
    return agent.add_reminder(
        title=request.title,
        due_date=request.due_date,
        source_doc_id=request.source_doc_id,
        amount=request.amount,
        db=db,
    )


@app.patch("/api/reminders/{reminder_id}")
async def update_reminder(
    reminder_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    rem = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")

    if status:
        rem.status = status
        if status == "completed":
            rem.completed_at = datetime.utcnow()
    db.commit()
    return {"updated": True}


@app.get("/api/dashboard")
async def dashboard(db: Session = Depends(get_db)):
    total_docs = db.query(func.count(Document.id)).scalar() or 0
    flagged_docs = db.query(func.count(Document.id)).filter(Document.pii_detected == True).scalar() or 0
    total_reminders = db.query(func.count(Reminder.id)).scalar() or 0
    pending_reminders = db.query(func.count(Reminder.id)).filter(Reminder.status == "pending").scalar() or 0

    upcoming_cutoff = datetime.now() + timedelta(days=7)
    upcoming_reminders = (
        db.query(Reminder)
        .filter(Reminder.status == "pending", Reminder.due_date <= upcoming_cutoff)
        .order_by(Reminder.due_date.asc())
        .limit(10)
        .all()
    )

    recent_docs = db.query(Document).order_by(Document.created_at.desc()).limit(5).all()

    recent_flags = (
        db.query(PIIFlag)
        .order_by(PIIFlag.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "stats": {
            "total_documents": total_docs,
            "flagged_documents": flagged_docs,
            "total_reminders": total_reminders,
            "pending_reminders": pending_reminders,
        },
        "upcoming_reminders": [
            {
                "id": r.id,
                "title": r.title,
                "due_date": r.due_date.isoformat() if r.due_date else None,
                "amount": r.amount,
            }
            for r in upcoming_reminders
        ],
        "recent_documents": [
            {
                "id": d.id,
                "filename": d.original_filename,
                "doc_type": d.doc_type.value,
                "pii_detected": d.pii_detected,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in recent_docs
        ],
        "recent_flags": [
            {
                "document_id": f.document_id,
                "pii_type": f.pii_type.value,
                "severity": f.severity.value,
                "matched_text": f.matched_text[:20] + "..." if len(f.matched_text) > 20 else f.matched_text,
            }
            for f in recent_flags
        ],
    }


@app.get("/api/digest")
async def daily_digest(db: Session = Depends(get_db)):
    upcoming = datetime.now() + timedelta(days=7)
    reminders = (
        db.query(Reminder)
        .filter(Reminder.status == "pending", Reminder.due_date <= upcoming)
        .order_by(Reminder.due_date.asc())
        .all()
    )

    flagged = db.query(Document).filter(Document.pii_detected == True).order_by(Document.created_at.desc()).limit(5).all()

    summary_parts = []
    if reminders:
        summary_parts.append(f"**Upcoming deadlines ({len(reminders)}):**")
        for r in reminders[:5]:
            days_until = (r.due_date - datetime.now()).days if r.due_date else 0
            amount_str = f" - ₹{r.amount:,.0f}" if r.amount else ""
            summary_parts.append(f"- {r.title} (in {days_until} days){amount_str}")

    if flagged:
        summary_parts.append(f"\n**Documents with sensitive data ({len(flagged)}):**")
        for d in flagged:
            summary_parts.append(f"- {d.original_filename} (severity: {d.pii_severity.value})")

    if not summary_parts:
        summary_parts.append("No upcoming deadlines or flagged documents.")

    return {
        "summary": "\n".join(summary_parts),
        "reminders_count": len(reminders),
        "flagged_count": len(flagged),
        "reminders": [
            {"title": r.title, "due_date": r.due_date.isoformat() if r.due_date else None}
            for r in reminders
        ],
        "flagged_docs": [
            {"filename": d.original_filename, "severity": d.pii_severity.value}
            for d in flagged
        ],
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "app": settings.app_name}