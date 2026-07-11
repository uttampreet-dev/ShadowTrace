from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agents.ai_operation_detector import AIOperationDetector
from agents.deepfake_detector import DeepfakeDetector
from agents.campaign_detector import CampaignDetector
from agents.content_analyzer import ContentAnalyzer
from agents.linguistic_fingerprinter import LinguisticFingerprinter
from agents.network_mapper import NetworkMapper
from agents.sarvam_language_detector import SarvamLanguageDetector
from agents.temporal_coordinator import TemporalCoordinator
from agents.threat_classifier import ThreatClassifier
from api.schemas import (
    AIOperationResponse,
    AccountIntelAnalyzeRequest,
    AccountIntelResponse,
    AnalyzeNetworkRequest,
    AnalyzeNetworkResponse,
    AnalyzeTextRequest,
    AnalyzeTextResponse,
    DeepfakeAnalyzeRequest,
    DeepfakeAnalyzeResponse,
    DetectCampaignRequest,
    DetectCampaignResponse,
    LanguageDetectRequest,
    LanguageDetectResponse,
    LinguisticFingerprintResponse,
    ThreatClassifierRequest,
    ThreatClassifierResponse,
    TemporalCoordinationResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)
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


@router.post("/account-intel/analyze", response_model=AccountIntelResponse)
def analyze_account_intel(payload: AccountIntelAnalyzeRequest) -> AccountIntelResponse:
    try:
        temporal = TemporalCoordinator().analyze(payload.handles)
        linguistic = LinguisticFingerprinter().analyze(payload.handles)
        ai_operation = AIOperationDetector().analyze(payload.handles)
        return AccountIntelResponse(
            temporal=TemporalCoordinationResponse(**asdict(temporal)),
            linguistic=LinguisticFingerprintResponse(**asdict(linguistic)),
            ai_operation=AIOperationResponse(**asdict(ai_operation)),
        )
    except Exception as exc:
        logger.exception("Account intel analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail="Account intelligence analysis failed") from exc


@router.get("/account-intel/accounts/{handle}", response_model=AccountIntelResponse)
def get_account_intel(handle: str) -> AccountIntelResponse:
    return analyze_account_intel(AccountIntelAnalyzeRequest(handles=[handle]))


@router.post("/deepfake/analyze", response_model=DeepfakeAnalyzeResponse)
def analyze_deepfake(payload: DeepfakeAnalyzeRequest) -> DeepfakeAnalyzeResponse:
    try:
        result = DeepfakeDetector().analyze(payload.image_url)
        return DeepfakeAnalyzeResponse(**asdict(result))
    except Exception as exc:
        logger.exception("Deepfake analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail="Deepfake analysis failed") from exc


@router.post("/language/detect", response_model=LanguageDetectResponse)
def detect_language(payload: LanguageDetectRequest) -> LanguageDetectResponse:
    try:
        result = SarvamLanguageDetector().detect(payload.text)
        return LanguageDetectResponse(**asdict(result))
    except Exception as exc:
        logger.exception("Language detection failed: %s", exc)
        raise HTTPException(status_code=500, detail="Language detection failed") from exc


# ── /live-feed — real debunked claims from Indian fact-checker RSS feeds ───────

_LIVE_FEED_TTL_SECONDS = 300  # don't hammer the RSS feeds
_live_feed_cache: dict[str, Any] = {"data": None, "fetched_at": 0.0}


@router.get("/live-feed")
async def get_live_feed() -> dict[str, Any]:
    """
    Fetch real debunked claims from Indian fact-checkers
    and analyze each through ContentAnalyzer pipeline.
    """
    from agents.fact_checker_ingestion import FACT_CHECKER_FEEDS, fetch_live_claims

    now = time.time()
    if _live_feed_cache["data"] and now - _live_feed_cache["fetched_at"] < _LIVE_FEED_TTL_SECONDS:
        return _live_feed_cache["data"]

    claims = fetch_live_claims()

    analyzed_claims = []
    for claim in claims:
        try:
            # Run real ContentAnalyzer on each claim title + summary
            text = f"{claim['title']}. {claim['summary']}"
            result = content_analyzer.analyze(text)
            claim["ai_score"] = result.misinformation_score
            claim["risk_level"] = (
                "HIGH" if result.misinformation_score > 70
                else "MED" if result.misinformation_score > 40
                else "LOW"
            )
            claim["keywords"] = list(result.signals.keys())[:4]
        except Exception:
            claim["ai_score"] = 50
            claim["risk_level"] = "MED"
        analyzed_claims.append(claim)

    payload = {
        "items": analyzed_claims,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_count": len(analyzed_claims),
        "sources": [f["name"] for f in FACT_CHECKER_FEEDS],
    }
    if analyzed_claims:  # never cache an all-feeds-down result
        _live_feed_cache["data"] = payload
        _live_feed_cache["fetched_at"] = now
    return payload


# ── /whatsapp/analyze — WhatsApp forward misinformation analyzer ───────────────


@router.post("/whatsapp/analyze")
async def analyze_whatsapp_forward(request: dict) -> dict[str, Any]:
    """
    Analyze a WhatsApp forward for misinformation patterns.
    Combines WhatsAppForwardAnalyzer + ContentAnalyzer for dual scoring.
    """
    from agents.whatsapp_analyzer import WhatsAppForwardAnalyzer

    text = str(request.get("text", ""))
    if not text or len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    wa_result = WhatsAppForwardAnalyzer().analyze(text)

    try:
        content_result = content_analyzer.analyze(text)
        content_score = content_result.misinformation_score
    except Exception:
        content_score = wa_result.misinformation_score

    # Blend scores — WhatsApp patterns + content analysis. When no forward
    # markers or misinfo patterns exist, trust the pattern score more: the
    # tiny BERT model misfires on casual conversational text.
    if wa_result.forward_signals or wa_result.is_forward:
        final_score = int(wa_result.misinformation_score * 0.6 + content_score * 0.4)
    else:
        final_score = int(wa_result.misinformation_score * 0.85 + content_score * 0.15)
    risk_level = "HIGH" if final_score > 70 else "MED" if final_score > 40 else "LOW"

    return {
        "is_forward": wa_result.is_forward,
        "forward_depth": wa_result.forward_depth,
        "misinformation_score": final_score,
        "risk_level": risk_level,
        "language_detected": wa_result.language_detected,
        "red_flags": wa_result.red_flags,
        "forward_signals": wa_result.forward_signals,
        "claim_extracted": wa_result.claim_extracted,
        "verdict": wa_result.verdict,
        "content_score": content_score,
        "wa_pattern_score": wa_result.misinformation_score,
    }


# ── /campaigns — primary source is Neo4j AuraDB; JSON files are the fallback ──
# Node/edge output shape is identical either way so the frontend D3 graph
# works unchanged.

from db.neo4j_client import run_query

_DATA_DIR = Path(__file__).parent.parent / "data"

_PREFIX_MAP = {"origin": "ORI", "bot": "BOT", "amplifier": "AMP", "legitimate": "USR"}

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

    nodes = [
        {
            "id":        n["id"],
            "type":      _node_type(n.get("metadata", {})),
            "label":     f"{_PREFIX_MAP[_node_type(n.get('metadata', {}))]}-{n['id'].upper()}",
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


def _campaign_from_neo4j(campaign: dict[str, Any]) -> dict[str, Any]:
    cid = campaign["id"]
    accounts = run_query(
        "MATCH (a:Account)-[:PART_OF]->(:Campaign {id: $id}) RETURN a ORDER BY a.id",
        {"id": cid},
    )
    edges = run_query(
        """
        MATCH (a1:Account)-[r:INTERACTS]->(a2:Account)
        WHERE a1.campaign_id = $id AND a2.campaign_id = $id
        RETURN a1.id AS source, a2.id AS target, r.relation AS relation
        """,
        {"id": cid},
    )
    nodes = []
    for row in accounts:
        a = row["a"]
        meta = {
            "account_age_days": a.get("age_days", 365),
            "followers":        a.get("followers", 0),
            "following":        a.get("following", 0),
            "verified":         a.get("verified", False),
        }
        node_type = _node_type(meta)
        nodes.append(
            {
                "id":        a["id"],
                "type":      node_type,
                "label":     f"{_PREFIX_MAP[node_type]}-{a['id'].upper()}",
                "accountId": a.get("handle", f"@usr_{a['id']}"),
                "posts":     a.get("post_count", 0),
                "followers": a.get("followers", 0),
                "clusterId": a.get("cluster_id"),
            }
        )
    return {
        "id":            cid,
        "name":          campaign.get("name", cid),
        "threat_level":  campaign.get("threat_level", "MED"),
        "confidence":    campaign.get("confidence", 0.5),
        "account_count": len(nodes),
        "start_time":    campaign.get("start_time", "2026-06-20T08:00:00Z"),
        "narrative":     campaign.get("narrative", ""),
        "nodes":         nodes,
        "edges": [
            {"source": e["source"], "target": e["target"], "weight": _edge_weight(e.get("relation") or "mention")}
            for e in edges
        ],
        "data_source": "neo4j",
    }


def _campaigns_from_neo4j() -> list[dict[str, Any]]:
    campaigns = run_query("MATCH (c:Campaign) RETURN c ORDER BY c.id")
    return [_campaign_from_neo4j(row["c"]) for row in campaigns]


@router.get("/campaigns")
def list_campaigns() -> list[dict[str, Any]]:
    try:
        campaigns = _campaigns_from_neo4j()
        if campaigns:
            return campaigns
    except Exception:
        pass  # AuraDB unreachable — JSON fallback keeps the demo alive
    return _load_campaigns()


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: str) -> dict[str, Any]:
    try:
        rows = run_query("MATCH (c:Campaign {id: $id}) RETURN c", {"id": campaign_id})
        if rows:
            return _campaign_from_neo4j(rows[0]["c"])
    except Exception:
        pass
    match = next((c for c in _load_campaigns() if c["id"] == campaign_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return match
