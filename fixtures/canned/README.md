# Canned responses

Each file is one shape from docs/contract.md, filled from the fixture files. Card S serves these
from the skeleton routes. `MOCK_GRANITE=1` makes backend/granite.py return the `granite_job*` files.

| File | Shape | Served by |
|---|---|---|
| file_result.json | FileResult for shift1_log.csv (new layout, 3 questions) | POST /api/files (first upload) |
| file_result_recognized.json | FileResult for shift2_export.csv (recognized) | POST /api/files (later uploads) |
| file_status.json | FileStatus while working | GET /api/files/{id}/status |
| file_rows.json | list of FileRow (ready, recognized, error) | GET /api/files |
| save_result.json | SaveResult | POST /api/files/{id}/answers |
| file_detail.json | FileDetail | GET /api/files/{id}/detail |
| granite_exchanges.json | list of GraniteExchange | GET /api/files/{id}/granite |
| file_view.json | FileView of shift1_log.csv | GET /api/files/{id}/view |
| answer.json | Answer for the sample buyer message (lot 4417) | POST /api/find |
| answer_no_match.json | Answer with no matching lot | POST /api/find with an unknown lot |
| granite_job4.json | Draft | POST /api/draft |
| held_rows.json | list of HeldRow | GET /api/held |
| record_page.json | RecordPage (Press 3, stop A_101) | GET /api/records |
| timeline.json | Timeline for lot 4417 | GET /api/timeline/{lot} |
| records_question.json | RecordsQuestionReading | POST /api/records/ask |
| settings.json | Settings | GET and PUT /api/settings |
| error.json | Error body | any route error |
| granite_job1.json | list of LabelProposal for shift1_log.csv | granite.py mock |
| granite_job2.json | list of MergeProposal for shift1_log.csv | granite.py mock |
| granite_job3.json, granite_job3_nothing.json | RequestReading | granite.py mock |
