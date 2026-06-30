import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Publisher client (general use)
export const redis = createClient({ url: REDIS_URL });
redis.on("error", (e) => console.error("[redis pub]", e));

// Subscriber client (must be separate connection)
export const redisSub = createClient({ url: REDIS_URL });
redisSub.on("error", (e) => console.error("[redis sub]", e));

// Connect both on startup
await redis.connect();
await redisSub.connect();
