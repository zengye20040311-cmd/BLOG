const fs = require("fs");
const path = require("path");

const outputDir = path.join(process.cwd(), "public");
const graphDataPath = path.join(outputDir, "graph-data.json");
const metaPath = path.join(outputDir, "articles-meta.json");

fs.mkdirSync(outputDir, { recursive: true });

const emptyGraph = {
  generatedAt: new Date().toISOString(),
  nodes: [],
  links: [],
};

const emptyMeta = {
  generatedAt: new Date().toISOString(),
  articles: [],
};

fs.writeFileSync(graphDataPath, JSON.stringify(emptyGraph, null, 2));
fs.writeFileSync(metaPath, JSON.stringify(emptyMeta, null, 2));

console.log("Generated placeholder graph-data.json and articles-meta.json");
