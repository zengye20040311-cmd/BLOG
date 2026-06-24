import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Ye's Knowledge Atlas",
  description: "Personal technical blog about RL, LLMs, agents, and engineering practice.",
  lang: "zh-CN",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: "/mark.svg",
    nav: [
      { text: "首页", link: "/" },
      { text: "文章", link: "/articles/" },
      { text: "项目", link: "/projects/" },
      { text: "笔记", link: "/notes/" },
      { text: "关于", link: "/about" },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/zengye20040311-cmd/BLOG" },
    ],
    footer: {
      message: "Built with VitePress, D3, and a lot of curiosity.",
      copyright: "Copyright 2026 Ye",
    },
    search: {
      provider: "local",
    },
  },
});
