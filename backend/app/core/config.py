from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    app_name: str = "Privacy Guardian Agent"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "sqlite:///./data/sqlite/guardian.db"

    # File storage
    upload_dir: str = "./data/uploads"
    faiss_dir: str = "./data/faiss"
    max_file_size: int = 50 * 1024 * 1024  # 50MB

    # OCR
    tesseract_cmd: Optional[str] = None  # Auto-detect if None

    # Embeddings & LLM (Azure OpenAI)
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_key: Optional[str] = None
    azure_openai_api_version: str = "2024-02-15-preview"
    azure_openai_embedding_deployment: str = "text-embedding-3-small"
    azure_openai_chat_deployment: str = "gpt-4o-mini"

    # Alternative: Claude API
    anthropic_api_key: Optional[str] = None

    # PII Detection
    pii_confidence_threshold: float = 0.7
    enable_indian_pii: bool = True

    # RAG
    chunk_size: int = 500
    chunk_overlap: int = 50
    top_k_retrieval: int = 5

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()