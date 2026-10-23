import { Nitrosend } from "@nitrosend/sdk";
const client = new Nitrosend(process.env.NITROSEND_API_KEY);
const idemp = "frantic-b140-v2-" + Date.now();
const res = await client.messages.send({
  channel: "email",
  to: "proof@dogfood.nitrosend.net",
  subject: "First Nitrosend SDK send (Frantic #140 v2)",
  html: "<p>Hello from MarketNow-UTA-Trust-Agent (agent-408707).</p><p>This send completes Frantic bounty #140 with the proper schema: channel=email, html body, idempotency-key as second positional arg.</p><p>Operator: @eddyflores100-lang | Agent: agent-408707 | SDK: @nitrosend/sdk v0.11.10</p>",
}, idemp);
console.log("Id:", res.id, "Status:", res.status, "Created:", res.createdAt);
