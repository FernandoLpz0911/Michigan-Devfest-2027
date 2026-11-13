# Live demo (about 3 minutes)

Before each run: `scripts/demo.sh` (real Granite) or `scripts/demo.sh --mock` (no network), then `cd frontend && npm run dev`, then open a NEW browser tab.

The story: three shifts keep the same log in three different layouts. A buyer emails about a bad lot. Without this tool, the paperwork person opens three spreadsheets and pieces it together by hand. With it, they get one lot history and a reply in under a minute.

## Click path

1. **Files: drop `fixtures/shift1_log.csv`.** (about 30 s)
   Say: "This is a messy shift log: a title row, short headers, times written like 5/3/21 6:01a."
   On Check, answer the 3 questions: Ref is the lot number, pick the right time column, Press 3 and P3 are the same.
   Say: "Granite guesses, but a person decides. It only sees the column names and a few samples."

2. **Drop `fixtures/shift2_export.csv` and `fixtures/shift3.xlsx`.** (about 15 s)
   Both say "Recognized from a file you checked earlier", with no questions.
   Say: "Different headers, different file type, and nothing to answer. It remembers the layout."

3. **See the file on shift2 (keep it to about 10 s).**
   Point at the summary bar at the top, one skipped title row, and the held-back row: "Time unreadable. It doesn't guess; it holds the row for you."

4. **Find a record: paste `fixtures/buyer_message.txt`.** (about 60 s, the main moment)
   Granite reads the email and finds lot 4417, part B-220, problem burrs.
   Show the history across all three shifts and the timeline on Press 3: "8 lots worth checking out of 140 that week."
   Open the draft reply and its "What we are doing now" section.

5. **If time is left:** turn on Shop-floor mode, or open All records filtered to Press 3.

## If a judge asks "does it work on real machine data?"

Drop `fixtures/piade_machine_sample.csv` (300 unmodified rows from the PIADE dataset). It asks about the machine-style columns instead of quietly guessing. Choose None of these for the lot: a machine export has no lot number, so all rows are held back rather than made up. See `fixtures/NOTE.md` for the 20-second answer.

## If something breaks

Switch to the mock: stop the backend, run `scripts/demo.sh --mock`, and open a new tab. The canned answers give the same click path.
