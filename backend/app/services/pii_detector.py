import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

from app.models.database import PIIType, SeverityLevel


@dataclass
class PIIMatch:
    pii_type: PIIType
    matched_text: str
    start_pos: int
    end_pos: int
    confidence: float
    severity: SeverityLevel


class PIIDetector:
    def __init__(self, enable_indian_pii: bool = True, confidence_threshold: float = 0.7):
        self.enable_indian_pii = enable_indian_pii
        self.confidence_threshold = confidence_threshold
        self._compile_patterns()

    def _compile_patterns(self):
        self.patterns: List[Tuple[PIIType, re.Pattern, SeverityLevel, float]] = []

        if self.enable_indian_pii:
            self.patterns.extend([
                (PIIType.AADHAAR, re.compile(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'), SeverityLevel.CRITICAL, 0.95),
                (PIIType.PAN, re.compile(r'\b[A-Z]{5}\d{4}[A-Z]\b'), SeverityLevel.CRITICAL, 0.95),
                (PIIType.PASSPORT, re.compile(r'\b[A-Z]\d{7}\b'), SeverityLevel.HIGH, 0.85),
                (PIIType.DRIVING_LICENSE, re.compile(r'\b[A-Z]{2}\d{2}[\s-]?\d{11}\b'), SeverityLevel.HIGH, 0.8),
                (PIIType.VOTER_ID, re.compile(r'\b[A-Z]{3}\d{7}\b'), SeverityLevel.HIGH, 0.8),
                (PIIType.BANK_ACCOUNT, re.compile(r'\b\d{9,18}\b'), SeverityLevel.HIGH, 0.7),
                (PIIType.IFSC, re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b'), SeverityLevel.HIGH, 0.9),
            ])

        self.patterns.extend([
            (PIIType.CREDIT_CARD, re.compile(r'\b(?:\d{4}[\s-]?){3}\d{4}\b'), SeverityLevel.CRITICAL, 0.9),
            (PIIType.PHONE, re.compile(r'\b(?:\+91[\s-]?)?[6-9]\d{9}\b'), SeverityLevel.MEDIUM, 0.85),
            (PIIType.EMAIL, re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), SeverityLevel.MEDIUM, 0.95),
            (PIIType.PASSWORD, re.compile(r'(?i)(?:password|pwd|pass)[\s:=]+([^\s]{6,})'), SeverityLevel.CRITICAL, 0.8),
            (PIIType.DATE_OF_BIRTH, re.compile(r'\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b'), SeverityLevel.MEDIUM, 0.75),
        ])

    def detect(self, text: str) -> List[PIIMatch]:
        matches = []
        for pii_type, pattern, severity, base_confidence in self.patterns:
            for match in pattern.finditer(text):
                if base_confidence >= self.confidence_threshold:
                    matches.append(PIIMatch(
                        pii_type=pii_type,
                        matched_text=match.group(),
                        start_pos=match.start(),
                        end_pos=match.end(),
                        confidence=base_confidence,
                        severity=severity
                    ))
        matches = self._deduplicate_matches(matches)
        matches.sort(key=lambda x: x.start_pos)
        return matches

    def _deduplicate_matches(self, matches: List[PIIMatch]) -> List[PIIMatch]:
        if not matches:
            return []
        deduped = [matches[0]]
        for match in matches[1:]:
            last = deduped[-1]
            if match.start_pos <= last.end_pos and match.pii_type == last.pii_type:
                if match.confidence > last.confidence:
                    deduped[-1] = match
            else:
                deduped.append(match)
        return deduped

    def redact(self, text: str, matches: List[PIIMatch]) -> str:
        if not matches:
            return text
        result = []
        last_end = 0
        for match in matches:
            result.append(text[last_end:match.start_pos])
            result.append(f"[{match.pii_type.value.upper()}_REDACTED]")
            last_end = match.end_pos
        result.append(text[last_end:])
        return "".join(result)

    def analyze_severity(self, matches: List[PIIMatch]) -> SeverityLevel:
        if not matches:
            return SeverityLevel.LOW
        severities = [m.severity for m in matches]
        if SeverityLevel.CRITICAL in severities:
            return SeverityLevel.CRITICAL
        elif SeverityLevel.HIGH in severities:
            return SeverityLevel.HIGH
        elif SeverityLevel.MEDIUM in severities:
            return SeverityLevel.MEDIUM
        return SeverityLevel.LOW


def create_pii_detector(enable_indian_pii: bool = True, confidence_threshold: float = 0.7) -> PIIDetector:
    return PIIDetector(enable_indian_pii, confidence_threshold)