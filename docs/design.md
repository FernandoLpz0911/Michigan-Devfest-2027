# Data Wrapper: Hackathon Design Doc

**Event:** Michigan DevFest + AI Hackathon 2026, Fri Nov 13, 8:00 AM to 8:00 PM ET (7 AM to 7 PM CT), Hollywood Casino Greektown, Detroit. Competing solo.
**Status:** Pre-event planning only. This doc holds decisions, mockup pictures, and outlines. It holds no project code, no Granite prompt text, and no finished submission text. Those are written on Friday.
**Version:** v5.6, Nov 12, 2026. v5.6 merges the three cut orders into one, ranked by judge points kept per build minute (section 12), and gives the presentation features their waves (3b, 3c). v5.5 simplifies the UI (fewer borders, notes moved to `mockups/builder-notes.md`) and adds eight presentation features chosen by Fernando, each with its own cut order (section 9.8): See the file, All records with filters, a time-saved line, an animated clean-up switch, live steps on the file row, shop-floor mode, a lot timeline, and Ask your records (Granite job 5, section 7.5). v5.4: v5.4 hardens the plan (section 16.7): structured JSON output for Granite, a verified cost per layout, PIADE attribution, a fairer hand-timed baseline, and a network backup. v5.3: v5.3 verifies the remaining open claims (section 4b; research/verified-facts.md facts 14 to 17). v5.2: v5.2 adds zero-build pitch additions (section 16.6): a reply shaped like an 8D containment step, CONNEX Michigan as a route to shops, and supplier emissions requests as the scale line. v5.1: Overnight research is folded in: verified numbers (section 4b), honest data labels and an answer-first demo order (section 5), a skeleton-first build order (section 12), and full agent cards in `build/subagent-cards.md`. Sources are in `research/verified-facts.md`. The pitch outline is in `pitch/pitch-plan.md`. v5 summary: Adds "what else is at risk" (chosen by Fernando to raise creativity): a buyer's message goes in, the lot history, the other lots worth checking, and a drafted reply come out. The idea was revised to close every problem found in the critique, then the UI was redrawn to match. Section 3 lists each change and why. Earlier versions are saved as backups in the project files.

## 1. Hard constraints from the official rules

- **watsonx is required:** the project must use watsonx.ai, watsonx.data, or IBM Granite models to be eligible for prizes.
- **The watsonx use must be credible:** IBM may disqualify entries without a credible or feasible use of watsonx.
- **Original work only:** nothing developed in any substantive form before the event. Winners may get a code review.
- **Pre-written design doc and AI coding assistants:** both allowed, confirmed by the organizers by email and in person, as long as no code exists before Friday (per Fernando, Nov 11). Keep the email.
- **Slides, script, and statements:** these are Submission material, and the organizers only approved the design doc. Until they say otherwise in writing, keep to outlines and talking points before Friday. The question to send them is in `pitch/pitch-plan.md`.
- **Third-party data and open source:** allowed. Check every license before it goes in the repo.
- **Submission deliverables:** (1) video demo, (2) written problem and solution statements, (3) written statement of how watsonx is used, (4) working code repo, optional.
- **Deadline conflict (unresolved):** the official rules say about 8:00 PM ET on Nov 13. The IBM Compete page says Nov 15 at 2:00 PM ET. Ask at check-in. Plan for Fri 8:00 PM ET.

## 2. Judging (25 points, average of judges' scores)

| Criterion (5 each) | What the judges ask (Compete page wording) |
|---|---|
| Completeness and feasibility | How feasible? How thought-out? How complete is the proof-of-concept? How clear is the application of IBM technology? |
| Creativity and innovation | How unique is the approach to applying AI? Is it differentiated in the market? |
| Design and usability | How good is the UX and ease of use? How quickly could target users adopt it? |
| Effectiveness and efficiency | High-priority issue? Achieves the goal efficiently? Measurable impact? Scales to more users or use cases? |
| Michigan impact | Keeps value, jobs, opportunity in Michigan? Real Michigan challenge, clear business value, working proof-of-concept, storytelling that positions Michigan as a technology innovator |

Past judges were most impressed by clean, well-handled data. Judges see the video and the written statements. They may never touch the app.

## 3. What changed in v4, and why

| # | Change | Why | Criterion it protects |
|---|---|---|---|
| 1 | Columns now map to eight named fields (lot, part, quantity, time, machine, operator, shift, process step), grouped under the five questions. | With only five buckets, nothing marked which column was the lot number, so lot search could not work. | Completeness |
| 2 | Granite has a second job: cleaning values. It spots that "Press 3", "PRESS-3", and "P3" are one machine and proposes one name. | One labeling call per format was a thin use of watsonx, and the rules punish token use. Value clean-up is hard for rules and easy to see on screen. It is also the clean, well-handled data past judges liked. | Completeness (IBM clarity), Creativity |
| 3 | A column is also sent for review when two columns claim the same field, or when lot or time has no column at all. | The old rule compared types only, so production date and ship date both passed as "date" and the wrong one could be used silently. | Completeness, Effectiveness |
| 4 | Matched columns are listed on the Check screen instead of hidden behind a link. | The user must be able to see every mapping in a traceability tool. A short list costs little space. | Design and usability |
| 5 | A saved format is reused only if every mapped column is found again. A new or missing column sends just that column to Check. | A loose header match could apply the wrong mapping with no warning. | Completeness |
| 6 | A lot shows as a history: every step in time order, each with its source. | Real lots cross shifts and steps. One row per lot was wrong, and a history is what a buyer's auditor asks for. | Completeness, Michigan impact |
| 7 | Each step has "See the original row", showing the messy row above the clean one. | Messy to clean is the most persuasive picture in the project, and no screen showed it. | Effectiveness, Design |
| 8 | A business number is added: time to answer "who made lot X" by hand across the raw files, against time with the tool. | AI calls and seconds per file describe the app. Judges ask for measurable impact in the field. | Effectiveness |
| 9 | The story targets shops that already keep spreadsheets and machine exports. Paper is named as the reason those files are messy. | A shop that is only on paper has nothing to upload, so the old context argued against the product. The locked statement itself is unchanged. | Effectiveness, Michigan impact |
| 10 | Positioning leads with what import tools do not do: a buyer-ready lot history with a source on every line, value clean-up, and a human confirming once per format. | AI column matching alone is already sold. | Creativity |
| 11 | Simulated operator and lot columns are stated up front in the video and the statement. | The demo's key moment uses them. Volunteered, it reads as rigor. Discovered, it reads as hiding. | Completeness |
| 12 | Michigan claims get verified on Thursday, with sources, plus one named local route to shops. | Nothing in the story was verified, and nothing was specific to Michigan. | Michigan impact |
| 13 | The Agriculture file is cut from the build and becomes one sentence about what comes next. | It cost 45 minutes, its dataset had no coordinates, and the time is worth more on value clean-up and the video. "Potential to scale" needs an argument, not a second demo. | Effectiveness, Completeness |
| 14 | Cancel, Undo, lot suggestions, and the progress bar are cut. Export becomes the browser's Print. | Each was drawn but costly to build right, and a faked progress bar is dishonest status. | Completeness |
| 15 | The step line is replaced by two plain places: Files and Find a record. Check appears inside Files only when needed. | The step line claimed three steps in order, which was false for recognized files. | Design and usability |
| 16 | "AI was needed for only 1 of 3" is a large line on the Files screen. | In small grey text it would not survive a compressed video. | Effectiveness |
| 17 | The source is stated once per step, not once per line. "Complete" is removed. | Repeating it five times was noise, and "Complete" had no meaning. | Design and usability |
| 18 | The video and statements get protected time, and the feature freeze is fixed. | They are the only things judges are sure to see. | All five |
| 19 | **v5:** the tool now answers the buyer's second question, "what else is at risk?" It lists every other lot that shared a machine, shift, or time window with the lot in question, with the reason for each. | A lookup is useful but ordinary. Turning clean records into a containment decision is what import tools do not do, and recalls are a problem every Michigan auto supplier knows. A shop checks three lots instead of a week of production. | Creativity, Effectiveness, Michigan impact |
| 20 | **v5:** Granite reads the buyer's message and drafts the reply from the records, with a person confirming both. | Granite is now used on every request, not only once per file layout. The use of watsonx is plainly central. | Completeness (IBM clarity), Creativity |
| 21 | **v5:** a machine alarm field is added, taken from the real alarm data in PIADE. | "Press 3 logged an alarm during this run" comes from real equipment data, which makes the at-risk list credible and joins machine data to people's records. | Completeness, Creativity |
| 22 | **v5:** containment is built last, as a layer on a working core, with its own checkpoint. | It adds about two hours to a full day. If the core is late, it is dropped and v4 still stands. | Completeness |
| 23 | **v5.1:** the video shows the answer first, then how the files got clean. | A judge's own published advice: show the solution within about 90 seconds, one person, one flow. | Design, Creativity |
| 24 | **v5.1:** the data disclosure is exact. Real: machine times, counts, stop codes, from packaging machines. Added: lots, people, parts, names, the mess. | A winner's code may be reviewed, and a judge who opens the dataset would see the difference. Saying it first reads as rigor. | Completeness |
| 25 | **v5.1:** the build starts with a skeleton of canned routes, and real modules are swapped in. | Removes the late-day joining risk, which is the most likely way to lose Completeness points. | Completeness |
| 26 | **v5.1:** claims are backed by checked sources or cut. Clause 8.5.2.1 is tied to the at-risk list. | Michigan impact is scored on evidence, and one wrong number costs trust on every other line. | Michigan impact, Effectiveness |
| 27 | **v5.5:** the UI is simplified: fewer bordered boxes, one sentence per lot step, the pasted message collapses after search, and "Matched for you" moves behind one link (reverses change 4). Builder notes live in `mockups/builder-notes.md`, not on the pictures. | Fernando found the screens cluttered. The matched list is still one click away. | Design and usability |
| 28 | **v5.5:** the reply's middle heading becomes "Other lots that may be affected", and the third, "What we are doing now", is left for the person. | "Suspect" read badly, and the buyer's own words are "what else may be affected". Granite cannot know what the shop is doing, so it doesn't invent it. | Design, Effectiveness |
| 29 | **v5.5:** eight presentation features are added as a layer after the core, each with its own cut point (section 9.8). | Non-technical judges respond to seeing the change happen. Each one is cut independently, so none can sink the core. | Design, Creativity, Effectiveness |
| 30 | **v5.6:** one cut order, in section 12, ranked by points kept per build minute. Features the video never shows go first, hero-screen items last. Waves 3b and 3c get times and a gate. | Three lists disagreed, and the new features had no time slot. | Completeness |

**Honest ceiling.** These changes remove every point loss found so far. They do not guarantee 25. Three things remain outside the plan's control: no real shop has used the tool, part of the data is simulated, and judges weigh originality by taste. A fair estimate is 22 to 23 with containment working, and 20 to 21 if it has to be dropped. Finishing matters more than any single feature. The one thing that could still raise it is in section 11: a ten-minute opinion from someone who works in a Michigan shop.

## 4. Problem, story, and positioning

### 4a. Problem and Michigan impact statement (locked)

"Without traceable documentation, small Michigan shops lose contracts to overseas or out-of-state competitors, costing Michigan workers their jobs. Our tool lets small shops produce documentation that's traceable to who made it, what was made, and how it was made, at a fraction of the cost of an MES rollout or consultants so that companies can focus on manufacturing efforts while keeping manufacturing contracts in Michigan."

### 4b. Supporting context (v5.1: checked overnight, sources in `research/verified-facts.md`)

- **Verified:** Michigan has 109,600 auto parts manufacturing jobs and 19.3% of all U.S. auto jobs, the most of any state. Parts jobs fell by 4,000 in the year to June 2026 (CAR and MEDC dashboard, Q2 2026). Do not say traceability caused the drop.
- **Verified from summaries:** IATF 16949 clause 8.5.2.1 asks suppliers to identify suspect product, segregate it, and meet the customer's response time. Those are the three things the tool does. The standard is paid, so never put quotation marks around clause text.
- **Verified:** half of surveyed U.S. plants still decide from manual logs, paper, and spreadsheets, and 9% can find a root cause immediately (L2L survey, 2026).
- **Verified:** Granite is open source (Apache 2.0) and can run locally, so a shop could later keep its data in the building.
- **Say with a caveat:** a traditional on-site MES runs about $250,000 to $500,000 over three years (a vendor's estimate; cloud MES is cheaper). Never claim the tool replaces an MES.
- **Say with a caveat:** in 2020 the state said 12% of small and midsize manufacturers had adopted Industry 4.0 tools. Automation Alley and the Michigan Manufacturing Technology Center are the named routes to shops. Do not imply they endorse the project.
- **Verified (v5.2):** Ford's Supplier Code of Conduct (April 2025) asks suppliers to report Scope 1, 2 and 3 emissions to Ford on request. GM asked its suppliers to disclose emissions as early as 2019. Use for the scale line only.
- **Verified (v5.2):** CONNEX Michigan, run by the Michigan Manufacturers Association, is a searchable directory of Michigan suppliers' equipment, capabilities, and certifications. It is a named route to shops. Do not imply MMA endorses the project.
- **Verified (v5.3):** Michigan has 10,287 small manufacturing employers (under 500 workers), 94.4% of its manufacturing employers, employing 248,416 people (SBA Advocacy, 2021 data).
- **Verified (v5.3), the buyer's own words:** Michigan Tier 1 supplier manuals ask for exactly what the tool does. Adient asks for lot traceability on request, a containment plan in 24 hours, and an 8D. Containment problems can lead to New Business Hold, and the supplier pays for sorting. Nexteer asks for containment in 24 hours, the "break points where the non-conformance began and ended", and analysis to "identify any suspect material". These quotes from public documents now replace the paid IATF clause as the main evidence.
- **Still not a statistic:** "shops lose contracts for lack of traceability". Say the mechanism instead: a Tier 1 can put a supplier that can't contain a problem on New Business Hold.

**Who it is for:** the person in a small shop who already answers the buyer's paperwork requests.
**Answer to the layoff question:** that person keeps the job and does it faster. A shop that keeps its contracts keeps its jobs.

### 4c. Positioning points (ideas only; the statement is written Friday)

- It answers the two questions a buyer asks after a defect: what happened to this lot, and what else is at risk.
- Not another import tool. The output is a lot history and a short list of lots worth checking, with a source on every line.
- Granite does four things: reads meaning from cryptic headers, recognizes the same thing written three ways, reads the buyer's message, and drafts the reply from the records.
- The at-risk list itself is plain rules a person can check, not a model's opinion.
- A person confirms once per file layout. After that, files in that layout need no AI and no review.
- Granite models are open, so a shop could later run this without sending data out. Verify before saying it.
- The assumption being overturned: traceability needs a new system. Here the shop's own files are already the system.
- How people and AI share the work: Granite suggests and says why, a person decides, the decision is remembered, nothing is hidden.
- Real machine data joined to the records people keep. The demo's machine times and counts come from real equipment.
- Business case, to be filled with Thursday's verified numbers: who pays (the shop owner), what one new file layout costs in Granite tokens, the saving per buyer request from the hand-timed test, the route to shops, and a first pilot as the next step.
- What comes next (v5.2): the same clean machine records can answer a buyer's other data requests, such as the emissions data Ford's supplier code says it may ask for. One cleanup, many answers.
- Route to shops (v5.2): a shop that can show traceability has something to list in CONNEX Michigan, where buyers search Michigan suppliers. Pair it with Automation Alley and MMTC.
- What comes next: a printed lot sheet with a code that opens the lot history from the shop floor, and field lists for other industries, such as Michigan specialty-crop farms that run several record systems with no shared format.

## 5. Demo

**Data (v5.1, say this plainly in the video and the repo):** PIADE (Zenodo 7071747, CC BY 4.0) is from five real packaging machines, recorded 2020 to 2022.
- **Real:** when each machine ran and stopped, how many units it counted, and its stop codes.
- **Added for the demo:** lot numbers, part numbers, operators, shifts, process steps, friendly machine names, and the messy formatting of the three files.
- **Rules that follow:** show a stop as "Machine stop, code N", never as a named press fault. Keep the data's real dates. The fictional shop is labeled fictional on its first appearance. One caption in the video and one paragraph in the repo state the list above.

### 5a. Demo outline (beats only; v5.1 shows the answer first)

A judge's published advice is that the solution should appear within about 90 seconds and follow one person through one flow. So the video opens on the payoff and explains how afterward.

| # | Beat | On screen | Criterion |
|---|---|---|---|
| 1 | The ask | A buyer emails a small Michigan shop: burrs found on lot 4417, send the record, and tell us what else is affected. The shop is fictional and labeled so. | Michigan impact |
| 2 | By hand | A sped-up clip of answering both questions by hand in the three raw files, with the real time taken. | Effectiveness |
| 3 | Paste the email | The buyer's message goes into Find a record. "Granite read this as: Lot 4417, Part B-220, Problem: burrs." | Completeness (IBM clarity), Design |
| 4 | What happened | The lot history with both steps and the machine stop. Open "See the original row". | Completeness |
| 5 | What else is at risk | "Worth checking: 3 other lots", each with its reason, against the number of lots that week. | Creativity, Effectiveness |
| 6 | The reply | Granite's drafted reply, built from the records. Copy it. Show the time against beat 2. | Creativity, Effectiveness |
| 7 | How it got there | Back to Files: the first messy file goes in. "Asking IBM Granite what the columns mean". Check opens: 3 things need a look. | Completeness (IBM clarity) |
| 8 | Granite and a person | The lot number guess, the two date columns, three spellings of one machine. Answer one with the keyboard only. Save. | Creativity, Design |
| 9 | Never asked again | Files two and three: "Recognized. Nothing to check." Details: Granite not needed. AI was needed for 1 of 3. | Effectiveness and efficiency |
| 10 | Honest limits | What is real and what was added. Rows held back are shown, not dropped. Not yet tried in a real shop. | Completeness |
| 11 | Close | The two numbers, the measured AI cost, who pays and the route to shops, clause 8.5.2.1 in plain words, what comes next, the Michigan line. | Michigan impact |

The build order does not change: Files and Check are still built first. Only the video order changes.

If containment is dropped on Friday, beats 3, 5, and 6 become: type the lot number, show the history, show rows held back.

**Insurance:** screen-record beats 3, 7, and 8 the first time they work, in case the venue network fails later.

### 5b. Recording notes

- Record with the browser window narrow and zoomed in, so text is large on a small player.
- Zoom or crop on the Check cards, the Details panel, and the lot history.
- Captions on every beat, in one consistent style. Many judges watch without sound, and designers on the panel will judge the video's own design.
- One idea per shot. No screen stays up without a caption saying why it matters.
- Length and format come from the "Complete the hackathon" page on Friday.

## 6. Data model

| Question (shown to the user) | Field | Holds | One column only? |
|---|---|---|---|
| What was made | Lot number | The lot or batch ID. The search key. | Yes, required |
| What was made | Part number | The part ID | Yes |
| What was made | Quantity | Count made | Yes |
| When | Time | When this step was done, in one normalized format | Yes, required |
| Where | Machine | Machine or station name | Yes |
| Who made it | Operator | Operator ID. IDs only, never names. | Yes |
| Who made it | Shift | Shift name or number | Yes |
| How it was made | Process step | The operation performed | Yes |
| Where | Machine alarm | An alarm or stop code the machine logged during this step. Real data in PIADE. | Yes, optional |
| (none) | Extra detail | Any other column. Kept and shown with the original row. | No |

- **Entry:** one cleaned row. Holds the fields above, its source (file and row number), and the original row exactly as it was.
- **Lot history:** every entry with the same lot number, in time order.
- **Request reading:** what Granite read from a buyer's message: lot number, part, the problem described.
- **Link:** another lot connected to the lot in question, with the reason in words.
- **Held-back row:** a row that could not become an entry (no lot number, unreadable time), with the reason. Never dropped.

## 7. How a file is handled

### 7.1 Steps

1. **Find the header.** The first row that is mostly filled. Title rows, blanks, and notes above it are skipped.
2. **Known format?** A saved format is reused only if every column it mapped is found again in this file (fuzzy header match). If so, skip to step 7. A new or missing column sends only that column to step 5.
3. **Detect types.** Rules classify each column: date, number, or text.
4. **Ask IBM Granite, job 1: meaning.** Input per column: header, detected type, 5 distinct non-empty sample values spread across the column. Output: the field from section 6, up to two alternatives, a one-line reason, and whether it is sure.
5. **Ask IBM Granite, job 2: clean-up.** For the machine, process step, and part columns, input is the list of distinct values. Output: groups of values that mean the same thing, with one suggested name per group.
6. **Your check.** Only the questions in 7.2 are asked. Everything else is listed as matched. The confirmed mapping and clean-up rules are saved as the format.
7. **Clean the values.** Apply saved clean-up rules. Dates are normalized by rules, not AI. A spelling never seen before is kept as it is and counted in Details.
8. **Build the records.** Create entries with sources. Rows that fail go to held-back rows with a reason.

### 7.2 When the user is asked

| Trigger | Question shown |
|---|---|
| Granite is not sure about a column | "What is this column?" with Granite's guess first, up to two alternatives, and "Something else" |
| Detected type conflicts with the field (a number labeled as a time) | Same question, with the conflict said in one sentence |
| Two columns claim a field that takes one column | "Which one is it?" with both columns and their samples |
| No column was found for lot number or time | "Which column is the lot number?" |
| Granite proposes merging values | "Are these the same?" with the values and the suggested name |

Granite's own confidence number is never used. Each trigger is something the app can check for itself.

### 7.3 When Granite fails

If the answer does not parse, retry once. If it fails again, every column becomes a question with no guess, and no values are merged. The app never stops on a bad model response.

### 7.4 Answering a buyer's request

1. **Read the message. Granite, job 3.** Input: the pasted message. Output: lot number, part, and the problem described. The reading is shown with a Change link. If no lot number is found, the app asks for one. Typing a lot number skips this step.
2. **Show the lot history,** including any machine alarm on each step.
3. **Find what else is worth checking.** Plain rules, each one stated on screen:

| Rule | Reason shown |
|---|---|
| Same machine, within 4 hours before or after a step of this lot | "Same press, 35 minutes later" |
| Same machine and the same stop code | "Same machine stop, code 42" |
| Same operator and shift on the same day | "Same operator and shift, same day" |

   The list is sorted by closeness. The count is shown against all lots in the same week.
4. **Draft the reply. Granite, job 4.** Input: the request reading, the lot history, the list of links. Output: a short reply that states only what those records show. **v5.2:** the reply is laid out like the containment step (D3) of an 8D report, the problem-solving format auto buyers already expect: what was found, what is suspect, what is being held and checked. **v5.5:** the headings shown are "What we found", "Other lots that may be affected", and "What we are doing now". Granite fills only the first two. The third is left for the person, because no record says what the shop is doing. Only the layout changes, not the build. The person edits it and copies it. The app never sends anything.

**Guardrails**

- The list is called "worth checking", never "defective". It is a lead for the shop's quality person, not a verdict.
- The draft may only restate the records it was given. It is labeled as written by Granite, and the person must read it before use.
- If Granite fails on job 3, the app asks for the lot number. If it fails on job 4, the reply card shows the facts as a plain list.
- The 4-hour window is a setting the shop can change.

### 7.5 Ask your records (v5.5, Granite job 5, built last)

1. **Read the question. Granite, job 5.** Input: the typed question ("Press 3 stops last week") and the list of filters with their allowed values (machines, shifts, stop codes, and the date range in the data). Output: filter values only, chosen from those lists, using the same guided-choice output as job 1 (section 16.7, item 1).
2. **Apply them as chips.** The filters appear as removable chips on All records, with "Granite read this as" and Change, exactly like the reading of a buyer's message. The app runs the filters itself with plain database queries. Granite never sees the records and never writes a query.
3. **If it fails,** the box says "Couldn't read that. Use the filters below." Nothing else changes.

Guardrail: Granite picks filter values only. It cannot answer the question in its own words, so it cannot state anything the records don't show.

## 8. Numbers

Counted by the app, shown in the Details panel:

- AI calls for this file, and how many files needed AI
- Seconds from upload to records
- Columns Granite labeled correctly before any human fix, out of total
- Values cleaned, and rows held back
- Granite tokens for one new format, converted to cost

Measured by hand on Friday, for the statements and the video:

- Minutes to answer both of the buyer's questions by hand across the three raw files
- Seconds to answer them with the tool
- Lots worth checking, out of all lots that week

Only numbers measured on Friday are quoted. The mockup values are placeholders.

## 9. UI design (v4)

Mockup pictures for planning, in the `mockups/` folder. The throwaway file used to draw them is not saved and is not to be reused as front-end code. All values shown are placeholders.

**Look:** IBM's Carbon design system for type and color, because the judges are from IBM. Apple's Human Interface Guidelines and the HCI principles Fernando supplied are applied as rules (9.5), not as a visual style.

**Shape:** two places, Files and Find a record. Check opens inside Files only for a new kind of file.

### 9.1 Files

While working:

![Files, while a file is being handled](mockups/screen1a-files-working.png)

When done:

![Files, when ready](mockups/screen1b-files-done.png)

- One drop area. One row per file: an icon, the name, one sentence of status.
- While Granite is working, the row says so and says what is sent. This is honest status, and it puts IBM's technology on the default screen.
- An unreadable file says why and offers the fix on the same row.
- When files are ready, one large line states the result, with one main button under it.

### 9.2 Check

![Check](mockups/screen2a-check.png)

- The heading is the task: how many things need a look.
- One bordered card per question. Granite's guess is already selected and marked, so most of the time the user only confirms.
- At most four choices per card.
- **v5.5:** "See the 8 matched columns" opens the matched list, with one Change link. It is one click away rather than always shown.
- One main button. Back to files beside it. "What Granite saw" now opens from the Details panel of a file that used Granite (mockup screen2c), with the input sent and the answer returned.

### 9.3 Find a record

The request and what happened:

![Find a record: the request and the lot history](mockups/screen3a-find-record-request.png)

What else is at risk, and the reply (the same page, further down):

![Find a record: other lots worth checking and the drafted reply](mockups/screen3b-find-record-at-risk.png)

- One box takes a pasted message or a lot number.
- "Granite read this as" shows what was understood, with Change beside it. The person stays in control of the reading.
- The lot history: each step in time order, answering how, where, who, and how many, with its source stated once and "See the original row".
- A machine alarm is shown on the step it happened in, with words and a marker, never color alone.
- "Worth checking" lists other lots with the reason for each in plain words, and says how many lots were not linked.
- "Reply to the buyer" is Granite's draft from the records, labeled as such. Copy reply is the one main action once results are showing, so the search button becomes a quiet outline.
- Rows held back are one link at the bottom. Print lays the history out as a lot sheet.
- If no lot matches, the message says so and shows the closest lot numbers.

### 9.4 Details panel

![Details panel](mockups/screen4a-details-recognized.png)

- Opens from Details on a file row. The page behind is dimmed, and Close is always visible.
- Steps that were not needed are hollow and plain, including "Ask IBM Granite" on a recognized file.
- "Cleaned the values" says what changed and in how many rows.
- The numbers at the bottom come from section 8.

### 9.5 Rules for whoever builds this

1. Solid blue is for the one main action on a screen. Nothing else is solid blue. A selected choice is a dark outline with a filled dot. Links are underlined blue text.
2. Every action gets a visible response at once: a spinner with a status sentence, or a confirmation. No progress bar unless progress is really known.
3. Every screen has a way out: Back to files, Close, Change.
4. Every error says what happened in plain words and puts the fix on the same row.
5. Related things sit together inside one border. Unrelated things are separated by space.
6. Words are the shop's words. Never "template", "schema", "regex", "label", or "field".
7. Never rely on color alone. Pair it with an icon and words.
8. No more than four choices in one question.
9. Text is dark enough to read. No light grey on white. Body text is at least 16 px.
10. Everything works with the keyboard alone, in a sensible order, with a visible focus outline.
11. Every control has a name a screen reader can say. Icons that carry meaning have text beside them.
12. Targets are large enough for a gloved finger on a shop-floor touchscreen.
13. Motion is used only to show messy becoming clean: the original row settling into the clean row, and (v5.5) cells changing when the Your file / Cleaned switch flips. It is skipped when the device asks for reduced motion.
14. Use Carbon's own components wherever one exists. They are built to accessibility standards, so less has to be checked by hand.

### 9.6 Principle check

| Principle | Where it shows |
|---|---|
| Clarity, match the real world | Headings state the task. Choices are the shop's own questions. |
| Recognition over recall | Sample values sit beside every question. Matched columns are listed. The original row sits under the clean one. |
| Hick's law | Granite's guess is selected. Four choices at most. Only exceptions are asked. |
| Fitts's law | Large, equal choice targets. The main button sits directly under the content. |
| System status and feedback | Spinner with a sentence, result line, saved message, Details panel. |
| Forgiveness and control | Back to files, Change, Close. Nothing is dropped. Errors carry their fix. |
| Consistency | One meaning per style, across all screens. |
| Minimalism | One heading and one main action per screen. Detail is one click away. |
| Gestalt: proximity, common region, similarity, figure and ground, continuity | Source under its step. One card per question. Blue means action. Dimmed page behind the panel. Steps in time order down the page. |
| Apple: Responsibility | The status row says what is sent to Granite. |
| Apple: Agency | People can leave any screen and change any earlier answer. |
| Inclusive design | Keyboard-only use, screen-reader names, large targets, plain words, no reliance on color, readable type. Checked with an automated accessibility test on Friday. |
| Design for AI | The AI's guess is labeled as a guess, comes with a reason, shows what it saw, admits when it is unsure, and never overrides the person. Its reading of a message can be changed, its draft is labeled and editable, and the at-risk list is rules a person can check. |

### 9.7 Build order

1. Files (working, done, error) and Find a record with a typed lot number and the lot history.
2. Check with all question kinds and the matched list.
3. Details panel.
4. "See the original row", rows held back.
5. Pasted message, "Worth checking", and the drafted reply.
6. "What Granite saw", Print.
7. **v5.5:** "See the file" (before and after view, mockup screen1c). Wave 3b.
8. **v5.5:** "All records" with filters (mockup screen1d). Built after step 7.
9. **v5.5 features, in this order** (section 9.8): time-saved line, live steps on the file row, animated switch, shop-floor mode, lot timeline, Ask your records.

**Cut order:** one list for the whole build, in section 12 (v5.6). In short: Ask your records, fuzzy header match, All records, animated switch, Print, shop-floor mode, lot timeline, What Granite saw, See the file, then containment pieces. The time-saved line and live steps are kept.

### 9.8 Presentation features (v5.5)

Chosen by Fernando to make the demo land with non-technical judges. Each is independent, adds no new page except All records, and can be cut on its own. Times are estimates for one subagent.

| # | Feature | Where | What it does | Build | Criterion |
|---|---|---|---|---|---|
| A | See the file | Files, "See the file" on each row (screen1c) | The raw file as a grid. Skipped rows greyed with the reason, a tag over each column saying what it became, held-back rows marked. A Your file / Cleaned switch. Clicking a column explains it. | 40 min | Design, Effectiveness |
| B | All records with filters | Files, "See all records" (screen1d) | Every record from every file. Search, Machine, Shift, Dates, Stop code, "only cleaned", "only held back". Chips, a live count, and the raw/cleaned switch. Clicking a row opens the lot. Export as CSV. | 60 min | Effectiveness, Completeness |
| C | Time-saved line | Find a record, under the reply | "Answered in 41 s. By hand: 22 min." The first number is timed by the app from paste to reply. The second is the hand time measured on Friday, entered once as a setting. Never a made-up figure. | 10 min | Effectiveness |
| D | Animated clean-up switch | See the file and All records | When the switch flips, changed cells fade from the old value to the new one, one column after another, over about one second. Off under reduced motion. | 20 min | Design, Creativity |
| E | Live steps on the file row | Files, while working | The status sentence moves through the real steps as the backend reports them: "Found the header", "Asking IBM Granite...", "Cleaning 38 values", "Built 402 records". Same step names as the Details panel. | 20 min | Design, Completeness (IBM clarity) |
| F | Shop-floor mode | Header, a "Shop-floor mode" toggle | Carbon's dark theme (g100), body text at 20 px, larger targets. Remembered on that device. Shown on camera for a few seconds. | 20 min | Design (accessibility) |
| G | Lot timeline | Find a record, above "Worth checking" | One horizontal strip of hours for the machine the lot ran on. Lot 4417 is dark, the linked lots are outlined with their lot numbers, and the machine stop is the triangle. A text list sits under it for screen readers. Drawn with plain elements, not a chart library. | 45 min | Design, Creativity |
| H | Ask your records | All records, a box above the filters | Granite job 5 (section 7.5). A typed question becomes filter chips the person can see and change. | 60 to 90 min | Completeness (IBM clarity), Creativity |

**Rules for all eight:** no new solid blue button (rule 1). Every feature works with the keyboard. Nothing shows a number the app or Friday's timing didn't produce. Mockups: A screen1c, B and H screen1d, C and G screen3b, D screen1e, E screen1a, F screen5. Cards in `build/subagent-cards.md`: V (A), L (B), N (C, E), M (D, F), T (G), G3 (H).

## 10. Architecture

Stack confirmed by Fernando: common enough for AI coding agents to write and trace reliably.

```
 LAPTOP (everything runs here)                         IBM CLOUD
+------------------------------------------------+    +---------------------+
|  Browser                                       |    |  watsonx.ai         |
|  React + Carbon, single page                   |    |  Granite model in   |
|        |  JSON over HTTP on localhost          |    |  the hackathon      |
|        v                                       |    |  project            |
|  API server (Python, FastAPI)                  |    +---------------------+
|    - Reader           (pandas)                 |              ^
|    - Type detector    (rules)                  |              |
|    - Format store     (rapidfuzz)              |              | HTTPS, API key
|    - Granite client   (ibm-watsonx-ai SDK) ----+--------------+ only when the
|        jobs 1-2: meaning, clean-up             |                format is new,
|        jobs 3-4: read request, draft reply     |                or a message
|    - Risk rules                                |                is pasted
|    - Review rules                              |
|    - Cleaner and record builder                |
|    - Counters                                  |
|        |                                       |
|        v                                       |
|  SQLite file: formats, entries, held-back      |
|  rows, Granite exchanges, counters             |
+------------------------------------------------+
```

### 10.1 Where each thing lives

| Piece | Runs where | Why |
|---|---|---|
| Front end | Browser on the laptop | The deliverable is a video, so no hosting is needed |
| API server | Laptop, localhost | One process, one language |
| Data store | One SQLite file | No setup. Shop data stays on the machine except the samples sent to Granite |
| Granite | watsonx.ai, the project created Friday | The only outside call. Model and region come from the "Complete the hackathon" page |
| API key | A local env file, excluded from the repo | Never in the repo |

### 10.2 Calls between front end and back end

| Screen action | Front end asks | Back end does | Returns |
|---|---|---|---|
| Drop a file | Upload file | Steps 1 to 5 of section 7.1, or steps 1, 2, 7, 8 if recognized | File ID, recognized or new, questions, matched list, timings |
| Poll a file | Get file status | Read current step | The status sentence for the row |
| Save and continue | Send the answers | Save the format, clean values, build records | Counts of entries and held-back rows |
| Details | Get file detail | Read steps and counters | Steps with what happened, the numbers |
| What Granite saw | Get Granite exchange | Read the stored input and output | Both, for both jobs |
| Find a record | Send the message or lot number | Granite job 3 if it is a message. Query entries. Apply the risk rules. | Request reading, lot history, links with reasons, lots in the week. Or closest lot numbers. |
| Draft the reply | Ask for a draft | Granite job 4 from the history and links | The draft text |
| Rows held back | Get held-back rows | Query | Rows and reasons |

### 10.3 Risks

- **Venue network:** a new format and a pasted message need the internet. A typed lot number does not. Record those beats as soon as they work.
- **Two languages for one person:** if the 14:15 checkpoint fails, fall back to a Python-only UI (Streamlit).
- **Sample values leave the laptop:** say so in the watsonx statement. Operator IDs only.
- **v5.4, venue Wi-Fi fails:** test a phone hotspot with the watsonx call at check-in, and keep the canned Granite answers from Card 0 so that every beat except a live call can still be recorded.

## 11. Thursday prep (no project code)

Done overnight: Michigan job figures, the IATF clause, Granite's license, the route to shops, a manufacturing survey. See `research/verified-facts.md`.

In order of value:
1. **Email the organizer one question:** may slides and a script be prepared before the event, or only outlines? The wording is in `pitch/pitch-plan.md`. Until the answer comes, outlines only.
2. **Download PIADE (raw file only) and look at it.** Confirm the alarm column has enough different stop codes in one week on one machine to make "same alarm" a meaningful rule. If not, the rule becomes "any stop during the run".
3. **Open each slide-strength link yourself** and confirm the figure. Anything you cannot confirm comes off the slide.
4. **Still to find:** a direct count of small Michigan manufacturers (Census County Business Patterns or the Michigan Manufacturers Association), and an MES cost source that is not a vendor.
5. **Optional, highest value:** show the mockups to one person who works in a Michigan shop. Ask whether this lot history and at-risk list would answer a buyer. Ask permission to quote them.
6. Tooling dry run from section 16.5, in a scratch folder that is deleted afterward.
7. On paper: pick the demo lot, its two steps, and which three other lots should come up as worth checking and why.
8. Skim the Education tab for the Granite and watsonx.ai material. Charge the laptop, bring a power bank and the parking QR code. Sleep.
 Friday plan (ET)

| Time | Work |
|---|---|
| 8:00 to 9:00 | Check-in and keynote. Ask about the deadline and the video length. Accounts, credits, API key. Create the repo. |
| 9:00 to 9:30 | Card 0. First Granite call with one real column sample. Test how to get reliable JSON back before anything depends on it. **v5.4:** try the SDK's built-in options first (16.7, item 1), in this order: a JSON schema, then JSON mode, then plain text with one retry. Save the answer as the canned response. |
| 9:30 to 10:00 | Write the contract file. Build the three messy shift files from PIADE with the added columns. |
| 10:00 to 10:45 | Card S: every route exists and returns canned data. Cards D and E start against it. All three screens are clickable by 10:45. |
| 10:00 to 12:15 | Cards A, B, R, C, K run in parallel as stand-alone modules with their own checks. The lead builds G1 (Granite jobs 1 and 2) from 10:45. |
| 12:15 to 12:45 | Lunch. |
| 12:45 to 14:15 | Swap real modules in behind the routes, one at a time: A, B, G1, C. Check works end to end. Record beats 7 and 8 when they work. |
| 14:15 to 15:15 | Swap in R. Find a record works with a typed lot number: history, original row, Details panel. |
| 15:15 to 16:15 | Containment: G2 (Granite jobs 3 and 4) and K wired. "Worth checking" and the reply. Record beat 3 when it works. |
| 16:15 to 16:30 | Rows held back. Accessibility check and a keyboard-only pass. |
| 16:30 to 17:00 | Feature freeze at 16:30. Take every measurement in section 8, including the hand-timed one. Run the self-score in 16.3. |
| 17:00 to 19:15 | Record and edit the video. Write the three statements. Clean up the repo, with the data disclosure in the readme. |
| 19:15 to 19:45 | Submit. |
| 19:45 to 20:00 | Buffer. |

**Why skeleton first (v5.1):** the usual way a one-day build fails is at the join, late in the day. With canned routes up by 10:45 the screens are demo-able from mid-morning, and each real module replaces a canned answer without touching the front end.

**Cut order (v5.6, the only one; every other file points here; first cut first).** Ranked by judge points kept per build minute. What the video never shows goes first, and what sits on the hero screens goes last.

1. Ask your records (Card G3). 60 to 90 minutes of the lead's time, and not in the video. Build it only if the deadline is confirmed as Nov 15.
2. Fuzzy header match. Use an exact header match instead. You make the demo files, so nothing changes on camera.
3. All records (Card L). 75 minutes for at most a proof shot.
4. Animated switch (Card M, first half). Polish on a screen the video shows for a few seconds.
5. Print lot sheet. Becomes one "what comes next" sentence.
6. Shop-floor mode (Card M, second half). The keyboard-only pass on camera already proves accessibility.
7. Lot timeline (Card T). The "Worth checking" list states the same facts in text.
8. What Granite saw. The Check reasons and the "Granite read this as" line still show what Granite did.
9. See the file (Card V). Beat 7 falls back to the Files screen.
10. The drafted reply. Show the facts as a list under the same three 8D headings.
11. The pasted message. Type the lot number, and beat 3 becomes typing it.
12. The confirm step for value merges. Show no merges rather than unconfirmed ones.

**Keep unless broken** (cheap and in the video): the time-saved line and live steps (Card N), rows held back, and the "Worth checking" list (dropped only by the checkpoints below).
**Never cut:** Granite jobs 1 and 2, the Check screen, the lot history with source and original row, the Details panel, the hand-timed number, the video.

**Checkpoints:** at 14:15, if Check does not work end to end, drop containment, switch to the Streamlit fallback, and apply cuts 1 to 12. At 15:15, if the lot history does not work with a typed lot number, skip containment, apply cuts 1 to 9, and finish the core. At 15:15, if it does work, wave 3c may start.

**Waves for the presentation features (v5.6):** wave 3b (12:45 to 14:15) runs Card V, then Card N's front end, against canned routes while the lead swaps in; Card L only if an agent is free. Wave 3c (15:15 to 16:15) runs Cards T and then M, only if the 15:15 checkpoint passed, while the lead builds G2 and K. The lead reviews them in 16:15 to 16:30, at most 10 minutes; a card that fails review once is cut. Card G3 is not scheduled on Friday's clock.

## 13. Build handoff for subagents

Smaller models do well-bounded tasks from this doc. The contract becomes a real file on Friday morning, not before.

### 13.1 Layout principles

- One job per file, one public function each. An agent reads its own file and the contract, nothing else.
- One shared contract, edited only by the lead.
- Plain functions. Input in, output out, no hidden state.
- A canned Granite response lets everything else be built with no network.

### 13.2 Repo layout (created Friday)

| Path | Holds | Owner |
|---|---|---|
| docs/design.md | This doc | Lead |
| docs/contract.md | The shared shapes from 13.3 | Lead only |
| backend/main | The routes from 10.2, nothing else | Agent F |
| backend/reader | Read CSV or Excel, find the header row | Agent A |
| backend/types | Detect date, number, text | Agent A |
| backend/formats | Save, load, and match formats | Agent B |
| backend/granite | All five Granite jobs (job 5 is v5.5, built last), parse, retry, fallback | Lead |
| backend/risk | The rules of 7.4: given a lot, return linked lots with reasons | Agent K |
| backend/review | Turn proposals into the questions of 7.2 | Agent R |
| backend/build | Clean values, build entries, held-back rows | Agent C |
| backend/store | SQLite read and write, counters | Agent C |
| frontend/screens | Files, Check, Find a record | Agents D and E |
| frontend/parts | File row, question card, step card, details panel | Agents D and E |
| fixtures/ | Three messy shift files, canned Granite responses | Lead |
| tests/ | One test file per back-end module | Each module's agent |

### 13.3 Shared shapes (described here, written as the contract file on Friday)

| Shape | Contains |
|---|---|
| Field | One of the ten names in section 6 |
| Column profile | Header, position, detected type, five sample values, distinct values for text columns |
| Label proposal | Column, field, up to two alternatives, reason, sure or not |
| Merge proposal | Column, the values to merge, the suggested name |
| Question | Kind (unsure, type conflict, duplicate, missing, merge), columns involved, sentence, choices, which is pre-selected |
| Format | Header list, column-to-field mapping, value rules |
| Entry | The nine fields, extra details, source file, source row, original row |
| Lot history | Lot number, part, entries in time order |
| Request reading | Lot number, part, problem described, or nothing found |
| Link | Lot number, reason in words, how close in time |
| Answer | Request reading, lot history, links, lots in the week |
| Held-back row | File, row, original row, reason |
| File result | File ID, recognized or new, questions, matched list, steps with what happened, timings |
| Counters | The numbers in section 8 |

### 13.4 Task cards

**v5.1:** the full cards, with what each agent owns, reads, must not touch, and its time box, are in `build/subagent-cards.md`. That file wins where it differs from the table below.

**Event-day entry point:** `docs/workflow.md` gives every builder the reading map, settled conflicts, setup checklist, review and swap-in steps, and cuts. Cards V (See the file) and L (All records) are in the cards file.

Give each agent this doc, the contract file, and its card only.

| # | Task | Needs | Done when | Model tier |
|---|---|---|---|---|
| 0 | Contract file, layout, three fixture files, canned Granite responses for both jobs | Nothing | Files exist and a real Granite call has returned parseable output | Lead |
| A | Reader and type detector | Contract, fixtures | Each fixture returns the right header row and a column profile per column. Tests pass. | Small |
| B | Format save, load, match | Contract | Fixtures 2 and 3 match the format saved from fixture 1. A file with one extra column reports that column. An unrelated file does not match. Tests pass. | Small |
| R | Review rules | Contract, canned responses | Given the canned proposals for fixture 1, returns exactly the questions in 7.2: the unsure lot column, the two date columns, the machine merge. Tests cover all five kinds. | Mid |
| C | Cleaner, record builder, store | Contract, a format | Fixture 1 with a known format yields entries with sources and original rows. Machine spellings are merged. Bad rows are held back with reasons. Row counts add up. Lot history is in time order. Tests pass. | Mid |
| G | Granite client, four jobs | Contract, API key, canned responses | Jobs 1 and 2 return label and merge proposals for fixture 1. Job 3 reads the sample buyer message into a request reading. Job 4 returns a draft that names only lots and facts it was given. A deliberately broken response triggers one retry, then the fallbacks in 7.3 and 7.4. | Lead with the strongest model |
| K | Risk rules | Contract, sample entries | Given a lot, returns the linked lots for each rule in 7.4 with the right reason, sorted by closeness, and the count of lots in the week. A lot with no links returns an empty list. Tests cover each rule. | Small |
| D | Files and Check screens | Contract, canned File result | Both render from canned data with no back end, match the mockups, and follow the rules in 9.5. Working, done, and error states exist. Every question kind renders. Every question can be answered with the keyboard alone. | Mid |
| E | Find a record and the Details panel | Contract, a canned Answer | The box takes a message or a lot number. The reading, lot history with alarm, "Worth checking", and the reply card render from canned data. No-match state exists. Details panel shows steps and numbers. Matches the mockups. Keyboard reaches everything, and Escape closes the panel. | Small |
| F | API routes and counters | A, B, C, R, G finished | Every row in 10.2 works with fixture 1, then fixture 2 with no Granite call. | Mid |
| H | Wire front end to API, polish | D, E, F, K finished | Beats 4 to 10 of the demo run without touching code. | Lead |

**Order:** 0, then A, B, R, C, D, E, K in parallel while the lead does G jobs 1 and 2, then F, then H for the core, then G jobs 3 and 4 and the containment wiring.

### 13.5 Standing instructions for every subagent

- Edit only the files on your card. Never edit the contract. If the contract seems wrong, stop and report.
- Use the shapes in the contract exactly, with the same names.
- Write the test first from the "done when" line, then the code.
- No new dependencies beyond those in section 10 without asking.
- Never write the API key into any file. Read it from the environment.
- Report back with: files changed, tests run and their result, anything assumed.

### 13.6 Where this plan is most likely to break

- **Agents drifting from the contract.** The lead checks each returned module against it before task F.
- **Granite's clean-up answer being inconsistent.** Keep the distinct-value list short, and fall back to no merges rather than wrong merges.
- **Integration running long.** The 14:15 and 15:15 checkpoints exist for this.
- **The drafted reply saying something the records do not.** Give Granite only the facts, and keep the plain-list fallback ready.

## 14. Still open

1. **Deadline.** Fri 8:00 PM ET or Nov 15 2:00 PM ET? Ask at check-in.
2. **Video length and format.** Check the "Complete the hackathon" page on Friday.
3. **The claims in section 11.** Verified Nov 12 (v5.3). Only a contracts-lost statistic and a dollar cost of containment remain without a source; see research/verified-facts.md.

## 15. Planning for the likely judges

Fernando expects last year's judges to return: Hoda Solati and Shima Solati (UX designers at BraunAbility, inclusive and accessible design, emerging technology), Tim Moore (founder and CEO of Clixie AI, angel adviser, pitch coach), and possibly Roland Frohman III (Design Lead for connected products at BISSELL, adjunct at the College for Creative Studies). The panel is not confirmed, and IBM staff may also judge.

Web research added little beyond their public bios, so what follows is inference from those bios, not from anything they have said about judging. Every item below also scores on the official criteria, so nothing is wasted if the panel changes.

| Likely interest | Read from | What the plan does about it | Criterion it also serves |
|---|---|---|---|
| Inclusive, accessible design | Hoda and Shima Solati's work at BraunAbility | Accessibility is built in and shown: keyboard-only use on camera, screen-reader names, large targets, plain words, readable type, an automated check on Friday with the result stated honestly (9.5 rules 9 to 14) | Design and usability |
| How people and AI work together | The three designers present a "Design for AI" workshop | The Check screen is presented as the designed handoff: Granite suggests and says why, a person decides, the decision is remembered. "What Granite saw" makes it inspectable. | Completeness (IBM clarity), Creativity |
| Challenging an assumption, not polishing a convention | The workshop description | The story opens by naming the assumption it overturns: that traceability needs a new system | Creativity |
| Physical and digital joined up | Roland Frohman's connected-product work | Real machine alarms are joined to people's records and drive the at-risk list, and the printed lot sheet is the physical handoff. A code on the sheet that opens the history is named as the next step. | Effectiveness (scale), Creativity |
| A business that could exist | Tim Moore's founder, investor, and pitch-coach background | The close states who pays, the measured cost and saving, the route to shops, and a first pilot | Effectiveness, Michigan impact |
| Craft | Design and animation backgrounds | One purposeful motion, consistent captions, one idea per shot, nothing on screen without a reason | Design and usability |

**What not to do**

- Do not name or flatter judges in the video or statements.
- Do not claim an accessibility standard is met unless the Friday check shows it. Say what was tested and what was found.
- Do not add features for a guessed judge that cost build time. Everything above is behavior or wording, except the keyboard and screen-reader work, which Carbon's components mostly provide.
- If their workshop runs before the submission deadline and its materials are public, a quick look is fair. Contacting judges about the project is not.

## 16. Raising the score without building more

The build plan is full. One more feature lowers the chance of finishing, and finishing is the largest factor in the score. Every item here raises the score without adding build time on Friday. None of it is code or finished submission text.

### 16.6 Additions evaluated (v5.2)

Every candidate was judged on score gained against Friday build time. Only zero-build or near-zero items were added.

| Candidate | Decision | Why | Criterion |
|---|---|---|---|
| Reply laid out like an 8D containment step (D3) | **Added** (7.4) | Same Granite call, new layout. Auto quality people recognize it at once, so it reads as built for the field. | Effectiveness, Michigan impact |
| CONNEX Michigan as a named route to shops | **Added** (4b, 4c, 16.4) | A real Michigan channel strengthens "who pays and how it reaches shops". | Michigan impact, Effectiveness |
| Supplier emissions requests as the scale line | **Added** (4b, 4c) | Verified buyer demand. Shows one cleanup serving many buyer requests without a second demo. | Effectiveness (scale) |
| "Doesn't CONNEX or an MES do this?" answer | **Added** (16.4) | Pre-empts the market-differentiation question. | Creativity |
| Run Granite locally through Ollama on camera | Rejected | A second runtime to set up and debug. The privacy line already says it as a next step. | |
| A watsonx.data or watsonx.governance layer | Rejected | Adds setup risk for a small gain in IBM clarity. Four Granite jobs already make the use clear. | |
| Emissions calculator built in | Rejected | New feature, simulated energy data, and math judges will question. Kept as a sentence. | |
| A QR code on the printed lot sheet that works | Rejected | Needs a hosted URL. Stays a named next step. | |
| A second dataset or industry demo | Rejected | Already cut in v4 (change 13). Scale is argued, not shown. | |
| RFQ-to-shop matching | Rejected | No open Michigan capability data, and CONNEX already does it. | |

### 16.7 Hardening pass (v5.4)

Each item lowers a risk or makes a claim checkable. None adds a feature.

| # | Item | What changes | Evidence | Criterion |
|---|---|---|---|---|
| 1 | Reliable JSON from Granite | The watsonx Python SDK's chat parameters include `response_format` (json_object or json_schema) and guided decoding (`guided_choice`, `guided_json`). Column meaning is a pick from a fixed list of eight fields plus extra, so a fixed list of choices fits it exactly. Whether a given Granite model honors these is tested at 9:00, and the retry-then-unknown fallback stays. | [SDK parameter reference v1.9.1](https://ibm.github.io/watsonx-ai-python-sdk/v1.9.1/fm_schema.html) | Completeness |
| 2 | A real cost line | granite-4-h-small is listed at about $0.06 per million input tokens and $0.27 per million output tokens on pay-as-you-go. The free plan includes up to 300,000 tokens a month. Friday's measured tokens per layout turn into a cost that will likely be a fraction of a cent. Say the measured number, not this estimate. | [IBM watsonx pricing](https://www.ibm.com/watsonx/pricing); research fact 18 | Effectiveness, Michigan impact (business value) |
| 3 | PIADE attribution | CC BY 4.0 requires credit. Put the citation (Beghi et al., PIADE, Zenodo, DOI 10.5281/zenodo.7071747, CC BY 4.0) and the list of changes made to it in the readme, and a one-line credit in the video's end card. | [Zenodo record](https://zenodo.org/record/7071747) | Rules (third-party data must follow its license) |
| 4 | A fairer hand-timed baseline | You built the messy files, so your own hand time is faster than a stranger's. That makes the comparison conservative, so say so. If another participant will spend five minutes, time them cold on the same two questions and report both times. | Reasoning, no source needed | Effectiveness (measurable impact) |
| 5 | PIADE has enough alarms | 429,394 intervals across five machines over about two years, with 133 alarm types. "Same alarm" should have matches in a demo week. Still look at one week on Thursday (section 11, item 2), since per-machine counts aren't published. | Zenodo record | Completeness |
| 6 | Optional only if ahead at 16:30 | Run Granite's column-meaning job on the extra headers from all three files and report "labeled N of M correctly before any human fix". This is already counted in section 8, so no new work, just say it on screen. | | Completeness, Effectiveness |

### 16.1 Video shot list (assumes about 3 minutes; rescale once the real limit is known)

**v5.1:** shoot in the beat order of section 5a (answer first). Where the list below is in the old order, 5a wins.

| Beat | Seconds | Shot | Caption carries |
|---|---|---|---|
| 1 The ask | 10 | The buyer's email, full screen | The two questions being asked |
| 2 The mess | 15 | Three raw files side by side, then a zoom on one ugly row | What is real, what is simulated |
| 3 By hand | 15 | Sped-up screen capture with a running clock | The minutes it took |
| 4 First file in | 15 | Files screen, the Granite status row | What is sent to Granite |
| 5 Granite cleans up | 25 | The three Check cards, one answered by keyboard | Granite suggests, a person decides |
| 6 Files two and three | 15 | Files done, then the Details panel | AI needed for 1 of 3 |
| 7 Paste the email | 15 | Find a record, the reading line | Granite read the message |
| 8 What happened | 20 | Lot history, alarm, original row opened | Every line has a source |
| 9 What else is at risk | 25 | "Worth checking", slow zoom | 3 lots, not a week of production |
| 10 The reply | 20 | The draft, Copy reply, the clock against beat 3 | The seconds it took |
| 11 Close | 20 | One plain slide | Cost, who pays, route to shops, next step |

If the limit is 2 minutes, keep beats 1, 2, 5, 7, 9, 10, 11 and fold the rest into captions.

### 16.2 Statement outlines (headings and evidence only; sentences are written Friday)

**Problem and solution statement**

| Part | What goes in it | Criterion wording it answers |
|---|---|---|
| The problem | The locked statement. One verified Michigan number with its source. | "high priority and relevant issue", "real Michigan challenge" |
| Who it is for | The person who answers buyer paperwork in a small shop | "adopted by target users" |
| What it does | Messy files in. Lot history, lots worth checking, and a drafted reply out. | "how complete is the proof-of-concept" |
| Proof | The hand-timed number against the tool. Lots worth checking against lots that week. AI needed for 1 of 3 files. | "measurable impact", "effectively and efficiently" |
| Why it is different | Not an import tool. Containment from files the shop already has. A person confirms once per layout. | "differentiated in the market" |
| Business value | Who pays, measured Granite cost per new layout, route to shops, first pilot | "clear business value", "potential to scale" |
| Honest limits | Simulated operator and lot columns. No shop has used it yet. What a pilot would test. | "how fully has the idea been thought-out" |
| Michigan | Contracts kept, jobs kept, a Michigan-built tool for Michigan suppliers | "positions Michigan as a technology innovator" |

**How watsonx is used**

| Part | What goes in it |
|---|---|
| Which model and service | The Granite model and watsonx.ai, as named on Friday |
| The four jobs | Meaning of columns, value clean-up, reading the buyer's message, drafting the reply. One line each on input and output. |
| Why a model is needed for each | What rules could not do: cryptic headers, three spellings of one machine, free-text email, readable reply |
| Where a model is deliberately not used | Type detection, format matching, date clean-up, the at-risk rules. Say why: cheaper, checkable, repeatable. |
| How it is kept honest | Guess labeled as a guess, person confirms, retry and fallback, draft limited to the records |
| What leaves the laptop | Column names, a few sample values, the pasted message, the facts for the draft |
| Measured cost | Tokens and cost for one new layout and one request, from Friday |

### 16.3 Self-score before filming (run at 16:30; fix any "no" that takes under ten minutes)

| Criterion | Must be visibly true in the video |
|---|---|
| Completeness and feasibility | The flow runs start to finish with no cut hiding a failure. Granite is named on screen at least three times. Simulated data is stated. |
| Creativity and innovation | "What else is at risk" gets the longest shot. The overturned assumption is said in the first 20 seconds. |
| Design and usability | One action per screen is obvious. A keyboard-only answer is shown. No screen is on camera without a caption. |
| Effectiveness and efficiency | Three numbers appear: time by hand against the tool, lots worth checking against lots that week, AI needed for 1 of 3. |
| Michigan impact | A verified Michigan number with a source. The buyer and shop are placed in Michigan. Who pays and the route to shops are said. |

### 16.4 Hard questions, and where the answer lives

| Question a judge may ask | Answer comes from |
|---|---|
| Is this real data? | Machine times, counts, and alarms are real (PIADE). Operator, shift, and lot are simulated. Said up front. |
| Why not Excel? | Excel needs a mapping built per layout and cannot answer "what else is at risk". Section 4c. |
| Why does this need AI? | The four jobs, and the list of where AI is deliberately not used. Section 16.2. |
| What if Granite is wrong? | A person confirms, the at-risk list is rules, the draft is limited to the records. Sections 7.2 to 7.4. |
| Why trust the at-risk list? | Every link states its reason and can be opened. It says "worth checking", not "defective". |
| Who pays, and how much? | Thursday's verified numbers and Friday's measured cost. |
| What about shop data privacy? | What leaves the laptop is listed. Granite models are open, so running inside the shop is the next step (verify). |
| Why Michigan? | Lower-tier auto suppliers, contracts and jobs kept, the named route to shops. |
| Doesn't CONNEX or an MES already do this? | No. CONNEX lists what a shop can make. An MES records production from now on. Neither turns the files a shop already has into an answer to a defect request. The tool helps a shop earn its CONNEX listing. |
| What would you do next? | A pilot with one shop, a code on the lot sheet, field lists for other industries. |

### 16.5 Thursday tooling dry run (in a scratch folder, deleted afterward, never in the project repo)

- Confirm Python and Node versions, and that FastAPI, pandas, rapidfuzz, the watsonx SDK, React, and Carbon all install cleanly.
- Run one subagent on an unrelated toy task from a card written in the section 13.4 format, to learn how long a card takes and how often it drifts.
- Test the screen recorder with captions and export a ten-second clip from the editor.
- Decide where the repo will live and check it can be made visible to judges.
- Time the hand search method on any spreadsheet, so Friday's hand-timed test is quick to run.
