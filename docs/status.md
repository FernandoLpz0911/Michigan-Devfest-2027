# Status (Nov 13, 12:05 ET)

## Working
- All routes run on real modules. Lot timeline and Ask your records still return canned answers.
- Real IBM Granite (granite-4-h-small) runs jobs 1 to 4 on the demo files with no retries or fallbacks.
  - Job 1 (columns) about 6 s, job 2 (merges) about 1 s per column, job 3 (read message) 0.5 s, job 4 (reply) 2.5 s.
- Shift 1 asks 3 questions (Ref unsure, two time columns, Press 3 merge). Shifts 2 and 3 are recognized.
- Lot 4417: 8 lots worth checking out of 140 that week.

## Done since
- Card T: lot timeline strip on Find a record (real data, matches the canned example for lot 4417).
- Card M: animated switch on See the file and All records; shop-floor mode toggle (g100, 20 px text).
  - Colour pairs checked by hand: all at least 6.4:1. Not yet checked by eye in a real browser.

## Live demo (cards L1 to L4, done 14:00 ET)
- Before each run: `scripts/demo.sh` (real Granite) or `scripts/demo.sh --mock` (no network). It empties `data/`. Then open a NEW browser tab, because a reload restores the last screen in that tab.
- A reload on Check keeps the questions (stored in the browser tab).
- "Which one is ..." questions now offer None of these. The contract line for duplicate choices still says positions only; it needs the lead's update.
- Machine-style columns (durations, speeds, counters, Unix times) are asked about, not matched quietly.
- `fixtures/piade_machine_sample.csv` is for judges' questions: 300 unmodified PIADE rows. Answer None of these for the lot; all 300 rows are held. With real Granite it asks 8 questions, with the mock 2.
- Dry run (mock, API level): Shift 1 asks 3 and saves 82 entries; Shifts 2 and 3 are recognized; the buyer message finds lot 4417; the PIADE sample holds 300 of 300.

## Known gaps
- PIADE times like `2020-01-01 11:21:28.907000+00:00` are read as text, so the time column becomes a type-conflict question.
- Check screen after a page reload shows "Nothing to check" (questions are kept in the browser only).
- File steps are not live during an upload; the upload is one request.

## Cut
- Card G3 (Ask your records): deadline is today.
