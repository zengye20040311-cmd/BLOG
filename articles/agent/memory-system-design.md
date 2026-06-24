---
title: Agent Memory 系统设计：从查字典到回忆
date: 2026-06-24
tags: [Agent, Memory, RAG, Systems]
category: agent
difficulty: intermediate
summary: 讨论 Agent 中短期记忆、长期记忆和可检索记忆的职责边界。
github: https://github.com/zengye20040311-cmd/BLOG
---

# Agent Memory 系统设计：从查字典到回忆

## 问题定义

很多 Agent 项目把所有“记忆”都塞进向量库，这样虽然能检索，但很难表达状态、偏好、经验和任务上下文之间的差异。

## 核心原理

我倾向把记忆拆成四层：

- 工作记忆：当前会话上下文；
- 情节记忆：过去发生过的具体事件；
- 语义记忆：稳定事实和知识；
- 程序性记忆：技能、策略和执行偏好。

## 工程启发

当 Agent 需要做长期任务时，真正关键的不是“存了多少”，而是“什么时候写入、什么时候召回、以什么格式返回给模型”。
