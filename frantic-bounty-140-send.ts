import { Nitrosend } from "@nitrosend/sdk";
import { randomBytes } from "node:crypto";

const apiKey = process.env.NITROSEND_API_KEY;
if (!apiKey) throw new Error("Set NITROSEND_API_KEY");

const client = new Nitrosend(apiKey);
const idemp = "frantic-b140-" + randomBytes(8).toString("hex");

async function main(): Promise<void> {
  const res = await client.messages.send({
    channel: "email",
    to: "proof@dogfood.nitrosend.net",
    subject: "First Nitrosend SDK send",
    html: "<p>SDK send completing the Nitrosend first-send task.</p><p>Operator: @eddyflores100-lang</p>",
  }, idemp);
  console.log("Id:", res.id, "Status:", res.status);
}

main().catch((e: unknown) => { console.error(e); process.exit(1); });
