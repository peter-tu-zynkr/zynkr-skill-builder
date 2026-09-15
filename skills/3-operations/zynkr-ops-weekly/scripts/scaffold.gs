/**
 * Zynkr — 營運每週彙報 週次骨架自動複製
 * Doc: [3.1] 營運每週彙報 Operation weekly
 * Tab: 每週事項 2026 (t.0)
 *
 * WHAT IT DOES
 *   Thursday 23:00, in one trigger, two steps in this order:
 *     1. scaffoldNextWeek()  — duplicates the newest weekly section and re-stamps
 *        it with the NEXT Thursday's date, inserting it above the current newest.
 *     2. archiveOldWeeks()   — MOVES every dated section past the newest
 *        KEEP_SECTIONS out of the live tab and into the archive tab.
 *   The entry point is weeklyMaintenance(); that is what the trigger calls.
 *
 * WHY ONE TRIGGER AND NOT TWO
 *   Apps Script fires within an HOUR window, not on the minute. Two triggers an
 *   hour apart can therefore run out of order or overlap. Chaining the two calls
 *   inside one function makes the order a fact rather than a hope. If the
 *   scaffold THROWS its post-condition, the throw propagates and the archive is
 *   skipped — never prune a document whose last write is in doubt.
 *
 * WHY DUPLICATE INSTEAD OF BUILDING A FRESH SPINE
 *   Each department heading carries an OWNER as a Google Docs person chip
 *   (e.g. #Demand Marketing → Sam Rivera <owner-a@example.com>). Neither Apps Script
 *   nor the Docs REST API can CREATE a person chip — so the only way to keep
 *   the owner map alive is to never destroy it. Duplication preserves it.
 *   Stripping finished items / marking carried-over ones is the Tuesday
 *   rollup's job, where judgement belongs — not this script's.
 *
 * SAFETY
 *   - Idempotent: the scaffold exits if the target date section already exists;
 *     the archive exits if the live tab is already at or under KEEP_SECTIONS.
 *   - The scaffold is insert-only. The archive is the ONLY part of this system
 *     that removes anything, and it only ever MOVES — it copies into the archive
 *     tab, asserts the copy landed, and only then removes the original.
 *   - Set DRY_RUN = true to log what both steps would do without touching the doc.
 *
 * ⚠️ SETUP — pasting this file is NOT enough. You must:
 *   1. Set DOC_ID to a DUPLICATE of the doc and run weeklyMaintenance() once.
 *   2. Open the duplicate and confirm the owner chips survived the copy, and that
 *      the archived sections arrived intact and in newest-first order.
 *      If chips came through as plain text, see NOTE_ON_CHIPS below.
 *   3. Only then point DOC_ID at the real doc and run installTriggers() ONCE.
 *      Without running installTriggers() nothing is ever scheduled.
 */

const DOC_ID  = 'PUT_A_DUPLICATE_DOC_ID_HERE_FIRST';
const TAB_ID  = 't.0';              // 每週事項 2026 — the LIVE tab
const DRY_RUN = true;               // flip to false once verified

/* ── ARCHIVE ────────────────────────────────────────────────────────────────
 * The live tab keeps only the newest KEEP_SECTIONS dated sections. Everything
 * older is MOVED into the archive tab, which must already exist.
 *
 * KEEP_SECTIONS counts sections AFTER the scaffold has added next Thursday, so
 * 3 leaves: next Thursday (the empty skeleton Tuesday's rollup writes into),
 * the week that just closed, and the one before it. Monday's `nudge` reads last
 * week's decisions out of the second of those, so 3 is the floor — below that
 * the nudge has nothing to quote.
 *
 * ⚠️ THE ARCHIVE TAB MUST LIVE IN THIS SAME DOCUMENT, DIRECTLY AFTER THE LIVE TAB.
 * Not a separate file. `carryover.py` produces the ↻N週 streaks by walking back
 * through EVERY dated section in document order, and it reads the Doc through
 * get_doc_as_markdown, which returns all tabs concatenated in tab order. Keep the
 * archive in a sibling tab and that walk-back is untouched (it already spans the
 * 2026 and 2025 tabs today). Move the sections to another document instead and
 * every streak silently resets to <= KEEP_SECTIONS, which quietly destroys the
 * one signal the Wednesday agenda is built on.
 *
 * Order matters for the same reason: the walk-back assumes newest-first, so the
 * archive tab sits immediately after the live tab and its sections stay
 * newest-first. Archiving prepends, as one contiguous block, to preserve that. */
const ARCHIVE_TAB_TITLE = '每週事項 封存';   // resolved by TITLE, not id — see getTabBodyByTitle_()
const KEEP_SECTIONS     = 3;

/* How many sections one run may archive. Steady state is ONE a week, so this only bites when
 * working off a backlog — which is exactly when it matters. Apps Script kills a run at 6
 * minutes and DocumentApp moves elements one at a time: the 2026-09-15 attempt spent 4m08s
 * copying 4,465 elements and had not begun removing them. A cap turns "one enormous run that
 * may die halfway" into "a bounded unit of work you can repeat until the log says the backlog
 * is clear". Raise it only if you have measured the runtime on a duplicate. */
const MAX_SECTIONS_PER_RUN = 4;

/* WHEN IT RUNS — the trigger fires in TZ, regardless of the script project's own
 * timezone. Note the Apps Script Triggers panel DISPLAYS times in the PROJECT's
 * timezone (File > Project Settings), so if that is not TZ the row shows a
 * different clock than the trigger actually uses. Set the project timezone to
 * match TZ and the two agree.
 * Apps Script schedules within the HOUR, not on the minute: hour 23 means the run
 * lands somewhere in 23:00-24:00. Anything that must happen AFTER the scaffold has
 * to allow for that whole window. */
const TRIGGER_DAY  = 'THURSDAY';    // ScriptApp.WeekDay key
const TRIGGER_HOUR = 23;            // 23 => fires in the 23:00-24:00 window
const TZ           = 'Asia/Taipei';

/* The skill half's auto-summary block: a 〔自動彙整 …〕 stamp line followed by `·` lines.
 * Matched by PREFIX only, never by week, so this keeps working across the 2026-09-15 label
 * change from `2026-W38` to `WB 9/14`. These two strings are frozen on the skill side too --
 * see references/wording.md. `·` is U+00B7, which the team never types by hand; their bullets
 * are real Docs list items, and those are LIST_ITEMs, not paragraphs. */
const AUTO_STAMP_PREFIX = '〔自動彙整';
const AUTO_BULLET       = '·';

/** Matches the weekly date headings, e.g. "Aug 27, 2026" */
const DATE_RE = /^([A-Z][a-z]{2})\s+(\d{1,2}),\s*(\d{4})$/;
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun',
                 'Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * THE TRIGGER ENTRY POINT. Open next week, then prune what fell off the back.
 *
 * Order is load-bearing and deliberate: scaffold first, archive second. Archiving
 * first would count the sections before next Thursday exists and prune one week too
 * many. A throw from the scaffold propagates and skips the archive by design.
 */
function weeklyMaintenance() {
  // The scaffold infers the section range from the gap between the two newest headings,
  // so it needs >= 2 sections to survive. Archiving down to 1 would brick it next week.
  if (KEEP_SECTIONS < 2) {
    throw new Error('KEEP_SECTIONS must be >= 2 (the scaffold needs two dated sections to ' +
                    'infer where a section ends). Got ' + KEEP_SECTIONS + '.');
  }
  const label = scaffoldNextWeek();
  const moved = archiveOldWeeks();
  Logger.log('weeklyMaintenance done — section "' + label + '" open, ' +
             moved + ' section(s) archived.');
  return { scaffolded: label, archived: moved };
}

function scaffoldNextWeek() {
  const body = getTabBody_(DOC_ID, TAB_ID);

  // 1. Locate every weekly date heading (they run newest-first).
  const marks = dateMarks_(body);
  if (marks.length < 2) throw new Error('Need >= 2 dated sections to infer the section range. Found ' + marks.length);
  const before = marks.length;

  // 2. The newest section spans [marks[0], marks[1]).
  const from = marks[0].index;
  const to   = marks[1].index;

  // 3. Next Thursday after the newest section's date.
  const next  = addDays_(marks[0].date, 7);
  const label = MONTHS[next.getMonth()] + ' ' + next.getDate() + ', ' + next.getFullYear();

  // 4. Idempotency guard — never double-insert.
  if (marks.some(function (mk) { return mk.text === label; })) {
    Logger.log('Section "' + label + '" already exists — nothing to do.');
    return label;
  }

  Logger.log('Duplicating "' + marks[0].text + '" (elements ' + from + '..' + (to - 1) +
             ', ' + (to - from) + ' elements) as "' + label + '"');

  // 5. SNAPSHOT the source elements BEFORE writing anything.
  //     Every insert shifts the index of everything after it. Reading and writing in
  //     the same loop therefore re-reads the SAME element each pass (i advances at the
  //     same rate the insert pushes it forward) and duplicates it. Observed live: it
  //     produced ~100 copies of the date heading instead of the section. Read first.
  //     While snapshotting, DROP last week's 〔自動彙整〕 blocks. Without this the archive
  //     bounds the number of sections but not their size: the new section is a copy of a copy,
  //     so it inherits EVERY auto-block ever written. Measured 2026-09-15 — Aug 27 carried 1
  //     week of blocks, Sep 3 carried 2, Sep 10 carried 3, Sep 17 carried 4, and the newest
  //     section had 22 blocks of which 4 were its own. A week's summary belongs to the week
  //     that was summarised; Tuesday's rollup writes the new one from scratch.
  const copies = [];
  let dropped = 0, inAutoBlock = false;
  for (let i = from; i < to; i++) {
    const el = body.getChild(i);
    if (el.getType() === DocumentApp.ElementType.PARAGRAPH) {
      const t = el.asParagraph().getText().trim();
      if (t.indexOf(AUTO_STAMP_PREFIX) === 0) { inAutoBlock = true; dropped++; continue; }
      // A block is its stamp line plus the `·` lines under it, blanks included. Any other
      // paragraph ends it -- and so does a list item or table, handled by the branch above.
      if (inAutoBlock && (t === '' || t.indexOf(AUTO_BULLET) === 0)) { dropped++; continue; }
    }
    inAutoBlock = false;
    copies.push(el.copy());
  }
  Logger.log('Dropped ' + dropped + ' line(s) of previous 〔自動彙整〕 blocks from the copy; ' +
             'carrying ' + copies.length + ' element(s) forward.');

  // The DRY_RUN gate sits HERE, after the snapshot, not before it. Snapshotting only calls
  // copy(), which builds detached elements and touches nothing in the document -- so running
  // it during a dry run is free, and it is the only way the rehearsal can report how many
  // 〔自動彙整〕 lines would actually be dropped. Gating earlier made the dry run silent on
  // the one number worth checking before a real run.
  if (DRY_RUN) { Logger.log('DRY_RUN — no changes written.'); return label; }

  // 6. Insert the snapshot above the newest section, preserving order.
  let cursor = from;
  for (let j = 0; j < copies.length; j++) {
    const copy = copies[j];
    switch (copy.getType()) {
      case DocumentApp.ElementType.PARAGRAPH:
        body.insertParagraph(cursor++, copy.asParagraph()); break;
      case DocumentApp.ElementType.LIST_ITEM:
        body.insertListItem(cursor++, copy.asListItem()); break;
      case DocumentApp.ElementType.TABLE:
        body.insertTable(cursor++, copy.asTable()); break;
      default:
        Logger.log('Skipped unsupported element type: ' + copy.getType());
    }
  }

  // 7. Re-stamp the copied date heading (it is the first element we inserted).
  body.getChild(from).asParagraph().setText(label);

  // 8. Post-condition: exactly ONE new dated heading should exist. This is the guard
  //    that would have caught the shift bug on its first run instead of by eye.
  const after = countDateHeadings_(body);
  if (after !== before + 1) {
    throw new Error('Aborting: expected ' + (before + 1) + ' dated sections after insert, found ' +
                    after + '. The document was modified — undo it (Ctrl/Cmd-Z in the doc, or ' +
                    'File > Version history) before re-running.');
  }
  Logger.log('Inserted section "' + label + '". Dated sections: ' + before + ' -> ' + after + '.');
  return label;
}

/** Count top-level dated HEADING2 paragraphs — used as an insert post-condition. */
function countDateHeadings_(body) {
  let n = 0;
  for (let i = 0; i < body.getNumChildren(); i++) {
    const el = body.getChild(i);
    if (el.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    const p = el.asParagraph();
    if (p.getHeading() !== DocumentApp.ParagraphHeading.HEADING2) continue;
    if (DATE_RE.test(p.getText().trim())) n++;
  }
  return n;
}

/**
 * Move every dated section past the newest KEEP_SECTIONS into the archive tab.
 *
 * MOVE, not delete: copy into the archive, assert the copy landed, then remove the
 * originals. If anything throws between those steps the content exists twice, which
 * is recoverable by hand; the reverse order would lose a week permanently.
 *
 * ASSUMPTION, asserted below: dated sections run to the END of the live tab, so
 * "everything from the cut mark onwards" is exactly the sections being retired.
 * Anything parked at the bottom of the tab BELOW the oldest section would be swept
 * along with it — the live tab is not a place to keep standing notes. Put those
 * above the newest dated heading, where the cut never reaches.
 */
function archiveOldWeeks() {
  const live  = getTabBody_(DOC_ID, TAB_ID);
  const marks = dateMarks_(live);

  if (marks.length <= KEEP_SECTIONS) {
    Logger.log('Archive: ' + marks.length + ' dated section(s) in the live tab, keeping ' +
               KEEP_SECTIONS + ' — nothing to archive.');
    return 0;
  }

  const arch = getTabBodyByTitle_(DOC_ID, ARCHIVE_TAB_TITLE);
  const archBefore = countDateHeadings_(arch);
  const liveBefore = marks.length;

  // Take the OLDEST `batch` sections — the tail of the tab — not the whole backlog at once.
  //
  // Steady state is one section a week, so the cap only ever bites on a backlog. It exists
  // because Apps Script kills a run at 6 minutes and the move is element-by-element: the live
  // 2026-09-15 attempt spent 4m08s copying 4,465 elements and had not started removing them.
  // Capping makes every run a bounded, repeatable unit of work — run it again for the next
  // batch. Working from the BOTTOM upward is what keeps the archive newest-first: each batch
  // is older than the last, and each is prepended above the previous one.
  const backlog = liveBefore - KEEP_SECTIONS;
  const moving  = Math.min(backlog, MAX_SECTIONS_PER_RUN);
  const cut     = marks[liveBefore - moving].index;
  const last    = live.getNumChildren() - 1;
  const oldest  = marks[marks.length - 1].text;

  // The counts below are of HEADING2 dated sections, because that is what this script can
  // identify. The MOVE is by element range and runs to the END of the tab, so anything below
  // the oldest HEADING2 section travels with it -- on the real Doc that is 11 older sections
  // whose headings are not styled HEADING2 and so are never counted here. That is correct
  // (they are older than everything being retired) but the element count is the honest number.
  Logger.log('Archive: ' + liveBefore + ' dated HEADING2 sections, keeping ' + KEEP_SECTIONS +
             ' (' + marks.slice(0, KEEP_SECTIONS).map(function (m) { return m.text; }).join(', ') +
             '), backlog ' + backlog + ', moving the oldest ' + moving + ' (' +
             marks[liveBefore - moving].text + ' .. ' + oldest +
             ') AND everything below them to the end of the tab = elements ' + cut + '..' + last +
             ' (' + (last - cut + 1) + ' elements) -> "' + ARCHIVE_TAB_TITLE + '"' +
             (backlog > moving ? '   [' + (backlog - moving) + ' section(s) left after this run — ' +
                                 'run weeklyMaintenance again to continue]' : ''));
  if (DRY_RUN) { Logger.log('DRY_RUN — no changes written.'); return 0; }

  // 1. SNAPSHOT before writing anything — same index-shift trap as the scaffold.
  const copies = [];
  for (let i = cut; i <= last; i++) copies.push(live.getChild(i).copy());

  // 2. PREPEND to the archive as one contiguous block, so the archive stays newest-first
  //    and the concatenated live+archive sequence stays monotonically descending.
  let cursor = 0;
  for (let j = 0; j < copies.length; j++) {
    const copy = copies[j];
    switch (copy.getType()) {
      case DocumentApp.ElementType.PARAGRAPH:
        arch.insertParagraph(cursor++, copy.asParagraph()); break;
      case DocumentApp.ElementType.LIST_ITEM:
        arch.insertListItem(cursor++, copy.asListItem()); break;
      case DocumentApp.ElementType.TABLE:
        arch.insertTable(cursor++, copy.asTable()); break;
      default:
        Logger.log('Skipped unsupported element type: ' + copy.getType());
    }
  }

  // 3. Assert the copy LANDED before removing anything. This is the whole safety story.
  const archAfter = countDateHeadings_(arch);
  if (archAfter !== archBefore + moving) {
    throw new Error('Aborting BEFORE removal: archive should hold ' + (archBefore + moving) +
                    ' dated sections, found ' + archAfter + '. Nothing was deleted from the ' +
                    'live tab — remove the partial copy from "' + ARCHIVE_TAB_TITLE + '" by hand.');
  }

  // 4. Only now remove the originals — BACKWARDS, so each removal only shifts what is done.
  //
  //     ⚠️ A Body must always END with a paragraph. `last` IS the body's final element, so
  //     removing it first throws "Can't remove the last paragraph in a document section" and
  //     the prune dies before it starts. Observed live 2026-09-15, after the copy had already
  //     landed — which left the rehearsal doc holding both halves.
  //     So append a throwaway paragraph first: it becomes the body's final element, every
  //     removal below is then legal, and the tab is left ending in one empty paragraph,
  //     exactly as a tab whose last section was cut by hand would be.
  live.appendParagraph('');
  for (let i = last; i >= cut; i--) live.removeChild(live.getChild(i));

  // 5. Post-conditions on both tabs. A partial prune is worse than a failed one.
  //     Note the expected count is liveBefore - moving, NOT KEEP_SECTIONS: while a backlog is
  //     being worked off a run legitimately ends above the target and the next run continues.
  const liveAfter = countDateHeadings_(live);
  if (liveAfter !== liveBefore - moving) {
    throw new Error('Live tab should hold ' + (liveBefore - moving) + ' dated sections after ' +
                    'archiving ' + moving + ', found ' + liveAfter + '. The document was ' +
                    'modified — restore via File > Version history before re-running.');
  }
  if (liveAfter + archAfter !== liveBefore + archBefore) {
    throw new Error('Section count changed across the move: ' + (liveBefore + archBefore) +
                    ' -> ' + (liveAfter + archAfter) + '. Restore via File > Version history.');
  }

  const left = liveAfter - KEEP_SECTIONS;
  Logger.log('Archived ' + moving + ' section(s). Live: ' + liveBefore + ' -> ' + liveAfter +
             '. Archive: ' + archBefore + ' -> ' + archAfter + '.' +
             (left > 0 ? '  ' + left + ' still to go — run weeklyMaintenance again.' : '  Backlog clear.'));
  return moving;
}

/** Every dated HEADING2 in a body, in document order (newest first, as the Doc stores them). */
function dateMarks_(body) {
  const marks = [];
  for (let i = 0; i < body.getNumChildren(); i++) {
    const el = body.getChild(i);
    if (el.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    const p = el.asParagraph();
    if (p.getHeading() !== DocumentApp.ParagraphHeading.HEADING2) continue;
    const m = DATE_RE.exec(p.getText().trim());
    if (m) marks.push({ index: i, text: p.getText().trim(), date: parseDate_(m) });
  }
  return marks;
}

/** Resolve a tab's body — a tabbed doc's top-level getBody() is NOT the tab. */
function getTabBody_(docId, tabId) {
  const doc  = DocumentApp.openById(docId);
  const tabs = doc.getTabs();
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].getId() === tabId) return tabs[i].asDocumentTab().getBody();
  }
  throw new Error('Tab ' + tabId + ' not found. Available: ' +
                  tabs.map(function (t) { return t.getId() + ' (' + t.getTitle() + ')'; }).join(', '));
}

/**
 * Resolve the archive tab by TITLE, and fail loud if it is missing.
 *
 * By title rather than id because the tab is created by hand during install and its
 * id is not knowable until then — and a wrong hardcoded id would archive into another
 * document's tab, which is the one mistake with no undo. Neither DocumentApp nor the
 * Docs REST API can CREATE a tab, so this never auto-creates: a missing archive tab is
 * a setup error, and the run stops rather than inventing somewhere to put a year of work.
 */
function getTabBodyByTitle_(docId, title) {
  const doc  = DocumentApp.openById(docId);
  const tabs = doc.getTabs();
  const hits = tabs.filter(function (t) { return t.getTitle().trim() === title; });
  if (hits.length === 0) {
    throw new Error('Archive tab "' + title + '" not found — create it by hand, directly ' +
                    'AFTER the live tab, then re-run. Available: ' +
                    tabs.map(function (t) { return t.getTitle(); }).join(', '));
  }
  if (hits.length > 1) {
    throw new Error('Found ' + hits.length + ' tabs titled "' + title + '". Rename the ' +
                    'duplicates — archiving into an ambiguous target is not safe.');
  }
  if (hits[0].getId() === TAB_ID) {
    throw new Error('Archive tab resolves to the LIVE tab (' + TAB_ID + '). Check ' +
                    'ARCHIVE_TAB_TITLE — archiving a tab into itself would delete it.');
  }
  return hits[0].asDocumentTab().getBody();
}

function parseDate_(m) {
  return new Date(Number(m[3]), MONTHS.indexOf(m[1]), Number(m[2]));
}

function addDays_(d, n) {
  const c = new Date(d.getTime());
  c.setDate(c.getDate() + n);
  return c;
}

/**
 * Run ONCE, by hand, after verifying on a duplicate.
 * Fires Thursday evening — right after the ops meeting, so the week closes
 * and the next one opens in the same beat, and Tuesday's rollup always has
 * a section waiting for it.
 */
function installTriggers() {
  // Delete BOTH handler names. Installs made before the archive existed are scheduled on
  // `scaffoldNextWeek` directly; leaving that trigger in place would open next week twice
  // over — once with archiving and once without — and only one of them would prune.
  const OWNED = ['weeklyMaintenance', 'scaffoldNextWeek'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (OWNED.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('weeklyMaintenance')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay[TRIGGER_DAY])
    .atHour(TRIGGER_HOUR)
    .inTimezone(TZ)
    .create();
  Logger.log('Trigger installed: weeklyMaintenance (scaffold + archive), ' + TRIGGER_DAY + 's ' +
             TRIGGER_HOUR + ':00-' + (TRIGGER_HOUR + 1) + ':00 ' + TZ +
             '. (The Triggers panel shows this in the PROJECT timezone — set the ' +
             'project timezone to ' + TZ + ' if the row disagrees.)');
}

/*
 * NOTE_ON_CHIPS
 * If step 2 shows owners arriving as plain text instead of person chips,
 * DocumentApp dropped them. Fallback: after the copy, re-apply each owner as a
 * plain mailto hyperlink —
 *   para.editAsText().setLinkUrl(start, end, 'mailto:owner-a@example.com');
 * It loses the chip pill visually but stays machine-readable, so the Tuesday
 * rollup can still route by owner email exactly as before.
 */
