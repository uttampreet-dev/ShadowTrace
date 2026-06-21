from __future__ import annotations

from dataclasses import dataclass

import networkx as nx


@dataclass(slots=True)
class CommunityResult:
    cluster_count: int
    communities: list[list[str]]


def detect_communities(graph: nx.Graph) -> CommunityResult:
    """Detect communities using greedy modularity maximization."""

    if graph.number_of_nodes() == 0:
        return CommunityResult(0, [])

    try:
        from networkx.algorithms.community import greedy_modularity_communities

        communities = [sorted(list(group)) for group in greedy_modularity_communities(graph)]
        return CommunityResult(len(communities), communities)
    except Exception:
        return CommunityResult(1 if graph.number_of_nodes() else 0, [sorted(list(graph.nodes()))])
