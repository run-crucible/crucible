/**
 * Trial job producer.
 *
 * For MVP we push a simple JSON payload directly into a Redis list
 * (LPUSH) so the Python worker can read it with BLPOP — no BullMQ
 * overhead needed across the language boundary.
 */
import { createClient } from "redis";

const REDIS_URL  = process.env.REDIS_URL ?? "redis://localhost:6379";
const QUEUE_KEY  = "crucible:trials:queue";

let _client: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (!_client) {
    _client = createClient({ url: REDIS_URL });
    _client.on("error", (e) => console.error("[redis]", e));
    await _client.connect();
  }
  return _client;
}

export async function enqueueTrial(trialId: string): Promise<void> {
  const client = await getClient();
  const payload = JSON.stringify({ trialId });
  const len = await client.lPush(QUEUE_KEY, payload);
  console.log(`[queue] enqueued trial ${trialId} → list length now ${len}`);
}
