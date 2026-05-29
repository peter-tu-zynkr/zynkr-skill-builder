---
name: seo-angle-finder
description: "SEO 流程第三棒：從 SEO 專家角度＋競爭對手網址，找出「哪裡可以加強」的內容切角與差異化機會。對應 v2 流程圖「從 SEO 角度思考加強 + 參考競爭對手網址思考加強」。當使用者交出 Questions 交棒包、提供競品網址、說「找 SEO 切角」時觸發。只找切角，不做關鍵字地圖、不寫文章。"
category: brand-marketing
project: seo-angle-finder
platform: claude
status: WIP
author: Peter Tu
input: "seo-question-miner 的 SEO_PACKET ▸ Questions；可選：已知競爭對手網址（文章資料包）"
process: "從問題與競品內容找出未被滿足的角度、可加強處、Zynkr 第一手證據可切入點 → 人工驗證 → 交棒"
output: "差異化內容切角清單（含競品缺口），交給 seo-keyword-mapper"
synergy: ["seo-keyword-mapper"]
---

# SEO Angle Finder

```bash
npx skills add https://github.com/peter-tu-zynkr/zynkr-skill-builder --skill seo-angle-finder
```

SEO 流程第三棒，對應流程圖「找線頭」階段的 SEO 加強思考。它從買家問題與已知競品出發，找出 Zynkr 能用「決策優先（decision-first）」差異化的切角——別人都在給答案，Zynkr 點出背後的決策與真實取捨。第一手經驗只是支撐判斷的證據，不是賣點。

---

## Resources you'll use

> **知識來源**：本 skill 用到的 rubric/範本優先從 SEO Knowledge Base 的「01 Rubrics & Templates」(Drive，google-workspace MCP，依名稱 search) 讀取；取不到時 fallback 本地 `./references/`。對照表見 `seo-article-pipeline/seo-pipeline-config.md`。

- **切角評估**：`./references/seo-angle-rubric.md`
- **SEO 知識庫資料夾 ID**：`<your-seo-kb-folder-id>`（種子知識：直播實作經驗、第一手案例）
- **MCP server**：`google-workspace`；競品網址可用 WebFetch 摘要

## Step 1 — 接收問題包與競品

讀取 `SEO_PACKET ▸ Questions`。若使用者提供已知競爭對手網址（文章資料包），用 WebFetch 摘要競品涵蓋了什麼、漏了什麼。

## Step 2 — 找加強切角

依 `./references/seo-angle-rubric.md`：
- 競品缺口（covered vs missing）。
- Zynkr 第一手證據可切入點（直播實作、真實 build、顧問方法論）。
- AEO 切角：哪個問題可以用「答案寫前面」的結構搶 AI 引用。

## Step 3 — 人工驗證提議（HITL）

列出切角，問使用者哪些值得做。對應流程圖「從 SEO 角度發想，驗證提議」「提供已知競爭對手網址，驗證提議」。

## Step 4 — 交棒並存檔

```
SEO_PACKET ▸ Angles
- 切角：<標題> ｜競品缺口：<...> ｜Zynkr 差異化證據：<...> ｜對應問題：<...>
- ...

切角已確認，可交棒給 seo-keyword-mapper 進行關鍵字研究與地圖。
```

## Outputs

差異化切角清單（`SEO_PACKET ▸ Angles`），含競品缺口與第一手證據點。

## Limitations

不產關鍵字地圖、不分類、不寫文章。競品分析以公開頁面為限。
