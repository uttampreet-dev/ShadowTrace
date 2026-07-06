from __future__ import annotations

import json
from dataclasses import asdict
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agents.campaign_detector import CampaignDetector
from agents.content_analyzer import ContentAnalyzer
from agents.network_mapper import NetworkMapper
from agents.threat_classifier import ThreatClassifier
from api.schemas import (
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


# ── /campaigns — not in teammate's spec but needed by the frontend D3 graph ───
# Loads teammate's campaign JSON files and adapts node/edge format for D3.

_DATA_DIR = Path(__file__).parent.parent / "data"

_CAMPAIGN_META = [
    {"id": "campaign-001", "name": "Operation Pulse",  "threat_level": "HIGH", "confidence": 0.92},
    {"id": "campaign-002", "name": "MedFear",          "threat_level": "MED",  "confidence": 0.65},
    {"id": "campaign-003", "name": "ReviewStorm",      "threat_level": "LOW",  "confidence": 0.35},
]


def _node_type(meta: dict[str, Any]) -> str:
    age, followers, following, verified = (
        meta.get("account_age_days", 365),
        meta.get("followers", 100),
        meta.get("following", 100),
        meta.get("verified", False),
    )
    if verified and followers > 1000:
        return "origin"
    if age < 30 and followers < 20 and following > 200:
        return "bot"
    if followers > 200 and not verified:
        return "amplifier"
    return "legitimate"


def _edge_weight(relation: str) -> float:
    return {"retweet": 0.8, "mention": 0.5, "reply": 0.3}.get(relation, 0.5)


def _adapt(raw: dict[str, Any], meta: dict[str, Any]) -> dict[str, Any]:
    posts = raw.get("posts", [])
    post_count: dict[str, int] = {}
    for p in posts:
        aid = p.get("author_id", "")
        post_count[aid] = post_count.get(aid, 0) + 1

    prefix_map = {"origin": "ORI", "bot": "BOT", "amplifier": "AMP", "legitimate": "USR"}
    nodes = [
        {
            "id":        n["id"],
            "type":      _node_type(n.get("metadata", {})),
            "label":     f"{prefix_map[_node_type(n.get('metadata', {}))]}-{n['id'].upper()}",
            "accountId": f"@usr_{n['id']}",
            "posts":     post_count.get(n["id"], 0),
            "followers": n.get("metadata", {}).get("followers", 0),
            "clusterId": None,
        }
        for n in raw.get("nodes", [])
    ]
    edges = [
        {"source": e["source"], "target": e["target"], "weight": _edge_weight(e.get("relation", "mention"))}
        for e in raw.get("edges", [])
    ]
    timestamps = raw.get("timestamps", ["2026-06-20T08:00:00Z"])
    return {
        **meta,
        "account_count": len(nodes),
        "start_time":    timestamps[0] if timestamps else "2026-06-20T08:00:00Z",
        "narrative":     raw.get("account_metadata", {}).get("description", raw.get("title", "")),
        "nodes":         nodes,
        "edges":         edges,
    }


@lru_cache(maxsize=1)
def _load_campaigns() -> list[dict[str, Any]]:
    result = []
    for i, fname in enumerate(["campaign_1.json", "campaign_2.json", "campaign_3.json"]):
        path = _DATA_DIR / fname
        if path.exists():
            raw = json.loads(path.read_text(encoding="utf-8"))
            result.append(_adapt(raw, _CAMPAIGN_META[i]))
    return result


@router.get("/campaigns")
def list_campaigns() -> list[dict[str, Any]]:
    return _load_campaigns()


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: str) -> dict[str, Any]:
    match = next((c for c in _load_campaigns() if c["id"] == campaign_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return match
