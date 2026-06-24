---
title: DQN 原理与 PyTorch 实现
date: 2026-06-24
tags: [RL, DQN, PyTorch, CartPole]
category: reinforcement-learning
difficulty: intermediate
summary: 从 Bellman 方程到经验回放和目标网络，完整拆解 DQN 的实现路径。
github: https://github.com/zengye20040311-cmd/BLOG
---

# DQN 原理与 PyTorch 实现

## 问题定义

如果直接让神经网络拟合动作价值函数，训练往往会因为样本强相关和目标不断漂移而不稳定。DQN 的价值在于，它给出了第一套在视觉输入和离散动作上稳定工作的深度强化学习范式。

## 核心原理

- 用 `Q(s, a)` 估计状态动作价值。
- 用经验回放打乱样本相关性。
- 用目标网络稳定 bootstrap 目标。

## 代码实现

后续我会把完整的 `PyTorch` 版本、训练脚本和关键超参数表补进来。

## 实验结果

这一节会展示 CartPole 收敛曲线，以及是否使用经验回放和目标网络时的差异。

## 踩坑记录

最常见的问题是：

- epsilon 衰减太快，探索不足；
- reward 设计和终止条件处理不一致；
- target network 更新周期过短，等价于没分离目标。
