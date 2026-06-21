# Real-Time Coordinated Misinformation Campaign Detection System

## Overview
This backend analyzes suspicious text, campaign graphs, and coordinated propagation patterns to surface misinformation threats in real time.

The service remains backend-only and keeps the existing API contract unchanged while upgrading the internal model stack.

## Architecture

The system is organized into four layers:

1. Content analysis
2. Network and graph analysis
3. Campaign detection orchestration
4. Threat classification and alert generation

Key upgrades in this revision:

- Content scoring now uses a dedicated fake-news classifier instead of `roberta-base` classification-head defaults.
- Campaign similarity uses SentenceTransformers `all-MiniLM-L6-v2` with cosine similarity.
- Bot scoring now includes PageRank, betweenness centrality, and clustering coefficient.
- Threat classification uses the Groq API when available, with deterministic fallback rules.

## Folder Structure

```text
backend/
├── agents/
├── api/
├── models/roberta_model/
├── graph/
├── data/
├── main.py
├── requirements.txt
├── README.md
└── TASKS.md
```

The `models/roberta_model/` directory is reserved for local model artifacts if a fine-tuned checkpoint is added later.

## Agent Descriptions

### ContentAnalyzer
Scores text on a `0-100` misinformation scale using the HuggingFace model `mrm8488/bert-tiny-finetuned-fake-news-detection`. Lexical heuristics are retained only as secondary signals.

### NetworkMapper
Loads campaign JSON, builds a NetworkX graph, computes PageRank, betweenness centrality, and clustering coefficient, then detects communities and bot-likelihood indicators.

### CampaignDetector
Combines content analysis, graph structure, and SentenceTransformer-based narrative similarity to decide whether a campaign is coordinated.

### ThreatClassifier
Calls Groq for a structured threat assessment when `GROQ_API_KEY` is configured. If Groq is unavailable, it falls back to the existing rule-based classifier.

## API Docs

### `GET /`
Returns:

```json
{
  "project_name": "Real-Time Coordinated Misinformation Campaign Detection System",
  "status": "operational",
  "docs_url": "/docs"
}
```

### `POST /analyze-text`
Request:

```json
{ "text": "Breaking: proof of fraud has been hidden!" }
```

Response:

```json
{
  "misinformation_score": 82,
  "confidence": 0.74,
  "signals": {
    "lexical_score": 0.18,
    "model_score": 0.91,
    "score_blend": 0.80
  }
}
```

### `POST /analyze-network`
Request:

```json
{ "campaign": { "...": "campaign json" } }
```

Response includes node and edge counts, cluster count, communities, density, and bot indicators.

### `POST /detect-campaign`
Request:

```json
{ "campaign": { "...": "campaign json" } }
```

Response includes whether a campaign was detected, confidence score, cluster count, narrative similarity, graph behavior score, and content risk score.

### `POST /generate-alert`
Request:

```json
{
  "payload": {
    "campaign_detected": true,
    "confidence_score": 82,
    "cluster_count": 3,
    "bot_pressure": 78,
    "content_risk_score": 91
  }
}
```

## Setup Instructions

1. Create a Python 3.11+ environment.
2. Install dependencies from `backend/requirements.txt`.
3. Set `GROQ_API_KEY` if you want live Groq classification.
4. Run the API:

```bash
uvicorn backend.main:app --reload
```

## Validation Instructions

Validate these endpoints after startup:

1. `GET /`
2. `GET /docs`
3. `GET /redoc`
4. `POST /analyze-text`
5. `POST /analyze-network`
6. `POST /detect-campaign`
7. `POST /generate-alert`

## Dataset Descriptions

### Campaign 1
Coordinated bot campaign with multiple clusters, synchronized posting bursts, and low-age accounts.

### Campaign 2
Mixed organic discussion with a small amplification layer of suspicious accounts.

### Campaign 3
Mostly organic misinformation spread by older, higher-credibility accounts with minimal coordination.

## Sample Requests

```bash
curl -X POST http://127.0.0.1:8000/analyze-text -H "Content-Type: application/json" -d "{\"text\":\"BREAKING: share before deleted\"}"
```

```bash
curl -X POST http://127.0.0.1:8000/analyze-network -H "Content-Type: application/json" --data-binary "@backend/data/campaign_1.json"
```

## Notes

- The backend remains compatible with the existing endpoint names and payload shapes.
- If `GROQ_API_KEY` is missing, threat classification uses the fallback rule engine instead of failing.
