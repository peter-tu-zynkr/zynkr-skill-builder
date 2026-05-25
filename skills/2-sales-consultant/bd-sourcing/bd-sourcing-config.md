# BD Sourcing — Runtime Config

Edit the values below for your environment. Placeholders in `<angle-brackets>` will be substituted at skill runtime; leave them as-is and the skill will prompt you when needed.

---

## Google Workspace

```yaml
user_google_email: <your-google-workspace-account>
spreadsheet_id: <your-pipeline-sheet-id>
sheet_tab: <your-sheet-tab-name>   # leave blank to use the first tab
```

If `spreadsheet_id` is `TBD` or blank at runtime, the skill will prompt you to paste a Sheet URL/ID before continuing.

---

## Header Auto-Detection Hints

Fuzzy-match keywords. The skill picks the column whose header contains any of these substrings (case-insensitive). Override per-survey if your sheet uses non-standard labels.

```yaml
header_hints:
  company:
    - "公司"
    - "公司名稱"
    - "服務單位"
    - "服務公司"
    - "單位"
    - "company"
    - "organization"

  challenges:
    - "挑戰"
    - "障礙"
    - "痛點"
    - "困難"
    - "challenge"
    - "difficulty"
    - "obstacle"

  topics:
    - "議題"
    - "感興趣"
    - "想學"
    - "topic"
    - "interest"
    - "subject"

  attend_motivation:
    - "原因"
    - "為什麼參加"
    - "吸引"
    - "目的"
    - "motivation"
    - "reason"

  participant_name:
    - "姓名"
    - "name"
    - "學員"
```

---

## Hot Lead Signal Phrases

If the participant's `attend_motivation` cell contains any of these phrases, the Hot Lead flag fires `Y`. These get joined with `|` and dropped into a `REGEXMATCH` ARRAYFORMULA, so use them as literal text (no regex metacharacters needed unless intentional).

```yaml
hot_lead_signals:
  - "評估是否適合在公司內部安排類似課程"
  - "評估未來參加公開班課程的可能性"
```

---

## Generic Company-Name Skip List

If the company cell (trimmed, lowercased) exactly matches any of these, the row is classified as `generic` — its company is not researched, but it still receives the Hot Lead / 平均分數 formulas. Add new patterns as you encounter them.

```yaml
generic_patterns:
  - "無"
  - "NA"
  - "na"
  - "n/a"
  - "-"
  - "—"
  - "個人"
  - "個人身分"
  - "自由業"
  - "SOHO族"
  - "待業中"
  - "幼兒園"
  - "不便"
  - "不便提供"
  - "不便透露"
  - "暫無"
  - "no"
  - "Johnny"
  - ""
```

Rows where the company cell is **purely numeric** (e.g. `70`) are also auto-classified as `generic` regardless of this list.

---

## Optional Add-On Columns

```yaml
add_satisfaction_columns: true
# When true, the skill also writes:
#   有普通?     — Y if any Likert column for this row equals "普通"
#   平均分數    — 1–5 average across Likert columns (ignores blanks/non-Likert)

satisfaction_score_columns: []
# Which columns hold 1–5 Likert satisfaction ratings.
# Leave blank to auto-detect by scanning row 2 for tokens:
#   非常滿意 / 滿意 / 普通 / 不滿意 / 非常不滿意
# Otherwise specify as a contiguous block of column letters, e.g. [D, E, F, G, H]
```

---

## Directory-Domain Reject List

Used in Step 5 to filter out useless WebSearch hits. Extend as you find more.

```yaml
reject_domains:
  - "twincn.com"
  - "iyp.com.tw"
  - "alphaloan.co"
  - "findcompany.com.tw"
  - "1111.com.tw"
  - "104.com.tw"
  - "518.com.tw"
  - "taiwantrade.com"
  - "dnb.com"
  - "companys.com.tw"
  - "twfile.com"
  - "business.com.tw"
  - "aibee.com.tw"
  - "costring.com"
  - "datagove.com"
  - "data.zhupiter.com"
  - "info.technews.tw"
  - "alltwcompany.com"
```

---

## Defaults Notes

- **Parallel batch size** for WebSearch enrichment: **8** (Step 5). Reduce to 4 if you hit rate limits.
- **Write-back chunk size**: **55 rows** per modify call (Step 7). Halve automatically on payload error.
- **WebSearch policy**: one attempt per company; on failure, log to `UNKNOWNS[]` and move on. Don't retry.
