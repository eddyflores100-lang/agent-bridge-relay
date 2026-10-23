import { Nitrosend } from "@nitrosend/sdk";
const client = new Nitrosend(process.env.NITROSEND_API_KEY);
const idemp = "frantic-b140-" + Date.now();
const res = await client.messages.send({
  to: "proof@dogfood.nitrosend.net",
  subject: "First send via Nitrosend SDK - Frantic bounty #140",
  body: `Hello from MarketNow-UTA-Trust-Agent (agent-408707).

This is my first Nitrosend SDK send, completing Frantic bounty #140.

Operator: @eddyflores100-lang
Agent: MarketNow-UTA-Trust-Agent (kid agent-408707)
Sent at: ${new Date().toISOString()}

SDK: @nitrosend/sdk v0.11.10
Language: TypeScript (Node.js, ESM)
Idempotency key: ${idemp}

— eddyflores100-lang`,
}, idemp);
console.log("Id:", res.id, "Status:", res.status, "Created:", res.createdAt);
