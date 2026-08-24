# Message templates

All output is zh-TW. Every Chat post ends with the footer line — it is the idempotency marker
the next run looks for, so it is not decoration:

```
— zynkr-ops-weekly · W35
```

Keep posts short. Chat scrolls; anything past a screen is not read. The Doc is where length is
allowed to live.

---

## `nudge` — Mon 09:00

Quote last week's decisions **read from the Doc**, so people report against something concrete.

```
本週週報開始徵集，截止 週二 09:00

上週四的決議
· <決議 1> — <owner> · <日期>
· <決議 2> — <owner> · <日期>
· <決議 3> — <owner> · <日期>

請照這個格式回，四行就好：

#週報
上週:
- 事項 — Done / WIP / Blocked
本週:
- 事項
數字: 報名 72 / 訂閱 +18        （沒有就寫 —）
卡關: 需要誰決定什麼            （沒有就寫 無）

— zynkr-ops-weekly · W35
```

Re-post the format **verbatim** every week. The ask has already drifted once; repetition of the
exact shape is what stops a variant from becoming the norm.

---

## `chase` — Tue 09:30

Only when someone is actually missing. Naming nobody teaches people to skip the message.

```
還缺這幾位的週報，補到 週三 12:00 都算數

· <Name A>
· <Name B>

週四議程週三下午就會產出，沒進來的部分不會出現在議程上

— zynkr-ops-weekly · W35
```

Plain text names, not live @-mentions: `send_message` posts text, and reliable programmatic
mentions need an annotation payload the tool does not expose.

---

## `agenda` — Wed 17:00 (pointer only)

The agenda itself lives in the Doc. This post is a pointer.

```
週四議程已產出 → <doc link with #tab and heading anchor>

要決定的三件事
· <決策 1>
· <決策 2>
· <決策 3>

逾期 <n> 項 · 連續 3 週以上未動 <m> 項 · KPI off-target <k> 項
會議只談這些，進度不再逐部門唸

— zynkr-ops-weekly · W35
```

---

## `decisions` — Thu 18:00 (Chat, three lines)

Short by design — next Monday's `nudge` quotes it.

```
今天的決議
· <決議 1> — <owner> · <日期>
· <決議 2> — <owner> · <日期>
· <決議 3> — <owner> · <日期>

完整 recap 已寄出 · 下週骨架已開

— zynkr-ops-weekly · W35
```

---

## `decisions` — Thu 18:00 (recap mail)

Subject: `【營運週報】2026-08-27（W35）— 決議 3 項 · 逾期 2 項`

Recipients: **the owner-chip emails read from the Doc this run** — never a list kept in config.
Someone joins or leaves, the Doc changes, and routing and this list move together.

Body sections, in order:

1. **決議** — decision · owner · date. A decision missing an owner or a date is not a decision;
   list it under 未決 instead of promoting it.
2. **逾期與 carry-over** — items at `↻3週` or more, with how long they have been open.
3. **KPI off-target** — metric · actual · target · the cell it came from.
4. **下週各部門 focus** — one line per department, from the `本週:` lines.
5. **回到這週的 Doc 區塊** — direct link.

Written as an HTML mail via `send_gmail_message`. Plain, legible, no images.

---

## Failure notice — any mode

Posted to the space when an assertion fails. The point is that a broken loop announces itself
in the room where people already are, rather than dying quietly in a log.

```
⚠ <mode> 這週沒有完成：<one-line reason>

<what a human should do about it>

— zynkr-ops-weekly · W35
```

Concrete cases that must produce one:

| Assertion | Notice |
|---|---|
| Recap mail not found in `in:sent` after sending | 寄信失敗，決議只在大廳與 Doc |
| Target Thursday section missing at rollup | 骨架沒開，Apps Script trigger 可能沒裝或沒跑 |
| Next Thursday section missing after `decisions` | 下週骨架沒開 |
| `unmapped_sender` in the sweep | 有人的 Chat id 不在對照表，週報沒被收進來 |
| `unrouted_heading` in the Doc | 有部門標題沒有 owner chip，該段不會被寫入 |
