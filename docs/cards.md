# Subagent cards and lead run sheet

For Friday. These are instructions and acceptance checks in plain words. They contain no code, no file contents, and no prompt text for Granite. The contract file they refer to is written by the lead on Friday morning from section 13.3 of the design doc.

**Start with `build/agent-workflow.md`.** It says what to read for each card, settles conflicts between this file and the design doc, and covers setup, review, swap-in, and cuts. This file holds the cards themselves.

## How to use this file

1. Write the contract file first (9:30). Nothing starts before it exists.
2. Brief each agent with the template in build/agent-workflow.md section 8a. It names the standing rules, the card, the contract, and the card's reading list by path. The model for each card is in that section too.
3. Time-box every card. When the box ends, the agent stops and reports, finished or not.
4. Review each report against the card's "done when" before using the work.
5. If a card fails review twice, do not send it a third time. Take it over or cut it.

## Standing rules (paste at the top of every agent's brief)

- You own only the files named on your card. Do not create, edit, or delete anything else.
- The contract file is read-only. If it seems wrong or incomplete, stop and report. Do not work around it.
- Use the contract's names exactly. Do not rename or add anything to a shared shape.
- Write the tests first, from the "done when" list. Then write the code. Then run the tests and paste the result.
- One public function per file unless the card says otherwise. No hidden state. No network calls unless the card says so.
- No new dependencies. The allowed ones are listed on your card.
- Never write a key, password, or token into any file.
- Do not add features, options, or settings that the card does not ask for.
- Keep it short and plain. A reader should follow each function without scrolling.
- Report back with exactly: files changed, tests run with their result, every assumption you made, and anything on the card you did not finish.

## Build order: skeleton first, then fill in

The old order built modules in parallel and joined them after lunch. That puts all the integration risk at the end. The new order makes the whole app click through on canned data by 10:45, then replaces canned parts with real ones one at a time. At every point after 10:45 there is something that can be filmed.

| Wave | Time (ET) | Cards | Result |
|---|---|---|---|
| 0 | 9:00 to 10:00 | Card 0 (lead) | Contract file, fixtures, canned responses, first real Granite call |
| 1 | 10:00 to 10:45 | S (skeleton routes), D, E | Every screen works end to end on canned data |
| 1 | 10:00 to 11:15 | A, B, R, C, K, in parallel with the above | Modules with passing tests, not yet connected |
| 2 | 10:45 to 12:15 | G1 (lead) | Granite jobs 1 and 2 against the real service |
| 3 | 12:45 to 14:15 | Swap in A, B, G1, R, C behind the Files and Check routes | A real file goes through Check. Checkpoint. |
| 4 | 14:15 to 15:15 | Swap in the store behind Find a record. Details panel. | A typed lot number returns a real history. Checkpoint. |
| 5 | 15:15 to 16:15 | G2 (lead), swap in K | Pasted message, worth checking, drafted reply |
| 3b | 12:45 to 14:15 | V, then N (front end); L only if an agent is free | Screens on canned data |
| 3c | 15:15 to 16:15, only if the 15:15 checkpoint passed | T, then M | Timeline, switch, shop-floor mode |
| 6 | 16:15 to 16:30 | Lead | Rows held back, accessibility check |

"Swap in" means one thing: the route stops returning the canned shape and calls the real module, which returns the same shape. If the shapes match the contract, nothing else changes.

## Cards

### Card 0. Foundations (lead, 9:00 to 10:00)

- **Make:** the contract file; the repo layout; three messy shift files; one sample buyer message; canned responses for all four Granite jobs; one canned File result, one canned Answer.
- **Fixture rules:** build the shift files from real PIADE production intervals. Keep the real times, counts, and alarm codes. Add lot, part, operator, shift, and step columns. Give the three files different header names, date styles, and machine spellings, plus title rows above the header. Include at least: one lot that crosses two files, one alarm shared by two lots, one row with no lot, one row with an unreadable date, and two date columns in file 1. Write down what was added, in a short note in the fixtures folder. That note is the disclosure.
- **First Granite call:** send one real column and find out how to get an answer that parses every time. Try asking for JSON in the instructions first. Save what works as the canned response.
- **Done when:** the files exist, the Granite call returned something that parsed, and the note on what is real is written.

### Card S. Skeleton routes (mid tier, 45 minutes)

- **Owns:** backend/main
- **Reads:** contract, the canned File result and Answer, section 10.2 of the design doc
- **Do:** create every route in section 10.2. Each returns the matching canned shape from the fixtures folder. No logic.
- **Done when:** each route answers with a shape that matches the contract exactly; a test calls every route and checks the shape; the server starts with one command.
- **Not your job:** reading files, calling Granite, storing anything.

### Card D. Files and Check screens (mid tier, 60 minutes)

- **Owns:** frontend/screens for Files and Check; frontend/parts for the file row and question card
- **Reads:** contract, mockups screen1a, screen1b, screen2a, screen2b, screen2c, mockups/builder-notes.md, section 9.5 of the design doc
- **Do:** build both screens against the skeleton routes.
- **Done when:** the working, done, and error states of a file row all render; all five question kinds render from canned data; Granite's guess arrives pre-selected and labeled; every question can be answered with the keyboard alone and focus is visible; "Matched for you" lists every mapping; exactly one solid blue button per screen; no word from the banned list in 9.5 appears on screen.
- **Not your job:** Find a record, the Details panel, any styling beyond Carbon's defaults.

### Card E. Find a record and the Details panel (mid tier, 60 minutes)

- **Owns:** frontend/screens for Find a record; frontend/parts for the step card and details panel
- **Reads:** contract, mockups screen3a to screen3e, screen4a, screen4b, mockups/builder-notes.md, section 9.5
- **Do:** build the screen and the panel against the skeleton routes.
- **Done when:** the box accepts a message or a lot number; the reading line shows with Change; the lot history shows steps in time order with source and "See the original row"; a machine alarm shows with words and a marker; "Worth checking" lists links with reasons and the count for the week; the reply card shows the draft with its label and Copy; the no-match state shows closest lot numbers; the panel shows steps and numbers, traps focus, and closes on Escape.
- **Not your job:** Files, Check, Print.

### Card A. Reader and type detector (small tier, 45 minutes)

- **Owns:** backend/reader, backend/types, their tests
- **Allowed:** pandas
- **Do:** read a CSV or Excel file; find the header row as the first row that is mostly filled; return a column profile per column with its detected type (date, number, text), five distinct non-empty samples spread across the column, and the distinct values for text columns.
- **Done when:** each of the three fixtures returns the right header row; title rows above the header are skipped; dates in all three styles are detected as dates; an empty column and a column of one repeated value do not crash; tests pass.
- **Not your job:** deciding what a column means.

### Card B. Formats (small tier, 45 minutes)

- **Owns:** backend/formats, its tests
- **Allowed:** rapidfuzz
- **Do:** save a format, load formats, and decide whether a file's headers match a saved format.
- **Done when:** fixtures 2 and 3 match the format saved from fixture 1; a file with one extra column matches and reports that column as new; a file missing a mapped column reports it as missing; an unrelated file does not match; tests pass.
- **Not your job:** applying the format to data.

### Card R. Review rules (mid tier, 45 minutes)

- **Owns:** backend/review, its tests
- **Reads:** contract, section 7.2 of the design doc, the canned Granite responses
- **Do:** one function. Column profiles, label proposals, and merge proposals go in. A list of questions and a list of matched columns come out.
- **Done when:** the canned proposals for fixture 1 produce exactly three questions (the unsure lot column, the two date columns, the machine merge); each of the five triggers has its own test; no question has more than four choices; Granite's guess is pre-selected except on a type conflict; tests pass.
- **Not your job:** calling Granite, wording beyond the sentence patterns in 7.2.

### Card C. Cleaner, record builder, store (mid tier, 75 minutes)

- **Owns:** backend/build, backend/store, their tests
- **Allowed:** pandas, the standard SQLite module
- **Do:** apply a format to a file; clean values using the format's rules; normalize dates; build entries with source and original row; hold back rows that cannot become entries, with a reason; save and query entries, lot histories, held-back rows, and counters.
- **Done when:** fixture 1 with a known format yields the expected number of entries; machine spellings are merged; all date styles come out in one format; the row with no lot and the row with a bad date are held back with reasons; entries plus held-back rows equal the file's data rows; a lot that crosses two files returns one history in time order; a spelling never seen before is kept unchanged and counted; tests pass.
- **Not your job:** deciding the mapping, the risk rules.

### Card K. Risk rules (small tier, 45 minutes)

- **Owns:** backend/risk, its tests
- **Reads:** contract, section 7.4 of the design doc
- **Do:** one function. A lot number and the stored entries go in. Linked lots, each with its reason in words and how close in time, come out, plus the count of lots in that week.
- **Done when:** each rule in 7.4 has a test with a lot that should link and one that should not; the same lot never links to itself; a lot linked by two rules appears once with both reasons; results are sorted by closeness; a lot with no links returns an empty list; the window is a parameter with 4 hours as the default; tests pass.
- **Not your job:** calling Granite, deciding whether anything is defective.

### Card G1. Granite jobs 1 and 2 (lead, strongest model, 10:45 to 12:15)

- **Owns:** backend/granite
- **Do:** job 1 returns label proposals from column profiles. Job 2 returns merge proposals from distinct values. Both retry once on an answer that does not parse, then fall back as section 7.3 says. Store every exchange so "What Granite saw" can show it. Count tokens.
- **Done when:** fixture 1 returns sensible proposals from the real service; a deliberately broken answer triggers one retry and then the fallback; the stored exchange can be read back; the token count is recorded.

### Card G2. Granite jobs 3 and 4 (lead, 15:15 to 15:45)

- **Do:** job 3 reads a buyer's message into a request reading. Job 4 drafts a reply from the reading, the history, and the links.
- **Done when:** the sample message returns the right lot, part, and problem; a message with no lot returns "nothing found"; the draft names only lots and facts it was given, checked by a test that scans the draft for lot numbers not in the input; failure of either job falls back as section 7.4 says.

### Card V. See the file (mid tier, 60 minutes, wave 3b; cut 9 of 12)

- **Owns:** backend/fileview, its tests; frontend/screens for See the file
- **Allowed:** pandas, Carbon DataTable and ContentSwitcher
- **Reads:** contract (File view shape), mockup screen1c, builder notes "See the file", section 9.5
- **Do:** the back-end function takes a file ID and returns the File view shape for its first 50 rows. The screen renders it against the canned route.
- **Done when:** skipped title and blank rows show greyed with their reason; held-back rows show the triangle and reason; each column has a tag saying what it became (dashed for extra detail); the switch flips raw and cleaned values, with the old value struck through under a changed one; clicking a header shows the one-line summary with Change; only 50 rows; no sorting, filtering, or editing; keyboard reaches the switch and every header; tests pass.
- **Not your job:** changing a mapping (Change only reopens the Check question), routes in backend/main.

### Card L. All records with filters (mid tier, 75 minutes, wave 3b, only if an agent is free; cut 3 of 12)

- **Owns:** backend/records, its tests; frontend/screens for All records
- **Allowed:** the standard SQLite module; Carbon DataTable with pagination, Dropdown, Search, Checkbox, Tag
- **Reads:** contract (Record page shape), mockup screen1d, builder notes "All records", section 9.5
- **Do:** the back-end function takes filters and a page number and returns the Record page shape, filtering in SQLite. A second function writes the filtered clean records as CSV. The screen renders against the canned route.
- **Done when:** every filter in the builder notes narrows the results and combines with the others; active filters show as removable chips with Clear all; the count line updates; 50 rows per page; the raw and cleaned switch works; clicking a row opens that lot in Find a record; the CSV link exports exactly the filtered rows; filtering on the demo lot's machine and stop code returns the lots that "Worth checking" lists; tests pass.
- **Not your job:** routes in backend/main, Find a record itself.

The lead adds the two routes for V and L to backend/main during swap-in.

### Card N. Time-saved line and live steps (small tier, 30 minutes, wave 3b; keep)

- **Owns:** frontend/parts for the time-saved line and the file-row steps; backend/progress (an in-memory step per file ID) and its tests
- **Allowed:** Carbon only; no new libraries
- **Reads:** contract (File status shape, now with a `step` value), mockups screen1a and screen3b, builder notes "Live steps" and "Time-saved line", design doc 9.8 C and E
- **Do:** the file handler sets the current step (header, granite, cleaning, records) as it goes. The file row polls the status route every 500 ms while working and shows the four steps: done with a check, current in bold blue with a dot, waiting with a hollow dot. The time-saved line shows the app's own timer (from paste or typed lot to reply shown) beside the hand time, which is read from a setting.
- **Done when:** the steps change in the real order on a real upload; a recognized file skips "Granite" and shows it as not needed; the hand-time setting is empty by default, and when empty the line shows only the tool time; no number is hard-coded; tests pass.
- **Not your job:** the Details panel, the routes in backend/main.

### Card M. Animated switch and shop-floor mode (small tier, 40 minutes, wave 3c; switch is cut 4, shop-floor mode cut 6)

- **Owns:** frontend/parts for the switch animation; frontend/theme for shop-floor mode
- **Allowed:** CSS transitions; Carbon Theme (white and g100) and Toggle
- **Reads:** mockups screen1e and screen5, builder notes "Animated switch" and "Shop-floor mode", rules 9.5.9 to 9.5.13
- **Do:** when the Your file / Cleaned switch flips, changed cells fade to the new value with the old value sliding under it, struck through, one column after another, about 1 second in total. Add a header toggle that switches to Carbon g100 with 20 px body text and is remembered in the browser.
- **Done when:** the animation runs on See the file and All records; unchanged cells never move; with reduced motion turned on, the switch jumps to the end at once; in shop-floor mode every screen passes the automated contrast check and no text is cut off; the toggle works by keyboard and has a screen-reader name; storage failures fall back to the light theme.
- **Not your job:** the switch's data (Cards V and L).

### Card T. Lot timeline (mid tier, 45 minutes, wave 3c; cut 7 of 12)

- **Owns:** backend/timeline and its tests; frontend/parts for the timeline strip
- **Allowed:** plain elements and CSS only, with no chart library
- **Reads:** contract (Timeline shape), mockup screen3b, builder notes "Lot timeline", the risk rules in 7.4
- **Do:** given a lot, return every lot on the same machine on the same day with start and end times, which of them are worth checking (from backend/risk), and any machine stops with their times. Draw one strip of hours: the lot in question filled dark, linked lots outlined with their numbers, and stops as the triangle with "stop N" above. Under it, put a text list of the same facts for screen readers.
- **Done when:** blocks sit at their real times; only lots that "Worth checking" lists are outlined; a lot linked only by operator and shift is left off the strip but stays in the list below; lots under 20 minutes still show a readable label; tests cover a lot alone on its machine (the strip shows just that lot).
- **Not your job:** the risk rules themselves (Card K).

### Card G3. Granite job 5, Ask your records (lead, 60 to 90 minutes, only if the deadline is Nov 15; cut 1 of 12)

- **Owns:** the job 5 part of backend/granite, and the Ask box on All records
- **Reads:** design doc 7.5, 16.7 item 1, mockup screen1d, builder notes "Ask your records"
- **Do:** send the question and the allowed filter values. Force the answer to choose from those values only (guided choice or JSON schema). Apply the result as chips through Card L's filters, with "Granite read this as" and Change.
- **Done when:** five test questions give the expected filters; a question with no match shows "Couldn't read that. Use the filters below." and changes nothing; Granite never receives record rows; a bad answer gets one retry and then the fallback.

## Live demo cards (added Nov 13, 12:40 ET, after we were told the demo is also live)

The judges will watch the app run live and may ask to try things. These cards make a live run repeatable, safe to recover, and honest when a judge hands it an odd file. The user is a shop's paperwork person, not a data person: every message stays in plain words.

### Card L1. Demo reset and start script (small tier, 30 minutes)

- **Owns:** scripts/demo.sh (new)
- **Do:** one command a nervous presenter can run before every demo. `scripts/demo.sh` empties the data folder (`DATA_DIR`, default `data/`: the SQLite file, `formats/`, `uploads/`, `files/`), then starts the backend with real Granite on `API_PORT` (default 8000). `scripts/demo.sh --mock` does the same with `MOCK_GRANITE=1`, the fallback if the venue network or watsonx stalls. Refuse to delete anything unless the resolved data folder is inside the repo. Print one plain line saying which mode is running and how to start the frontend.
- **Done when:** after upload of a demo file, running the script leaves `GET /api/files` returning an empty list; `--mock` answers uploads with no network; pointing `DATA_DIR` outside the repo makes it refuse and delete nothing.

### Card L2. Keep the Check screen through a page reload (mid tier, 45 minutes)

- **Owns:** frontend/src/api.js, frontend/src/App.jsx, and their tests
- **Do:** today a reload (or a judge pressing F5) loses the questions and shows "Nothing to check". There is no route to fetch the questions again, and the contract must not change, so keep them in the browser: store each FileResult in `sessionStorage` by `file_id`, and store the current screen and its params in `sessionStorage` so a reload returns to the same screen. Wrap every storage call in try/catch; with storage blocked the app works as today. Results answered and saved can be dropped.
- **Done when:** a test renders App, goes to Check with a result, simulates a reload (new render with the same storage), and sees the same questions; blocked storage does not throw.

### Card L3. Ask, don't guess, on machine-style columns (lead, strongest model, 45 minutes)

- **Owns:** backend/granite.py (job 1 prompt and the mock guess only), tests/test_granite.py
- **Do:** on the raw PIADE export, job 1 matched `elapsed` (a duration in milliseconds) as Quantity with no question, and offered `pi`/`po` (running package counters) as the part number. For a shop's paperwork person a silent wrong match is the worst outcome. Tune the job 1 prompt so durations, speeds, rates, running counters and Unix timestamps are marked unsure or extra, never confidently quantity, part or time. Make the mock guess follow the same rule. The three demo files must still give exactly the questions in status.md (Shift 1 asks 3; Shifts 2 and 3 ask none).
- **Done when:** with the mock, a PIADE-style header set gives no confident quantity, part or time label on `elapsed`, `speed`, `pi`, `po`, `start` or `end`; the demo-file tests still pass; one real Granite run on the PIADE sample and on Shift 1 is reported (key read from the repo's `.env`, never printed).

### Card L4. A small real PIADE file for questions from judges (small tier, 20 minutes)

- **Owns:** fixtures/piade_machine_sample.csv (new), fixtures/NOTE.md (one added section)
- **Do:** cut about 300 rows from the raw PIADE file (`/home/fez/Documents/ProgrammingProjects/piade-raw/raw_data.csv`), unchanged, all ten columns, from the demo week (Mon May 3 to Sun May 9, 2021), across the five machines. It answers "does it work on real machine data?": the app asks, the presenter picks None of these for the lot, and rows are held because a machine export has no lot number. Add a NOTE.md section saying what the file is, that it is unmodified PIADE data (CC BY 4.0, cite as the note already does), and the 20-second answer to give a judge.
- **Done when:** the file has a header plus 250 to 350 rows, every value matches the raw file, and uploading it with `MOCK_GRANITE=1` gives a Check screen with a lot question that offers None of these.

### Card L5. Read machine-export times as dates (small tier, 20 minutes)

- **Owns:** backend/types.py (the date patterns only), backend/build.py (`normalize_time` only), tests/test_types.py, tests/test_build.py
- **Do:** PIADE writes times as `2020-01-01 11:21:28.907000+00:00`. The type detector reads that as text, so a plainly correct time column becomes a type-conflict question, which makes the app look like it can't read dates. Accept ISO dates with seconds, an optional fraction, and an optional zone (`Z`, `+00:00`, `-05:00`) in both the detector and `normalize_time`, as contract section 5 now lists. Keep the clock time as written: drop seconds, fraction and offset, never convert zones.
- **Done when:** `normalize_time("2021-05-04 14:02:28.907000+00:00") == "2021-05-04T14:02"`, `"2021-05-04T14:02:28Z"` likewise; a column of such values is detected as `date`; Unix numbers like `1577877688.907` stay `number`; every existing test still passes.

### Card L6. Make See the file show what cleaning did (medium tier, 30 minutes)

- **Owns:** frontend/src/screens/SeeFile.jsx, frontend/src/screens/SeeFile.css, frontend/src/screens/SeeFile.test.jsx
- **Why:** in the live demo a judge looks at this screen for a few seconds. Today the Cleaned view looks almost the same as the file: `.seefile-changed` has no style, unchanged cells look the same as changed ones, and the "Changed in N rows" line shows only after a column is clicked.
- **Do:**
  1. Open in the Cleaned view.
  2. In the Cleaned view, a changed cell gets a light tinted background (IBM blue 10, `#edf5ff`, with a darker pair under `.shop-floor`) and shows the old value struck through in small grey text above the new value in normal weight. Unchanged cells show only their value, with no strikethrough. Colour is never the only signal: the strikethrough old value stays.
  3. Add a summary bar above the grid, always visible, built only from the view response the screen already gets (no new API calls, no contract change). Plain words, one line per item, items with a zero count left out, for example: "Times written one way: 46 rows", "Machine names made the same: 9 rows", "Title and blank rows skipped: 2", "Held back for you to check: 1". Per-column counts come from `columns[].rows_changed` grouped by field; skipped and held counts come from `rows[].kind`. Note that `rows` holds at most the first 50 lines, so say "in the first 50 lines" when `total_rows` is larger.
  4. Keep the existing click-a-column summary and Change link.

### Card L7. Filter and download on See the file (large tier, 60 minutes)

- **Owns:** backend/fileview.py, backend/export.py (new), backend/main.py (the view route's parameters and one new download route only), tests/test_fileview.py, tests/test_export.py (new), frontend/src/screens/SeeFile.jsx, SeeFile.css, SeeFile.test.jsx, frontend/src/api.js (`fileView` gains filters, one new `downloadUrl` function only)
- **Why:** the paperwork person wants to send a cleaned copy to a buyer or their boss, in the form that person can open, and to find rows in a long file without scrolling.
- **Do:** follow contract "FileView" filters and "File download" exactly.
  1. Backend: filters in `file_view` (pass `pipeline.file_parts` data as now; read the original upload path from the file record via `pipeline._load(file_id)["path"]`, read-only). `export.py` writes CSV with the `csv` module and xlsx with openpyxl (already installed; bold header row, no other styling). The original version streams the upload as is.
  2. See the file: above the grid, a search box ("Find in this file"), a "Show" dropdown (All rows / Saved rows / Held back), and a "Download" button. Clicking a column header already picks a column; add "Only rows where <header> is <value>" by clicking a cell while a column is picked, with an x to clear it. Show "N rows match" when filtering. Filters apply to both the Your file and Cleaned views. Debounce typing about 300 ms.
  3. Download opens a small Carbon Modal with plain choices: "Which version?" (Cleaned / Your original file), "File type" (CSV, opens anywhere / Excel), "Dates look like" (2021-05-03 06:01 / 05/03/2021 6:01 AM), "Include held-back rows" checkbox, and "Only the rows that match your filter" checkbox when a filter is set. Options other than version are disabled for the original. The Download button in the modal is a plain link to `api.downloadUrl(...)` so the browser saves the file.
  4. Shop-floor mode must stay readable (see frontend/src/theme/shopfloor.css for colours; put overrides in SeeFile.css under `.shop-floor`).
- **Done when:** backend tests cover each filter, `matching`, both formats, both date styles, held rows on and off, filtered download, original bytes unchanged, and 404; frontend tests cover the search, the Show dropdown, the modal's choices building the right URL, and original disabling the other options; both full suites pass.
- **Done when:** tests cover the default Cleaned view, a changed cell having the class and both values, an unchanged cell having no strikethrough, and the summary bar text with a zero-count item left out; the whole frontend suite passes.

## Lead's review checklist for every returned card

- Do the shapes match the contract, name for name?
- Did the agent touch a file it does not own?
- Do the tests pass when you run them yourself?
- Is there anything on screen or in a name that the card did not ask for? Remove it.
- Commit with a message that says which card it was. The history is the proof that the code was written on Friday.
