#!/usr/bin/env python3
"""Generate and send one post to the channel (smoke test)."""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# Load project .env.local first, then local .env
root = Path(__file__).resolve().parent.parent
load_dotenv(root / ".env.local")
load_dotenv(Path(__file__).resolve().parent / ".env")

# Map existing Next.js env names → bot names
if not os.getenv("TELEGRAM_CHAT_ID"):
    chat = (
        os.getenv("TELEGRAM_CHANNEL_ID")
        or os.getenv("TELEGRAM_GROUP_ID")
        or ""
    ).strip()
    if chat:
        os.environ["TELEGRAM_CHAT_ID"] = chat

from bot import create_openai_client, publish_slot  # noqa: E402
from aiogram import Bot  # noqa: E402

SLOT = sys.argv[1] if len(sys.argv) > 1 else "morning"
if SLOT not in ("morning", "evening"):
    print("Usage: python send_once.py [morning|evening]")
    sys.exit(1)


async def main() -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        print("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID / TELEGRAM_CHANNEL_ID")
        sys.exit(1)

    print(f"Sending {SLOT} post to {chat_id}…")
    bot = Bot(token=token)
    client = create_openai_client()
    try:
        await publish_slot(bot, client, SLOT)  # type: ignore[arg-type]
        print("Done — check the channel.")
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
