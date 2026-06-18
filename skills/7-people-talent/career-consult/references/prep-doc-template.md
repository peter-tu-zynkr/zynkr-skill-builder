# Pre-consult prep-doc template

This is the skeleton for the prep Doc. It mirrors the **Career development** tab
(GROW model) of the live template `[1] 履歷、職涯諮詢模板`, plus the four extras
that make it a *prep* doc rather than a blank intake: an opener checklist, the
client's own questions re-grouped under GROW, a consultant-side CV-healthcheck
block, and a suggested agenda.

**How to fill it**
- Populate every GROW question from what the client actually gave you (their
  pre-consult email answers + CV + LinkedIn). Quote their own words where they
  answered.
- Where the client didn't answer, **infer** from the CV and mark it
  `〔推測，需確認〕` so Peter knows what to confirm live versus what's grounded.
  Never fabricate a fact the materials don't support — an honest "未提供，現場確認"
  is more useful than an invented answer.
- Leave **Summary** and the **scoring matrix** blank — those get filled during /
  after the session.
- The opener checklist is the highest-value part: surface the one or two facts
  that swing every downstream answer (for an overseas move, **work
  authorization / visa** is almost always #1) and anything inconsistent in their
  materials (e.g. years-of-experience that differs between email and CV).
- Keep it bilingual the way Peter's docs are — Chinese scaffolding, English where
  the client's domain is English.

The doc legitimately contains the real client's name, email and CV detail — it's
Peter's private working doc in his own Drive, not a published artifact, so there
is no anonymization at runtime. (Anonymization only applies to this skill's own
documentation examples.)

---

```
[N] {{CLIENT_NAME}} 職涯諮詢

日期：{{DATE}}（{{WEEKDAY}}）{{TPE_TIME}} (台北) / {{LOCAL_TIME}} ({{LOCAL_CITY}})
顧問：Peter Tu．協辦：{{CO_HOST}}
諮詢對象：{{CLIENT_NAME}}（{{CLIENT_ALT_NAME}}）
Email：{{CLIENT_EMAIL}}
LinkedIn / Resume：{{CLIENT_LINKEDIN}}
電話：{{CLIENT_PHONE}}
諮詢項目：{{CONSULT_ITEM}}　（職涯諮詢 / 履歷健檢 / 模擬面試）
諮詢主題：{{CONSULT_TOPIC}}
Meet：{{MEET_LINK}}
費用：NT${{FEE}} / 60 分鐘（全程錄影）

═══════════════════════════════════════
⚠️ 開場必確認（影響後面所有建議的關鍵變數）
═══════════════════════════════════════
1. {{OPENER_1}}   ← e.g. 海外工作權／居留身分（EU 工作權？伴侶簽？xx% ruling？需 sponsor？）
2. {{OPENER_2}}   ← e.g. 履歷與來信不一致處（年資、職稱口徑）
3. {{OPENER_3}}   ← e.g. 時間軸：何時希望到職？是否已在投遞？

═══════════════════════════════════════
背景簡介
═══════════════════════════════════════
{{BACKGROUND}}  ← 現職/年資/產業 + 資歷軌跡 + 學歷 + 代表專案，3–6 行濃縮

═══════════════════════════════════════
找到標竿 (Goal)
═══════════════════════════════════════
▸ 你的短期 (1–2 年) 和長期 (3–5 年) 職涯目標是什麼？
  {{GOAL_HORIZON}}
▸ 你對未來的理想工作有什麼具體的期待？（產業、公司規模、職位、薪資、文化等）
  {{GOAL_IDEAL}}
▸ 工作上是否有嚮往的模範？
  {{GOAL_ROLE_MODEL}}
▸ 目前這份工作的哪些方面讓你有成就感？哪些方面讓你感到困擾？
  {{GOAL_SATISFACTION}}

═══════════════════════════════════════
盤點現狀 (Reality)
═══════════════════════════════════════
▸ 目前的職位內容是什麼？主要職責與貢獻？
  {{REALITY_ROLE}}
▸ 盤點天賦：你覺得你的強項是什麼？還有哪些地方需要提升？
  {{REALITY_STRENGTHS}}
▸ 盤點喜好：你對於目前工作喜歡的是什麼？不喜歡什麼？
  {{REALITY_LIKES}}
▸ 盤點價值：你覺得你的價值主張是什麼？
  {{REALITY_VALUE}}
▸ 成長力道：你的職涯成長速度如何？有遇到瓶頸嗎？
  {{REALITY_GROWTH}}
▸ 全方位回饋：你的同事或主管會怎麼形容你？
  {{REALITY_FEEDBACK}}

═══════════════════════════════════════
找到選擇 (Options)
═══════════════════════════════════════
▸ 你覺得你的背景與哪些新興職位有對應關係？有沒有什麼可轉換技能？
  {{OPTIONS_ADJACENT}}
▸ 你是否有興趣轉換產業或職能？如果有，你覺得可行性如何？
  {{OPTIONS_SWITCH}}
▸ 你覺得目前職涯發展的關鍵技能是什麼？你的掌握程度如何？
  {{OPTIONS_KEY_SKILLS}}
▸ 你最近有學習或進修什麼新技能嗎？這些技能如何幫助你的職涯發展？
  {{OPTIONS_UPSKILLING}}
▸ 如果想要升遷或轉職，你認為還需要補足哪些能力？
  {{OPTIONS_GAPS}}
▸ 你有沒有導師或職場前輩可以提供建議？
  {{OPTIONS_MENTORS}}
▸ 你如何評分自己所有的選擇？
  見下方〈評分表格〉。

═══════════════════════════════════════
判斷時間和行動 (Will)
═══════════════════════════════════════
▸ 你有正在主動找工作嗎？目前的求職經驗如何？
  {{WILL_SEARCHING}}
▸ 你是如何準備面試的？是否有遇到挑戰？
  {{WILL_INTERVIEW}}
▸ 你的求職策略是什麼？（投遞履歷、內推、人脈推薦、參加活動等）
  {{WILL_STRATEGY}}
▸ 你在求職過程中遇到的最大困難是什麼？
  {{WILL_OBSTACLE}}

═══════════════════════════════════════
故事 (Story)
═══════════════════════════════════════
▸ 你如何定位自己的職涯轉換故事，讓未來雇主覺得你是合適的候選人？
  {{STORY_POSITIONING}}
▸ 你有沒有思考過如何讓你的個人品牌更符合新職涯方向？
  {{STORY_BRAND}}

═══════════════════════════════════════
總結 (Summary)　※ 現場與諮詢後填寫
═══════════════════════════════════════
▸ 今天諮詢完最重要的三件事？
  1.
  2.
  3.
▸ 你的短期行動計劃是什麼？
▸ 你的中期行動計劃是什麼？
▸ 你的長期行動計劃是什麼？
▸ 你需要哪些資源來幫助你達成目標？
▸ 你如何衡量自己在發展上的進展？

═══════════════════════════════════════
{{CLIENT_NAME}} 來信列出的問題（依 GROW 分組對照）
═══════════════════════════════════════
{{CLIENT_QUESTIONS_GROUPED}}
  ← 把客戶自己列的問題，按〔定位/品牌〕〔市場適配〕〔履歷/補強〕〔路徑/策略〕
     等貼回對應的 GROW 段落，並標上原始題號，方便諮詢時對照。

═══════════════════════════════════════
履歷健檢快速筆記（顧問側，現場展開）
═══════════════════════════════════════
{{CV_HEALTHCHECK}}
  ← 5–8 條：header 是否名實相符、密度、重複指標、在地化、年資一致性、明顯缺口。
     婉轉但具體。只有當諮詢項目含「履歷健檢」或客戶問到履歷時才展開。

═══════════════════════════════════════
建議 60 分鐘節奏
═══════════════════════════════════════
{{AGENDA}}
  ← e.g. 5' 確認簽證/目標 → 15' 定位（最高價值）→ 10' 市場 → 15' 履歷 → 10' 路徑+行動 → 5' 收尾+作業

═══════════════════════════════════════
評分表格（Options 決策矩陣）
═══════════════════════════════════════
List              Option 1        Option 2        Option 3
                 ({{OPT1}})       ({{OPT2}})       ({{OPT3}})
Culture
Management
Compensation
Growth
Work-life balance
Total score
```
