# Status (Nov 13, 12:05 ET)

## Working
- All routes run on real modules. Lot timeline and Ask your records still return canned answers.
- Real IBM Granite (granite-4-h-small) runs jobs 1 to 4 on the demo files with no retries or fallbacks.
  - Job 1 (columns) about 6 s, job 2 (merges) about 1 s per column, job 3 (read message) 0.5 s, job 4 (reply) 2.5 s.
- Shift 1 asks 3 questions (Ref unsure, two time columns, Press 3 merge). Shifts 2 and 3 are recognized.
- Lot 4417: 8 lots worth checking out of 140 that week.

## In progress
- Card T: lot timeline (backend and strip).
- Card M: animated switch and shop-floor mode.

## Known gaps
- Check screen after a page reload shows "Nothing to check" (questions are kept in the browser only).
- File steps are not live during an upload; the upload is one request.

## Cut
- Card G3 (Ask your records): deadline is today.
