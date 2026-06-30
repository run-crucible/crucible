import type { FastifyInstance } from "fastify";
import { createClient } from "redis";
import { sql } from "../lib/db.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const CHANNEL = (id: string) => `combat:${id}`;

export function registerCombatLogStream(app: FastifyInstance): void {
  app.get(
    "/stream/trial/:trialId",
    { websocket: true },
    async (socket, request) => {
      const { trialId } = request.params as { trialId: string };

      // Replay persisted attempts first
      try {
        const past = await sql`
          SELECT seq, vector_id, outcome, detector, severity, turns,
                 finished_at, created_at
          FROM attempts
          WHERE trial_id = ${trialId}
          ORDER BY seq ASC
        `;
        for (const row of past) {
          if (socket.readyState === 1)
            socket.send(JSON.stringify({ type: "attempt_replay", ...row }));
        }
      } catch {
        /* non-fatal */
      }

      // Dedicated subscriber for this connection
      const sub = createClient({ url: REDIS_URL });
      sub.on("error", () => {});
      await sub.connect();

      const channel = CHANNEL(trialId);

      await sub.subscribe(channel, (message) => {
        try {
          const event = JSON.parse(message) as { type?: string };
          if (socket.readyState === 1) socket.send(message);
          if (event.type === "done") cleanup();
        } catch {
          /* ignore */
        }
      });

      const cleanup = () => {
        sub.unsubscribe(channel).catch(() => {});
        sub.quit().catch(() => {});
      };

      socket.on("close", cleanup);
      socket.on("error", cleanup);
    }
  );
}
