# Message templates

All output is zh-TW. **Read `wording.md` before composing anything** — these templates set the
voice, and every free-text line the model writes at run time (agenda bullets, failure notices,
the recap mail body) has to match it.

Every Chat post ends with the footer line — it is the idempotency marker the next run looks
for, so it is not decoration and its exact shape is frozen:

```
— zynkr-ops-weekly · W35
```

Keep posts short. Chat scrolls; anything past a screen is not read. The Doc is where length is
allowed to live.

---

## `nudge` — Mon 09:00

Quote last week's decisions **read from the Doc**, so people report against something concrete.

```
這週的週報開始收囉，週二早上 09:00 截止

上週四談定的事
· <決議 1> — <owner>，<日期>
· <決議 2> — <owner>，<日期>
· <決議 3> — <owner>，<日期>

回報照這個格式就好，四行：

#週報
上週:
- 事項 — 完成 / 進行中 / 卡住
本週:
- 事項
數字: 報名 72 / 訂閱 +18        （沒有就寫 —）
卡關: 需要誰決定什麼            （沒有就寫 無）

— zynkr-ops-weekly · W35
```

Re-post the format **verbatim** every week. The ask has already drifted once; repetition of the
exact shape is what stops a variant from becoming the norm.

The status words are Chinese on purpose. `parse_reports.py` accepts both, but the team writes
Chinese, and a template that asks for `Done / WIP / Blocked` is asking them to code-switch for
no reason.

---

## `chase` — Tue 09:30

Only when someone is actually missing. Naming nobody teaches people to skip the message.

```
還缺這幾位的週報，週三中午 12:00 前補都算數

· <Name A>
· <Name B>

議程週三下午就會整理好，沒補到的就不會出現在上面

— zynkr-ops-weekly · W35
```

Plain text names, not live @-mentions: `send_message` posts text, and reliable programmatic
mentions need an annotation payload the tool does not expose.

---

## `agenda` — Wed 17:00 (pointer only)

The agenda itself lives in the Doc. This post is a pointer.

```
週四的議程整理好了 → <doc link with #tab and heading anchor>

這次要決定的三件事
· <決策 1>
· <決策 2>
· <決策 3>

另外：逾期 <n> 件 · 連續三週以上沒動 <m> 件 · KPI 沒達標 <k> 項
會議只談這些，進度不再一個部門一個部門唸

— zynkr-ops-weekly · W35
```

If there are no decisions to make, say so plainly and say why — an agenda that pretends to have
three decisions when the reports carried none is worse than an honest empty line:

```
這次沒有要決定的事：大家都用舊格式回報，沒有「卡關」那行，議程就長不出決策
```

---

## `decisions` — Thu 22:00 (Chat, three lines)

Short by design — next Monday's `nudge` quotes it.

```
今天談定的事
· <決議 1> — <owner>，<日期>
· <決議 2> — <owner>，<日期>
· <決議 3> — <owner>，<日期>

完整版已經寄到大家信箱，下週的區塊也開好了

— zynkr-ops-weekly · W35
```

---

## `decisions` — Thu 22:00 (recap mail)

Subject: `【營運週報】2026-08-27（W35）— 決議 3 件 · 逾期 2 件`

Recipients: **the owner-chip emails read from the Doc this run** — never a list kept in config.
Someone joins or leaves, the Doc changes, and routing and this list move together.

Body sections, in order:

1. **這週談定的事** — 決議 · owner · 日期. A decision missing an owner or a date is not a
   decision; list it under **還沒定案** instead of promoting it.
2. **逾期和一直沒動的** — items at `↻3週` or more, with how long they have been open.
3. **KPI 沒達標** — 指標 · 目前 · 目標 · 數字出處的儲存格.
4. **下週各部門要做的事** — one line per department, from the `本週:` lines.
5. **這週的 Doc 區塊** — direct link.

Written as an HTML mail via `send_gmail_message`. Plain, legible, no images.

---

## Failure notice — any mode

Posted to the space when an assertion fails. The point is that a broken loop announces itself
in the room where people already are, rather than dying quietly in a log.

Name the beat in Chinese — `nudge` / `rollup` / `agenda` are internal names and mean nothing to
the people reading:

| mode | 說法 |
|---|---|
| `nudge` | 週報提醒 |
| `rollup` | 週報彙整 |
| `chase` | 補件提醒 |
| `agenda` | 週四議程 |
| `decisions` | 會後回貼 |

```
⚠ 這週的<說法>沒跑完：<一句話講原因>

<需要誰做什麼>

— zynkr-ops-weekly · W35
```

Concrete cases that must produce one:

| Assertion | Notice |
|---|---|
| Recap mail not found in `in:sent` after sending | 信沒寄出去，決議目前只在大廳和 Doc 裡 |
| Target Thursday section missing at rollup | 下週的區塊沒開，Apps Script 的排程可能沒裝或沒跑到 |
