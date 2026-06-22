#!/usr/bin/env python3
"""
Preview a generated post without starting the scheduler.

Usage:
  python preview_post.py              # today's morning post
  python preview_post.py evening      # today's evening post
  python preview_post.py morning 2    # Wednesday morning (0=Mon … 6=Sun)
"""

from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

_root = Path(__file__).resolve().parent.parent
load_dotenv(_root / ".env.local")
load_dotenv(Path(__file__).resolve().parent / ".env")

from bot import create_openai_client, generate_post_text  # noqa: E402
from content_plan import get_rotation, get_slot_plan  # noqa: E402


async def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    slot = sys.argv[1] if len(sys.argv) > 1 else "morning"
    if slot not in ("morning", "evening"):
        print("Slot must be 'morning' or 'evening'")
        sys.exit(1)

    weekday = int(sys.argv[2]) if len(sys.argv) > 2 else datetime.now().weekday()
    now = datetime.now().replace()  # keep current date, override weekday for preview
    # Fake weekday for plan lookup only:
    class _FakeNow:
        weekday = staticmethod(lambda: weekday)
        isocalendar = datetime.now().isocalendar

    fake = _FakeNow()
    fake.weekday = lambda: weekday  # type: ignore[method-assign]
    fake.isocalendar = datetime.now().isocalendar  # type: ignore[method-assign]

    plan = get_slot_plan(weekday, slot)  # type: ignore[arg-type]
    rotation = get_rotation(datetime.now().isocalendar()[1])

    client = create_openai_client()
    if not client:
        sys.exit(1)

    print(f"=== {slot.upper()} | weekday={weekday} | {plan.rubric} ===\n")
    text, quiz = await generate_post_text(client, plan, rotation, datetime.now())
    print(text or "(generation failed — check logs)")
    if slot == "morning" and quiz:
        print("\n--- Quiz ---")
        print(json.dumps(quiz, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
