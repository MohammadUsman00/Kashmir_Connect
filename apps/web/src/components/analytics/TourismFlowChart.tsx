"use client";

import * as React from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { KCCard, KCSkeleton } from "@kashmir/ui";

type FlowNode = { id: string; name: string };
type FlowLink = { source: string; target: string; value: number; month: number; nationality: string; entry: string; destination: string };

const sourceCities = ["Delhi", "Mumbai", "Bengaluru", "Kolkata", "Dubai", "Riyadh"];
const entryPoints = ["Srinagar Airport", "Jammu Entry", "Banihal Rail"];
const destinations = ["Srinagar", "Gulmarg", "Pahalgam", "Sonmarg", "Yusmarg"];

function buildFlowData(filters: {
  nationality: string;
  entry: string;
  destination: string;
  month: number;
}): { nodes: FlowNode[]; links: FlowLink[] } {
  const nodes: FlowNode[] = [
    ...sourceCities.map((name) => ({ id: `source-${name}`, name })),
    ...entryPoints.map((name) => ({ id: `entry-${name}`, name })),
    ...destinations.map((name) => ({ id: `dest-${name}`, name }))
  ];
  const links: FlowLink[] = [];
  for (const source of sourceCities) {
    for (const entry of entryPoints) {
      const value = 180 + (source.length * 13 + entry.length * 7) % 220 + filters.month * 4;
      links.push({
        source: `source-${source}`,
        target: `entry-${entry}`,
        value,
        month: filters.month,
        nationality: "all",
        entry,
        destination: "all"
      });
    }
  }
  for (const entry of entryPoints) {
    for (const destination of destinations) {
      const value = 130 + (entry.length * 9 + destination.length * 5) % 190 + filters.month * 3;
      links.push({
        source: `entry-${entry}`,
        target: `dest-${destination}`,
        value,
        month: filters.month,
        nationality: "all",
        entry,
        destination
      });
    }
  }
  return {
    nodes,
    links: links.filter((item) => {
      if (filters.entry !== "all" && !item.entry.includes(filters.entry)) return false;
      if (filters.destination !== "all" && item.destination !== "all" && !item.destination.includes(filters.destination)) return false;
      if (filters.nationality !== "all" && item.nationality !== filters.nationality) return false;
      return true;
    })
  };
}

export function TourismFlowChart(): JSX.Element {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [month, setMonth] = React.useState(6);
  const [nationality, setNationality] = React.useState("all");
  const [entry, setEntry] = React.useState("all");
  const [destination, setDestination] = React.useState("all");

  React.useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    if (!svgRef.current || loading) return;
    const { nodes, links } = buildFlowData({ nationality, entry, destination, month });

    const width = 980;
    const height = 420;
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const sankeyLayout = sankey<FlowNode, FlowLink>()
      .nodeId((d) => d.id)
      .nodeWidth(16)
      .nodePadding(20)
      .extent([
        [20, 20],
        [width - 20, height - 20]
      ]);

    const graph = sankeyLayout({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l }))
    });

    const maxValue = Math.max(...graph.links.map((l) => l.value), 1);
    const opacity = scaleLinear().domain([0, maxValue]).range([0.2, 0.9]);

    svg
      .append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", "#1B6CA8")
      .attr("stroke-opacity", (d) => opacity(d.value))
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .append("animate")
      .attr("attributeName", "stroke-dashoffset")
      .attr("from", "0")
      .attr("to", "-30")
      .attr("dur", "1.6s")
      .attr("repeatCount", "indefinite");

    const nodesG = svg
      .append("g")
      .selectAll("rect")
      .data(graph.nodes)
      .join("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => Math.max(1, d.y1 - d.y0))
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", "#C8972A")
      .attr("rx", 4);

    nodesG.append("title").text((d) => d.name);

    svg
      .append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr("y", (d) => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
      .attr("fill", "currentColor")
      .attr("font-size", 12)
      .text((d) => d.name);
  }, [destination, entry, loading, month, nationality]);

  return (
    <KCCard className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Tourism Flow Sankey</h3>
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border px-2 text-xs dark:bg-[#102239]" value={nationality} onChange={(e) => setNationality(e.target.value)}>
            <option value="all">All nationalities</option>
            <option value="indian">Indian</option>
            <option value="international">International</option>
          </select>
          <select className="h-9 rounded-md border px-2 text-xs dark:bg-[#102239]" value={entry} onChange={(e) => setEntry(e.target.value)}>
            <option value="all">All entry points</option>
            {entryPoints.map((point) => (
              <option key={point} value={point}>
                {point}
              </option>
            ))}
          </select>
          <select className="h-9 rounded-md border px-2 text-xs dark:bg-[#102239]" value={destination} onChange={(e) => setDestination(e.target.value)}>
            <option value="all">All destinations</option>
            {destinations.map((dest) => (
              <option key={dest} value={dest}>
                {dest}
              </option>
            ))}
          </select>
          <input type="range" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          <span className="text-xs">Month {month}</span>
        </div>
      </div>

      {loading ? (
        <KCSkeleton className="h-[420px] w-full rounded-xl" />
      ) : (
        <div className="overflow-x-auto">
          <svg ref={svgRef} viewBox="0 0 980 420" className="h-[420px] min-w-[980px] w-full" />
        </div>
      )}
    </KCCard>
  );
}
