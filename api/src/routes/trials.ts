import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "crypto";
import { sql } from "../lib/db.js";
import { enqueueTrial } from "../queue/trials.js";

const CreateTrialBody = z.object({
  agent_id: z.string().uuid(),
  budget_cap: z
    .object({ max_tokens: z.number().int().positive().optional(), max_usd: z.number().positive().optional() })
    .optional()
    .default({}),
});

export async function trialRoutes(app: FastifyInstance): Promise<void> {
  /** POST /trials — submit an agent for a trial */
  app.post("/trials", async (request, reply) => {
    const body = CreateTrialBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    const { agent_id, budget_cap } = body.data;

    // Ensure agent exists + has a verified manifest
    const [agent] = await sql`
      SELECT id, status FROM agents WHERE id = ${agent_id}
    `;
    if (!agent) return reply.status(404).send({ error: "Agent not found" });
    if (agent.status !== "verified") {
      return reply.status(422).send({
        error: "Agent must be verified (has a manifest) before running a trial.",
      });
    }

    // Pull latest manifest
    const [manifest] = await sql`
      SELECT id FROM manifests WHERE agent_id = ${agent_id}
      ORDER BY version DESC LIMIT 1
    `;
    if (!manifest) {
      return reply.status(422).send({ error: "No manifest found for this agent." });
    }

    // Pull the current active benchmark set
    const [benchmarkSet] = await sql`
      SELECT bs.id, bs.corpus_version_id
      FROM benchmark_sets bs
      JOIN corpus_versions cv ON cv.id = bs.corpus_version_id
      ORDER BY bs.frozen_at DESC LIMIT 1
    `;
    if (!benchmarkSet) {
      return reply.status(503).send({ error: "No benchmark set available yet. System warming up." });
    }

    const trialId = randomUUID();
    const [trial] = await sql`
      INSERT INTO trials
        (id, agent_id, manifest_id, benchmark_set_id, corpus_version_id,
         status, budget_cap)
      VALUES
        (${trialId}, ${agent_id}, ${manifest.id},
         ${benchmarkSet.id}, ${benchmarkSet.corpus_version_id},
         'queued', ${JSON.stringify(budget_cap)})
      RETURNING id, status, created_at
    `;

    await enqueueTrial(trialId);

    return reply.status(202).send({
      ...trial,
      stream_url: `/stream/trial/${trialId}`,
    });
  });

  /** GET /trials — list all trials, newest first */
  app.get("/trials", async (_request, reply) => {
    const trials = await sql`
      SELECT t.id, t.status, t.temper, t.critical_break,
             t.started_at, t.finished_at, t.created_at,
             a.name AS agent_name, a.id AS agent_id
      FROM trials t
      JOIN agents a ON a.id = t.agent_id
      ORDER BY t.created_at DESC
      LIMIT 100
    `;
    return reply.send(trials);
  });

  /** GET /trials/:id — trial status + results */
  app.get("/trials/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [trial] = await sql`
      SELECT t.id, t.status, t.temper, t.category_scores,
             t.critical_break, t.error_msg,
             t.started_at, t.finished_at, t.created_at,
             a.name AS agent_name
      FROM trials t
      JOIN agents a ON a.id = t.agent_id
      WHERE t.id = ${id}
    `;
    if (!trial) return reply.status(404).send({ error: "Trial not found" });
    return reply.send(trial);
  });

  /** GET /trials/:id/attempts — ordered attempt log */
  app.get("/trials/:id/attempts", async (request, reply) => {
    const { id } = request.params as { id: string };
    const attempts = await sql`
      SELECT a.seq, a.outcome, a.detector, a.severity, a.turns,
             a.created_at, a.finished_at,
             v.category, v.difficulty, v.framework
      FROM attempts a
      JOIN vectors v ON v.id = a.vector_id
      WHERE a.trial_id = ${id}
      ORDER BY a.seq ASC
    `;
    return reply.send(attempts);
  });

  /** GET /trials/:id/report — fetch report reference */
  app.get("/trials/:id/report", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [report] = await sql`
      SELECT summary_ref, generated_at FROM reports WHERE trial_id = ${id}
    `;
    if (!report) return reply.status(404).send({ error: "Report not yet available." });
    return reply.send(report);
  });
}
