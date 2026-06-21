from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import re


@dataclass(slots=True)
class ContentAnalysisResult:
    misinformation_score: int
    confidence: float
    signals: dict[str, float]


class ContentAnalyzer:
    """Score text for misinformation likelihood.

    Uses HuggingFace RoBERTa when available, with a deterministic fallback so
    the backend remains usable in offline hackathon environments.
    """

    def __init__(self, model_name: str = "mrm8488/bert-tiny-finetuned-fake-news-detection") -> None:
        self.model_name = model_name
        self._pipeline = self._load_pipeline()

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_pipeline() -> Any:
        try:
            from transformers import pipeline

            return pipeline(
                "text-classification",
                model="mrm8488/bert-tiny-finetuned-fake-news-detection",
                top_k=None,
            )
        except Exception:
            return None

    def analyze(self, text: str) -> ContentAnalysisResult:
        text = text.strip()
        if not text:
            return ContentAnalysisResult(0, 0.0, {"empty_text": 1.0})

        lexical = self._lexical_score(text)
        model_score = self._model_score(text)
        score = self._blend_scores(lexical, model_score)
        confidence = min(0.99, 0.4 + abs(score - 50) / 100)
        signals = {
            "lexical_score": lexical / 100,
            "model_score": model_score / 100,
            "score_blend": score / 100,
        }
        return ContentAnalysisResult(int(round(score)), round(confidence, 3), signals)

    def _model_score(self, text: str) -> float:
        if self._pipeline is None:
            return self._lexical_score(text)

        try:
            result = self._pipeline(text[:512])
            if isinstance(result, list) and result:
                rows = result[0] if isinstance(result[0], list) else result
                score = 0.0
                for row in rows:
                    label = str(row.get("label", "")).lower()
                    value = float(row.get("score", 0.0))
                    if any(token in label for token in ("fake", "misinfo", "false", "rumor", "contradict")):
                        score = max(score, value * 100)
                if score == 0.0 and rows:
                    fallback_row = next(
                        (row for row in rows if str(row.get("label", "")).lower() in {"fake", "false", "misinformation"}),
                        rows[0],
                    )
                    score = float(fallback_row.get("score", 0.0)) * 100
                return max(0.0, min(100.0, score))
        except Exception:
            pass
        return self._lexical_score(text)

    @staticmethod
    def _lexical_score(text: str) -> float:
        lowered = text.lower()
        suspicious_terms = [
            "they don't want you to know",
            "wake up",
            "breaking",
            "secret",
            "censored",
            "proof",
            "exposed",
            "hoax",
            "false flag",
            "share before deleted",
        ]
        score = 10.0
        for term in suspicious_terms:
            if term in lowered:
                score += 3

        caps_ratio = sum(1 for c in text if c.isupper()) / max(1, len(text))
        exclamations = text.count("!")
        questions = text.count("?")
        urls = len(re.findall(r"https?://\S+", text))
        numbers = len(re.findall(r"\b\d{2,}\b", text))

        score += min(10, caps_ratio * 80)
        score += min(5, exclamations * 1.0)
        score += min(4, questions * 0.75)
        score += min(4, urls * 2)
        score += min(3, numbers * 0.7)

        if len(text) < 40:
            score += 2
        if any(token in lowered for token in ("breaking", "urgent", "alert")):
            score += 3

        return max(0.0, min(100.0, score))

    @staticmethod
    def _blend_scores(lexical: float, model_score: float) -> float:
        return max(0.0, min(100.0, 0.15 * lexical + 0.85 * model_score))
