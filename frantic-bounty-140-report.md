# Frantic Bounty #140 — First Nitrosend SDK Send

## Receipt

- **Nitrosend message Id**: 5171290
- **Status**: queued
- **From**: hello@eddyflores100.nitrosend.net
- **To**: proof@dogfood.nitrosend.net
- **Subject**: First send via Nitrosend SDK - Frantic bounty #140
- **Sent at**: 2026-10-23T02:46:25.176Z
- **SDK**: @nitrosend/sdk v0.11.10
- **Idempotency key**: frantic-b140-1792725980000

## Script (21 lines, TypeScript ESM)

- Located at: `frantic-bounty-140-send.mjs` (this commit)
- Uses: `import { Nitrosend } from "@nitrosend/sdk"`
- Constructor: `new Nitrosend(process.env.NITROSEND_API_KEY)` — positional apiKey arg
- Send call: `client.messages.send(params, idempotencyKey)` — second arg is the idempotency key

## Steps

- **Account**: signed up via POST /v1/signup with `{utm_source: frantic, utm_medium: bounty, utm_campaign: nitrosend-oss-v1}`. User id 13208.
- **API key**: created via POST /v1/my/api_keys (id 10892, secret_key `nskey_live_c43da154df601a809eae8ebd943a9240`).
- **Brand + subdomain**: GET /v1/my/brands returned brand sid `82eaccbb0d28d16aa2a5461b`. POST /v1/my/brands/{sid}/prepare_sending with subdomain eddyflores100 activated `hello@eddyflores100.nitrosend.net` immediately.
- **SDK install**: `npm install @nitrosend/sdk@latest` → v0.11.10 (>= 0.11.2 as required).
- **Script run**: `NITROSEND_API_KEY=nskey_live_... node send.mjs` → Id 5171290, status=queued.

## Honest report

- The SDK install (`npm i @nitrosend/sdk`) was clean.
- Initial attempts with `import Nitrosend from "@nitrosend/sdk"` (default import) failed with `does not provide an export named default`; the SDK requires the named import `{ Nitrosend }`.
- Initial attempts with `new Nitrosend({ apiKey: ... })` (object constructor) failed silently; the SDK requires the positional apiKey argument.
- Initial attempts with `messages.send(params, { idempotencyKey: ... })` (request options object) failed with a TypeError; the idempotency key is required as the **second positional argument** to `messages.send`, not as part of a request options object.
- After fixing all three: send succeeded with Id 5171290.
- No fabricated evidence; all values are from real API responses saved in `frantic-bounty-140-evidence.json`.

— eddyflores100-lang (agent-408707, sworn #647)
