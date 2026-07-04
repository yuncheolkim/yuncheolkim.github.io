+++
title = "Ai 工具"
date = 2025-12-14T12:00:00+08:00
draft = false
slug = "jimeng-ai-document"
author = "yuncheol kim"
categories = ["文档"]
tags = ["AI", "Github"]
summary = "各种AI工具"
+++

[caveman](https://github.com/JuliusBrussee/caveman)

定位：控制 AI 对话输出长度，极致压缩 Token
- 核心逻辑：模仿原始人极简说话风格，删掉所有修饰、客套、解释、铺垫，只留核心信息
- 效果：对话 Token 平均减少 65%，拒绝冗长废话、分段抒情、多余注释
- 适用场景：通用对话、问答、文案总结、不需要严谨代码的场景
- 风格特点：直白、简短、无冗余，只给结果，不解释原理

[ponytail](https://github.com/DietrichGebert/ponytail)

- 定位：专门优化 AI 代码生成，精简代码行数 LOC
- 核心逻辑：7 层决策阶梯，AI 写代码前先层层判断：要不要写、能不能复用、能否一行简化，遵循 YAGNI 原则（不需要就不写）
- 实测效果：代码行数平均减少 92%，剔除冗余循环、多余变量、无效校验
- 适配：Claude Code、各类代码 Agent，只聚焦代码逻辑精简
- 风格：极简工业风，无冗余注释、不做多余容错，追求最少可运行代码
