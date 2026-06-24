import fs from "node:fs";
import path from "node:path";

const metaPath = path.join(process.cwd(), "public", "articles-meta.json");

function loadArticles() {
  if (!fs.existsSync(metaPath)) {
    return [];
  }

  const payload = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  return payload.articles || [];
}

function scoreArticle(query, article) {
  const text = `${article.title} ${article.summary} ${(article.tags || []).join(" ")} ${article.category}`.toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/[\s,.;:!?/]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return tokens.reduce((score, token) => (text.includes(token) ? score + 1 : score), 0);
}

function localRecommend(message, articles) {
  const ranked = articles
    .map((article) => ({
      ...article,
      score: scoreArticle(message, article),
    }))
    .filter((article) => article.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (ranked.length === 0) {
    return {
      answer: "我还没找到和这个问题直接匹配的文章。你可以先从文章页浏览 RL、Agent 和 RLHF 三条主线。",
      suggestions: articles.slice(0, 3).map((article) => ({
        title: article.title,
        route: article.route,
        reason: "当前内容里比较适合先浏览的入口。",
      })),
    };
  }

  return {
    answer: "我先按关键词为你挑了几篇更相关的内容，你可以从这些入口开始看。",
    suggestions: ranked.map((article) => ({
      title: article.title,
      route: article.route,
      reason: `匹配到 ${article.tags.join(" / ") || article.category} 相关内容。`,
    })),
  };
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const articles = loadArticles();
  const fallback = localRecommend(message, articles);
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    res.status(200).json({
      mode: "fallback",
      ...fallback,
    });
    return;
  }

  try {
    const compactArticles = articles.map((article) => ({
      title: article.title,
      route: article.route,
      summary: article.summary,
      tags: article.tags,
      category: article.category,
    }));

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a blog navigation assistant. Recommend the most relevant articles from the provided metadata. Return strict JSON with keys: answer, suggestions. suggestions must be an array of up to 3 objects with title, route, reason.",
          },
          {
            role: "system",
            content: `Available articles: ${JSON.stringify(compactArticles)}`,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API failed with ${response.status}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    const parsed = extractJson(content);

    res.status(200).json({
      mode: "deepseek",
      answer: parsed.answer || fallback.answer,
      suggestions: parsed.suggestions?.length ? parsed.suggestions : fallback.suggestions,
    });
  } catch (error) {
    res.status(200).json({
      mode: "fallback",
      ...fallback,
      debug: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
