<!--
CONTRACT — this template is client-facing (zh-TW) and feeds a downstream skill.
Two structural rules:
  1. Scenario ids are traceable: every 測試情境表 row S-n maps to the PRD's AC-n
     (S-1 ↔ AC-1 …). D3 negative/permission rows are numbered S-nN (e.g. S-3N)
     and name their parent AC in the 備註 column. Never renumber after the gate.
  2. The four numbered bullets in 問題回報方式 are EXACTLY the mail shape that
     consult-bug-ticket parses (發生了什麼 / 預期看到什麼 / 操作步驟 / 截圖).
     Do not rename, reorder, or drop any of the four — a UAT round's bug mails
     flow straight into that skill.
Everything the CLIENT reads is zh-TW. Fill every {{PLACEHOLDER}}, then delete
the HTML comments (including this one and the placeholder guide at the bottom).
-->
# [UAT] {{COMPANY}} — 驗收測試指南

- **專案**：{{PROJECT_TITLE}}（規格 {{SPEC_ID}} · 驗收深度 {{DOD}}）
- **文件日期**：{{TODAY}} · **版本**：v0.1（草稿）
- **對應需求文件**：{{PRD_DOC_LINK}}
- **顧問窗口**：Peter Tu（peter_tu@zynkr.ai）

## 一、測試前準備

<!-- Bullets: what the client needs on hand before starting — data/files to
     prepare, who should run it, suggested single-sitting duration. -->

- {{PREP_ITEM_1}}
- {{PREP_ITEM_2}}
- 建議一次完成所有情境（預估 {{EST_MINUTES}} 分鐘），遇到問題先記下、繼續往下測

## 二、環境與帳號

| 項目 | 內容 |
|------|------|
| 系統／助理名稱 | {{ASSISTANT_NAME}} |
| 網址 | {{ASSISTANT_URL}} |
| 測試帳號 | {{TEST_ACCOUNT}}（例：tester@example.com）|
| 密碼／取得方式 | {{CREDENTIAL_NOTES}} |
| 存取說明 | {{ACCESS_NOTES}} |

## 三、測試情境表

請依編號順序執行，每完成一列就勾選 通過 或 失敗：

| 編號 | 目的 | 步驟 | 預期結果 | 通過/失敗 | 備註 |
|------|------|------|----------|-----------|------|
| S-1 | {{S1_GOAL}} | {{S1_STEPS}} | {{S1_EXPECTED}} | ☐ 通過 ☐ 失敗 | 對應 AC-1 |
| S-2 | {{S2_GOAL}} | {{S2_STEPS}} | {{S2_EXPECTED}} | ☐ 通過 ☐ 失敗 | 對應 AC-2 |

<!-- One row per AC, in AC order; steps start from login and use the client's
     own UI wording quoted in 「」 (e.g. 點擊「送出報價」). D3 adds S-nN rows
     (negative/permission cases) directly below their parent S-n row. -->

## 四、問題回報方式

<!-- CONTRACT — the four numbered items below are EXACTLY the mail shape
     consult-bug-ticket parses. Keep names, order, and count byte-stable. -->

測試中遇到任何問題，請寄信到 **peter_tu@zynkr.ai**，主旨註明「{{COMPANY}} UAT 問題」，內文包含以下四項：

1. **發生了什麼**：實際看到的行為或錯誤訊息
2. **預期看到什麼**：您認為正確的結果（可註明對應的情境編號 S-n）
3. **操作步驟**：從登入開始，一步一步如何操作到出現問題
4. **截圖**：問題畫面的截圖（有錯誤訊息請一併入鏡）

一封信回報一個問題，方便逐項追蹤與回覆。

## 五、不在本次驗收範圍

以下項目**不在**本次交付範圍，測試時遇到請不必回報為問題：

- {{OUT_OF_SCOPE_1}}
- {{OUT_OF_SCOPE_2}}

<!-- Mirror the PRD's ## Out of scope lines, rephrased for the client; where the
     PRD names a follow-up home（後續另案處理）carry that phrase through. -->

## 六、簽收欄

全部情境完成後，請填寫下表並回信給顧問窗口：

| 欄位 | 內容 |
|------|------|
| 姓名 | |
| 日期 | |
| 結果 | ☐ 通過 ☐ 有條件通過（請附條件說明）☐ 退回（請附主要問題的情境編號）|
| 備註 | |

---

## 附錄 · 顧問側驗證（內部）

<!-- Internal appendix — NOT part of the client checklist. Any PRD *Verify:*
     line that is builder-only (SQL / curl / CLI) lands here verbatim; its
     client-facing row in 測試情境表 above shows only the observable UI effect. -->

| 對應 AC | 檢查方式（SQL / curl / CLI）| 結果 |
|---------|------------------------------|------|
| AC-{{N}} | {{BUILDER_CHECK}} | ☐ |

<!--
Placeholder guide (fill, then delete this comment block):
  {{COMPANY}}         client company name (as on the CRM deal)
  {{PROJECT_TITLE}}   the PRD's {{TITLE}}, zh-TW where a client name exists
  {{SPEC_ID}}         from the PRD H1, e.g. ACME-001
  {{DOD}}             from the PRD's Size / DoD line, e.g. D2 or D3
  {{TODAY}}           YYYY-MM-DD
  {{PRD_DOC_LINK}}    URL of the [PRD] Doc this guide was derived from
  {{PREP_ITEM_n}}     pre-test prep bullets; {{EST_MINUTES}} total estimate
  {{ASSISTANT_NAME}}/{{ASSISTANT_URL}}  the deployed assistant's name + URL
  {{TEST_ACCOUNT}}    the client's test login (examples always tester@example.com)
  {{CREDENTIAL_NOTES}}/{{ACCESS_NOTES}}  how to get in; VPN/permission notes
  {{Sn_GOAL}}/{{Sn_STEPS}}/{{Sn_EXPECTED}}  one row per AC-n; steps from login
  {{OUT_OF_SCOPE_n}}  from the PRD's ## Out of scope
  {{N}}/{{BUILDER_CHECK}}  appendix rows for builder-only Verify lines (or
                      delete the appendix if every Verify was client-runnable)
-->
