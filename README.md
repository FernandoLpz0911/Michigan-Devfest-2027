# LotTrail

**Messy shop files in, buyer answers out.**

LotTrail is for the person who keeps a small manufacturing shop's paperwork. Each shift
keeps its production log in its own layout. LotTrail reads those spreadsheets, asks a few
plain questions where it is unsure, and keeps one clean set of records. When a buyer
reports a bad lot, it shows that lot's whole history (machine, time, operator, stop codes,
with the file and row each fact came from), the other lots worth checking, and a reply
drafted by IBM Granite from those records only.

- IBM Granite (watsonx.ai) reads column layouts, buyer messages and drafts replies.
- watsonx Orchestrate: `lottrail_agent` answers the same questions in chat. See `orchestrate/README.md`.

## Run

```
.venv/bin/uvicorn backend.main:app --port 8000
cd frontend && npm run dev
```

Set `MOCK_GRANITE=1` to run without watsonx credentials. The demo path is in `DEMO.md`.
