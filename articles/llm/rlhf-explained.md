---
title: RLHF 完整解析：SFT -> RM -> PPO
date: 2026-06-24
tags: [LLM, RLHF, PPO, Reward-Model]
category: llm-rl
difficulty: advanced
summary: 梳理 RLHF 的训练链路，以及每一环真正解决了什么问题。
github: https://github.com/zengye20040311-cmd/BLOG
---

# RLHF 完整解析：SFT -> RM -> PPO

## 问题定义

只靠 next-token prediction，模型会“会说”，但不一定“会按人类偏好说”。RLHF 的目标是把偏好信号引入训练目标，让模型输出更符合预期。

## 三阶段拆解

- SFT：先让模型学会基本格式和任务习惯；
- Reward Model：把人类偏好转成可优化分数；
- PPO：在不偏离原模型太远的前提下优化输出策略。

## 重点难点

- reward hacking；
- KL 惩罚强度；
- 偏好数据质量；
- rollout 成本控制。
