#!/usr/bin/env python3
"""
IELTS Writing Telegram channel bot.

Publishes AI-generated posts twice daily (09:00 & 18:00) using APScheduler.
Morning: vocabulary collocations + scheduled quiz 5 min later.
Evening: practice task + "Check my text" DM essay feedback.

Environment variables (see .env.example):
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, OPENAI_API_KEY
  Optional: TIMEZONE, MORNING_HOUR, EVENING_HOUR, OPENAI_MODEL, SITE_URL,
            MORNING_QUIZ_DELAY_MINUTES

Run:
  pip install -r requirements.txt
  python bot.py
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import sys
from datetime import datetime, timedelta
from typing import Literal

from aiogram import Bot, Dispatcher, F, Router
from aiogram.enums import ChatType, ParseMode
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from pathlib import Path

from dotenv import load_dotenv
from openai import APIConnectionError, APIStatusError, OpenAI, RateLimitError

from content_plan import SlotPlan, get_rotation, get_slot_plan
from prompts import (
    BASE_SYSTEM_PROMPT_EVENING,
    BASE_SYSTEM_PROMPT_MORNING,
    ESSAY_CHECK_SYSTEM,
    MORNING_QUIZ_PROMPT,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_root = Path(__file__).resolve().parent.parent
load_dotenv(_root / ".env.local")
load_dotenv(Path(__file__).resolve().parent / ".env")

# Map Next.js env names → bot names
if not os.getenv("TELEGRAM_CHAT_ID"):
    _chat = (
        os.getenv("TELEGRAM_CHANNEL_ID") or os.getenv("TELEGRAM_GROUP_ID") or ""
    ).strip()
    if _chat:
        os.environ["TELEGRAM_CHAT_ID"] = _chat

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = (
    os.getenv("TELEGRAM_CHAT_ID")
    or os.getenv("TELEGRAM_CHANNEL_ID")
    or os.getenv("TELEGRAM_GROUP_ID")
    or ""
).strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o").strip()
TIMEZONE = os.getenv("TIMEZONE", "Europe/Moscow").strip()
MORNING_HOUR = int(os.getenv("MORNING_HOUR", "9"))
EVENING_HOUR = int(os.getenv("EVENING_HOUR", "18"))
MORNING_QUIZ_DELAY_MINUTES = int(os.getenv("MORNING_QUIZ_DELAY_MINUTES", "5"))
SITE_URL = os.getenv("SITE_URL", "https://stratumielts.com/").strip().rstrip("/")
TELEGRAM_BOT_USERNAME_CANONICAL = (
    os.getenv("TELEGRAM_BOT_USERNAME", "Stratum_ielts_writing_bot").strip()
)

Slot = Literal["morning", "evening"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ielts-telegram-bot")

router = Router()
_bot_username: str | None = None

CHECK_START_TEXT = (
    "✅ <b>Check my text</b>\n\n"
    "Paste your IELTS Writing Task 1 or Task 2 essay here (plain text).\n"
    "I will score it on all 4 criteria: TA/TR, CC, LR, GRA.\n\n"
    "Tip: include at least 150 words (Task 1) or 250 words (Task 2)."
)

# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------


def build_system_prompt(plan: SlotPlan) -> str:
    """Combine base instructions with slot-specific rubric context."""
    base = (
        BASE_SYSTEM_PROMPT_MORNING
        if plan.slot == "morning"
        else BASE_SYSTEM_PROMPT_EVENING
    )
    criteria = ", ".join(plan.criteria)
    extra = []
    if plan.requires_vocab_block:
        extra.append("Expand Vocabulary with Band 7.5–9 collocations and band tags.")
    if plan.requires_grammar_block:
        extra.append("Expand Grammar Tip with ❌/✅ contrast and a short English explanation — English only.")

    focus = " ".join(extra)
    return (
        f"{base}\n\n"
        f"TODAY'S RUBRIC: {plan.rubric}\n"
        f"MODULE: {plan.module}\n"
        f"IELTS CRITERIA FOCUS: {criteria}\n"
        f"CONTENT BRIEF: {plan.description}\n"
        f"{focus}"
    ).strip()


def build_user_prompt(plan: SlotPlan, rotation: dict[str, str], now: datetime) -> str:
    """Fill the slot template with week-rotation variables."""
    weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_name = weekday_names[now.weekday()]
    slot_label = "Morning (theory)" if plan.slot == "morning" else "Evening (practice)"

    body = plan.user_prompt_template.format(**rotation)
    return (
        f"Day: {day_name} | Slot: {slot_label}\n"
        f"Week rotation context: {rotation}\n\n"
        f"Generate today's post following this brief:\n{body}"
    )


# ---------------------------------------------------------------------------
# OpenAI generation
# ---------------------------------------------------------------------------


def create_openai_client() -> OpenAI | None:
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY is not set — cannot generate posts.")
        return None
    return OpenAI(api_key=OPENAI_API_KEY)


def enforce_english_only(text: str) -> str:
    """Drop legacy spoiler blocks and lines with Cyrillic — channel is English-only."""
    t = re.sub(r"<tg-spoiler>[\s\S]*?</tg-spoiler>", "", text, flags=re.IGNORECASE)
    lines = [ln for ln in t.splitlines() if not re.search(r"[\u0400-\u04FF]", ln)]
    t = "\n".join(lines)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


async def generate_post_text(
    client: OpenAI,
    plan: SlotPlan,
    rotation: dict[str, str],
    now: datetime,
) -> str | None:
    """Call OpenAI and return generated post text, or None on failure."""
    system = build_system_prompt(plan)
    user = build_user_prompt(plan, rotation, now)

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.75,
            max_tokens=1500,
        )
        text = (response.choices[0].message.content or "").strip()
        if not text:
            logger.error("OpenAI returned empty content for slot=%s", plan.slot)
            return None
        return enforce_english_only(text)
    except RateLimitError as exc:
        logger.error("OpenAI rate limit: %s", exc)
    except APIConnectionError as exc:
        logger.error("OpenAI connection error: %s", exc)
    except APIStatusError as exc:
        logger.error("OpenAI API error %s: %s", exc.status_code, exc.message)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected OpenAI error: %s", exc)
    return None


async def generate_morning_quiz(client: OpenAI, post_text: str) -> dict | None:
    """Generate fill-in-the-blank quiz from morning post vocabulary."""
    prompt = MORNING_QUIZ_PROMPT.format(post_text=post_text[:2000])
    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=400,
            response_format={"type": "json_object"},
        )
        raw = (response.choices[0].message.content or "").strip()
        data = json.loads(raw)
        options = [str(o) for o in data.get("options", [])][:4]
        if len(options) < 2 or not data.get("question"):
            return None
        correct = int(data.get("correctOptionId", 0))
        if correct < 0 or correct >= len(options):
            correct = 0
        return {
            "question": str(data["question"])[:300],
            "options": options,
            "correct_option_id": correct,
            "explanation": str(data.get("explanation", ""))[:200] or None,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("Morning quiz generation failed: %s", exc)
        return None


async def check_essay(client: OpenAI, essay_text: str) -> str | None:
    """Score a student essay on 4 IELTS criteria."""
    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": ESSAY_CHECK_SYSTEM},
                {"role": "user", "content": essay_text[:4000]},
            ],
            temperature=0.35,
            max_tokens=1200,
        )
        return (response.choices[0].message.content or "").strip() or None
    except Exception as exc:  # noqa: BLE001
        logger.exception("Essay check failed: %s", exc)
        return None


def word_count(text: str) -> int:
    return len(re.findall(r"\S+", text or ""))


# ---------------------------------------------------------------------------
# Telegram delivery
# ---------------------------------------------------------------------------


def build_site_keyboard(campaign: str, include_check: bool = False) -> InlineKeyboardMarkup:
    """Inline buttons → site + optional Check my text DM."""
    url = f"{SITE_URL}/?utm_source=telegram&utm_medium=channel&utm_campaign={campaign}"
    rows: list[list[InlineKeyboardButton]] = [
        [InlineKeyboardButton(text="👉 stratumielts.com — Check your writing", url=url)]
    ]
    if include_check:
        username = TELEGRAM_BOT_USERNAME_CANONICAL or _bot_username
        if username:
            rows.append(
                [
                    InlineKeyboardButton(
                        text="✅ Check my text",
                        url=f"https://t.me/{username}?start=check",
                    )
                ]
            )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def append_site_footer(text: str) -> str:
    """Visible link in every post body."""
    link = f"{SITE_URL}/"
    if link in text:
        return text
    return f"{text}\n\n—\n✍️ Practice with AI feedback:\n{link}"


async def send_post(
    bot: Bot,
    text: str,
    parse_mode: ParseMode | None,
    reply_markup: InlineKeyboardMarkup | None = None,
) -> bool:
    """Send message to channel; retry as plain text if parsing fails."""
    chat_id = TELEGRAM_CHAT_ID

    modes: tuple[ParseMode | None, ...] = (parse_mode, None) if parse_mode else (None,)

    for mode in modes:
        try:
            await bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=mode,
                reply_markup=reply_markup,
                disable_web_page_preview=False,
            )
            logger.info("Post sent successfully (parse_mode=%s)", mode)
            return True
        except TelegramAPIError as exc:
            if mode is not None:
                logger.warning("Parse send failed (%s), retrying plain text", exc)
                continue
            logger.error("Telegram send failed: %s", exc)
            return False
    return False


async def send_quiz_poll(
    bot: Bot,
    quiz: dict,
    schedule_date: datetime | None = None,
) -> bool:
    """Send or schedule a native Telegram quiz poll."""
    kwargs: dict = {
        "chat_id": TELEGRAM_CHAT_ID,
        "question": quiz["question"],
        "options": quiz["options"],
        "type": "quiz",
        "correct_option_id": quiz["correct_option_id"],
        "is_anonymous": True,
    }
    if quiz.get("explanation"):
        kwargs["explanation"] = quiz["explanation"]
    if schedule_date:
        kwargs["schedule_date"] = int(schedule_date.timestamp())

    try:
        await bot.send_poll(**kwargs)
        label = f"scheduled +{MORNING_QUIZ_DELAY_MINUTES}m" if schedule_date else "immediate"
        logger.info("Quiz poll sent (%s)", label)
        return True
    except TelegramAPIError as exc:
        logger.error("Quiz poll failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Scheduled jobs
# ---------------------------------------------------------------------------


async def publish_slot(
    bot: Bot,
    client: OpenAI | None,
    slot: Slot,
    scheduler: AsyncIOScheduler | None = None,
) -> None:
    """Generate and publish one scheduled post. Never raises — logs errors only."""
    now = datetime.now()
    weekday = now.weekday()

    try:
        plan = get_slot_plan(weekday, slot)
    except KeyError as exc:
        logger.error("Content plan lookup failed: %s", exc)
        return

    week_number = now.isocalendar()[1]
    rotation = get_rotation(week_number)

    logger.info(
        "Publishing %s post | weekday=%s | rubric=%s",
        slot,
        weekday,
        plan.rubric,
    )

    if client is None:
        logger.error("Skipping publish — OpenAI client unavailable.")
        return

    text = await generate_post_text(client, plan, rotation, now)
    if not text:
        logger.error("Skipping publish — generation failed for slot=%s", slot)
        return

    campaign = f"{slot}_{now.strftime('%Y-%m-%d')}"
    text = append_site_footer(text)
    parse_mode = ParseMode.HTML if slot == "morning" else ParseMode.MARKDOWN
    keyboard = build_site_keyboard(campaign, include_check=(slot == "evening"))

    await send_post(bot, text, parse_mode, reply_markup=keyboard)

    if slot == "morning":
        quiz = await generate_morning_quiz(client, text)
        if quiz and scheduler:
            run_at = now + timedelta(minutes=MORNING_QUIZ_DELAY_MINUTES)
            scheduler.add_job(
                send_quiz_poll,
                trigger=DateTrigger(run_date=run_at),
                args=[bot, quiz],
                kwargs={"schedule_date": None},
                id=f"morning_quiz_{now.strftime('%Y%m%d_%H%M')}",
                replace_existing=True,
            )
            logger.info("Morning quiz scheduled for %s", run_at.isoformat())
        elif quiz:
            await send_quiz_poll(bot, quiz)


def make_publish_callback(
    bot: Bot,
    client: OpenAI | None,
    slot: Slot,
    scheduler: AsyncIOScheduler,
):
    """Return an async callable for APScheduler."""

    async def _job() -> None:
        try:
            await publish_slot(bot, client, slot, scheduler)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unhandled error in %s job: %s", slot, exc)

    _job.__name__ = f"publish_{slot}"
    return _job


# ---------------------------------------------------------------------------
# DM handlers — Check my text
# ---------------------------------------------------------------------------


@router.message(CommandStart(deep_link=True))
async def cmd_start_deeplink(message: Message, command: CommandObject, bot: Bot) -> None:
    if command.args == "check":
        await message.answer(CHECK_START_TEXT, parse_mode=ParseMode.HTML)


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await message.answer(
        "👋 <b>Welcome to STRATUM IELTS Writing!</b>\n\n"
        "Commands:\n/check — send your essay for AI feedback\n"
        "/tip — writing advice\n\n"
        "✍️ <b>stratum</b>\n"
        f"<a href=\"{SITE_URL}/?utm_source=telegram&utm_medium=bot\">https://stratumielts.com/</a>",
        parse_mode=ParseMode.HTML,
    )


@router.message(Command("check"))
async def cmd_check(message: Message) -> None:
    await message.answer(CHECK_START_TEXT, parse_mode=ParseMode.HTML)


@router.message(F.chat.type == ChatType.PRIVATE, F.text)
async def handle_private_essay(message: Message) -> None:
    """Treat long private messages as essay submissions."""
    text = message.text or ""
    if text.startswith("/"):
        return
    if word_count(text) < 80:
        return

    client = create_openai_client()
    if not client:
        await message.answer("AI checking is temporarily unavailable.")
        return

    await message.answer("⏳ Checking your essay… This may take up to 30 seconds.")
    feedback = await check_essay(client, text)
    if feedback:
        await message.answer(feedback[:4096])
    else:
        await message.answer("Could not generate feedback. Please try again later.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def validate_config() -> bool:
    ok = True
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is required.")
        ok = False
    if not TELEGRAM_CHAT_ID:
        logger.error("TELEGRAM_CHAT_ID is required (channel @username or numeric id).")
        ok = False
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY is required.")
        ok = False
    return ok


async def main() -> None:
    global _bot_username

    if not validate_config():
        sys.exit(1)

    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    client = create_openai_client()

    me = await bot.get_me()
    _bot_username = me.username
    logger.info("Bot username: @%s", _bot_username)

    dp = Dispatcher()
    dp.include_router(router)

    scheduler = AsyncIOScheduler(timezone=TIMEZONE)

    scheduler.add_job(
        make_publish_callback(bot, client, "morning", scheduler),
        CronTrigger(hour=MORNING_HOUR, minute=0, timezone=TIMEZONE),
        id="morning_post",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    scheduler.add_job(
        make_publish_callback(bot, client, "evening", scheduler),
        CronTrigger(hour=EVENING_HOUR, minute=0, timezone=TIMEZONE),
        id="evening_post",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    scheduler.start()
    logger.info(
        "Bot started | timezone=%s | schedule=%02d:00 & %02d:00 | quiz_delay=%dm | model=%s",
        TIMEZONE,
        MORNING_HOUR,
        EVENING_HOUR,
        MORNING_QUIZ_DELAY_MINUTES,
        OPENAI_MODEL,
    )

    if os.getenv("RUN_ON_START", "").strip() == "1":
        logger.info("RUN_ON_START=1 — publishing test morning post…")
        await publish_slot(bot, client, "morning", scheduler)

    polling_task = asyncio.create_task(dp.start_polling(bot))

    try:
        await polling_task
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down…")
    finally:
        scheduler.shutdown(wait=False)
        polling_task.cancel()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
