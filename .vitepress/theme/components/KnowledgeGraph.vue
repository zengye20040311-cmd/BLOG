<script setup lang="ts">
import { withBase } from "vitepress";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as d3 from "d3";

type ArticleRef = {
  title: string;
  route: string;
  summary: string;
};

type GraphNode = {
  id: string;
  label: string;
  category: string;
  count: number;
  articles: ArticleRef[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
};

const svgRef = ref<SVGSVGElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);
const search = ref("");
const nodes = ref<GraphNode[]>([]);
const links = ref<GraphLink[]>([]);
const selectedId = ref<string>("");

let cleanup: (() => void) | undefined;

const palette: Record<string, string> = {
  rl: "#8f4ad7",
  agent: "#1e8f63",
  llm: "#2678c9",
  project: "#cc6b2c",
  infra: "#637081",
};

const selectedNode = computed(
  () => nodes.value.find((node) => node.id === selectedId.value) || null,
);

const relatedLinks = computed(() => {
  if (!selectedNode.value) {
    return [];
  }

  return links.value
    .filter((link) => {
      const source = typeof link.source === "string" ? link.source : link.source.id;
      const target = typeof link.target === "string" ? link.target : link.target.id;
      return source === selectedNode.value?.id || target === selectedNode.value?.id;
    })
    .map((link) => {
      const source = typeof link.source === "string" ? link.source : link.source.id;
      const target = typeof link.target === "string" ? link.target : link.target.id;
      const otherId = source === selectedNode.value?.id ? target : source;
      return {
        id: otherId,
        weight: link.weight,
      };
    })
    .sort((a, b) => b.weight - a.weight);
});

function renderGraph() {
  if (!svgRef.value || nodes.value.length === 0) {
    return;
  }

  cleanup?.();

  const width = 920;
  const height = 560;
  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const root = svg.append("g");
  const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.7, 1.8]).on("zoom", (event) => {
    root.attr("transform", event.transform);
  });

  svg.call(zoom);

  const simulation = d3
    .forceSimulation(nodes.value)
    .force(
      "link",
      d3
        .forceLink(nodes.value.length ? links.value : [])
        .id((d: d3.SimulationNodeDatum) => (d as GraphNode).id)
        .distance((link) => 110 - Math.min(24, (link as GraphLink).weight * 6))
        .strength((link) => 0.16 + Math.min(0.32, (link as GraphLink).weight * 0.08)),
    )
    .force("charge", d3.forceManyBody().strength(-360))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide<GraphNode>().radius((d) => 18 + d.count * 4));

  const linkLayer = root
    .append("g")
    .attr("stroke", "rgba(31,42,55,0.2)")
    .attr("stroke-linecap", "round")
    .selectAll("line")
    .data(links.value)
    .join("line")
    .attr("stroke-width", (d) => 1 + d.weight * 1.2);

  const nodeLayer = root
    .append("g")
    .selectAll("g")
    .data(nodes.value)
    .join("g")
    .style("cursor", "pointer");

  const tooltip = d3.select(tooltipRef.value);

  const circles = nodeLayer
    .append("circle")
    .attr("r", (d) => 16 + d.count * 4)
    .attr("fill", (d) => palette[d.category] || palette.infra)
    .attr("fill-opacity", 0.88)
    .attr("stroke", "rgba(255,255,255,0.86)")
    .attr("stroke-width", 2);

  const labels = nodeLayer
    .append("text")
    .text((d) => d.label)
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .attr("fill", "#f8f4ed")
    .style("pointer-events", "none");

  function updateOpacity() {
    const query = search.value.trim().toLowerCase();
    circles.attr("opacity", (d) => (!query || d.label.toLowerCase().includes(query) ? 1 : 0.18));
    labels.attr("opacity", (d) => (!query || d.label.toLowerCase().includes(query) ? 1 : 0.12));
    linkLayer.attr("opacity", (d) => {
      if (!query) {
        return 0.8;
      }
      const source = typeof d.source === "string" ? d.source : d.source.id;
      const target = typeof d.target === "string" ? d.target : d.target.id;
      return source.toLowerCase().includes(query) || target.toLowerCase().includes(query) ? 0.9 : 0.08;
    });
  }

  nodeLayer
    .on("mouseenter", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", `${event.offsetX + 18}px`)
        .style("top", `${event.offsetY + 18}px`)
        .html(`<strong>${d.label}</strong><br>${d.count} 篇关联内容`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.offsetX + 18}px`)
        .style("top", `${event.offsetY + 18}px`);
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0);
    })
    .on("click", (_, d) => {
      selectedId.value = d.id;
    })
    .call(
      d3
        .drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) {
            simulation.alphaTarget(0.25).restart();
          }
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) {
            simulation.alphaTarget(0);
          }
          d.fx = null;
          d.fy = null;
        }),
    );

  simulation.on("tick", () => {
    linkLayer
      .attr("x1", (d) => (typeof d.source === "string" ? 0 : d.source.x || 0))
      .attr("y1", (d) => (typeof d.source === "string" ? 0 : d.source.y || 0))
      .attr("x2", (d) => (typeof d.target === "string" ? 0 : d.target.x || 0))
      .attr("y2", (d) => (typeof d.target === "string" ? 0 : d.target.y || 0));

    nodeLayer.attr("transform", (d) => `translate(${d.x || 0}, ${d.y || 0})`);
  });

  updateOpacity();
  cleanup = () => simulation.stop();
}

watch(search, () => {
  renderGraph();
});

onMounted(async () => {
  const response = await fetch(withBase("/graph-data.json"));
  const graph = await response.json();
  nodes.value = graph.nodes || [];
  links.value = graph.links || [];
  selectedId.value = nodes.value[0]?.id || "";
  renderGraph();
});

onBeforeUnmount(() => {
  cleanup?.();
});
</script>

<template>
  <section class="knowledge-graph">
    <div class="knowledge-graph__header">
      <div>
        <p class="knowledge-graph__eyebrow">Interactive Map</p>
        <h2>知识图谱预览</h2>
        <p>每个节点代表一个主题标签，节点越大说明关联文章越多，边越粗说明主题共现越频繁。</p>
      </div>
      <label class="knowledge-graph__search">
        <span>搜索主题</span>
        <input v-model="search" type="text" placeholder="例如 PPO / Agent / RLHF" />
      </label>
    </div>

    <div class="knowledge-graph__layout">
      <div class="knowledge-graph__canvas">
        <svg ref="svgRef" />
        <div ref="tooltipRef" class="knowledge-graph__tooltip" />
      </div>

      <aside class="knowledge-graph__panel" v-if="selectedNode">
        <p class="knowledge-graph__eyebrow">Selected Topic</p>
        <h3>{{ selectedNode.label }}</h3>
        <p>{{ selectedNode.count }} 篇内容与这个主题直接相关。</p>

        <h4>相关文章</h4>
        <ul>
          <li v-for="article in selectedNode.articles" :key="article.route">
            <a :href="article.route">{{ article.title }}</a>
            <span>{{ article.summary }}</span>
          </li>
        </ul>

        <h4>关联主题</h4>
        <ul>
          <li v-for="item in relatedLinks" :key="item.id">
            <button type="button" @click="selectedId = item.id">
              {{ item.id }}
            </button>
            <span>共现 {{ item.weight }} 次</span>
          </li>
        </ul>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.knowledge-graph {
  margin: 2.5rem 0;
  padding: 1.5rem;
  border-radius: 28px;
  background: rgba(255, 251, 244, 0.74);
  border: 1px solid rgba(31, 42, 55, 0.08);
  box-shadow: 0 18px 56px rgba(31, 42, 55, 0.08);
}

.knowledge-graph__header,
.knowledge-graph__layout {
  display: grid;
  gap: 1.5rem;
}

.knowledge-graph__header {
  grid-template-columns: 1.5fr minmax(220px, 320px);
  align-items: end;
}

.knowledge-graph__eyebrow {
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  color: #14756c;
  font-weight: 700;
}

.knowledge-graph__search span {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.88rem;
  color: #435163;
}

.knowledge-graph__search input {
  width: 100%;
  border: 1px solid rgba(31, 42, 55, 0.12);
  border-radius: 999px;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.9);
}

.knowledge-graph__layout {
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 0.9fr);
}

.knowledge-graph__canvas,
.knowledge-graph__panel {
  position: relative;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(31, 42, 55, 0.08);
}

.knowledge-graph__canvas {
  min-height: 560px;
  overflow: hidden;
}

.knowledge-graph__canvas svg {
  width: 100%;
  height: 100%;
  display: block;
}

.knowledge-graph__tooltip {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  padding: 0.6rem 0.8rem;
  border-radius: 14px;
  background: rgba(31, 42, 55, 0.92);
  color: #f8f4ed;
  font-size: 0.85rem;
  transition: opacity 0.12s ease;
}

.knowledge-graph__panel {
  padding: 1.25rem;
}

.knowledge-graph__panel h3,
.knowledge-graph__panel h4 {
  margin-top: 0;
}

.knowledge-graph__panel ul {
  list-style: none;
  padding: 0;
  margin: 0 0 1.2rem;
  display: grid;
  gap: 0.85rem;
}

.knowledge-graph__panel li {
  display: grid;
  gap: 0.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(31, 42, 55, 0.08);
}

.knowledge-graph__panel a,
.knowledge-graph__panel button {
  font-weight: 700;
  color: #1f2a37;
  text-align: left;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

.knowledge-graph__panel span {
  color: #526173;
  font-size: 0.88rem;
}

@media (max-width: 960px) {
  .knowledge-graph__header,
  .knowledge-graph__layout {
    grid-template-columns: 1fr;
  }

  .knowledge-graph__canvas {
    min-height: 440px;
  }
}
</style>
