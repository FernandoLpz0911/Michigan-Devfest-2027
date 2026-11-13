# LotTrail in watsonx Orchestrate

A watsonx Orchestrate agent, `lottrail_agent`, runs on IBM Granite and answers buyer
questions about lots by calling LotTrail's own API as tools. It sees only the shop's
cleaned records, and every fact it gives comes from a stored row.

| Tool | Endpoint | What it does |
|---|---|---|
| `find_record` | `POST /api/find` | Lot history and lots worth checking; any value (machine, operator, stop code); a pasted buyer message read by Granite |
| `lot_timeline` | `GET /api/timeline/{lot}` | Everything that ran on the lot's machine that day, with the stops |
| `draft_reply` | `POST /api/draft` | Granite drafts the reply to the buyer from this lot's records |

Files:
- `openapi.yaml`: the tool definitions, imported with `orchestrate tools import -k openapi`.
- `lottrail_agent.yaml`: the agent, its instructions and its model.
- `../scripts/orchestrate_setup.sh`: imports both against a live backend URL.

## Set up

1. Install the ADK and connect it to your Orchestrate instance. The URL and API key come
   from the Orchestrate settings page (API details).
   ```
   .venv/bin/pip install ibm-watsonx-orchestrate
   orchestrate env add -n devfest -u <instance URL>
   orchestrate env activate devfest   # asks for the API key
   ```
2. Start the backend and give it a public URL. Orchestrate runs in IBM Cloud and cannot
   reach localhost. A Cloudflare quick tunnel needs no account:
   ```
   .venv/bin/uvicorn backend.main:app --port 8000
   cloudflared tunnel --url http://localhost:8000    # prints https://<name>.trycloudflare.com
   ```
3. Import the tools and the agent:
   ```
   scripts/orchestrate_setup.sh https://<name>.trycloudflare.com
   ```
4. In Orchestrate chat, pick `lottrail_agent` and ask:
   *"A buyer says parts from lot A-101 cracked. What ran with it, and can you draft a reply?"*

If `watsonx/ibm/granite-3-8b-instruct` is not offered on your instance, run
`orchestrate models list` and put a Granite model it lists in `llm:`.

The tunnel URL changes each time cloudflared starts, so run step 3 again after a restart.
