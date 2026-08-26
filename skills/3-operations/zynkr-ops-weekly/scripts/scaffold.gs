/**
 * Zynkr — 營運每週彙報 週次骨架自動複製
 * Doc: [3.1] 營運每週彙報 Operation weekly
 * Tab: 每週事項 2026 (t.0)
 *
 * WHAT IT DOES
 *   Duplicates the newest weekly section verbatim and re-stamps it with the
 *   NEXT Thursday's date, inserting it above the current newest section.
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
 *   - Idempotent: exits if the target date section already exists.
 *   - Insert-only: never deletes or rewrites existing content.
 *   - Set DRY_RUN = true to log what it would do without touching the doc.
 *
 * ⚠️ SETUP — pasting this file is NOT enough. You must:
 *   1. Set DOC_ID to a DUPLICATE of the doc and run scaffoldNextWeek() once.
 *   2. Open the duplicate and confirm the owner chips survived the copy.
 *      If they came through as plain text, see NOTE_ON_CHIPS below.
 *   3. Only then point DOC_ID at the real doc and run installTriggers() ONCE.
 *      Without running installTriggers() nothing is ever scheduled.
 */

const DOC_ID  = 'PUT_A_DUPLICATE_DOC_ID_HERE_FIRST';
const TAB_ID  = 't.0';              // 每週事項 2026
const DRY_RUN = true;               // flip to false once verified

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

/** Matches the weekly date headings, e.g. "Aug 27, 2026" */
const DATE_RE = /^([A-Z][a-z]{2})\s+(\d{1,2}),\s*(\d{4})$/;
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun',
                 'Jul','Aug','Sep','Oct','Nov','Dec'];

function scaffoldNextWeek() {
  const body = getTabBody_(DOC_ID, TAB_ID);

  // 1. Locate every weekly date heading (they run newest-first).
  const marks = [];
  for (let i = 0; i < body.getNumChildren(); i++) {
    const el = body.getChild(i);
    if (el.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    const p = el.asParagraph();
    if (p.getHeading() !== DocumentApp.ParagraphHeading.HEADING2) continue;
    const m = DATE_RE.exec(p.getText().trim());
    if (m) marks.push({ index: i, text: p.getText().trim(), date: parseDate_(m) });
  }
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
  if (DRY_RUN) { Logger.log('DRY_RUN — no changes written.'); return label; }

  // 5. SNAPSHOT the source elements BEFORE writing anything.
  //     Every insert shifts the index of everything after it. Reading and writing in
  //     the same loop therefore re-reads the SAME element each pass (i advances at the
  //     same rate the insert pushes it forward) and duplicates it. Observed live: it
  //     produced ~100 copies of the date heading instead of the section. Read first.
  const copies = [];
  for (let i = from; i < to; i++) copies.push(body.getChild(i).copy());

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
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'scaffoldNextWeek') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('scaffoldNextWeek')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay[TRIGGER_DAY])
    .atHour(TRIGGER_HOUR)
    .inTimezone(TZ)
    .create();
  Logger.log('Trigger installed: scaffoldNextWeek, ' + TRIGGER_DAY + 's ' +
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
