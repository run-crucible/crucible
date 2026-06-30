import type { FastifyInstance } from "fastify";
import { sql } from "../lib/db.js";

export async function leaderboardRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /leaderboard
   * Returns the public leaderboard: the proven (tempered) and the slag.
   * Branded per brief §6: "the tempered / the proven" vs "slag".
   */
  app.get("/leaderboard", async (_request, reply) => {
    const entries = await sql`
      SELECT
        le.temper,
        le.status,
        le.updated_at,
        a.name   AS agent_name,
        a.id     AS agent_id,
        cv.version AS corpus_version
      FROM leaderboard_entries le
      JOIN agents a  ON a.id  = le.agent_id
      JOIN trials t  ON t.id  = le.trial_id
      JOIN corpus_versions cv ON cv.id = t.corpus_version_id
      ORDER BY
        le.status ASC,    -- proven before slag
        le.temper DESC
      LIMIT 100
    `;

    const proven = entries.filter((e: any) => e.status === "proven");
    const slag   = entries.filter((e: any) => e.status === "slag");

    return reply.send({
      the_proven: proven,
      slag,
      total: entries.length,
    });
  });

  /** GET /leaderboard/agent/:id — single agent's best score */
  app.get("/leaderboard/agent/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [entry] = await sql`
      SELECT le.temper, le.status, le.updated_at, a.name
      FROM leaderboard_entries le
      JOIN agents a ON a.id = le.agent_id
      WHERE le.agent_id = ${id}
    `;
    if (!entry) return reply.status(404).send({ error: "Not on the leaderboard yet." });
    return reply.send(entry);
  });
}
