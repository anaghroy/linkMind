import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { getGraph, buildGraph, rebuildGraph } from "../../api/graph.api";

const TYPE_COLORS = {
  article: "#6366f1",
  youtube: "#ef4444",
  tweet: "#38bdf8",
  pdf: "#f59e0b",
  image: "#10b981",
  note: "#8b5cf6",
};

function nodeRadius(d) {
  return 7 + Math.min((d.surfaceCount || 0) * 1.5, 10);
}

export default function GraphPage() {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const simulationRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [typeFilters, setTypeFilters] = useState({
    article: true, youtube: true, tweet: true,
    pdf: true, image: true, note: true,
  });
  const [minStrength, setMinStrength] = useState(0.1);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchGraph();
  }, [minStrength]);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await getGraph({ minStrength, limit: 100 });
      const { nodes, links, stats } = res.data.graph;
      setGraphData({ nodes, links });
      setStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildGraph = async () => {
    setBuilding(true);
    try {
      await buildGraph();
      await fetchGraph();
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  const handleRebuildGraph = async () => {
    if (!confirm("This will delete and rebuild all graph connections. Continue?")) return;
    setBuilding(true);
    try {
      await rebuildGraph();
      await fetchGraph();
    } catch (err) {
      console.error(err);
    } finally {
      setBuilding(false);
    }
  };

  // ── D3 Simulation ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    const filteredNodes = graphData.nodes.filter((n) => {
      const typeMatch = typeFilters[n.type];
      const searchMatch = !search.trim() ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        (n.aiTags || []).some((t) => t.includes(search.toLowerCase()));
      return typeMatch && searchMatch;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links.filter(
      (l) =>
        filteredNodeIds.has(l.source?.id || l.source) &&
        filteredNodeIds.has(l.target?.id || l.target)
    );

    if (filteredNodes.length === 0) return;

    // Zoom
    const g = svg.append("g");
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    // Defs for glow
    const defs = svg.append("defs");
    Object.entries(TYPE_COLORS).forEach(([type, color]) => {
      const filter = defs.append("filter").attr("id", `glow-${type}`);
      filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in", "coloredBlur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", (d) =>
        d.relationshipType === "embedding_similarity"
          ? "rgba(99,102,241,0.25)"
          : "rgba(255,255,255,0.1)"
      )
      .attr("stroke-width", (d) => Math.max(d.strength * 3, 0.5))
      .attr("stroke-dasharray", (d) =>
        d.relationshipType === "embedding_similarity" ? "4,4" : "none"
      );

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag()
          .on("start", (e, d) => {
            if (!e.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on("end", (e, d) => {
            if (!e.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on("click", (e, d) => { e.stopPropagation(); setSelectedNode(d); });

    // Outer ring
    node.append("circle")
      .attr("r", (d) => nodeRadius(d) + 4)
      .attr("fill", "none")
      .attr("stroke", (d) => TYPE_COLORS[d.type] || "#6366f1")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.2);

    // Inner circle
    node.append("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => TYPE_COLORS[d.type] || "#6366f1")
      .attr("fill-opacity", 0.85)
      .attr("filter", (d) => `url(#glow-${d.type})`);

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "graph-tooltip")
      .style("opacity", 0)
      .style("pointer-events", "none");

    node
      .on("mouseover", (e, d) => {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          <div class="graph-tooltip__type" style="color:${TYPE_COLORS[d.type]}">${d.type.toUpperCase()}</div>
          <div class="graph-tooltip__title">${d.title}</div>
          ${d.aiTags?.length ? `<div class="graph-tooltip__tags">${d.aiTags.slice(0, 3).map((t) => `#${t}`).join(" ")}</div>` : ""}
        `)
          .style("left", (e.pageX + 12) + "px")
          .style("top", (e.pageY - 28) + "px");
      })
      .on("mousemove", (e) => {
        tooltip.style("left", (e.pageX + 12) + "px").style("top", (e.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(100).style("opacity", 0);
      });

    svg.on("click", () => setSelectedNode(null));

    // Simulation
    const simulation = d3.forceSimulation(filteredNodes)
      .force("link", d3.forceLink(filteredLinks)
        .id((d) => d.id)
        .distance((d) => 80 + (1 - d.strength) * 100)
        .strength((d) => d.strength * 0.5)
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => nodeRadius(d) + 12))
      .on("tick", () => {
        link
          .attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [loading, graphData, typeFilters, search]);

  const handleZoom = (factor) => {
    d3.select(svgRef.current).transition().duration(300)
      .call(d3.zoom().scaleBy, factor);
  };

  const handleReset = () => {
    d3.select(svgRef.current).transition().duration(500)
      .call(d3.zoom().transform, d3.zoomIdentity);
  };

  if (loading) {
    return (
      <div className="graph-page__loading">
        <div className="graph-page__loading-dots">
          <span /><span /><span />
        </div>
        <p>Loading knowledge graph...</p>
      </div>
    );
  }

  return (
    <div className="graph-page">
      {/* Controls */}
      <div className="graph-controls">
        <div className="graph-controls__search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="graph-controls__types">
          {Object.keys(TYPE_COLORS).map((type) => (
            <button
              key={type}
              className={`graph-controls__type-btn${typeFilters[type] ? " graph-controls__type-btn--active" : ""}`}
              style={typeFilters[type] ? { borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] } : {}}
              onClick={() => setTypeFilters((p) => ({ ...p, [type]: !p[type] }))}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="graph-controls__strength">
          <span>Strength:</span>
          <input
            type="range" min="0" max="0.9" step="0.1"
            value={minStrength}
            onChange={(e) => setMinStrength(Number(e.target.value))}
          />
          <span>{minStrength.toFixed(1)}</span>
        </div>

        {stats && (
          <div className="graph-controls__stats">
            <span>{stats.totalNodes} nodes · {stats.totalLinks} edges</span>
          </div>
        )}

        <div className="graph-controls__actions">
          <button className="graph-controls__build-btn" onClick={handleBuildGraph} disabled={building}>
            {building ? "Building..." : "⟳ Update"}
          </button>
          <button className="graph-controls__rebuild-btn" onClick={handleRebuildGraph} disabled={building}>
            Rebuild
          </button>
        </div>

        <div className="graph-controls__zoom">
          <button onClick={() => handleZoom(1.3)}>+</button>
          <button onClick={() => handleZoom(0.7)}>−</button>
          <button onClick={handleReset}>↺</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="graph-canvas">
        <svg ref={svgRef} width="100%" height="100%" />

        {graphData.nodes.length === 0 && (
          <div className="graph-canvas__empty">
            <p>No graph data yet</p>
            <span>Make sure items have AI processing done, then build the graph</span>
            <button className="graph-canvas__build-btn" onClick={handleBuildGraph} disabled={building}>
              {building ? "Building..." : "Build Graph Now"}
            </button>
          </div>
        )}

        {graphData.nodes.length > 0 && (
          <div className="graph-legend">
            <div className="graph-legend__item">
              <div className="graph-legend__line graph-legend__line--solid" />
              <span>Tag similarity</span>
            </div>
            <div className="graph-legend__item">
              <div className="graph-legend__line graph-legend__line--dashed" />
              <span>Embedding similarity</span>
            </div>
            <div className="graph-legend__item">
              <div className="graph-legend__dot" />
              <span>Node size = resurfaced count</span>
            </div>
          </div>
        )}
      </div>

      {/* Node preview */}
      {selectedNode && (
        <div className="graph-preview">
          <button className="graph-preview__close" onClick={() => setSelectedNode(null)}>×</button>
          <div className="graph-preview__type" style={{ color: TYPE_COLORS[selectedNode.type] }}>
            {selectedNode.type?.toUpperCase()}
          </div>
          {selectedNode.thumbnail && (
            <img src={selectedNode.thumbnail} alt={selectedNode.title}
              className="graph-preview__thumb"
              onError={(e) => (e.target.style.display = "none")} />
          )}
          <h3 className="graph-preview__title">{selectedNode.title}</h3>
          {selectedNode.aiSummary && (
            <div className="graph-preview__ai">
              <span className="graph-preview__ai-label">✦ AI SYNTHESIS</span>
              <p>{selectedNode.aiSummary}</p>
            </div>
          )}
          {selectedNode.aiTags?.length > 0 && (
            <div className="graph-preview__tags-section">
              <span className="graph-preview__section-label">ASSOCIATIONS</span>
              <div className="graph-preview__tags">
                {selectedNode.aiTags.map((tag) => (
                  <span className="graph-preview__tag" key={tag}>#{tag}</span>
                ))}
              </div>
            </div>
          )}
          <div className="graph-preview__actions">
            <button className="graph-preview__open-btn"
              onClick={() => navigate(`/library/${selectedNode.id}`)}>
              Open Item ↗
            </button>
            <button className="graph-preview__connections-btn"
              onClick={() => navigate(`/library/${selectedNode.id}`)}>
              Show Backlinks 🔗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}