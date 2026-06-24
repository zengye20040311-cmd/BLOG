const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const root = process.cwd();
const outputDir = path.join(root, "public");
const graphDataPath = path.join(outputDir, "graph-data.json");
const metaPath = path.join(outputDir, "articles-meta.json");
const contentRoots = ["articles", "notes", "projects"];

const categoryMap = {
  "reinforcement-learning": "rl",
  agent: "agent",
  "llm-rl": "llm",
  llm: "llm",
  project: "project",
  notes: "infra",
};

function walkMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkMarkdownFiles(absolutePath);
    }
    return entry.name.endsWith(".md") ? [absolutePath] : [];
  });
}

function toRoute(filePath) {
  const relative = path.relative(root, filePath).replace(/\\/g, "/");
  const withoutExt = relative.replace(/\.md$/, "");
  return withoutExt.endsWith("/index")
    ? `/${withoutExt.slice(0, -6)}/`
    : `/${withoutExt}`;
}

function inferKind(filePath) {
  const relative = path.relative(root, filePath).replace(/\\/g, "/");
  return relative.split("/")[0];
}

const files = contentRoots.flatMap((dir) => walkMarkdownFiles(path.join(root, dir)));
const articles = files
  .map((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(source);
    const title = data.title || path.basename(filePath, ".md");
    const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const category = String(data.category || inferKind(filePath));

    return {
      title,
      date: data.date || null,
      tags,
      category,
      difficulty: data.difficulty || null,
      summary: data.summary || content.trim().split(/\r?\n/).find(Boolean) || "",
      github: data.github || null,
      route: toRoute(filePath),
      kind: inferKind(filePath),
    };
  })
  .filter((item) => item.title);

articles.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

const nodeMap = new Map();
const linkMap = new Map();

for (const article of articles) {
  const uniqueTags = [...new Set(article.tags)];

  for (const tag of uniqueTags) {
    const existing = nodeMap.get(tag) || {
      id: tag,
      label: tag,
      category: categoryMap[article.category] || "infra",
      count: 0,
      articles: [],
    };

    existing.count += 1;
    existing.articles.push({
      title: article.title,
      route: article.route,
      summary: article.summary,
    });
    nodeMap.set(tag, existing);
  }

  for (let index = 0; index < uniqueTags.length; index += 1) {
    for (let other = index + 1; other < uniqueTags.length; other += 1) {
      const pair = [uniqueTags[index], uniqueTags[other]].sort();
      const key = pair.join("::");
      const existing = linkMap.get(key) || {
        source: pair[0],
        target: pair[1],
        weight: 0,
      };
      existing.weight += 1;
      linkMap.set(key, existing);
    }
  }
}

const graphData = {
  generatedAt: new Date().toISOString(),
  nodes: [...nodeMap.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  links: [...linkMap.values()].sort((a, b) => b.weight - a.weight),
};

const meta = {
  generatedAt: new Date().toISOString(),
  articles,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(graphDataPath, JSON.stringify(graphData, null, 2));
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

console.log(`Generated ${graphData.nodes.length} graph nodes and ${meta.articles.length} content entries.`);
