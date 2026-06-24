---
title: Ye's Knowledge Atlas
titleTemplate: false
---

# 知识图谱式个人博客

这里不是普通的时间线博客，而是围绕强化学习、Agent、LLM 和工程实践构建的一张个人知识地图。后续首页会嵌入交互式图谱；当前版本先把内容结构、项目页和展示组件搭起来。

<KnowledgeGraph />

<div class="atlas-grid">
  <div class="atlas-panel">
    <h3>为什么做这个博客</h3>
    <p>它既是面向读者的知识入口，也是面向面试官的工程样本。内容、项目、自动化数据生成和 AI 导航会一起构成完整作品。</p>
  </div>
  <div class="atlas-panel">
    <h3>当前内容支柱</h3>
    <p>强化学习、LLM + RL、Agent 架构、项目复盘四条线并行推进，原创文章与学习笔记分层展示。</p>
  </div>
  <div class="atlas-panel">
    <h3>接下来的亮点</h3>
    <p>下一阶段会把标签关系自动生成为图谱节点和边，再加入 DeepSeek 智能导航，形成一个轻量的 RAG + Agent 体验。</p>
  </div>
</div>

## 先看什么

<div class="atlas-grid">
  <ProjectCard
    title="原创技术文章"
    summary="从数理推导、代码实现到实验结论，集中展示自己的技术理解。"
    stack="RL / LLM / Agent"
    href="/articles/"
    status="Writing"
  />
  <ProjectCard
    title="项目展示"
    summary="把值得在面试中讲清楚的项目拆成目标、架构、难点和结果。"
    stack="Research + Engineering"
    href="/projects/"
    status="Featured"
  />
  <ProjectCard
    title="学习笔记"
    summary="课程、论文和开源项目的结构化笔记，帮助构建长期知识回路。"
    stack="Papers / Courses / OSS"
    href="/notes/"
    status="Growing"
  />
</div>

## 建设路线

<div class="timeline">
  <article>
    <h3>Phase 1</h3>
    <p>站点骨架、页面风格、基础内容结构和个人展示组件。</p>
  </article>
  <article>
    <h3>Phase 2</h3>
    <p>自动扫描 Frontmatter，生成知识图谱和文章元数据。</p>
  </article>
  <article>
    <h3>Phase 3</h3>
    <p>接入 DeepSeek 智能导航，让读者可以用问题驱动探索内容。</p>
  </article>
</div>
