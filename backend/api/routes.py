from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter

from backend.agents.campaign_detector import CampaignDetector
from backend.agents.content_analyzer import ContentAnalyzer
from backend.agents.network_mapper import NetworkMapper
from backend.agents.threat_classifier import ThreatClassifier
from backend.api.schemas import (
    AnalyzeNetworkRequest,
    AnalyzeNetworkResponse,
    AnalyzeTextRequest,
    AnalyzeTextResponse,
    DetectCampaignRequest,
    DetectCampaignResponse,
    ThreatClassifierRequest,
    ThreatClassifierResponse,
)

router = APIRouter()
content_analyzer = ContentAnalyzer()
network_mapper = NetworkMapper()
campaign_detector = CampaignDetector(content_analyzer=content_analyzer, network_mapper=network_mapper)
threat_classifier = ThreatClassifier()


@router.get("/")
def root() -> dict[str, str]:
    return {
        "project_name": "Real-Time Coordinated Misinformation Campaign Detection System",
        "status": "operational",
        "docs_url": "/docs",
    }


@router.post("/analyze-text", response_model=AnalyzeTextResponse)
def analyze_text(payload: AnalyzeTextRequest) -> AnalyzeTextResponse:
    result = content_analyzer.analyze(payload.text)
    return AnalyzeTextResponse(**asdict(result))


@router.post("/analyze-network", response_model=AnalyzeNetworkResponse)
def analyze_network(payload: AnalyzeNetworkRequest) -> AnalyzeNetworkResponse:
    result = network_mapper.analyze(payload.campaign)
    return AnalyzeNetworkResponse(
        nodes=result.nodes,
        edges=result.edges,
        cluster_count=result.cluster_count,
        communities=result.communities,
        density=result.density,
        bot_indicators=[asdict(item) for item in result.bot_indicators],
    )


@router.post("/detect-campaign", response_model=DetectCampaignResponse)
def detect_campaign(payload: DetectCampaignRequest) -> DetectCampaignResponse:
    result = campaign_detector.detect(payload.campaign)
    return DetectCampaignResponse(**asdict(result))


@router.post("/generate-alert", response_model=ThreatClassifierResponse)
def generate_alert(payload: ThreatClassifierRequest) -> ThreatClassifierResponse:
    result = threat_classifier.classify(payload.payload)
    return ThreatClassifierResponse(**asdict(result))
