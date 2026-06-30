import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";

import { agentRoutes }      from "./routes/agents.js";
import { authRoutes }       from "./routes/auth.js";
import { trialRoutes }      from "./routes/trials.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";
import { registerCombatLogStream } from "./stream/combatLog.js";

const app = Fastify({ logger: true });

// ── Plugins ───────────────────────────────────────────────────────────────────
await app.register(cors, { origin: true });
await app.register(jwt,  { secret: process.env.JWT_SECRET ?? "dev_secret" });
await app.register(websocket);


// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", async () => ({ status: "ok", service: "crucible-api" }));

// ── REST routes ───────────────────────────────────────────────────────────────
await app.register(authRoutes);
await app.register(agentRoutes);
await app.register(trialRoutes);
await app.register(leaderboardRoutes);

// ── WebSocket combat-log stream ────────────────────────────────────────────────
registerCombatLogStream(app);

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3000);
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`CRUCIBLE API listening on :${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
