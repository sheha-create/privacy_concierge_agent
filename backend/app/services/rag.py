import os
import json
import pickle
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import logging

import numpy as np
import faiss
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.database import Document, DocumentChunk

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self):
        self.faiss_dir = Path(settings.faiss_dir)
        self.faiss_dir.mkdir(parents=True, exist_ok=True)
        
        self.index_path = self.faiss_dir / "documents.index"
        self.metadata_path = self.faiss_dir / "metadata.json"
        
        self.index: Optional[faiss.Index] = None
        self.chunk_metadata: List[Dict[str, Any]] = []
        self.embedding_dim = 1536
        
        self._load_or_create_index()
    
    def _load_or_create_index(self):
        if self.index_path.exists() and self.metadata_path.exists():
            try:
                self.index = faiss.read_index(str(self.index_path))
                with open(self.metadata_path, "r") as f:
                    self.chunk_metadata = json.load(f)
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
            except Exception as e:
                logger.warning(f"Failed to load index: {e}, creating new")
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        self.index = faiss.IndexFlatL2(self.embedding_dim)
        self.chunk_metadata = []
        self._save_index()
    
    def _save_index(self):
        faiss.write_index(self.index, str(self.index_path))
        with open(self.metadata_path, "w") as f:
            json.dump(self.chunk_metadata, f)
    
    def add_chunks(self, chunks: List[DocumentChunk], embeddings: np.ndarray):
        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings count mismatch")
        
        if self.index is None:
            self._create_new_index()
        
        start_id = self.index.ntotal
        self.index.add(embeddings.astype(np.float32))
        
        for i, chunk in enumerate(chunks):
            self.chunk_metadata.append({
                "faiss_id": start_id + i,
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "chunk_index": chunk.chunk_index,
                "content": chunk.sanitized_content[:200],
            })
        
        self._save_index()
        logger.info(f"Added {len(chunks)} chunks to FAISS index")
    
    def search(self, query_embedding: np.ndarray, top_k: int = None) -> List[Dict[str, Any]]:
        if self.index is None or self.index.ntotal == 0:
            return []
        
        top_k = top_k or settings.top_k_retrieval
        top_k = min(top_k, self.index.ntotal)
        
        distances, indices = self.index.search(
            query_embedding.astype(np.float32).reshape(1, -1), top_k
        )
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.chunk_metadata):
                meta = self.chunk_metadata[idx].copy()
                meta["distance"] = float(dist)
                meta["score"] = 1.0 / (1.0 + float(dist))
                results.append(meta)
        
        return results
    
    def get_chunk_content(self, chunk_id: int, db: Session) -> Optional[str]:
        chunk = db.query(DocumentChunk).filter(DocumentChunk.id == chunk_id).first()
        return chunk.sanitized_content if chunk else None
    
    def remove_document_chunks(self, document_id: int):
        new_metadata = []
        ids_to_remove = []
        
        for i, meta in enumerate(self.chunk_metadata):
            if meta["document_id"] == document_id:
                ids_to_remove.append(meta["faiss_id"])
            else:
                new_metadata.append(meta)
        
        if ids_to_remove and self.index is not None:
            self.chunk_metadata = new_metadata
            self._rebuild_index()
            logger.info(f"Removed {len(ids_to_remove)} chunks for document {document_id}")
    
    def _rebuild_index(self):
        if not self.chunk_metadata:
            self._create_new_index()
            return
        
        self._create_new_index()
        embeddings = []
        
        for meta in self.chunk_metadata:
            pass
        
        self._save_index()
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "total_chunks": len(self.chunk_metadata),
            "embedding_dim": self.embedding_dim,
        }


class EmbeddingService:
    def __init__(self):
        self.client = None
        self.embedding_dim = 1536
        self._init_client()
    
    def _init_client(self):
        if settings.azure_openai_endpoint and settings.azure_openai_api_key:
            from openai import AzureOpenAI
            self.client = AzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
            )
            self.deployment = settings.azure_openai_embedding_deployment
        else:
            logger.warning("Azure OpenAI not configured, using mock embeddings")
    
    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        if self.client:
            return self._get_azure_embeddings(texts)
        else:
            return self._get_mock_embeddings(texts)
    
    def _get_azure_embeddings(self, texts: List[str]) -> np.ndarray:
        response = self.client.embeddings.create(
            input=texts,
            model=self.deployment,
        )
        embeddings = [e.embedding for e in response.data]
        return np.array(embeddings, dtype=np.float32)
    
    def _get_mock_embeddings(self, texts: List[str]) -> np.ndarray:
        np.random.seed(42)
        embeddings = np.random.randn(len(texts), self.embedding_dim).astype(np.float32)
        # Normalize for cosine similarity
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        embeddings = embeddings / (norms + 1e-8)
        return embeddings
    
    def get_query_embedding(self, text: str) -> np.ndarray:
        return self.get_embeddings([text])[0]


def create_rag_service() -> RAGService:
    return RAGService()


def create_embedding_service() -> EmbeddingService:
    return EmbeddingService()