# Mockup notes for the builder

The images show only the screen. Everything a builder needs that the image can't show is here. All values are placeholders. Only Friday's measured numbers get quoted.

## All screens
- Exactly one solid blue button per screen. Selected choice: dark border with a filled dot. Keyboard focus: blue outline.
- Machine stops are shown as "Machine stop, code N" with a triangle icon and words, never as a named fault. Dates are PIADE's real dates (2021).
- Side panels (Details, What Granite saw, Rows held back) share one pattern: page dimmed, Close always visible, Escape closes, focus stays inside.

## Files (1a, 1b)
- Row states: working (spinner and a status sentence), error (the fix on the same row), ready. No progress bar.
- "Find a record" is disabled (grey) until a file is ready.
- After the first Save, a toast appears once: "Saved. Files like shift1_log.csv are automatic from now on."

## Check (2a, 2b)
- 2a and 2b together cover all five question kinds in section 7.2.
- Granite's guess is pre-selected and labeled. A card with no guess has nothing selected, and Save stays disabled until it is answered.
- Keys: arrows move inside a card, Tab goes to the next card, Enter saves.
- "See the 8 matched columns" opens the matched list. It replaces the always-open grey box ("detail behind one link").
- When Granite's answer can't be read after one retry, the warning bar shows, every column becomes a question with no guess, and nothing is merged.

## What Granite saw (2c)
- Opens from Details on a file that used Granite (4b). "Show the exact request" expands the raw JSON.

## Find a record (3a, 3b, 3c)
- After a search, the pasted message collapses to one line with "New search". While Granite reads it: "Sending this message to IBM Granite..."
- Typing only a lot number skips Granite, and the "Granite read this as" line is not shown.
- Each step is one sentence that answers how, where, who, and how many. "See original row" opens the raw row in place.
- "Worth checking" is sorted by closeness. The 4-hour window is a setting, not shown on this screen.
- Reply headings: What we found / Other lots that may be affected / What we are doing now. Granite fills the first two from records only. The third is left for the person.
- If the reply fails, the same three headings show the facts as a plain list.
- 3c shows the edge states: before a search, no lot number found, no matching lot, and the reply fallback.

## Rows held back (3d), Print (3e)
- Rows are grouped by reason, with file and row numbers. "Show the original rows" expands them.
- Print uses a print-only layout of the lot history. A shop-floor code is a next step and is not built.

## Details (4a, 4b)
- Hollow grey steps mean the step was not needed. A green check means done. Words carry the meaning too.
- 4b's numbers: columns Granite got right before the check, and the measured token cost.

## See the file (1c), added 2026-11-12, built last
- Opens from "See the file" on any ready file row. It shows the raw file as a grid: skipped title and blank rows greyed with the reason, a row of tags above the header saying what each column became (dashed tag = kept as an extra detail), and held-back rows marked with the triangle and the reason.
- The switch flips between "Your file" (raw values) and "Cleaned" (clean value, with the old one struck through underneath).
- Clicking a column header highlights the column and shows one line under the grid: what it became, whether Granite or the person decided, how many rows changed, and Change (reopens that Check question).
- Show the first 50 rows only. No sorting, filtering, or editing. Use Carbon DataTable and ContentSwitcher.
- Demo use: beat 7 ("how it got there"). Toggle Your file to Cleaned on camera.
- Cut order: 9 of 12 (design doc section 12). Nothing else depends on it.

## All records with filters (1d), added 2026-11-12, built after 1c
- Opens from "See all records" under the result line on Files. It covers every record from every file.
- Filters: a search box (lot, part, operator), plus dropdowns for Machine, Shift, Dates, and Stop code. Two checkboxes: "Only rows that were cleaned" and "Only rows held back". Active filters show as removable chips, with "Clear all".
- The count line ("4 of 1,195 records match") updates as filters change. The switch flips between the files' raw values and the cleaned ones.
- Clicking a row opens that lot in Find a record. "Download these as CSV" exports the filtered clean records. It is a link, not a blue button.
- Filtering runs in the backend with SQLite queries. Show 50 rows per page using Carbon DataTable with pagination, Dropdown, Search, Checkbox, and Tag.
- Demo use: filter Press 3 and stop code 42 to show that the "worth checking" lots are really there in the data.
- Cut order: 3 of 12 (design doc section 12). Nothing else depends on it.

## v5.5 presentation features
- **Live steps (1a):** the four steps under the status sentence are Header, Granite, Cleaning, Records. Done: green check. Current: bold blue dot. Waiting: hollow dot. A recognized file shows Granite as not needed.
- **Time-saved line (3b):** two large numbers under Copy reply. The tool time comes from the app's own timer. The hand time comes from Friday's measured setting and is hidden until it has been entered.
- **Lot timeline (3b):** one strip of hours for the machine and day. Dark block: this lot. Outlined: lots worth checking on the same machine. Triangle: machine stop. Lots linked only by operator and shift aren't on the strip. A text list sits under it for screen readers.
- **Animated switch (1e):** columns change left to right over about 1 second. Old values slide under the new ones, struck through. Unchanged cells don't move. With reduced motion, it jumps straight to the end.
- **Shop-floor mode (5):** a header toggle on every screen. Carbon g100, 20 px body text, warning yellow on the stop icon. It is remembered in the browser.
- **Ask your records (1d):** the box above the filters. The Granite reading line sits under it with Change. Its result sets the same dropdowns and chips a person would.
