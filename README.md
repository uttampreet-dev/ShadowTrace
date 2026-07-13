<img width="4320" height="1440" alt="HACKHAZARDS '26" src="https://github.com/user-attachments/assets/c698b2cd-da84-4cb0-9276-125c6a7244aa" />

# 🕵️ ShadowTrace

> **Fact-checkers verify posts. ShadowTrace hunts the network that amplified them.**

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Neo4j_AuraDB-008CC1?style=flat-square&logo=neo4j&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq_LLaMA_3.3_70B-F55036?style=flat-square&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/Sarvam_AI-EF7C22?style=flat-square&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black" />
  <img src="https://img.shields.io/badge/LangGraph-1C3C3C?style=flat-square&logo=langchain&logoColor=white" />
  <img src="https://img.shields.io/badge/D3.js-F9A03C?style=flat-square&logo=d3.js&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=flat-square" />
</p>

<p align="center">
  <b>🏆 Tracks:</b>
  <img src="https://img.shields.io/badge/Neo4j_Track-008CC1?style=flat-square&logo=neo4j&logoColor=white" />
  <img src="https://img.shields.io/badge/Sarvam_AI_Track-EF7C22?style=flat-square" />
</p>

<p align="center">
  <b><a href="https://shadowtrace-bay.vercel.app">🔴 Live Mission Control</a></b> ·
  <a href="#-demo--deliverables">Demo Video</a> ·
  <a href="#-how-to-run-the-project">Run Locally</a> ·
  <a href="docs/Technical_Documentation.md">Technical Docs</a>
</p>

---

## 📌 Problem & Domain

A coordinated misinformation campaign — a fabricated EVM-hacking claim, a fake health advisory, deepfake audio attributed to a doctor — reaches millions in India **within minutes**. The infrastructure behind it is not one bad post. It is hundreds of accounts pushing the same narrative inside the same 60-second window, seeded from a handful of coordination hubs.

Today's defence is fact-checking, and fact-checking is **post-level and retrospective**. By the time a single claim is verified and debunked, the bot network that pushed it has already moved 10,000 shares and started on the next narrative. **Nobody is watching the network.** That is the gap ShadowTrace closes.

ShadowTrace is a **threat-intelligence platform for coordinated inauthentic behaviour**: it ingests live accounts and posts into a graph, runs **10 specialised agents** across them, and returns the *campaign* — its cluster of bot accounts, its synchronisation fingerprint, its severity, and an evidence-grade report — in seconds.

**Themes Selected:**

- [x] **Trust, Identity & Security** — **`PRIMARY`**
  Coordinated inauthentic behaviour detection, bot-network attribution, synthetic-media forensics. Every agent in the pipeline exists to answer a trust question: *is this account real, is this image real, is this coordination real?*
- [x] **Media, Social & Interactive Platforms** — **`SECONDARY`**
  Live ingestion and forensic analysis of social propagation across Bluesky, WhatsApp forwards, and Indian fact-checker feeds.
- [x] **Public Systems, Governance and Civic Tech** — **`TERTIARY`**
  Election integrity and public-health information defence — built for newsrooms, election commissions, and public-health information cells.

---

## 🎯 Objective

**The target users**
Newsroom fact-checkers (Alt News, BOOM, The Quint), election-commission and public-health information cells, and platform trust-and-safety teams.

**The pain point**
Existing tools answer *"is this post false?"* — a question that arrives too late and scales linearly with the flood. Nobody can answer *"which 847 accounts are pushing this together, since when, and how coordinated are they?"* without a data-science team and weeks of manual work.

**The value we provide**
ShadowTrace turns a single suspicious message, image, or account handle into a **complete campaign dossier in under a minute**:

| You give it | It gives you back |
|---|---|
| A WhatsApp forward | Misinformation score, forward-chain markers, Hindi/Hinglish language ID, live fact-checker cross-reference, threat class |
| A real Bluesky handle | Live-ingested post graph, 60-second coordination windows, stylometric cluster peers, LLM-authorship signals |
| An image URL | ELA heatmap of edited regions, EXIF anomalies, two-model AI-generation verdict |
| A claim or narrative | The bot cluster amplifying it, campaign attribution, severity, and an exportable evidence package |

The difference is the difference between debunking one post and **dismantling the network responsible for it**.

---

## 🔬 Don't Take Our Word For It — Falsify It

Most hackathon demos are fixtures with a loading spinner. Here is how to **prove ours isn't**, in under a minute, on the [live deployment](https://shadowtrace-bay.vercel.app):

| # | Do this | Why it can't be faked |
|---|---|---|
| **1** | Open **Account Intel** and type in **your own** Bluesky handle — or any handle you invent on the spot | We can't have pre-seeded a handle we've never seen. It is fetched from the Bluesky public API, `MERGE`d into Neo4j, and analysed by the same Cypher our seeded campaigns use |
| **2** | Open **Live Feed** | Those are today's debunked claims, pulled live from Alt News / BOOM / FactChecker.in / The Quint RSS. Cross-check any headline against their site |
| **3** | Open **Agent Monitor**, then go run an analysis and come back | Task counts **go up**. They're read from an in-process counter (`agent_stats.py`), not a hardcoded array |
| **4** | Paste a **real photograph** into Image Forensics | It should *not* be flagged as AI-generated. Getting this right cost us a rebuild — see below |

**Or skip the UI entirely and hit production directly.** Pick any Bluesky handle — one we could not possibly have seeded:

```bash
curl -X POST https://shadowtrace-backend-g6uy.onrender.com/account-intel/analyze \
  -H "Content-Type: application/json" \
  -d '{"handles": ["bsky.app"]}'
```
```jsonc
{
  "sources": { "bsky.app": "bluesky" },   // ← fetched live, MERGEd into AuraDB
  "temporal":     { "score": 0,  "flagged_pairs": 0, "timeline": [ /* 20 real posts */ ] },
  "ai_operation": { "score": 17.8, "verdict": "LIKELY_HUMAN" }
}
```

`"source": "bluesky"` means that handle **was not in our graph** — it was pulled from the Bluesky API, written into Neo4j, and analysed back out of it, in that request. Swap in your own handle and watch it happen. The `LIKELY_HUMAN` verdict on a real account is the point too: **a detector that flags everything is worthless.**

*(Render free tier cold-starts — the first request after idle can take up to a minute to wake the backend.)*

---

## 🧠 Team & Approach

### Team Name:
`Trace Matrix`

### Team Members:
- **Uttampreet Kaur** — [GitHub @uttampreet-dev](https://github.com/uttampreet-dev)
- **Aditya Bhandari** — [GitHub @Neverask1121](https://github.com/Neverask1121)

### Your Approach:

**Why we chose this problem.**
Every hackathon builds a fake-news *classifier*. We asked a harder question: a classifier tells you a post is false — so what? The post is already viral. The real adversary is an **operation**: coordinated, funded, multi-account, and completely invisible to post-level tooling. Nobody was building the counter-tool for that, so we did.

**Key challenges we addressed.**

1. **Coordination is a graph problem, not a text problem.** A bot's giveaway isn't *what* it says — it's that it said it 12 seconds after 40 other accounts did. We modelled accounts, posts, campaigns and `COORDINATES_WITH` edges in **Neo4j AuraDB**, so synchronisation becomes a first-class, queryable relationship instead of something we recompute in memory on every request.

2. **"AI-generated" is a verdict you cannot get wrong.** Our first image-forensics build flagged real photographs as AI-generated on a single model's say-so. We rebuilt it to require **two independent classifiers to agree** before making that call — and made the AI-generation verdict unable to veto the ELA editing evidence, so a real-but-doctored photo still gets caught. Being loudly wrong is worse than being quiet.

3. **India doesn't post in English.** A WhatsApp forward is Hindi, Hinglish, or Devanagari-script code-mixing. We wired in **Sarvam AI's language ID** and built the forward-chain detector around Indian-language urgency and share-bait patterns rather than translated English heuristics.

4. **Demos lie; we wanted live wires.** Anyone can hardcode a graph. ShadowTrace ingests **real Bluesky accounts** and **real debunked claims from live Indian fact-checker RSS feeds** — so a judge can type in their own handle, or any handle, and watch the pipeline actually run.

5. **A 512MB box made the system better.** Our host's free tier caps at 512MB, and `torch` + `transformers` OOM on load. Rather than pay for a bigger box, we deleted local model weights entirely: content scoring became a **Groq LLaMA-3.3-70B call with a deterministic lexical fallback**, and `sentence-transformers` is lazily imported behind an `lru_cache` so it never loads at startup. The backend now runs in **under 100MB** — and a 70B model comfortably outperforms the fine-tuned BERT-tiny it replaced. The constraint made it lighter *and* more accurate.

**Pivots, iterations, breakthroughs.**
We started with a BERT classifier and a pretty graph. The breakthrough was inverting the pipeline — making the **network the subject and the text merely evidence**. That reframing is what turned a fake-news demo into a threat-intelligence platform: it's why temporal coordination, stylometric fingerprinting, and LLM-operation detection run *as peers to* content analysis, not as decoration around it.

---

## 🛠️ Tech Stack

### Core Technologies Used:
- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · **D3.js** force-directed network graph
- **Backend:** Python 3.11 · **FastAPI** + Uvicorn · **LangGraph** multi-agent orchestration · NetworkX · scikit-learn (DBSCAN)
- **Database:** **Neo4j AuraDB** (primary — accounts, posts, campaigns, coordination edges) · Supabase Postgres
- **APIs:** **Groq** (LLaMA-3.3-70B) · **Sarvam AI** (Indian-language ID) · Hugging Face Inference (AI-image classifiers) · Bluesky public API · Fact-checker RSS (Alt News, BOOM, FactChecker.in, The Quint)
- **Hosting:** **Vercel** (frontend) · **Render** (FastAPI agent backend) · Neo4j AuraDB (managed graph)

### Additional Technologies Used:
- [x] **AI / ML** — LLaMA-3.3-70B scoring & threat classification, LangGraph agent graph, DBSCAN stylometric clustering, bigram-perplexity/burstiness LLM-authorship detection, ELA + Hugging Face image forensics
- [ ] Web3 / Blockchain
- [x] **Cyber Security** — coordinated inauthentic behaviour detection, bot-network attribution, synthetic-media forensics, evidence packaging
- [x] **Cloud** — Vercel, Render, Neo4j AuraDB, Groq & Sarvam inference

---

## 🏆 Sponsored Tracks

- [x] **Neo4j Track** — AuraDB is our **primary** database
- [x] **Sarvam AI Track** — Indian-language identification, live in the analysis pipeline
- [ ] **Expo Track** — not applicable *(ShadowTrace is an analyst web console, not a mobile app)*
- [ ] **Base44 Track** — not applicable *(built from scratch; retrofitting Base44 would be cosmetic)*

---

### 🟦 Neo4j Track — AuraDB as the primary database

> **How we used Neo4j AuraDB — and why the project doesn't work without it.**
>
> Coordination *is* a graph. AuraDB isn't a storage layer we bolted on; it's the substrate the entire detection thesis runs on.
>
> **Our graph model:**
> ```cypher
> (:Account)-[:SHARED]->(:Post)-[:PART_OF]->(:Campaign)
> (:Account)-[:PART_OF]->(:Campaign)
> (:Account)-[:INTERACTS {relation}]->(:Account)                  // retweet · mention · reply
> (:Account)-[:COORDINATES_WITH {delay_seconds}]->(:Account)      // ← the money edge
> ```
>
> - **`COORDINATES_WITH` is computed, not seeded.** Any two accounts whose posts land within **60 seconds** of each other get an edge carrying the tightest observed `delay_seconds`. Synchronised amplification stops being an O(n²) rescan on every request and becomes a **one-hop traversal**.
> - **Bot scoring runs *inside* AuraDB.** Cypher computes `bot_score` and writes it back onto the `Account` node — the graph isn't a passive store, it's where the detection happens.
> - **Bot clusters are community detection over that edge set** — we don't guess who belongs to a campaign, we find the densely-coordinating component.
> - **Live accounts are ingested straight into AuraDB.** Type a real Bluesky handle into Account Intel and its posts are written into the graph, then analysed against everything already there.
> - **The dashboard's D3 network graph is a direct projection of AuraDB** — nodes, edges and campaign membership are served from Cypher (`GET /campaigns`), not from a fixture file.
> - **Graceful degradation:** if AuraDB is unreachable, `seed_database()` fails soft to a JSON fallback so the API stays up — but coordination traversal and cluster attribution, the features that make ShadowTrace *ShadowTrace*, are AuraDB-native.
>
> Schema, seeding and traversal live in [`backend/db/neo4j_client.py`](backend/db/neo4j_client.py) and [`backend/db/seed.py`](backend/db/seed.py).

---

### 🟧 Sarvam AI Track — Indian-language identification, live in the pipeline

> **Why an Indian-language model is not optional here.**
>
> ShadowTrace's highest-value input is a **WhatsApp forward**, and a real Indian WhatsApp forward is almost never clean English. It is Hindi, Hinglish, or Devanagari-script code-mixing — *"doctors ne confirm kiya, sabko bhejo, abhi share karo."* An English-only pipeline mis-scores exactly the content that does the most damage.
>
> - **`SarvamLanguageDetector` is a first-class agent** on the roster ([`sarvam_language_detector.py`](backend/agents/sarvam_language_detector.py)), calling Sarvam's **`text-lid`** endpoint — not a hardcoded label.
> - **It's step 3 of the live 5-agent `/investigate` chain**, running on whatever text the user actually pastes. Submit Hindi in the WhatsApp panel and watch Sarvam identify it, live, with its real measured latency shown in the step trace.
> - **It's exposed on its own endpoint** — `POST /language/detect` — so the language call is verifiable in isolation.
> - **Language ID feeds the analysis, it doesn't decorate it.** The forward-chain detector matches Hindi/Hinglish urgency and share-bait patterns (`turant`, `sabko dikhao`, `sarkar chupa rahi`) rather than translated English heuristics.
> - **Graceful degradation:** without a `SARVAM_API_KEY` the pipeline falls back to a Devanagari-character + Hinglish function-word heuristic — so the demo never dies, but the real call is the one that ships.

---

## ✨ Key Features

### 🧭 Mission Control Dashboard
A dense, data-first threat-intelligence console. No decorative UI — every element carries operational data.

![Dashboard Overview](docs/dashboard.png)

### 🕸️ Live Network Propagation Graph
D3.js force-directed rendering of the AuraDB graph. Origin nodes, bot clusters and amplifier accounts — draggable, hoverable, clickable, with animated campaign switching.

![Network Propagation Graph](docs/network.png)

### 🚨 Severity-Classified Alert Feed
CRITICAL / HIGH / MED / LOW alerts with campaign attribution, timestamps, and one-click pivot into the network graph.

![Alert Feed](docs/alerts.png)

### 🔍 Account Intelligence — *on real, live internet accounts*
Enter **any real Bluesky handle**. Posts are ingested live into Neo4j, then run through three forensic layers:
- ✅ **Temporal Coordinator** — 60-second synchronised posting windows
- ✅ **Linguistic Fingerprinter** — DBSCAN stylometric clustering to find accounts that *write like each other*
- ✅ **AI-Operation Detector** — bigram perplexity, burstiness and topic drift to score LLM-authored posting

### 💬 WhatsApp Forward Analyzer *(India-specific)*
Forward-chain detection across **English / Hindi / Hinglish**, blended with a Groq LLaMA-3.3-70B judgment — plus a one-click **5-agent investigation** chaining pattern analysis → LLM scoring → Sarvam language ID → live fact-check cross-reference → threat classification.

### 🖼️ Image Forensics
**Error Level Analysis** with rendered ELA heatmaps and EXIF anomaly detection, blended with Hugging Face AI-image classifiers. **Two models must agree** before we call an image AI-generated — and that verdict can never overrule the ELA editing evidence beneath it.

### 📡 Live Fact-Checker Feed
Real debunked claims streamed from **Alt News, BOOM, FactChecker.in and The Quint** RSS, each re-scored through our own content pipeline.

### 🤖 Agent Status Monitor
Live status and **genuine** per-agent task counts streamed from the running backend process — not demo numbers.

### 📦 Evidence Export
One-click JSON export of campaign data, alerts and network summaries, formatted for handoff to trust-and-safety teams.

---

## 🧬 The 10-Agent Pipeline

```
        DATA SOURCES
Bluesky (live) · Fact-checker RSS (live) · WhatsApp forwards · Image URLs
                          │
                          ▼
              INGESTION ──► Neo4j AuraDB
                          │
   ┌──────────────────────┴──────────────────────────────────┐
   ▼            ▼             ▼             ▼            ▼
Content     Deepfake      Network       Campaign      Threat
Analyzer    Detector      Mapper        Detector      Classifier
(Groq 70B)  (ELA + HF)    (Cypher)      (LangGraph)   (Groq 70B)
   │            │             │             │            │
   ▼            ▼             ▼             ▼            ▼
WhatsApp   Temporal    Linguistic     AI-Operation    Sarvam
Analyzer   Coordinator Fingerprinter  Detector        Language ID
   └──────────────────────┬──────────────────────────────────┘
                          ▼
                MISSION CONTROL DASHBOARD
   Network · Account Intel · Image Forensics · WhatsApp · Alerts
```

Every account is scored across **8 weighted bot signals** — four from metadata, four from graph topology: account age (×0.22) · posting frequency (×0.18) · connectivity (×0.14) · follower/following imbalance (×0.12) · betweenness centrality (×0.10) · clustering coefficient (×0.10) · PageRank (×0.08) · unverified penalty. The topology signals are the ones that matter: **betweenness** finds the bridge accounts wiring separate clusters together, which is exactly where a campaign's coordination hubs sit.

<details>
<summary><b>📖 Full architecture &amp; technical docs</b></summary>

- [Technical Documentation](docs/Technical_Documentation.md)
- [Architecture Diagram](docs/Architecture_Diagram.md)

</details>

---

## 📽️ Demo & Deliverables

- **Demo Video Link (Mandatory):** `[Paste your <5 min demo video link here]`
- **Deployment Link:** **https://shadowtrace-bay.vercel.app**
- **Pitch Deck / PPT:** `[Paste your ≤6-slide deck link here]`
- **Technical Documentation:** [docs/Technical_Documentation.md](docs/Technical_Documentation.md)

---

## ✅ Tasks & Bonus Checklist

- [ ] All team members completed the mandatory social task
- [ ] Bonus Task 1 – Badge sharing
- [ ] Bonus Task 2 – Blog/article

---

## 🧪 How to Run the Project

### Requirements
- **Node.js** 20+ *(required by Next.js 16)*
- **Python** 3.11+
- **Neo4j AuraDB** instance — free at [neo4j.com/cloud/aura](https://neo4j.com/cloud/aura/)
- **Groq API key** — free at [console.groq.com](https://console.groq.com)
- *(Optional)* Sarvam AI key (Indian-language ID), Hugging Face token (AI-image classifiers), Supabase project

### Local Setup

```bash
# 1. Clone
git clone https://github.com/uttampreet-dev/ShadowTrace.git
cd ShadowTrace

# 2. Frontend dependencies
npm install

# 3. Backend dependencies
pip install -r backend/requirements.txt
```

**4. Environment variables**

`.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key

# Neo4j AuraDB — the graph substrate
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_aura_password

# Optional — omit and the system degrades gracefully (see table below)
SARVAM_API_KEY=your_sarvam_key
HF_API_KEY=your_huggingface_token
```

**5. Run** — two terminals:

```bash
# Terminal 1 — AI agent backend (seeds AuraDB on startup)
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Mission Control frontend
npm run dev
```

Open **http://localhost:3000** → **Launch Mission Control**.

> **Try it in 30 seconds:** open **Account Intel**, drop in any real Bluesky handle, and watch it get ingested into the graph and scored for coordination live.

### API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/campaigns` | All campaigns + node/edge data **(Cypher → AuraDB)** |
| `POST` | `/analyze-text` | Groq LLaMA-3.3-70B misinformation scoring |
| `POST` | `/analyze-network` | 8-signal bot scoring over the account graph |
| `POST` | `/detect-campaign` | LangGraph campaign-detection pipeline |
| `POST` | `/generate-alert` | Groq threat classification |
| `POST` | `/investigate` | Full 5-agent investigation of one message |
| `POST` | `/whatsapp/analyze` | WhatsApp forward analysis (patterns + LLM) |
| `POST` | `/account-intel/analyze` | Temporal + stylometric + AI-operation analysis (live Bluesky ingestion → Neo4j) |
| `POST` | `/deepfake/analyze` | ELA forensics + two-model AI-image verdict |
| `POST` | `/language/detect` | Sarvam Indian-language identification |
| `GET` | `/live-feed` | Live debunked claims from fact-checker RSS |
| `GET` | `/agents/status` | Real per-agent task counts from the running process |

```bash
curl -X POST http://localhost:8000/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "BREAKING: EVMs hacked — share before this gets deleted"}'
```
```json
{
  "misinformation_score": 87,
  "confidence": 0.87,
  "signals": { "lexical_score": 0.34, "model_score": 0.95, "score_blend": 0.87 }
}
```

The score is a deliberate blend — `0.85 × LLaMA-3.3-70B + 0.15 × deterministic lexical`. The lexical half is not decoration: it is the **offline fallback**, so the endpoint keeps returning a defensible score when Groq is down.

### Degradation — Nothing Hard-Fails

Every external dependency has a defined failure mode. Pull any plug and the system stays up, just quieter:

| Pull this plug | What happens |
|---|---|
| **Neo4j unreachable** | JSON campaign fallback → in-memory NetworkX pipeline |
| **Groq down** | Deterministic lexical scorer + rule-based threat classifier |
| **No `HF_API_KEY`** | ELA + EXIF forensics still run; AI-generation verdict omitted |
| **No `SARVAM_API_KEY`** | Regex EN/HI/Hinglish heuristic takes over |
| **A fact-checker feed is down** | Skipped silently; the other three still serve |
| **Only one HF model responds** | Score clamped to 0.49 — **it cannot flag an image alone** |

---

## 🧬 Future Scope

- 📡 **Live Telegram ingestion** — Telethon connector for public channels, feeding straight into the agent pipeline
- 🐦 **Twitter/X & Mastodon connectors** — extend the live Bluesky ingestion path across platforms
- ⚡ **Real-time WebSocket alerts** — sub-second push from detection to analyst, replacing today's polling model
- 📰 **Journalist & government API** — public REST endpoint for newsrooms and election commissions to submit content and receive structured threat reports
- 📄 **Evidence packages** — signed PDF + JSON bundles per campaign, formatted for platform trust-and-safety submission
- 🛡️ **Purpose-trained deepfake model** — replace hosted classifiers with a detector fine-tuned on Indian misinformation imagery
- 🌐 **Broader Indian-language coverage** — extend Sarvam ID into full multilingual narrative clustering across the 22 scheduled languages

---

## 📎 Resources / Credits

- **Neo4j AuraDB** — the graph substrate for accounts, posts, campaigns and coordination edges
- **Groq** — LLaMA-3.3-70B inference for content scoring and threat classification
- **Sarvam AI** — Indian-language identification (`text-lid`)
- **Hugging Face Inference API** — AI-generated-image classifiers
- **Bluesky (AT Protocol) public API** — live account and post ingestion
- **Alt News, BOOM, FactChecker.in, The Quint** — live debunked-claim RSS feeds; thank you for doing the hard work this project is built to support
- **Open source:** FastAPI · LangGraph · NetworkX · scikit-learn · Pillow · D3.js · Next.js · Tailwind CSS
- Campaign seed datasets are **synthetic**, designed to emulate coordinated inauthentic behaviour patterns documented in public research. We label this explicitly rather than pass synthetic data off as live intelligence.

---

## 🏁 Final Words

We came in planning to build a fake-news detector. We threw it away on day one, because a detector that tells you a viral lie is a lie *after* it has gone viral isn't a defence — it's an obituary.

The hardest night was image forensics. We had a working build, and it confidently flagged a perfectly real photograph as AI-generated. In a tool whose entire value is being *trusted about what's fake*, that is the worst failure available to us. So we tore it up: two independent models must now agree before ShadowTrace will say those words, and that verdict can never bulldoze the ELA evidence underneath it. **Shipping less certainty, more honestly** was the most useful thing we learned all hackathon — and it's why the score caps at 97, never 100.

The moment it clicked: pasting a stranger's real Bluesky handle into Account Intel, watching their posts flow into Neo4j, and seeing coordination edges light up against accounts already in the graph. Not a mock. Not a fixture. **A real network, traced in real time.**

Huge thanks to **NAMESPACE**, **HACKHAZARDS '26** and **Neo4j** — for the platform, and for the graph that made this possible. 💛

---

<p align="center"><b>Detect. Trace. Neutralize.</b></p>
<p align="center">
  <a href="https://shadowtrace-bay.vercel.app">Live Demo</a> ·
  <a href="LICENSE">MIT License</a>
</p>
