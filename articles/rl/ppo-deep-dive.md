---
title: PPO 深入理解：从策略梯度到裁剪优化
date: 2026-06-24
tags: [RL, PPO, Policy-Gradient, PyTorch]
category: reinforcement-learning
difficulty: advanced
summary: 从 surrogate objective 的直觉出发，理解 PPO 为什么在实践中更稳。
github: https://github.com/zengye20040311-cmd/BLOG
---

# PPO 深入理解：从策略梯度到裁剪优化

## 问题定义

策略梯度方法更新方向直接、表达能力强，但步子太大时很容易把已经学到的行为破坏掉。PPO 的目标是用更简单的方式近似 TRPO 的“安全更新”思想。

## 核心原理

- 用优势函数衡量某个动作比基线好多少。
- 用 ratio 观察新旧策略差异。
- 用 clip 把过大的更新截断在可信范围内。

## 代码实现

这里会重点拆三件事：

- advantage 估计和 GAE；
- actor / critic 联合训练；
- clip 系数、entropy bonus 和 value loss 的平衡。

## 实验结果

计划用 LunarLander 展示不同 `clip` 和 `lambda` 设置对稳定性的影响。
