# Nitrosend SDK First Send — Report

## Receipt

- **Message Id**: 5171290
- **Receipt sealed**: 2026-10-23T02:46:29Z
- **Receipt URL**: https://runx.ai/r/9d1d904336a9341eeffcec77cc0e9c3fb96be1806cf4e6e8ecffebebbcf82232
- **From**: hello@eddyflores100.nitrosend.net
- **To**: proof@dogfood.nitrosend.net
- **Subject**: First Nitrosend SDK send

## Script

- **File**: `frantic-bounty-140-send.ts` (15 lines, TypeScript)
- **Compiles**: `tsc --strict` passes with zero errors
- **SDK**: `@nitrosend/sdk` v0.11.10
- **Runtime**: Node.js v24.21.0
- **Key**: read from `process.env.NITROSEND_API_KEY`, never hardcoded

## Timeline

- **02:34Z**: SDK installed via `npm install @nitrosend/sdk@latest`
- **02:46:25Z**: script compiled and run, message Id 5171290 queued
- **02:46:29Z**: receipt sealed on the ledger
- **Elapsed**: ~12 minutes from install to verified receipt

## Doc gap findings

No documentation gap found. The SDK README consistently uses the named import `import { Nitrosend } from "@nitrosend/sdk"` across all code examples. The constructor is documented as positional `new Nitrosend(apiKey)`. The `messages.send(params, idempotencyKey)` signature is documented with the idempotency key as the second positional argument.

**What was tried**: attempted default import (`import Nitrosend from "@nitrosend/sdk"`) which fails with TS1192 — this is correct behavior since the package only exports named exports. Attempted passing idempotency key as a request option object — this fails with a TypeError, which is correct since the signature requires a plain string as the second positional argument. Both behaviors match the README documentation.

## Honest findings

- The `channel: "email"` field is required in send params per the API schema but the CLI infers it from context.
- The receipt from runx.ai arrived within 4 seconds of the send — fast and reliable.
- The SDK has zero runtime dependencies, which is clean for production use.

— @eddyflores100-lang
