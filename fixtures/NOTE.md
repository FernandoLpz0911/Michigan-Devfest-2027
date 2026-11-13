# What is real in these files, and what was added

The three shift files are built by `make_fixtures.py` from the PIADE dataset:
Beghi et al., *Packaging Industry Anomaly DEtection (PIADE) Dataset*, Zenodo,
DOI 10.5281/zenodo.7071747, licensed CC BY 4.0. The raw PIADE file is not in
this repo. Run `python fixtures/make_fixtures.py path/to/raw_data.csv` to rebuild.

## Real (from PIADE, week of Mon May 3 to Sun May 9, 2021)

- **Times.** Each row is one machine's 2-hour block. Its time is the start of
  the first production interval in that block, as PIADE recorded it (PIADE's
  UTC times are used as plant wall-clock times).
- **Quantities.** The change in PIADE's output counter (`po`) over the block.
- **Stop codes.** The most frequent alarm code PIADE logged on that machine
  in that block (for example `A_101`). Blank when no alarm was logged.
- **Machines.** PIADE's five machines `s_1` to `s_5`.

## Added on Friday Nov 13, 2026 (made up, so the files look like a shop's logs)

- **Machine names and steps.** `s_1`, `s_2`, `s_3` are called Press 1, 2, 3
  (Stamping); `s_4` is Bench 2 (Deburring); `s_5` is Weld 1 (Welding).
- **Lot numbers.** Each stamping block starts a new lot. The next Deburring
  block, then the next Welding block, take the oldest waiting lot. Numbers are
  shifted so the demo lot is 4417.
- **Part numbers.** One part per press: B-118 (Press 1), B-305 (Press 2),
  B-220 (Press 3).
- **Operators and shifts.** Shift 1 is 06:00 to 14:00, shift 2 is 14:00 to
  22:00, shift 3 is 22:00 to 06:00. Operator IDs (never names) are fixed per
  machine and shift.
- **One file per shift,** each with its own layout: different header
  spellings, title rows above the header, and different date styles.
- **Mess added on purpose:**
  - `shift1_log.csv`: 3 title rows; two date columns (`Prod Dt` like
    `5/4/21 4:15p`, and `Logged`, a date only); Press 3 written as
    `Press 3`, `PRESS-3`, and `P3`; one row with no lot number.
  - `shift2_export.csv`: 2 title rows; ISO times; upper-case headers; one
    row whose time is `??`.
  - `shift3.xlsx`: 1 title row and a blank row; times like `04-May-2021 22:10`;
    `Comments` instead of `Notes`; one machine written `Press1`, a spelling
    not seen in the other files.

## Facts the demo relies on

- Lot 4417, part B-220, stamped on Press 3 on Tue May 4, 2021 at 16:15, stop
  code 101; deburred on Bench 2 on Fri May 7.
- Lot 4420 ran on Press 3 two hours later with the same stop code 101.
- Lot 4415 ran on Press 3 two hours earlier with stop code 1.
