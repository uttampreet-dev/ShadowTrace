# ShadowTrace — Technical Documentation

---

## 1. Project Overview

ShadowTrace is a multi-agent AI system designed to detect coordinated misinformation campaigns on social media. Unlike traditional fact-checkers that evaluate individual posts, ShadowTrace analyzes the infrastructure behind misinformation — mapping bot networks, identifying synchronized amplification patterns, and generating structured threat assessments.

**Live Deployment:** https://shadowtrace-bay.vercel.app
**Source Code:** https://github.com/uttampreet-dev/ShadowTrace

---

## 2. Problem Statement

Misinformation in India spreads faster than fact-checks can publish. The core problem is not individual false posts — it is coordinated networks of accounts amplifying false narratives in synchronized bursts. No existing tool available to Indian journalists, fact-checkers, or government bodies maps these networks in real time.

Key gaps in existing solutions:
- Fact-checkers examine posts in isolation, missing the coordinated campaign behind them
- AI-generated deepfake content is indistinguishable to human moderators
- Bot clusters amplify narratives in timing-coordinated waves with no detection layer
- By the time a correction publishes, the false narrative has already reached millions

---

## 3. System Architecture

```
DATA SOURCES
Twitter/X · Telegram Channels · News Articles · WhatsApp Forwards
          │
          ▼
DATA INGESTION PIPELINE
          │
    ┌─────┴────────────────────────────────────────┐
    ▼          ▼           ▼            ▼           ▼
Content    Deepfake    Network      Campaign    Threat
Analyzer   Detector    Mapper       Detector    Classifier
(BERT)     (CV)        (NetworkX)   (LangGraph) (Groq)
    └─────┬────────────────────────────────────────┘
          │
          ▼
MISSION CONTROL DASHBOARD
Network Graph · Threat Score · Alert Feed · Evidence Export · Campaign Timeline
```

### Architecture Decisions

**Why FastAPI?**
FastAPI provides async request handling critical for running multiple AI agents concurrently. Its automatic OpenAPI documentation also aids in debugging during rapid development.

**Why LangGraph over CrewAI?**
LangGraph provides explicit state management between agent steps, making it easier to inspect intermediate results and debug agent handoffs during development.

**Why NetworkX over Neo4j?**
For a hackathon MVP operating on synthetic datasets, NetworkX provides all required graph algorithms (PageRank, betweenness centrality, community detection) without the operational overhead of a graph database. Neo4j would be the migration path for production.

**Why D3.js over Recharts or Chart.js?**
The force-directed network graph requires low-level SVG control that only D3 provides. Recharts and Chart.js do not support custom force simulation layouts.

---

## 4. Agent Pipeline — Detailed

### Agent 1: ContentAnalyzer
**File:** `backend/agents/content_analyzer.py`

Uses HuggingFace `mrm8488/bert-tiny-finetuned-fake-news-detection` for primary classification. Falls back to a deterministic lexical scorer when the model is unavailable, ensuring the backend remains functional in offline environments.

**Input:** Raw text string
**Output:** `ContentAnalysisResult` — misinformation score (0-100), confidence float, signal breakdown dict

**Scoring signals:**
- ML model probability score (primary)
- Emotional trigger word density
- Uppercase character ratio
- Urgency language patterns
- Source attribution absence

### Agent 2: DeepfakeDetector
**File:** `backend/agents/deepfake_detector.py`

Computer vision pipeline scanning images and video frames for GAN synthesis artifacts, EXIF metadata anomalies, and pixel-level inconsistencies. Currently in STANDBY — integrated into the agent network, pending live media ingestion connector.

**Status:** Prototype implemented, live frame analysis in development

### Agent 3: NetworkMapper
**File:** `backend/agents/network_mapper.py`

Constructs account interaction graphs using NetworkX. Scores each account across 8 weighted behavioral signals to produce a bot probability score.

**Bot detection signals:**
1. Posting frequency anomaly (posts per hour vs baseline)
2. Account age relative to campaign start date
3. Temporal synchronization with other accounts (burst detection)
4. Retweet-to-original-post ratio
5. URL repetition rate across posts
6. Hashtag overlap with known campaign markers
7. Semantic similarity to origin narrative (SentenceTransformers cosine similarity)
8. Follower/following ratio imbalance

**Graph algorithms applied:**
- PageRank — identifies high-influence amplifier nodes
- Betweenness centrality — identifies bridge accounts connecting clusters
- Greedy modularity community detection — groups accounts into coordinated clusters

**Input:** Campaign ID
**Output:** Node list with bot scores, edge list with weights, cluster assignments, graph statistics

### Agent 4: CampaignDetector
**File:** `backend/agents/campaign_detector.py`

LangGraph orchestration layer that sequences ContentAnalyzer → NetworkMapper → community detection. Matches analyzed content against known campaign narrative signatures using SentenceTransformers semantic similarity.

**State machine:**
```
START → ContentAnalysis → NetworkAnalysis → CommunityDetection → CampaignMatching → END
```

**Input:** Raw text
**Output:** Matched campaign, threat assessment, full network data, coordination confidence score

### Agent 5: ThreatClassifier
**File:** `backend/agents/threat_classifier.py`

Final classification layer using Groq LLaMA-3.3-70B for natural language threat assessment generation. Falls back to a rule-based classifier when Groq is unavailable.

**Classification levels:**
- CRITICAL: Confirmed state-level coordination, >90% confidence
- HIGH: Coordinated inauthentic behavior confirmed, >75% confidence
- MED: Suspicious coordination patterns detected, >50% confidence
- LOW: Monitoring — activity within normal variance

**Input:** ContentAnalysisResult + NetworkMapper output + matched campaign
**Output:** Threat level, confidence score, natural language assessment, recommended action

---

## 5. Bot Detection — Technical Detail

NetworkMapper uses a composite scoring function:

```python
bot_score = (
  0.25 * posting_frequency_signal +
  0.20 * account_age_signal +
  0.20 * temporal_sync_signal +
  0.10 * retweet_ratio_signal +
  0.10 * url_repetition_signal +
  0.05 * hashtag_overlap_signal +
  0.05 * semantic_similarity_signal +
  0.05 * follower_ratio_signal
)
```

Accounts scoring above 0.65 are classified as bots. Accounts scoring 0.45-0.65 are flagged as suspicious amplifiers.

---

## 6. API Reference

Base URL (local): `http://localhost:8000`
Base URL (production): Backend runs locally — frontend proxies via Next.js API routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check, agent statuses |
| GET | `/campaigns` | All campaigns with node/edge network data |
| GET | `/campaigns/{id}` | Single campaign details |
| GET | `/campaigns/{id}/network` | Campaign + NetworkX graph statistics |
| POST | `/analyze` | Run ContentAnalyzer pipeline on text |
| POST | `/alert` | Generate Groq LLaMA threat assessment |
| GET | `/agents` | Live status of all 5 agents |

### Request/Response Examples

**POST /analyze**
```json
Request:
{ "text": "BREAKING: EVMs hacked — share before deleted" }

Response:
{
  "is_misinformation": true,
  "confidence": 0.87,
  "threat_level": "HIGH",
  "narrative_category": "election_interference",
  "summary": "Content exhibits urgency patterns and authority-undermining language consistent with coordinated amplification.",
  "indicators": ["urgency_language", "share_bait", "authority_undermining"]
}
```

**GET /campaigns**
```json
Response:
[
  {
    "id": "campaign-001",
    "name": "Operation Pulse",
    "threat_level": "HIGH",
    "account_count": 847,
    "confidence": 0.94,
    "nodes": [...],
    "edges": [...]
  }
]
```

---

## 7. Frontend Architecture

**Framework:** Next.js 14 with App Router
**Rendering:** Client components for interactive dashboard, server components for static pages
**State management:** React useState/useEffect — no external state library needed at MVP scale

### Key Components

**NetworkGraph.tsx**
D3.js force-directed graph with:
- `d3.forceSimulation` with link, charge, center, and collision forces
- SVG-based rendering for performance with 50+ nodes
- Drag interaction via D3 drag behavior
- Hover tooltips using absolute-positioned React divs
- Campaign switching with fade transition (opacity animation on simulation restart)

**AnalyzePanel.tsx**
Two-phase async flow:
1. POST to `/api/analyze` → displays ContentAnalyzer results immediately
2. POST to `/api/alert` → streams Groq response, displays with typewriter animation

**AlertFeed.tsx**
Simulates live updates via `setInterval` (25s) cycling through a pre-loaded alert pool. New alerts prepend to array with CSS slide-down animation.

### Next.js API Routes (Proxy Layer)
All backend calls go through Next.js API routes to:
- Hide the backend URL from the client
- Handle CORS in production
- Implement fallback mock data when backend is unavailable
- Transform FastAPI response shapes to frontend TypeScript interfaces

---

## 8. Database Schema

**Supabase (PostgreSQL + pgvector)**

```sql
-- Campaigns table
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  threat_level TEXT NOT NULL,
  account_count INTEGER,
  confidence FLOAT,
  narrative TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT REFERENCES campaigns(id),
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  recommendation TEXT
);

-- Network nodes table
CREATE TABLE network_nodes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id),
  node_type TEXT NOT NULL,
  bot_score FLOAT,
  post_count INTEGER,
  follower_count INTEGER,
  account_age_days INTEGER
);
```

---

## 9. Deployment Architecture

```
User Browser
     │
     ▼
Vercel Edge Network (CDN)
     │
     ▼
Next.js Application (Vercel)
     │
     ├── Static assets (landing page, CSS, fonts)
     ├── Server components (dashboard shell)
     └── API Routes (/api/*) → proxy to FastAPI
                                      │
                                      ▼
                              FastAPI Server (local/cloud)
                                      │
                              ┌───────┴────────┐
                              ▼                ▼
                         AI Agents          Supabase
                         (Python)           (Database)
```

**Note:** For the hackathon MVP, the FastAPI backend runs locally. Production deployment would use Railway, Render, or a VPS with the backend containerized via Docker (docker-compose.yml included in repository).

---

## 10. Campaign Datasets

Three synthetic datasets designed to emulate real-world coordinated inauthentic behavior patterns documented in academic research on influence operations.

| Campaign | Nodes | Edges | Bot Clusters | Threat Level | Confidence |
|---|---|---|---|---|---|
| Operation Pulse | 56 | 55 | 4 | HIGH | 94% |
| MedFear | 36 | 35 | 3 | HIGH | 91% |
| ReviewStorm | 22 | 21 | 2 | MED | 76% |

All datasets are synthetic. Account data, network topology, and narrative content are generated to reflect behavioral patterns described in public research. No real user data is used.

---

## 11. Scalability Considerations

**Horizontal scaling:** Each agent is a stateless Python function, deployable as independent microservices behind a load balancer.

**Graph database migration:** NetworkX (in-memory) → Neo4j for production-scale graph storage and Cypher query support.

**Live ingestion:** Current synthetic dataset approach → Telethon (Telegram) and Nitter (Twitter/X) connectors for real-time data ingestion.

**Vector search:** Supabase pgvector already integrated for semantic similarity queries at scale.

**Caching:** Redis layer between FastAPI and AI agents for repeated analysis requests on identical content.

---

## 12. Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (free tier)
- Groq API key — free at console.groq.com

### Installation

```bash
# Clone
git clone https://github.com/uttampreet-dev/ShadowTrace.git
cd ShadowTrace

# Frontend
npm install

# Backend
cd backend && pip install -r requirements.txt && cd ..

# Environment
cp .env.example .env.local
# Fill in GROQ_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
```

### Running

```bash
# Terminal 1 — AI Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
npm run dev
```

Open `http://localhost:3000`

---

## 13. Known Limitations

- FastAPI backend requires local execution for full AI pipeline — Vercel deployment serves frontend only with graceful fallback to mock data when backend is unreachable
- DeepfakeDetector agent is implemented but in STANDBY pending live media ingestion
- Live Telegram and Twitter/X ingestion connectors are in development — current implementation uses synthetic campaign datasets
- LangGraph orchestration uses synchronous agent calls in MVP — production would use async parallel execution

---

*Detect. Trace. Neutralize.*
