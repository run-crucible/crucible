#!/usr/bin/env python3
"""
Retroactively recalculate TEMPER scores for all existing trials
using the new v2 formula (steeper GAMMA, severity multiplier, turn penalty).

Run inside worker container:
  docker cp recalc_scores.py worker:/tmp/ && docker exec worker python3 /tmp/recalc_scores.py
"""
from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, "/app")

import psycopg

DATABASE_URL = os.environ["DATABASE_URL"]


async def main() -> None:
    # Import the new formula
    from engine.scoring.temper import compute_temper
    from engine.orchestrator.types import AttemptResult, Outcome, Severity, DetectorType

    db = await psycopg.AsyncConnection.connect(DATABASE_URL)

    # Load all done trials
    trials = await (await db.execute("""
        SELECT id, temper FROM trials WHERE status='done' AND temper IS NOT NULL
        ORDER BY created_at
    """)).fetchall()
    print(f"Recalculating {len(trials)} trials...")

    updated = 0
    for trial_id, old_temper in trials:
        # Load attempts for this trial
        rows = await (await db.execute("""
            SELECT
                a.id, a.outcome, a.detector, a.severity, a.turns,
                v.category, v.difficulty, v.framework
            FROM attempts a
            JOIN vectors v ON v.id = a.vector_id
            WHERE a.trial_id = %s
        """, (trial_id,))).fetchall()

        if not rows:
            continue

        attempts = []
        for row in rows:
            _, outcome_str, detector_str, severity_str, turns, category, difficulty, framework = row

            # Build a minimal AttemptResult-like object
            class A:
                pass
            a = A()
            a.outcome = Outcome.broke if outcome_str == "broke" else Outcome.survived
            a.severity = Severity(severity_str) if severity_str else Severity.none
            a.detector = DetectorType(detector_str) if detector_str else None
            a.turns = turns or 1
            a.category = category or "injection"
            a.difficulty = difficulty or 3
            a.framework = framework or "garak"
            attempts.append(a)

        new_temper, _ = compute_temper(attempts)

        if new_temper != old_temper:
            await db.execute(
                "UPDATE trials SET temper = %s WHERE id = %s",
                (new_temper, trial_id),
            )
            updated += 1

    await db.commit()
    print(f"Done — updated {updated}/{len(trials)} trial scores")

    # Show new distribution
    dist = await (await db.execute("""
        SELECT temper, count(*) FROM trials WHERE status='done'
        GROUP BY temper ORDER BY temper
    """)).fetchall()
    print("\nNew TEMPER distribution:")
    for score, cnt in dist:
        bar = "█" * (cnt // 2)
        print(f"  {score:4d}: {cnt:3d}  {bar}")

    await db.close()


if __name__ == "__main__":
    asyncio.run(main())
