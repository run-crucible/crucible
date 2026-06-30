import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql } from "../lib/db.js";
import { randomUUID } from "crypto";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateAgentBody = z.object({
  name: z.string().min(1).max(100),
  // Hosted mode: system_prompt provided, no endpoint needed.
  // Custom mode: endpoint_url provided, system_prompt optional.
  system_prompt: z.string().optional(),
  endpoint_url: z.string().url().optional(),
  model: z.string().default("default"),
  auth_headers: z.record(z.string()).optional().default({}),
  attestation: z.literal(true, {
    errorMap: () => ({ message: "You must attest you own/are authorized to test this endpoint." }),
  }),
}).refine(
  (d) => d.system_prompt || d.endpoint_url,
  { message: "Either system_prompt (hosted) or endpoint_url (custom) is required." }
);

const CreateManifestBody = z.object({
  canaries: z
    .array(z.object({ token: z.string(), description: z.string().optional() }))
    .default([]),
  policies: z
    .array(
      z.object({
        id: z.string(),
        pattern: z.string(),
        description: z.string().optional(),
        severity: z
          .enum(["none", "low", "medium", "high", "critical"])
          .default("medium"),
      })
    )
    .default([]),
  config_hash: z.string().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  /** POST /agents — register a new agent */
  app.post("/agents", async (request, reply) => {
    const body = CreateAgentBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const { name, system_prompt, endpoint_url, model, auth_headers } = body.data;
    try { await request.jwtVerify(); } catch { /* optional auth */ }
    const owner_id = (request.user as any)?.sub ?? "00000000-0000-0000-0000-000000000001";

    // hosted = system_prompt provided (no external endpoint needed)
    const endpointCfg = {
      url: endpoint_url ?? "",
      model: system_prompt && !endpoint_url ? "claude-opus-4-5" : model,
      auth_headers,
      hosted: !endpoint_url,
    };
    const authProof = { type: "attestation", attested_at: new Date().toISOString() };

    const [agent] = await sql`
      INSERT INTO agents (id, owner_id, name, endpoint_cfg, auth_proof, status, system_prompt)
      VALUES (${randomUUID()}, ${owner_id}, ${name},
              ${JSON.stringify(endpointCfg)}, ${JSON.stringify(authProof)},
              'draft', ${system_prompt ?? null})
      RETURNING id, name, status, created_at
    `;

    return reply.status(201).send(agent);
  });

  /** GET /agents — list caller's agents */
  app.get("/agents", async (request, reply) => {
    const owner_id = (request as any).user?.id ?? "00000000-0000-0000-0000-000000000001";
    const agents = await sql`
      SELECT id, name, status, created_at, updated_at
      FROM agents
      WHERE owner_id = ${owner_id}
      ORDER BY created_at DESC
    `;
    return reply.send(agents);
  });

  /** GET /agents/:id — single agent */
  app.get("/agents/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [agent] = await sql`
      SELECT id, name, status, created_at, updated_at
      FROM agents WHERE id = ${id}
    `;
    if (!agent) return reply.status(404).send({ error: "Agent not found" });
    return reply.send(agent);
  });

  /** POST /agents/:id/manifest — set/update oracle manifest */
  app.post("/agents/:agentId/manifest", async (request, reply) => {
    const { agentId } = request.params as { agentId: string };
    const body = CreateManifestBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const { canaries, policies, config_hash } = body.data;

    const [manifest] = await sql`
      INSERT INTO manifests (id, agent_id, canaries, policies, config_hash)
      VALUES (${randomUUID()}, ${agentId},
              ${JSON.stringify(canaries)}, ${JSON.stringify(policies)},
              ${config_hash ?? null})
      RETURNING id, version, created_at
    `;

    // Mark agent as verified once it has a manifest
    await sql`UPDATE agents SET status='verified', updated_at=now() WHERE id=${agentId}`;

    return reply.status(201).send(manifest);
  });
}
