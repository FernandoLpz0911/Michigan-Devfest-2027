#!/usr/bin/env bash
# Import the Data Wrapper tools and agent into watsonx Orchestrate.
# Usage: scripts/orchestrate_setup.sh https://<your-tunnel>.trycloudflare.com
# Needs: the ADK (pip install ibm-watsonx-orchestrate) and an active environment
# (orchestrate env add ... ; orchestrate env activate ...). See orchestrate/README.md.
set -euo pipefail

url="${1:?Give the public URL of the backend, e.g. https://abc.trycloudflare.com}"
url="${url%/}"
here="$(cd "$(dirname "$0")/.." && pwd)"
out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT

sed "s#https://REPLACE-WITH-TUNNEL-URL#${url}#" "$here/orchestrate/openapi.yaml" > "$out/openapi.yaml"

# Check the backend answers through the tunnel before importing.
curl -fsS "$url/api/settings" > /dev/null || { echo "The backend does not answer at $url"; exit 1; }

orchestrate tools import -k openapi -f "$out/openapi.yaml"
orchestrate agents import -f "$here/orchestrate/data_wrapper_agent.yaml"
orchestrate agents list
echo "Done. Open watsonx Orchestrate chat and pick data_wrapper_agent."
