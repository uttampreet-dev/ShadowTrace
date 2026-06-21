from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=1)


class AnalyzeTextResponse(BaseModel):
    misinformation_score: int
    confidence: float
    signals: dict[str, float]


class AnalyzeNetworkRequest(BaseModel):
    campaign: dict[str, Any]


class AnalyzeNetworkResponse(BaseModel):
    nodes: int
    edges: int
    cluster_count: int
    communities: list[list[str]]
    density: float
    bot_indicators: list[dict[str, Any]]


class DetectCampaignRequest(BaseModel):
    campaign: dict[str, Any]


class DetectCampaignResponse(BaseModel):
    campaign_detected: bool
    confidence_score: float
    cluster_count: int
    narrative_similarity: float
    graph_behavior_score: float
    content_risk_score: float


class ThreatClassifierRequest(BaseModel):
    payload: dict[str, Any]


class ThreatClassifierResponse(BaseModel):
    threat_type: Literal["Organic Misinformation", "Coordinated Inauthentic Behavior", "Possible State-Level Operation"]
    severity: str
    explanation: str
    structured_alert: dict[str, Any]
