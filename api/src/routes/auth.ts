/**
 * Auth routes — minimal API-key + JWT auth for MVP.
 *
 * POST /auth/register  { handle, email, password } → { token }
 * POST /auth/login     { email, password }          → { token }
 *
 * The token is a signed JWT with { sub: userId }.
 * Protected routes read request.user via fastify-jwt's .authenticate() decorator.
 *
 * Passwords are hashed with SHA-256 (good enough for MVP; upgrade to bcrypt later).
 */
import type { FastifyInstance } from "fastify";
import { createHash, randomUUID } from "crypto";
import { z } from "zod";
import { sql } from "../lib/db.js";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const RegisterBody = z.object({
  handle: z.string().min(2).max(32),
  email:  z.string().email(),
  password: z.string().min(8),
});

const LoginBody = z.object({
  email:    z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /** POST /auth/register */
  app.post("/auth/register", async (request, reply) => {
    const body = RegisterBody.safeParse(request.body);
    if (!body.success)
      return reply.status(400).send({ error: body.error.flatten() });

    const { handle, email, password } = body.data;
    const pwd_hash = sha256(password);
    const id = randomUUID();

    try {
      const [user] = await sql`
        INSERT INTO users (id, handle, email, pwd_hash)
        VALUES (${id}, ${handle}, ${email}, ${pwd_hash})
        RETURNING id, handle, email, created_at
      `;
      const token = app.jwt.sign({ sub: user.id });
      return reply.status(201).send({ token, user });
    } catch (e: unknown) {
      const msg = String((e as { message?: string }).message ?? "");
      if (msg.includes("unique") || msg.includes("duplicate"))
        return reply.status(409).send({ error: "Email or handle already taken." });
      throw e;
    }
  });

  /** POST /auth/login */
  app.post("/auth/login", async (request, reply) => {
    const body = LoginBody.safeParse(request.body);
    if (!body.success)
      return reply.status(400).send({ error: body.error.flatten() });

    const { email, password } = body.data;
    const pwd_hash = sha256(password);

    const [user] = await sql`
      SELECT id, handle, email FROM users
      WHERE email = ${email} AND pwd_hash = ${pwd_hash}
    `;
    if (!user) return reply.status(401).send({ error: "Invalid credentials." });

    const token = app.jwt.sign({ sub: user.id });
    return reply.send({ token, user });
  });

  /** GET /auth/me — verify token + return current user */
  app.get("/auth/me", {
    preHandler: [async (req, rep) => {
      try { await req.jwtVerify(); }
      catch { return rep.status(401).send({ error: "Unauthorized" }); }
    }],
  }, async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const [user] = await sql`
      SELECT id, handle, email, created_at FROM users WHERE id = ${sub}
    `;
    if (!user) return reply.status(404).send({ error: "User not found." });
    return reply.send(user);
  });
}
