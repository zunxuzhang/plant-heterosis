# 植势文献

植物杂种优势精选文献网站。项目为零依赖静态站点，直接打开 `index.html` 即可使用。

## 已包含

- 96 篇经典、机制、综述、位点鉴定与杂种预测文献
- 题目、作者、作物、主题、年代和类型组合检索
- 独立的“杂种优势位点鉴定”和“杂种预测”主题筛选
- 独立的“IPK / Reif 团队”专题筛选，收录 29 篇相关文献
- 论文详情、核心发现、关键词与 DOI / 学术搜索入口
- 本地收藏夹与 RIS 题录导出
- 研究年代、主题构成、机制证据和作物场景图谱
- 桌面端与移动端响应式布局

## 维护文献

文献数据集中在 `data.js`。每条记录采用统一字段，新增条目后会自动进入检索、筛选、统计、收藏和导出流程。

```js
{
  id: "unique-paper-id",
  title: "Original title",
  titleZh: "中文标题",
  authors: "作者一; 作者二",
  journal: "期刊名",
  year: 2026,
  volume: "1",
  pages: "1–10",
  doi: "10.xxxx/xxxxx",
  category: "基因组与预测",
  themes: ["基因组与预测"],
  crops: ["水稻"],
  type: "机制研究",
  importance: "核心",
  summary: "中文研究概览",
  finding: "中文核心发现",
  keywords: ["heterosis", "rice"]
}
```
