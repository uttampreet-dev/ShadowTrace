from __future__ import annotations

import logging
import os
from dataclasses import asdict, dataclass
from typing import Any

import requests

logger = logging.getLogger(__name__)

SARVAM_API_URL = "https://api.sarvam.ai/v1/language/detect"
REQUEST_TIMEOUT = 15


@dataclass(slots=True)
class SarvamLanguageDetectionResult:
    language: str
    confidence: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class SarvamLanguageDetector:
    def __init__(self) -> None:
        self.api_key = os.getenv("SARVAM_API_KEY", "").strip()

    def detect(self, text: str) -> SarvamLanguageDetectionResult:
        if not text.strip():
            return SarvamLanguageDetectionResult(language="unknown", confidence=0.0)
        if not self.api_key:
            return SarvamLanguageDetectionResult(language="unknown", confidence=0.0)
        try:
            response = requests.post(
                SARVAM_API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"text": text},
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            payload = response.json()
            language = str(payload.get("language") or payload.get("detected_language") or "unknown")
            confidence = float(payload.get("confidence") or payload.get("score") or 0.0)
            return SarvamLanguageDetectionResult(language=language, confidence=max(0.0, min(1.0, confidence)))
        except Exception as exc:
            logger.exception("Sarvam language detection failed: %s", exc)
            return SarvamLanguageDetectionResult(language="unknown", confidence=0.0)
