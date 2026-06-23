import fitz
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class OCRService:
    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.tesseract_cmd = tesseract_cmd

    def extract_text_from_pdf(self, file_path: str) -> Tuple[str, int]:
        text_parts = []
        page_count = 0
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            for page_num in range(page_count):
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    text_parts.append(f"--- Page {page_num + 1} ---\n{text}")
                else:
                    pix = page.get_pixmap(dpi=200)
                    img_data = pix.tobytes("png")
                    text_parts.append(f"--- Page {page_num + 1} (Image, OCR not available) ---\n[Image content - text extraction requires Tesseract OCR]")
            doc.close()
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            raise
        return "\n\n".join(text_parts), page_count

    def extract_text(self, file_path: str, mime_type: str) -> Tuple[str, int]:
        if mime_type == "application/pdf" or file_path.lower().endswith(".pdf"):
            return self.extract_text_from_pdf(file_path)
        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                return text, 1
            except Exception as e:
                logger.error(f"Text extraction failed: {e}")
                return "", 1


def create_ocr_service(tesseract_cmd: Optional[str] = None) -> OCRService:
    return OCRService(tesseract_cmd)