#!/usr/bin/env python3
"""
CRUCIBLE Twitter Attack Bot
============================
Picks an interesting agent trial from CRUCIBLE, formats it as a
viral attack-report thread, and posts it to Twitter/X.

Schedule: run once daily via cron, e.g.
  0 14 * * * cd /opt/crucible && python3 scripts/twitter_attack_bot.py

Required env vars (add to /opt/crucible/.env):
  TWITTER_BEARER_TOKEN
  TWITTER_API_KEY
  TWITTER_API_SECRET
  TWITTER_ACCESS_TOKEN
  TWITTER_ACCESS_SECRET
  CRUCIBLE_BASE=https://runcrucible.xyz/api   (optional override)
"""
from __future__ import annotations

import json
import os
import random
import re
import sys
import time
import textwrap
from datetime import datetime, timezone
from typing import Any

import httpx

# ── Twitter client ─────────────────────────────────────────────────────────────
try:
    import tweepy
except ImportError:
    print("Install tweepy: pip install tweepy")
    sys.exit(1)

TWITTER_API_KEY       = os.environ["TWITTER_API_KEY"]
TWITTER_API_SECRET    = os.environ["TWITTER_API_SECRET"]
TWITTER_ACCESS_TOKEN  = os.environ["TWITTER_ACCESS_TOKEN"]
TWITTER_ACCESS_SECRET = os.environ["TWITTER_ACCESS_SECRET"]

CRUCIBLE_BASE = os.environ.get("CRUCIBLE_BASE", "https://runcrucible.xyz/api")

# ── Helpers ───────────────────────────────────────────────────────────────────

def crucible_get(path: str) -> Any:
    r = httpx.get(f"{CRUCIBLE_BASE}{path}", timeout=15)
    r.raise_for_status()
    return r.json()


def score_label(temper: int) -> str:
    if temper >= 800: return "FORTRESS 🏰"
    if temper >= 700: return "HARDENED 🛡️"
    if temper >= 580: return "CRACKED 💀"
    if temper >= 450: return "COMPROMISED ⚠️"
    return "SHATTERED 🔴"


def temper_bar(score: int) -> str:
    """Visual bar: ████░░░░ 647/850"""
    filled = round((score - 300) / 550 * 10)
    return f"{'█' * filled}{'░' * (10 - filled)} {score}/850"


def shorten(text: str, max_len: int = 180) -> str:
    text = text.strip().replace("\n", " ")
    if len(text) <= max_len:
        return text
    return text[:max_len - 1] + "…"


def pick_target() -> dict | None:
    """
    Pick an interesting trial to tweet about.
    Prefers: broken agents with recognisable names, not tweeted recently.
    Falls back to any done trial.
    """
    trials = crucible_get("/trials")

    # Skip boring internal test names
    skip_patterns = re.compile(
        r"^(test|123|temp|debug|weak test|deepsy|ciem|55$)",
        re.IGNORECASE,
    )

    # Load already-tweeted trial IDs
    tweeted_file = "/opt/crucible/.tweeted_trials.json"
    try:
        tweeted: set[str] = set(json.loads(open(tweeted_file).read()))
    except Exception:
        tweeted = set()

    # Rank: prefer cracked (critical break), then broken (low temper), then survivors
    interesting = [
        t for t in trials
        if t.get("status") == "done"
        and t.get("temper") is not None
        and t["id"] not in tweeted
        and not skip_patterns.match(t.get("agent_name", ""))
    ]

    if not interesting:
        return None

    # Sort by "interestingness": critical breaks first, then lowest temper
    interesting.sort(key=lambda t: (
        0 if t.get("critical_break") else 1,
        t.get("temper", 850),
    ))

    # Pick from top-5 so we don't always tweet the same one
    candidate = random.choice(interesting[:5])
    return candidate


def fetch_trial_attempts(trial_id: str) -> list[dict]:
    """Fetch attempt breakdown with vector prompts."""
    try:
        return crucible_get(f"/trials/{trial_id}/attempts")
    except Exception:
        return []


def build_thread(trial: dict, attempts: list[dict]) -> list[str]:
    """
    Build a Twitter thread (list of tweets).
    Each string must be ≤ 280 chars.
    """
    name        = trial.get("agent_name", "Unknown Agent")
    temper      = trial.get("temper", 0)
    is_critical = trial.get("critical_break", False)
    label       = score_label(temper)
    bar         = temper_bar(temper)

    total      = len(attempts)
    broke_list = [a for a in attempts if a.get("outcome") == "broke"]
    breaks     = len(broke_list)

    # Category breakdown
    by_cat: dict[str, dict] = {}
    for a in attempts:
        cat = a.get("category", "?")
        by_cat.setdefault(cat, {"total": 0, "broke": 0})
        by_cat[cat]["total"] += 1
        if a.get("outcome") == "broke":
            by_cat[cat]["broke"] += 1

    cat_lines = []
    cat_icons = {
        "injection": "💉", "roleplay": "🎭", "social-eng": "🧠",
        "multi-turn": "🔄", "tool-abuse": "🔧",
    }
    for cat, stats in sorted(by_cat.items()):
        icon = cat_icons.get(cat, "•")
        cat_lines.append(
            f"{icon} {cat}: {stats['broke']}/{stats['total']} breaks"
        )

    # Find the most interesting break
    canary_break = next(
        (a for a in broke_list if a.get("detector") == "canary"), None
    )
    best_break = canary_break or (broke_list[0] if broke_list else None)

    # Pull attack prompt from vector_content
    attack_excerpt = ""
    if best_break:
        vc = best_break.get("vector_content")
        if isinstance(vc, str):
            try:
                vc = json.loads(vc)
            except Exception:
                vc = {}
        if isinstance(vc, dict):
            # garak: {"prompt": "..."}
            prompt = vc.get("prompt", "")
            if not prompt:
                # pyrit: {"turns": [{"prompt": "..."}]}
                turns = vc.get("turns", [])
                if turns:
                    prompt = turns[-1].get("prompt", "")
            attack_excerpt = shorten(prompt, 140)

    framework_used = best_break.get("framework", "garak") if best_break else "garak"
    turn_broke     = best_break.get("turns", 1) if best_break else 1

    # ── Build tweets ──────────────────────────────────────────────────────────
    tweets: list[str] = []

    # Tweet 1 — hook
    status_emoji = "💀" if is_critical else ("⚠️" if temper < 700 else "✅")
    tweet1 = (
        f"🔴 CRUCIBLE red-teamed {name}\n\n"
        f"TEMPER: {bar}\n"
        f"Status: {label} {status_emoji}\n\n"
        f"{breaks}/{total} attack vectors landed\n\n"
        f"Full report 🧵👇\n\n"
        f"#AIAgentSecurity #RedTeam"
    )
    tweets.append(tweet1[:280])

    # Tweet 2 — attack breakdown by category
    cat_block = "\n".join(cat_lines)
    tweet2 = (
        f"Attack breakdown across {len(by_cat)} categories:\n\n"
        f"{cat_block}\n\n"
        f"ATLAS fired {total} vectors across 3 frameworks:\n"
        f"garak • pyrit • AI attacker (Claude)"
    )
    tweets.append(tweet2[:280])

    # Tweet 3 — the winning attack (if any break)
    if attack_excerpt:
        detector = best_break.get("detector", "policy") if best_break else "policy"
        severity = best_break.get("severity", "medium") if best_break else "medium"
        sev_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡"}.get(severity, "⚪")

        tweet3 = (
            f"{sev_icon} {detector.upper()} breach — turn {turn_broke} ({framework_used})\n\n"
            f"The attack that cracked it:\n\n"
            f"\"{attack_excerpt}\""
        )
        tweets.append(tweet3[:280])
    elif breaks == 0:
        tweet3 = (
            f"✅ {name} survived all {total} attacks.\n\n"
            f"TEMPER {temper}/850 — genuinely hardened prompt.\n\n"
            f"Most AI agents score under 600.\n"
            f"This one held."
        )
        tweets.append(tweet3[:280])

    # Tweet 4 — CTA
    tweet4 = (
        f"Is your AI agent secure?\n\n"
        f"→ runcrucible.xyz\n\n"
        f"CRUCIBLE red-teams AI agents against 46 attack vectors.\n"
        f"Free. Instant. Reproducible.\n\n"
        f"$CRUCIBLE"
    )
    tweets.append(tweet4[:280])

    return tweets


def post_thread(tweets: list[str], dry_run: bool = False) -> str | None:
    """Post a thread. Returns the ID of the first tweet (or None on dry run)."""
    if dry_run:
        print("\n=== DRY RUN — Thread Preview ===")
        for i, t in enumerate(tweets, 1):
            print(f"\n--- Tweet {i} ({len(t)} chars) ---")
            print(t)
        return "dry_run"

    client = tweepy.Client(
        consumer_key=TWITTER_API_KEY,
        consumer_secret=TWITTER_API_SECRET,
        access_token=TWITTER_ACCESS_TOKEN,
        access_token_secret=TWITTER_ACCESS_SECRET,
    )

    first_id = None
    reply_to  = None

    for i, text in enumerate(tweets):
        try:
            if reply_to:
                resp = client.create_tweet(
                    text=text,
                    in_reply_to_tweet_id=reply_to,
                )
            else:
                resp = client.create_tweet(text=text)

            tweet_id = resp.data["id"]
            if i == 0:
                first_id = tweet_id
            reply_to = tweet_id
            print(f"Posted tweet {i+1}: {tweet_id}")
            time.sleep(2)   # small delay between tweets

        except tweepy.TweepyException as exc:
            print(f"  ERROR on tweet {i+1}: {exc}")
            break

    return first_id


def mark_tweeted(trial_id: str) -> None:
    tweeted_file = "/opt/crucible/.tweeted_trials.json"
    try:
        tweeted = set(json.loads(open(tweeted_file).read()))
    except Exception:
        tweeted = set()
    tweeted.add(trial_id)
    with open(tweeted_file, "w") as f:
        json.dump(list(tweeted), f)


def main() -> None:
    dry_run = "--dry-run" in sys.argv

    print(f"[{datetime.now(timezone.utc).isoformat()}] Twitter Attack Bot starting")

    target = pick_target()
    if not target:
        print("No suitable trial found to tweet about. Exiting.")
        return

    trial_id   = target["id"]
    agent_name = target.get("agent_name", "?")
    temper     = target.get("temper", 0)
    print(f"Selected: {agent_name} (TEMPER {temper}, trial {trial_id})")

    attempts = fetch_trial_attempts(trial_id)
    thread = build_thread(target, attempts)

    first_tweet_id = post_thread(thread, dry_run=dry_run)

    if first_tweet_id and first_tweet_id != "dry_run":
        mark_tweeted(trial_id)
        print(f"Thread posted! First tweet: {first_tweet_id}")
        print(f"URL: https://twitter.com/i/web/status/{first_tweet_id}")


if __name__ == "__main__":
    main()
