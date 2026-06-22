# ShadowTrace — Architecture Diagram

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph SOURCES["📡  DATA SOURCES"]
        TW["🐦 Twitter / X"]
        TG["📱 Telegram Channels"]
        WA["💬 WhatsApp Forwards"]
        NA["📰 News Articles"]
    end

    subgraph INGEST["⚡  DATA INGESTION PIPELINE"]
        ING["FastAPI Ingestion Layer"]
    end

    subgraph AGENTS["🤖  MULTI-AGENT AI PIPELINE"]
        CA["ContentAnalyzer\n──────────────\nHuggingFace BERT\nLexical Fallback Scorer"]
        DD["DeepfakeDetector\n──────────────\nComputer Vision\nGAN Artifact Detection\n⚠ STANDBY"]
        NM["NetworkMapper\n──────────────\nNetworkX\nPageRank · Centrality\nCommunity Detection"]
        CD["CampaignDetector\n──────────────\nLangGraph Orchestration\nSentenceTransformers\nNarrative Matching"]
        TC["ThreatClassifier\n──────────────\nGroq LLaMA-3.3-70B\nRule-based Fallback"]
    end

    subgraph STORE["🗄  DATA LAYER"]
        DB[("Supabase\nPostgreSQL + pgvector")]
    end

    subgraph DASH["🖥  MISSION CONTROL DASHBOARD"]
        NG["Network Graph\nD3.js Force-Directed"]
        AF["Alert Feed\nSeverity Classified"]
        AP["Analysis Panel\nContent Scanner"]
        CT["Campaign Timeline\n24h Activity"]
        EE["Evidence Export\nJSON Bundles"]
        AS["Agent Monitor\nLive Status"]
    end

    TW & TG & WA & NA --> ING
    ING --> CA & DD & NM & CD
    CA & DD & NM & CD --> TC
    TC --> DB
    DB --> NG & AF & AP & CT & EE & AS

    style SOURCES fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style INGEST fill:#0f172a,stroke:#7c3aed,color:#e2e8f0
    style AGENTS fill:#0f172a,stroke:#a855f7,color:#e2e8f0
    style STORE fill:#0f172a,stroke:#22c55e,color:#e2e8f0
    style DASH fill:#0f172a,stroke:#f59e0b,color:#e2e8f0

    classDef sourceNode fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    classDef agentNode fill:#2e1065,stroke:#a855f7,color:#e2e8f0
    classDef threatNode fill:#450a0a,stroke:#ef4444,color:#e2e8f0
    classDef dbNode fill:#052e16,stroke:#22c55e,color:#e2e8f0
    classDef dashNode fill:#1c1917,stroke:#f59e0b,color:#e2e8f0

    class TW,TG,WA,NA sourceNode
    class ING agentNode
    class CA,DD,NM,CD agentNode
    class TC threatNode
    class DB dbNode
    class NG,AF,AP,CT,EE,AS dashNode
```

---

## 2. Agent Execution Sequence

```mermaid
sequenceDiagram
    actor Analyst
    participant UI as Mission Control
    participant GW as FastAPI Gateway
    participant CA as ContentAnalyzer
    participant NM as NetworkMapper
    participant CD as CampaignDetector
    participant TC as ThreatClassifier
    participant DB as Supabase

    Analyst->>UI: Submit text / select campaign
    UI->>GW: POST /analyze

    activate GW

    GW->>CA: analyze(text)
    activate CA
    CA-->>GW: misinformation_score · confidence · signals
    deactivate CA

    GW->>NM: map_network(campaign_id)
    activate NM
    NM-->>GW: nodes · edges · bot_scores · clusters
    deactivate NM

    GW->>CD: detect_campaign(text, network_data)
    activate CD
    CD-->>GW: matched_campaign · coordination_confidence
    deactivate CD

    GW->>TC: classify_threat(content + network + campaign)
    activate TC
    TC-->>GW: threat_level · assessment · recommended_action
    deactivate TC

    GW->>DB: persist(campaign, alerts, network_nodes)
    GW-->>UI: full analysis response
    deactivate GW

    UI-->>Analyst: Threat report + network visualization + alert
```

---

## 3. Bot Detection Scoring Pipeline

```mermaid
flowchart LR
    ACC(["👤 Account\nData"])

    subgraph SIGNALS["  8 Weighted Behavioral Signals  "]
        F1["Posting Frequency Anomaly\n× 0.25"]
        F2["Account Age Signal\n× 0.20"]
        F3["Temporal Sync Detection\n× 0.20"]
        F4["Retweet-to-Original Ratio\n× 0.10"]
        F5["URL Repetition Rate\n× 0.10"]
        F6["Hashtag Campaign Overlap\n× 0.05"]
        F7["Semantic Narrative Similarity\n× 0.05"]
        F8["Follower / Following Imbalance\n× 0.05"]
    end

    SCORE{{"Composite\nBot Score"}}

    BOT["🤖 BOT\nScore > 0.65\nFlagged + Clustered"]
    SUS["⚠️ SUSPICIOUS\nScore 0.45 – 0.65\nMonitored Amplifier"]
    ORG["✅ ORGANIC\nScore < 0.45\nNormal Activity"]

    ACC --> F1 & F2 & F3 & F4 & F5 & F6 & F7 & F8
    F1 & F2 & F3 & F4 & F5 & F6 & F7 & F8 --> SCORE
    SCORE -->|"> 0.65"| BOT
    SCORE -->|"0.45 – 0.65"| SUS
    SCORE -->|"< 0.45"| ORG

    classDef signal fill:#1e1b4b,stroke:#6366f1,color:#e2e8f0
    classDef bot fill:#450a0a,stroke:#ef4444,color:#fca5a5
    classDef sus fill:#431407,stroke:#f97316,color:#fed7aa
    classDef org fill:#052e16,stroke:#22c55e,color:#a7f3d0
    classDef acc fill:#0f172a,stroke:#94a3b8,color:#e2e8f0

    class F1,F2,F3,F4,F5,F6,F7,F8 signal
    class BOT bot
    class SUS sus
    class ORG org
    class ACC acc
```

---

## 4. LangGraph Agent State Machine

```mermaid
flowchart LR
    S(["▶ START"])
    CA["ContentAnalysis\nBERT scoring\nSignal extraction"]
    NA["NetworkAnalysis\nGraph construction\nBot scoring"]
    COM["CommunityDetection\nPageRank\nModularity clustering"]
    CM["CampaignMatching\nSemantic similarity\nNarrative matching"]
    E(["⏹ END\nThreat report\ngenerated"])

    S -->|"raw text"| CA
    CA -->|"content result"| NA
    NA -->|"network graph"| COM
    COM -->|"cluster assignments"| CM
    CM -->|"matched campaign\n+ confidence"| E

    style S fill:#052e16,stroke:#22c55e,color:#a7f3d0
    style E fill:#450a0a,stroke:#ef4444,color:#fca5a5

    classDef stateNode fill:#1e1b4b,stroke:#818cf8,color:#e2e8f0
    class CA,NA,COM,CM stateNode
```

---

## 5. Deployment Architecture

```mermaid
flowchart TD
    USER(["👤 User / Analyst"])

    subgraph CDN["🌐  Vercel Edge Network — Global CDN"]
        subgraph NEXT["▲  Next.js 14 Application"]
            STATIC["Static Assets\nLanding · CSS · Fonts"]
            SC["Server Components\nDashboard Shell"]
            PROXY["API Routes /api/*\nProxy + CORS + Fallback"]
        end
    end

    subgraph BACKEND["🐍  Python Backend  (local / cloud)"]
        FASTAPI["FastAPI + Uvicorn\n:8000"]
        subgraph PIPELINE["AI Agent Pipeline"]
            A1["ContentAnalyzer"]
            A2["DeepfakeDetector"]
            A3["NetworkMapper"]
            A4["CampaignDetector"]
            A5["ThreatClassifier"]
        end
    end

    subgraph DATA["🗄  Data Layer"]
        SB[("Supabase\nPostgreSQL + pgvector")]
    end

    USER --> CDN
    STATIC & SC --> USER
    PROXY -->|"HTTP"| FASTAPI
    FASTAPI --> A1 & A2 & A3 & A4 & A5
    A1 & A2 & A3 & A4 & A5 --> SB
    SB --> FASTAPI --> PROXY

    style CDN fill:#0f172a,stroke:#6366f1,color:#e2e8f0
    style NEXT fill:#1a1a2e,stroke:#818cf8,color:#e2e8f0
    style BACKEND fill:#0f172a,stroke:#f97316,color:#e2e8f0
    style PIPELINE fill:#1a1a2e,stroke:#fb923c,color:#e2e8f0
    style DATA fill:#0f172a,stroke:#22c55e,color:#e2e8f0

    classDef userNode fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    classDef agentNode fill:#2e1065,stroke:#a855f7,color:#e2e8f0
    classDef dbNode fill:#052e16,stroke:#22c55e,color:#e2e8f0

    class USER userNode
    class A1,A2,A3,A4,A5 agentNode
    class SB dbNode
```

---

*ShadowTrace — Detect. Trace. Neutralize.*
