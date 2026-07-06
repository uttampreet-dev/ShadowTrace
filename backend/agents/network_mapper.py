from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import json
import networkx as nx

from graph.bot_detection import calculate_bot_score
from graph.community_detection import detect_communities


@dataclass(slots=True)
class NodeAnalysis:
    node_id: str
    bot_score: float
    indicators: dict[str, float]


@dataclass(slots=True)
class NetworkAnalysisResult:
    nodes: int
    edges: int
    cluster_count: int
    communities: list[list[str]]
    bot_indicators: list[NodeAnalysis]
    density: float


class NetworkMapper:
    def load_campaign(self, source: str | Path | dict[str, Any]) -> dict[str, Any]:
        if isinstance(source, dict):
            return source
        path = Path(source)
        return json.loads(path.read_text(encoding="utf-8"))

    def build_graph(self, campaign: dict[str, Any]) -> nx.Graph:
        graph = nx.Graph()
        for node in campaign.get("nodes", []):
            graph.add_node(node["id"], **node)
        for edge in campaign.get("edges", []):
            graph.add_edge(edge["source"], edge["target"], **edge)
        return graph

    def analyze(self, source: str | Path | dict[str, Any]) -> NetworkAnalysisResult:
        campaign = self.load_campaign(source)
        graph = self.build_graph(campaign)
        self._enrich_metrics(graph)
        communities = detect_communities(graph)
        bot_indicators = self._detect_bots(graph, campaign.get("posts", []))
        density = nx.density(graph) if graph.number_of_nodes() > 1 else 0.0
        return NetworkAnalysisResult(
            nodes=graph.number_of_nodes(),
            edges=graph.number_of_edges(),
            cluster_count=communities.cluster_count,
            communities=communities.communities,
            bot_indicators=bot_indicators,
            density=round(density, 4),
        )

    def _detect_bots(self, graph: nx.Graph, posts: list[dict[str, Any]]) -> list[NodeAnalysis]:
        posts_by_node: dict[str, list[dict[str, Any]]] = {}
        for post in posts:
            posts_by_node.setdefault(post["author_id"], []).append(post)

        analyses: list[NodeAnalysis] = []
        for node_id, attrs in graph.nodes(data=True):
            node_posts = posts_by_node.get(node_id, [])
            posting_frequency = self._posting_frequency(node_posts)
            connectivity = float(graph.degree(node_id))
            metadata = attrs.get("metadata", attrs)
            metadata = {
                **metadata,
                "pagerank": graph.nodes[node_id].get("pagerank", 0.0),
                "betweenness": graph.nodes[node_id].get("betweenness", 0.0),
                "clustering": graph.nodes[node_id].get("clustering", 0.0),
            }
            bot_score = calculate_bot_score(metadata, posting_frequency, connectivity)
            analyses.append(NodeAnalysis(node_id=node_id, bot_score=bot_score.score, indicators=bot_score.indicators))
        return sorted(analyses, key=lambda item: item.bot_score, reverse=True)

    @staticmethod
    def _enrich_metrics(graph: nx.Graph) -> None:
        if graph.number_of_nodes() == 0:
            return
        pagerank = nx.pagerank(graph, alpha=0.85)
        betweenness = nx.betweenness_centrality(graph, normalized=True)
        clustering = nx.clustering(graph)
        for node in graph.nodes:
            graph.nodes[node]["pagerank"] = float(pagerank.get(node, 0.0))
            graph.nodes[node]["betweenness"] = float(betweenness.get(node, 0.0))
            graph.nodes[node]["clustering"] = float(clustering.get(node, 0.0))

    @staticmethod
    def _posting_frequency(posts: list[dict[str, Any]]) -> float:
        if len(posts) < 2:
            return float(len(posts))
        timestamps = sorted(
            datetime.fromisoformat(str(post["timestamp"]).replace("Z", "+00:00")).astimezone(timezone.utc)
            for post in posts
        )
        span_hours = max(1.0, (timestamps[-1] - timestamps[0]).total_seconds() / 3600.0)
        return len(posts) / span_hours
