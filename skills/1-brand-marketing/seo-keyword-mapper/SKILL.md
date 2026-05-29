---
name: seo-keyword-mapper
description: "SEO 流程第四棒：用關鍵字工具（Ubersuggest / AnswerThePublic）把切角與種子字擴展成完整關鍵字地圖。對應 v2 流程圖「篩選關鍵字製作關鍵字地圖 + 整理完整關鍵字地圖」。當使用者交出 Angles 交棒包、貼上關鍵字工具匯出、說「做關鍵字地圖」時觸發。只做地圖，不分類意圖、不寫文章。"
category: brand-marketing
project: seo-keyword-mapper
platform: claude
status: WIP
author: Peter Tu
input: "seo-angle-finder 的 SEO_PACKET ▸ Angles；使用者貼上的 Ubersuggest / AnswerThePublic 匯出（CSV/文字）"
process: "依 keyword-checklist 擴展種子字 → 整理含搜尋量/難度的關鍵字地圖（線頭→關鍵字）→ 人工用工具補充 → 交棒"
output: "完整關鍵字地圖（關鍵字、線頭、量/難度），交給 seo-keyword-classifier"
synergy: ["seo-keyword-classifier"]
---

# SEO Keyword Mapper

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill seo-keyword-mapper
```

SEO 流程第四棒，對應流程圖「找線頭：發覺關鍵字」。它把切角與種子字擴展成一張完整的關鍵字地圖。**搜尋量／難度數據來自真實工具**（Ubersuggest、AnswerThePublic、keyword planner）——這個 skill 不發明數字，它整理人工貼進來的工具匯出。

---

## Resources you'll use

> **知識來源**：本 skill 用到的 rubric/範本優先從 SEO Knowledge Base 的「01 Rubrics & Templates」(Drive，google-workspace MCP，依名稱 search) 讀取；取不到時 fallback 本地 `./references/`。對照表見 `seo-article-pipeline/seo-pipeline-config.md`。

- **關鍵字檢查清單**：`./references/keyword-checklist.md`
- **SEO 知識庫資料夾 ID**：`<your-seo-kb-folder-id>`（存關鍵字地圖工作檔）
- **MCP server**：`google-workspace`
- **外部工具（人工）**：Ubersuggest、AnswerThePublic（使用者執行後貼匯出）

## Step 1 — 接收切角

讀取 `SEO_PACKET ▸ Angles` 與 `▸ Questions` 的種子字。

## Step 2 — 請使用者跑工具（HITL）

對應流程圖「利用工具找關鍵字 (Ubersuggest / keyword planner)」。請使用者把種子字丟進工具，貼回匯出（含搜尋量、難度、相關建議字）。**沒有工具數據時，標記為「待補量/難度」，不要捏造數字。**

## Step 3 — 整理關鍵字地圖

依 `./references/keyword-checklist.md` 把字整理成地圖：線頭（種子）→ 衍生關鍵字 → 長尾，每筆附搜尋量、難度、對應切角/問題、語言（zh-TW / EN）。

## Step 4 — 交棒並存檔

存成「關鍵字地圖」工作檔於本篇子資料夾，輸出：

```
SEO_PACKET ▸ KeywordMap
- 線頭：<種子> → 關鍵字：<字>（量 / 難度 / 對應切角 / 語言）
- ...（含待補標記）

關鍵字地圖已完成，可交棒給 seo-keyword-classifier 依意圖分類。
```

## Outputs

完整關鍵字地圖（`SEO_PACKET ▸ KeywordMap` + Drive 工作檔）。

## Limitations

不依意圖分類（下一棒）、不驗證需求／難度排序（seo-demand-validator）、不寫文章。不捏造搜尋量。
