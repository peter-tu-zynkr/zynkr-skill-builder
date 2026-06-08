# Strategy Templates — 陌生開發策略 Phrase Library

Reference library for Step 6 strategy synthesis. Compose by picking one **Industry anchor** + one **Challenge angle** + one **Topic proposal** + optional **Hot Lead nudge**. Aim for 120–180 chars total.

---

## Industry Anchors

| Industry | Anchor phrase |
|---|---|
| 半導體製造 | 半導體製造大廠/封測廠 |
| 製造業 SME | 中小型製造業 / 老牌製造業 |
| 金融業 | 金融業重資安 |
| 保險業 | 保險業 |
| 電信業 | 大型電信 / 國營電信 |
| 電商 | 電商龍頭 / 電商業 |
| 媒體業 | 媒體業 / 數位媒體 |
| 食品業 | 食品業 / 中央廚房調度 |
| 健康醫療 | 健康管理 / 醫美業 / 製藥業 GMP |
| 教育 | 高教 / 私校 / 偏鄉教育 / 文教基金會 |
| 政府 | 政府/國營 |
| NPO | NPO 預算緊 / 長照 NPO |
| BPO/客服 | 客服業天然 AI 場景 |
| 軟體/SaaS | 同業可同盟 / AI-native |
| 建設/裝修 | 建設業 SME / 裝修業 |
| 顧問業 | 顧問業 / 同業 |
| 綠能/能源 | 綠能業 / 太陽能 |
| 物流/郵政 | 物流/國營郵政 |
| 精品零售 | 精品零售 / 奢侈品 |
| 航空業 | 航空業重 PII 合規 |

---

## Challenge → Angle

| J-column challenge | Cold-outbound angle |
|---|---|
| 公司預算或資源不足 | 分階段付費 / 公開班共學群 / 免費 Demo 試水 |
| 缺乏明確的導入策略或規劃方向 | AI 導入路線圖 / leadership briefing / 分階段顧問導入 |
| AI 工具種類繁多，難以判斷適合選用的工具 | tool selection consulting / 推薦清單 / 工具對應表 |
| 資料安全與隱私疑慮 | 本地部署 Llama / 私有雲 LLM / 閉環 Demo / on-prem |
| 員工/同事對 AI 學習或使用的接受度較低 | Change Mgmt 工作坊 / 漸進式內訓 / 小組共學 |
| 目前尚未遇到明顯障礙 | 進階課程 / Agent 工作流 / 進階共學 |
| 多項齊備（≥3 項） | 階段性顧問模式 / 路線圖先行 |

---

## Topic → Concrete Proposal

| K-column topic | Concrete proposal phrase |
|---|---|
| AI 自動化：工作流程與資料自動化 | 工作流程 RAG / 文件自動產製 / 報表自動化 |
| 客製化 AI：打造 LINE Bot／企業知識庫 | LINE Bot 接客 / 內部知識庫 / 客戶服務 Bot |
| AI Agent：可自主執行任務的 AI 流程與工具整合 | 跨工具整合 Agent / 任務自動執行 Agent |
| Vibe Coding：AI 快速打造應用與產品 | 內部工具快速打造 / 韌體加速 / 原型驗證 |
| Prompt 指令設計 | Prompt 模板庫 / 提問框架 / GUIDE 應用 |
| Persona 設定 | 客戶 Persona / 業務 Persona / 員工 Persona |
| AI 內容生成：文案與社群貼文產出 | 文案 Agent / 社群貼文 / Newsletter 自動化 |
| AI 視覺應用：廣告素材與網站生成 | 廣告素材生成 / IG 視覺 / Banner 自動產製 |

---

## Hot Lead Nudges

If `attend_motivation` includes 評估內訓 OR 評估公開班, append one of:

- "Hot Lead — 建議主動聯繫 HR L&D 提案內訓藍圖。"
- "Hot Lead — 雙重意願（內訓 + 公開班），優先排序。"
- "已標記評估內訓 — 可主動發 1-pager 報價。"

---

## Composition Examples

**Example 1 — Manufacturing + 資安單一痛點 + Listed company**
> 半導體製造大廠唯一痛點是資安——主推「本地部署 Llama + PCB 製程文件 RAG Agent」。建議找 HR/IT 雙窗口，從製程工程師工作流入手。

**Example 2 — SME + 多項痛點 + Generic topic**
> 食品業 SME，4 項痛點齊備——主推「客戶下單 LINE Bot + 訂單自動化 Agent」低成本入門。可走階段性顧問模式應對預算疑慮。

**Example 3 — Government + Hot Lead double signal**
> 縣級政府——主推「公文/簡報自動化 + AI 視覺生成」中小型工作坊。高順位 Hot Lead（同時勾「評估內訓 + 公開班」）——建議走文化局或研考會。

**Example 4 — Same company, different individual context**
Same company appearing in 2 rows can have 2 different strategies — always synthesize from THIS row's J/K answers, not a cached strategy for the company.

---

## Special Cases

- **Generic company name (`無`, `個人`, etc.)** → leave 策略 empty. The participant still goes into Hot Lead detection but no outbound strategy is drafted.
- **Unidentified company (搜尋無結果)** → write a short note in 公司背景 like "搜尋無明確結果" and use J/K only in 策略 (e.g. "建議下次活動補確認公司名稱；J 列三項挑戰齊備，先納入電子報 nurture。").
- **Duplicate company across rows** → cache the website + background, but synthesize the strategy fresh per row using THIS row's J/K. Reference earlier row as "同 No.XX [公司名]" when appropriate.
- **Competitor / Same industry as Zynkr** (e.g. WePredict, NSECURED, 程曦) → frame as 同業合作 / 互推 rather than top-down selling.
- **NGO / NPO / Education** → frame as pro-bono, 公益價, 補助申請合作, or strategic partnership rather than commercial BD.
