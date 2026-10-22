# 尚硅谷 Kafka · 96 课时交互学习站

将尚硅谷 Kafka 教程（96 课时 / 15 章）整理为**可在线预览的交互学习站**：结构化大纲 + 每课时要点/代码/图表 + p5.js 手绘架构图 + ECharts 数据图表 + IMA 知识库实战案例。

## 🌐 在线预览

GitHub Pages：`https://sangjiexun.github.io/kafka-course/`（部署后访问）

本地预览：

```bash
cd site
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 📂 目录结构

```
├── docs/
│   └── 课程大纲.md            # 96 课时完整大纲（章节总览 + 详细目录 + 学习路径）
└── site/                     # 交互学习站（GitHub Pages 根目录）
    ├── index.html            # 单页应用入口（hash 路由）
    └── assets/
        ├── css/style.css     # 暗色主题样式
        ├── js/
        │   ├── app.js        # 路由 / 渲染 / 进度管理
        │   ├── data/         # 15 章 96 课时结构化数据（要点/代码/表格/案例）
        │   ├── p5/           # 7 幅 p5.js 交互架构图
        │   └── charts/       # 6 个 ECharts 图表模块
        └── img/              # 7 张本地生图引擎生成的配图
```

## ✨ 站点特性

| 特性 | 说明 |
|---|---|
| 📖 完整大纲 | 15 章 96 课时，每课时含摘要、核心要点、代码/命令、对比表 |
| 🎨 p5.js 架构图 | 基础架构 / 生产者流程 / 分区策略 / ISR 同步 / 文件存储 / 消费者组 / KRaft |
| 📈 ECharts 图表 | MQ 选型雷达 / 调优阶梯 / acks 权衡 / rebalance 移动量 / 压测曲线 / 章节分布 |
| 📚 IMA 案例填充 | 消息队列七种场景、爱奇艺 AutoMQ、零拷贝、酷狗音乐架构等真实案例 |
| ✅ 学习进度 | localStorage 记录已学课时，侧边栏进度条 |
| 🔍 课时搜索 | 侧边栏实时搜索课时标题与知识点 |

## 🛠 技术栈

- 纯静态站点（无构建步骤）：HTML + CSS + 原生 JS
- [p5.js](https://p5js.org/) 1.9.4 —— 交互架构图
- [ECharts](https://echarts.apache.org/) 5.4.3 —— 数据图表
- [highlight.js](https://highlightjs.org/) 11.9.0 —— 代码高亮
- 配图：本地生图引擎生成（gpt-image 系列，暗蓝科技风）

## 📄 课程内容说明

课程内容整理自尚硅谷公开 Kafka 教程（96 课时目录），用于学习研究；案例素材来自 IMA 知识库（腾讯 ima）检索结果，版权归原作者所有。
