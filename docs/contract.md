# Contract (v1, Fri Nov 13 2026)

The shared names and shapes. Written and changed only by the lead. If something here looks wrong or
missing, stop and report; do not work around it. Every key below is spelled exactly as written.

Change log (newest first; one line per change):
- v1: first version.

## 1. Conventions

- **Keys:** `snake_case` everywhere, in Python and in JSON. The front end uses the same keys.
- **Times:** every entry time is text `YYYY-MM-DDTHH:MM` (24-hour, no seconds, no zone). It is the
  plant's wall-clock time. PIADE's 2021 times are used as they are. Date-only values become `T00:00`.
- **Lot numbers are text, never numbers** (`"0042"` keeps its zeros). Same for part, operator, shift.
- **Quantity** is an integer or `null`.
- **IDs:** file ID `"f1"`, `"f2"`, ... in upload order. Entry ID `"<file_id>-r<source_row>"`, for example `"f1-r12"`.
  Format ID `"fmt1"`, ... Exchange ID `"g1"`, ... Question ID `"q1"`, ... within one file.
- **Row numbers** (`source_row`) are 1-based and count every line of the file, title rows included,
  exactly as a spreadsheet program would number them. For Excel, the first sheet only.
- **Column positions** (`position`) are 0-based within the header row.
- **Errors:** every route error is HTTP 4xx or 5xx with this body, and the screen shows both parts on the same row:
  ```json
  {"error": {"message": "This file has no rows we could read.", "fix": "Check that it is a CSV or Excel file and try again."}}
  ```
- Words shown on screen never include: template, schema, regex, label, field.

## 2. The ten fields

| Key | Shown as | Required | One column only |
|---|---|---|---|
| `lot` | Lot number | yes | yes |
| `part` | Part number | | yes |
| `quantity` | Quantity | | yes |
| `time` | Time | yes | yes |
| `machine` | Machine | | yes |
| `operator` | Operator | | yes |
| `shift` | Shift | | yes |
| `step` | Process step | | yes |
| `alarm` | Machine stop | | yes |
| `extra` | Extra detail | | no (any number of columns) |

Granite job 2 (merges) runs only on columns mapped to `machine`, `step`, `part`.
A machine stop code is shown as `Machine stop, code N` where N is the number in the code with
leading zeros removed (`A_101` is "code 101", `A_001` is "code 1"), with a triangle icon.

## 3. Back-end shapes (Python dicts, sent as JSON)

`str?` means the value may be `null`. Lists may be empty, never `null`.

### ColumnProfile
```json
{"position": 0, "header": "Ref", "detected_type": "text",
 "samples": ["4384", "4401", "4417", "4440", "4466"],
 "distinct": ["4384", "4385"]}
```
`detected_type` is one of `"date"`, `"number"`, `"text"`. `samples`: up to 5 distinct non-empty values spread across
the column, in column order. `distinct`: all distinct non-empty values in first-seen order for `"text"` columns, at most 200;
`null` for date and number columns. Note: a column of lot numbers like `4417` is detected as `"number"`.

### LabelProposal (Granite job 1, one per column)
```json
{"position": 0, "field": "lot", "alternatives": ["part"], "reason": "Short IDs that repeat.", "sure": false}
```
`field` is one of the ten keys, or `null` when Granite gave no usable answer (fallback). `alternatives`: at most 2 keys.

### MergeProposal (Granite job 2)
```json
{"position": 5, "values": ["Press 3", "PRESS-3", "P3"], "name": "Press 3"}
```

### MatchedColumn
```json
{"position": 1, "header": "Part", "field": "part", "decided_by": "granite"}
```
`decided_by` is `"granite"`, `"person"`, or `"format"` (recognized file).

### Question
```json
{"question_id": "q1", "kind": "unsure", "positions": [0],
 "title": "What is this column?",
 "sentence": "Granite thinks this is the lot number but isn't sure.",
 "choices": [
   {"value": "lot", "text": "Lot number", "samples": [], "granite_guess": true},
   {"value": "part", "text": "Part number", "samples": [], "granite_guess": false},
   {"value": "quantity", "text": "Quantity", "samples": [], "granite_guess": false},
   {"value": "extra", "text": "Something else", "samples": [], "granite_guess": false}],
 "preselected": "lot"}
```
- `kind` is exactly one of `"unsure"`, `"type_conflict"`, `"duplicate"`, `"missing"`, `"merge"`.
- At most 4 choices. `preselected` is the Granite guess's `value`, or `null` (always `null` for `type_conflict`
  and for every question made by the fallback).
- Choice values by kind:
  - `unsure`, `type_conflict`: field keys, last choice `{"value": "extra", "text": "Something else"}`.
    Titles: "What is this column?". For `type_conflict` the sentence states the conflict, for example
    "Granite says this is the time, but its values are numbers, not dates."
  - `duplicate`: the column positions as text (`"3"`, `"4"`), at most 3, `samples` filled, plus
    `{"value": "none", "text": "None of these"}`. Title "Which one is the time?" (or the field's shown name).
    The columns not chosen become `extra`; with `none`, every listed column becomes `extra`.
  - `missing`: column positions as text for the likeliest columns, plus `{"value": "none", "text": "None of these"}`.
    Title "Which column is the lot number?" (or "...the time?"). Sentence "None was found."
  - `merge`: `{"value": "yes", "text": "Yes, all are \"Press 3\""}` and `{"value": "no", "text": "No, keep them apart"}`.
    `positions` is the one column. `samples` of the yes choice lists the values. Title "Are these the same?"
- Review sentence patterns are in design doc 7.2.
- A type conflict is only: a column labeled `time` whose `detected_type` is not `"date"`, or a column labeled `quantity`
  whose `detected_type` is not `"number"`. Lot, part, operator, shift may be any type.
- Order of questions: missing, duplicate, type_conflict, unsure, merge; within a kind, by column position.
- Every column not in a question goes into `matched`. Columns in a question are not in `matched`.

### Answer to a question (sent by the Check screen)
```json
{"question_id": "q1", "value": "lot"}
```

### Format
```json
{"format_id": "fmt1", "name": "shift1_log.csv",
 "headers": ["Ref", "Part", "Qty", "Prod Dt", "Logged", "Mach", "Op", "Shift", "Step", "Alarm", "Notes"],
 "mapping": {"Ref": "lot", "Part": "part", "Prod Dt": "time", "Logged": "extra", "Mach": "machine"},
 "value_rules": {"machine": {"PRESS-3": "Press 3", "P3": "Press 3"}},
 "created_at": "2026-11-13T11:02"}
```
`mapping` has every header. `value_rules[field][raw] = clean`.

### FormatMatch (Card B)
```json
{"matched": true, "format_id": "fmt1",
 "header_map": {"REF": "Ref", "PROD DT": "Prod Dt"},
 "new_columns": ["Comments"], "missing_columns": ["Logged"]}
```
A file matches a saved format when every header that format mapped to a field other than `extra` is found again in the
file (fuzzy, see Card B). `header_map` maps this file's header to the format's header. `new_columns`: headers in the file
not in the format. `missing_columns`: format headers not found in the file (only `extra` ones can be missing on a match).
No match: `{"matched": false, "format_id": null, "header_map": {}, "new_columns": [], "missing_columns": []}`.

### RawTable (Card A reader)
```json
{"source_file": "shift1_log.csv", "header_row": 4,
 "skipped": [{"source_row": 1, "reason": "title", "text": "DEMO SHOP SHIFT LOG"},
             {"source_row": 3, "reason": "blank", "text": ""}],
 "headers": ["Ref", "Part"],
 "rows": [["4384", "B-118"]],
 "source_rows": [5]}
```
`header_row` is the header's `source_row`. All cell values are text exactly as in the file (`""` for empty; Excel
dates and numbers turned into text the way the cell displays them as closely as practical). Blank lines after the header
are not in `rows`; they are in `skipped` with reason `"blank"`.

### Entry
```json
{"entry_id": "f2-r21", "lot": "4417", "part": "B-220", "quantity": 7814, "time": "2021-05-04T16:15",
 "machine": "Press 3", "operator": "OP-121", "shift": "2nd", "step": "Stamping", "alarm": "A_101",
 "extra": {"NOTES": ""}, "source_file": "shift2_export.csv", "file_id": "f2", "source_row": 21,
 "original_row": {"REF": "4417", "PART": "B-220", "MACH": "Press 3"},
 "changed": ["time"]}
```
Fields with no column are `null`. `alarm` keeps the code as written in the file after value rules (`"A_101"`), or `null`
when empty. `original_row` maps every header to the raw text. `changed` lists the field keys whose clean value differs
from the raw text (empty list if none).

### HeldRow
```json
{"file_id": "f1", "source_file": "shift1_log.csv", "source_row": 31,
 "original_row": {"Ref": "", "Part": "B-118"}, "reason": "no_lot", "reason_text": "No lot number"}
```
`reason` is one of `"no_lot"` ("No lot number"), `"bad_time"` ("Time unreadable"), `"empty"` ("Empty").
Entries plus held rows always equal the file's data rows.

### LotHistory
```json
{"lot": "4417", "part": "B-220", "entries": []}
```
`entries`: every Entry with this lot, sorted by `time`, then `source_file`, then `source_row`.

### Link (Card K)
```json
{"lot": "4420", "part": "B-220", "machine": "Press 3", "time": "2021-05-04T18:16",
 "rules": ["same_machine_window", "same_stop"],
 "reasons": ["Same press, 2 hours later", "Same machine stop, code 101"],
 "closeness_minutes": 121}
```
Rules and reason sentence patterns (one reason per rule that matched, in this order):

| `rules` value | Matches when | Reason pattern | `closeness_minutes` |
|---|---|---|---|
| `same_machine_window` | Same `machine`, and some step of the other lot is within ±`window_hours` (default 4) of some step of this lot | `"Same machine, 35 minutes later"` / `"... 2 hours earlier"` (minutes under 60, else whole hours rounded down; singular "1 hour") | smallest absolute gap in minutes |
| `same_stop` | Same `machine` and same non-null `alarm` on some step, on the same calendar day | `"Same machine stop, code 101"` | smallest gap between the two steps with that stop |
| `same_operator_shift` | Same `operator` and same `shift` on the same calendar day | `"Same operator and shift, same day"` | smallest gap between any two steps that day |

A lot never links to itself. A lot matched by several rules appears once with all its rules. The list is sorted by
`closeness_minutes` ascending, then `lot`. "Same week" is Monday 00:00 to Sunday 23:59 of the lot's first entry.

### RiskResult (Card K)
```json
{"links": [], "lots_in_week": 212}
```
`lots_in_week`: distinct lot numbers with any entry in the same Monday-to-Sunday week as the lot's first entry.

### RequestReading (Granite job 3)
```json
{"found": true, "lot": "4417", "part": "B-220", "problem": "burrs", "source": "granite"}
```
Nothing found: `{"found": false, "lot": null, "part": null, "problem": null, "source": "granite"}`.
A typed lot number gives `"source": "typed"` and no Granite call. Fallback on Granite failure: `found: false`, `"source": "fallback"`.

### Answer (Find a record)
```json
{"reading": {}, "history": {}, "links": [], "lots_in_week": 212, "closest": []}
```
`reading` is a RequestReading or `null`; `history` a LotHistory or `null` when no lot matched (then `closest` lists up to
3 lot numbers nearest by text, and `links` is empty).

### Draft (Granite job 4)
```json
{"source": "granite",
 "sections": [
   {"heading": "What we found", "text": "..."},
   {"heading": "Other lots that may be affected", "text": "..."},
   {"heading": "What we are doing now", "text": ""}]}
```
`source` is `"granite"` or `"fallback"`. On fallback the first two `text`s are plain lists built by code from the history
and links, one fact per line starting with `"- "`. The third is always `""`, for the person to write.

### GraniteExchange
```json
{"exchange_id": "g1", "file_id": "f1", "job": 1, "model_id": "ibm/granite-4-h-small",
 "sent": "...exact request text...", "answer": "...exact answer text...",
 "parsed": true, "retried": false, "fell_back": false, "output_mode": "json_schema",
 "tokens_in": 812, "tokens_out": 240, "seconds": 2.1, "at": "2026-11-13T11:02"}
```
`file_id` is `null` for jobs 3 to 5. `output_mode` is how the answer was asked for: `"json_schema"`, `"json_object"`,
`"guided_choice"`, or `"text"`. One record per attempt; a retry is a second record with `retried: true`.

### Counters (design doc 8; shown in Details)
```json
{"granite_calls": 2, "files_total": 3, "files_with_granite": 1,
 "seconds_to_records": 4.2, "columns_right": 9, "columns_total": 11,
 "values_cleaned": 31, "unseen_values": [{"field": "machine", "value": "Press1", "count": 1}],
 "rows_held": 1, "entries": 82, "data_rows": 83,
 "tokens_in": 812, "tokens_out": 240, "cost_usd": 0.00011}
```
Per file. `columns_right`: columns where the person's final choice equals Granite's first guess. `cost_usd`: tokens times
$0.06 per million in and $0.27 per million out (granite-4-h-small list price; replace if the model differs).

### Step (file progress, Details and the file row)
```json
{"step": "granite", "state": "done", "title": "Asked IBM Granite", "detail": "What 11 columns mean."}
```
`step` is one of `"header"`, `"granite"`, `"cleaning"`, `"records"`. `state` is `"done"`, `"current"`, `"waiting"`,
or `"not_needed"`. Titles: "Found the header", "Asked IBM Granite", "Cleaned the values", "Built the records".

### FileStatus (polled every 500 ms while working)
```json
{"file_id": "f1", "source_file": "shift1_log.csv", "status": "working", "step": "granite",
 "sentence": "Asking IBM Granite what the columns mean...", "steps": [], "error": null}
```
`status` and its sentence:

| `status` | Sentence |
|---|---|
| `"working"` | depends on `step`: header "Finding the header...", granite "Asking IBM Granite what the columns mean...", cleaning "Cleaning the values...", records "Building the records..." |
| `"needs_check"` | "New layout. N things to check." |
| `"ready"` | new: "New layout. You checked N things." / recognized: "Recognized from a file you checked earlier." |
| `"error"` | the error message; `error` holds the error body's `{"message", "fix"}` |

`step` is `"header"`, `"granite"`, `"cleaning"`, `"records"`, or `"done"`. For a recognized file, the granite step's
`state` is `"not_needed"`.

### FileResult (upload response)
```json
{"file_id": "f1", "source_file": "shift1_log.csv", "recognized": false, "format_id": null,
 "status": "needs_check", "questions": [], "matched": [], "new_columns": [],
 "steps": [], "timings": {"header": 0.05, "granite": 3.2, "cleaning": 0, "records": 0},
 "fell_back": false}
```
`fell_back: true` means Granite's answer could not be read after one retry (the Check screen shows the warning bar).
A recognized file has `status: "ready"` and no questions; its records are already built.

### SaveResult (after answers are sent)
```json
{"file_id": "f1", "format_id": "fmt1", "entries": 82, "held": 1, "data_rows": 83, "status": "ready"}
```

### FileDetail (Details panel)
```json
{"file_id": "f1", "source_file": "shift1_log.csv", "recognized": false, "steps": [], "counters": {}}
```

### FileRow (Files screen list)
```json
{"file_id": "f1", "source_file": "shift1_log.csv", "status": "ready", "sentence": "New layout. You checked 3 things.",
 "entries": 82, "held": 1}
```

### FileView (See the file)
```json
{"file_id": "f1", "source_file": "shift1_log.csv",
 "columns": [{"position": 0, "header": "Ref", "field": "lot", "decided_by": "person", "rows_changed": 0}],
 "rows": [{"source_row": 1, "kind": "skipped", "reason_text": "title row", "raw": ["DEMO SHOP SHIFT LOG"], "clean": null},
          {"source_row": 5, "kind": "entry", "reason_text": null, "raw": ["4384", "5/3/21 6:01a"], "clean": ["4384", "2021-05-03T06:01"]},
          {"source_row": 31, "kind": "held", "reason_text": "No lot number", "raw": ["", "..."], "clean": null}],
 "total_rows": 87}
```
The first 50 lines of the file (header line included as `kind: "header"`). `kind` is `"skipped"`, `"header"`,
`"entry"`, or `"held"`. `raw` and `clean` are lists aligned with `columns`; `clean` only for entries.

### RecordFilters and RecordPage (All records)
Query parameters (all optional): `q` (text matched against lot, part, operator), `machine`, `shift`, `date_from`,
`date_to` (`YYYY-MM-DD`, inclusive), `stop` (alarm code as stored, e.g. `A_101`), `only_cleaned` (`true`),
`only_held` (`true`), `page` (1-based, default 1). 50 rows per page.
```json
{"filters": {"q": null, "machine": "Press 3", "shift": null, "date_from": null, "date_to": null,
             "stop": "A_101", "only_cleaned": false, "only_held": false},
 "page": 1, "page_size": 50, "total": 219, "matching": 4,
 "rows": [],
 "options": {"machine": ["Press 1"], "shift": ["1st"], "stop": ["A_101"], "date_min": "2021-05-03", "date_max": "2021-05-09"}}
```
`rows` are Entries, or HeldRows when `only_held` is true.

### Timeline
```json
{"lot": "4417", "machine": "Press 3", "day": "2021-05-04",
 "lots": [{"lot": "4417", "start": "2021-05-04T16:15", "end": "2021-05-04T18:15", "role": "this"},
          {"lot": "4420", "start": "2021-05-04T18:16", "end": "2021-05-04T20:16", "role": "worth_checking"}],
 "stops": [{"time": "2021-05-04T16:15", "code": "A_101"}]}
```
`role` is `"this"`, `"worth_checking"`, or `"other"`. An entry's end is its start plus 2 hours (the length of a log block),
cut at the next entry on the same machine.

### RecordsQuestionReading (Ask your records, job 5, only if built)
```json
{"question": "Press 3 stops last week", "found": true,
 "filters": {"machine": "Press 3", "stop": null, "shift": null, "date_from": "2021-05-03", "date_to": "2021-05-09"}}
```
Nothing found: `found: false`, `filters: {}`.

### Settings
```json
{"window_hours": 4, "hand_time_minutes": null}
```

## 4. Routes (all JSON unless stated; prefix `/api`)

| Method and path | Body or query | Returns |
|---|---|---|
| `POST /api/files` | multipart, one file in part `file` | FileResult |
| `GET /api/files` | | list of FileRow |
| `GET /api/files/{file_id}/status` | | FileStatus |
| `POST /api/files/{file_id}/answers` | `{"answers": [Answer to a question]}` | SaveResult |
| `GET /api/files/{file_id}/detail` | | FileDetail |
| `GET /api/files/{file_id}/granite` | | list of GraniteExchange |
| `GET /api/files/{file_id}/view` | | FileView |
| `POST /api/find` | `{"text": "message or lot number"}` | Answer |
| `POST /api/draft` | `{"lot": "4417", "reading": RequestReading or null}` | Draft |
| `GET /api/held` | | list of HeldRow |
| `GET /api/records` | RecordFilters | RecordPage |
| `GET /api/records.csv` | RecordFilters | CSV file of the matching clean entries |
| `GET /api/timeline/{lot}` | | Timeline |
| `POST /api/records/ask` | `{"question": "..."}` | RecordsQuestionReading |
| `GET /api/settings` | | Settings |
| `PUT /api/settings` | Settings | Settings |

`POST /api/find` treats the text as a lot number (no Granite call) when, trimmed, it has no spaces and matches a stored
lot or is 1 to 12 letters, digits, or dashes. Otherwise it calls Granite job 3. The server runs on port 8000
(`PORT` overrides). The front end dev server proxies `/api` to it.

## 5. Back-end modules and their public functions

One public function per file unless listed. All are plain functions: input in, output out. Files are Python modules in
`backend/`. Tests are `tests/test_<module>.py`.

| Module (owner) | Function | In | Out |
|---|---|---|---|
| `reader.py` (A) | `read_table(path: str, source_file: str) -> dict` | file path, original file name | RawTable |
| `types.py` (A) | `profile_columns(headers: list[str], rows: list[list[str]]) -> list[dict]` | | list of ColumnProfile |
| `formats.py` (B) | `save_format(fmt: dict, folder: str) -> dict`, `load_formats(folder: str) -> list[dict]`, `match_format(headers: list[str], formats: list[dict]) -> dict` | Format dicts stored as one JSON file each in `folder` | Format (with `format_id` set), list of Format, FormatMatch |
| `granite.py` (lead) | `label_columns(profiles, file_id)`, `propose_merges(profiles, labels, file_id)`, `read_request(text)`, `draft_reply(reading, history, risk)`, `ask_records(question, options)` | | see 3; jobs 1 and 2 return `(proposals, fell_back: bool)` |
| `review.py` (R) | `build_questions(profiles: list[dict], labels: list[dict], merges: list[dict], fell_back: bool) -> dict` | | `{"questions": [Question], "matched": [MatchedColumn]}` |
| `build.py` (C) | `build_entries(table: dict, fmt: dict, file_id: str) -> dict` | RawTable, Format (mapping keyed by this file's headers) | `{"entries": [Entry], "held": [HeldRow], "values_cleaned": int, "unseen_values": [{"field", "value", "count"}]}` |
| `build.py` (C) | `normalize_time(text: str) -> str or None` (second public function, allowed) | | `YYYY-MM-DDTHH:MM` or `None` |
| `store.py` (C) | `connect(db_path)`, `save_entries(con, entries)`, `save_held(con, held)`, `lot_history(con, lot)`, `all_entries(con)`, `held_rows(con)`, `lot_numbers(con)`, `save_exchange(con, exchange)`, `exchanges(con, file_id)`, `save_counters(con, file_id, counters)`, `get_counters(con, file_id)` | | shapes above |
| `risk.py` (K) | `find_links(lot: str, entries: list[dict], window_hours: float = 4) -> dict` | | RiskResult |
| `fileview.py` (V) | `file_view(table, fmt, matched, entries, held, file_id) -> dict` | | FileView |
| `records.py` (L) | `query_records(con, filters, page)`, `records_csv(con, filters) -> str` | | RecordPage, CSV text |
| `timeline.py` (T) | `lot_timeline(lot, entries, risk) -> dict` | | Timeline |
| `progress.py` (N) | `set_step(file_id, step)`, `get_step(file_id)` (in memory) | | |
| `pipeline.py` (lead) | Glue used by `main.py` after swap-in: upload, answers to format, build, store. | | |
| `main.py` (S) | the routes in section 4 | | |

Supported dates in `normalize_time`: `5/4/21 4:15p`, `5/4/21 4:15 PM`, `5/4/2021 16:15`, `2021-05-04 14:02`,
`2021-05-04T14:02`, `2021-05-04` (date only), `04-May-2021 22:10`, `4-May-21 22:10`. Anything else returns `None` and
the row is held back with `bad_time`.

Building rules (Card C): a row whose `lot` is empty is held back `no_lot`; a row whose time does not normalize is held back
`bad_time`; a row with every cell empty is held back `empty` (checked first). `quantity` that is not a whole number
becomes `null` and the raw text stays in `original_row`. Text values are trimmed; then `value_rules` apply; a value of a
merged field (`machine`, `step`, `part`) that is not in the rules and not the clean name of any rule is kept unchanged and
counted in `unseen_values` (only when that field has rules).

## 6. Paths and settings

- Canned responses: `fixtures/canned/<shape>.json` (see the list in `fixtures/canned/README.md`).
- Data folder: env `DATA_DIR`, default `data/` (git-ignored). SQLite file `data/wrapper.db`, formats in `data/formats/`,
  uploads in `data/uploads/`.
- `MOCK_GRANITE=1` makes `granite.py` return the canned answers with no network call.
- The watsonx key, URL, project ID, and model ID come only from `.env` (`WATSONX_APIKEY`, `WATSONX_URL`,
  `WATSONX_PROJECT_ID`, `GRANITE_MODEL_ID`). Never in code or tests.
