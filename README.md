# Privacy Guardian Agent

A personal concierge agent that manages your documents, bills, and digital footprint while actively protecting your privacy. All PII detection happens locally — only sanitized text is ever processed.

## Features

- **Document Ingestion**: Upload PDFs, images, or text files
- **On-Device PII Detection**: Automatically detects and redacts sensitive data (Aadhaar, PAN, bank accounts, etc.) before any processing
- **RAG-Based Q&A**: Ask natural language questions about your documents
- **Dashboard**: View flagged documents, upcoming deadlines, and document stats
- **Daily Digest**: Get summaries of deadlines and flagged items

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TRUST BOUNDARY                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Upload    │  │    OCR      │  │  PII Scan   │        │
│  │   Handler   │──│   Engine    │──│  & Redact   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                          │                                   │
│                    Sanitized Text Only                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    RETRIEVAL LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Chunking   │──│  Embeddings │──│  FAISS      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     AGENT/LLM LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Azure      │──│   Tool      │──│   Chat      │        │
│  │  OpenAI     │  │   Calling   │  │   History   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS
- **Backend**: Python 3.11, FastAPI, SQLAlchemy
- **OCR**: PyMuPDF, Tesseract
- **PII Detection**: Regex + spaCy NER (custom Indian PII patterns)
- **Embeddings**: Azure OpenAI (or mock for demo)
- **Vector Store**: FAISS (local)
- **Database**: SQLite

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Tesseract OCR (`brew install tesseract` or `apt install tesseract-ocr`)

### Local Development

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Optional: Configure Azure OpenAI in .env
cp .env.example .env
# Edit .env with your API keys

uvicorn app.api.routes:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

### Docker

```bash
docker-compose up --build
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000/docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload and process a document |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/{id}` | Get document details |
| DELETE | `/api/documents/{id}` | Delete a document |
| POST | `/api/query` | Ask a question about documents |
| POST | `/api/chat` | Chat with document context |
| GET | `/api/reminders` | List upcoming reminders |
| POST | `/api/reminders` | Create a reminder |
| GET | `/api/dashboard` | Get dashboard stats |
| GET | `/api/digest` | Get daily digest |

## PII Detection

The system detects and redacts:

- **Indian IDs**: Aadhaar, PAN, Passport, Voter ID, Driving License
- **Financial**: Bank accounts, IFSC codes, Credit card numbers
- **Contact**: Phone numbers, Email addresses
- **Other**: Passwords, Dates of birth

All detection runs on-device. Redacted text is what gets indexed and sent to any LLM.

## Demo Flow

1. Upload a mixed folder of documents
2. Watch the privacy gate catch and redact sensitive data in real-time
3. See flagged documents appear on the dashboard
4. Ask questions and get grounded answers with source citations
5. Review upcoming deadlines and reminders

## Project Structure

```
privacy-guardian/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes
│   │   ├── core/         # Config, database
│   │   ├── models/       # SQLAlchemy models
│   │   └── services/     # PII detection, OCR, RAG, Agent
│   ├── data/             # Local storage
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   └── components/   # React components
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT