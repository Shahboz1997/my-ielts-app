"""
Weekly IELTS Writing content plan for Telegram channel.
Cycle: Mon–Sun, 2 slots per day (morning theory / evening practice).
Covers TA, CC, LR, GRA across Academic & General, Task 1 & Task 2.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Slot = Literal["morning", "evening"]
Criterion = Literal["TA", "CC", "LR", "GRA"]

# 6-week rotation for task types (prevents identical prompts every week).
TASK_ROTATION = [
    {
        "academic_t1": "line graph",
        "general_t1": "letter of complaint",
        "task2_type": "opinion essay",
        "task2_topic": "technology and social life",
    },
    {
        "academic_t1": "bar chart",
        "general_t1": "letter of request",
        "task2_type": "discussion essay (both views + opinion)",
        "task2_topic": "university education funding",
    },
    {
        "academic_t1": "pie chart",
        "general_t1": "letter of apology",
        "task2_type": "problem-solution essay",
        "task2_topic": "urban traffic congestion",
    },
    {
        "academic_t1": "table",
        "general_t1": "invitation letter",
        "task2_type": "advantages-disadvantages essay",
        "task2_topic": "working from home",
    },
    {
        "academic_t1": "process diagram",
        "general_t1": "informal letter to a friend",
        "task2_type": "two-part question essay",
        "task2_topic": "decline of family meals",
    },
    {
        "academic_t1": "map comparison",
        "general_t1": "formal job application letter",
        "task2_type": "opinion essay",
        "task2_topic": "government spending on railways vs roads",
    },
]

TASK2_THEMES = [
    "Education",
    "Health",
    "Technology",
    "Environment",
    "Work & Career",
    "Globalisation",
    "Crime & Punishment",
]


@dataclass(frozen=True)
class SlotPlan:
    """One scheduled post slot (morning or evening on a given weekday)."""

    weekday: int  # 0=Monday … 6=Sunday (datetime.weekday())
    slot: Slot
    rubric: str
    description: str
    criteria: tuple[Criterion, ...]
    module: str  # e.g. "Academic Task 1", "General Task 2"
    user_prompt_template: str
    requires_vocab_block: bool = True
    requires_grammar_block: bool = False


def _morning_plans() -> list[SlotPlan]:
    """Theory-focused morning posts (lexicon, grammar, structure)."""
    return [
        SlotPlan(
            weekday=0,
            slot="morning",
            rubric="📚 Vocabulary of the Day (LR)",
            description="Academic Task 1 lexicon — trends, comparisons, figures.",
            criteria=("LR", "TA"),
            module="Academic Task 1",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create a morning post about vocabulary for Academic Task 1 — "
                "describing a {academic_t1}. "
                "Include 5–7 Band 7–9 words/phrases with brief English definitions, "
                "example sentences, and one common student mistake. "
                "End with a mini exercise: replace a Band 5 word with a Band 7+ alternative."
            ),
        ),
        SlotPlan(
            weekday=1,
            slot="morning",
            rubric="🔧 Grammar Tip (GRA)",
            description="General Task 1 — formal/informal register, modals, conditionals.",
            criteria=("GRA", "TA"),
            module="General Task 1 (Letter)",
            requires_vocab_block=False,
            requires_grammar_block=True,
            user_prompt_template=(
                "Create a morning post on grammar for General Task 1 — writing a {general_t1}. "
                "Focus on formal vs informal register OR modal verbs for polite requests. "
                "Give 3 before/after examples and a mini task: rewrite 2 informal sentences formally."
            ),
        ),
        SlotPlan(
            weekday=2,
            slot="morning",
            rubric="🏗️ Essay Structure (CC)",
            description="Task 2 skeleton — paragraphing and linking words.",
            criteria=("CC", "TA"),
            module="Task 2 (Academic & General)",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create a morning post on Task 2 essay structure for a {task2_type}. "
                "Provide a 4-paragraph skeleton (Intro → Body 1 → Body 2 → Conclusion) "
                "with sample topic sentences and 5 linking words/phrases with examples. "
                "Explain how examiners score Coherence & Cohesion."
            ),
        ),
        SlotPlan(
            weekday=3,
            slot="morning",
            rubric="📋 Task 1 Templates (TA + CC)",
            description="Ready-made phrases for Academic Task 1 overview and comparisons.",
            criteria=("TA", "CC"),
            module="Academic Task 1",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create a morning post with templates for Academic Task 1 — a {academic_t1}. "
                "Give 8–10 phrases for: (1) Overview, (2) comparing data, (3) describing change. "
                "Mark which phrases sound Band 6 vs Band 8. Stress that Overview is mandatory."
            ),
        ),
        SlotPlan(
            weekday=4,
            slot="morning",
            rubric="🧠 Tough Topic Breakdown (TA + LR)",
            description="Difficult Task 2 theme — arguments, vocabulary, staying on topic.",
            criteria=("TA", "LR"),
            module="Task 2",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create a morning post on a challenging Task 2 theme: {task2_topic}. "
                "Provide 8 topic-specific words, 3 arguments for and 3 against, "
                "2 illustration examples, and tips to avoid going off-topic."
            ),
        ),
        SlotPlan(
            weekday=5,
            slot="morning",
            rubric="📖 Topic Word Bank (LR)",
            description="Thematic vocabulary for Task 2.",
            criteria=("LR",),
            module="Task 2",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create a morning vocabulary post for Task 2 on the theme: {task2_theme}. "
                "Include 10 Band 7+ collocations, 3 synonym chains, "
                "and a mini exercise: write 2 sentences using 4 words from the list."
            ),
        ),
        SlotPlan(
            weekday=6,
            slot="morning",
            rubric="⚡ Advanced Grammar (GRA)",
            description="Complex structures for Band 7+ in Task 2.",
            criteria=("GRA",),
            module="Task 2",
            requires_vocab_block=False,
            requires_grammar_block=True,
            user_prompt_template=(
                "Create a morning post on advanced grammar for Task 2: "
                "participle clauses, cleft sentences, or inversion for emphasis. "
                "Explain the rule briefly, give 3 IELTS-style examples, "
                "warn against overuse, and add a mini rewrite exercise (3 simple → complex sentences)."
            ),
        ),
    ]


def _evening_plans() -> list[SlotPlan]:
    """Practice-focused evening posts."""
    return [
        SlotPlan(
            weekday=0,
            slot="evening",
            rubric="✍️ Practice: Academic Task 1",
            description="Real prompt + plan + TA checklist (no full model answer).",
            criteria=("TA", "CC"),
            module="Academic Task 1",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create an evening practice post for Academic Task 1 — a {academic_t1}. "
                "Invent a realistic IELTS prompt (describe the chart/graph briefly). "
                "Give: overview plan + 2 body paragraph plans, a 4-point TA checklist, "
                "and one common trap. Ask students to write 150+ words in 20 minutes. "
                "Do NOT write the full report — only the plan."
            ),
        ),
        SlotPlan(
            weekday=1,
            slot="evening",
            rubric="✉️ Practice: General Task 1",
            description="Letter prompt + structure + opening/closing phrases.",
            criteria=("TA",),
            module="General Task 1 (Letter)",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create an evening practice post for General Task 1 — a {general_t1}. "
                "Write a full prompt with 3 bullet points. "
                "Provide letter structure (greeting → purpose → details → action → closing), "
                "3 useful opening/closing phrases, and a TA checklist."
            ),
        ),
        SlotPlan(
            weekday=2,
            slot="evening",
            rubric="🎯 Prompt Breakdown: Task 2 (Academic)",
            description="Deconstruct prompt, brainstorm, thesis, outline.",
            criteria=("TA", "CC"),
            module="Academic Task 2",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create an evening post breaking down an Academic Task 2 prompt — "
                "a {task2_type} about {task2_topic}. "
                "Show: (1) what the question really asks, (2) brainstorm 4 ideas, "
                "(3) 2 thesis options, (4) 4-paragraph outline. "
                "Highlight one typical TA mistake."
            ),
        ),
        SlotPlan(
            weekday=3,
            slot="evening",
            rubric="🎯 Prompt Breakdown: Task 2 (General)",
            description="Two-part question — answering BOTH parts.",
            criteria=("TA",),
            module="General Task 2",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create an evening post for General Task 2 — a two-part question "
                "about everyday life (family, work, or local community). "
                "Show how to answer BOTH parts, brainstorm + outline, "
                "and include a TA checklist for two-part questions."
            ),
        ),
        SlotPlan(
            weekday=4,
            slot="evening",
            rubric="❌ Error Analysis",
            description="Band 5.5 fragment with 5 annotated mistakes.",
            criteria=("GRA", "LR"),
            module="Task 2",
            requires_vocab_block=False,
            requires_grammar_block=True,
            user_prompt_template=(
                "Create an evening error-analysis post. "
                "Write an 80–100 word Task 2 fragment at Band 5.5 with 5 errors: "
                "subject-verb agreement, articles, collocation, run-on sentence, informal word. "
                "For each: show wrong → corrected → rule. "
                "End with 'Find 2 more errors yourself'."
            ),
        ),
        SlotPlan(
            weekday=5,
            slot="evening",
            rubric="🏆 Band 8.5 Essay Breakdown",
            description="Model essay with inline criterion annotations.",
            criteria=("TA", "CC", "LR", "GRA"),
            module="Task 2",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create an evening post analysing a Band 8.5 Task 2 essay (~280 words) "
                "on: {task2_topic}. Include the full essay with brief inline notes "
                "[TA], [CC], [LR], [GRA]. End with 5 techniques students can copy."
            ),
        ),
        SlotPlan(
            weekday=6,
            slot="evening",
            rubric="🔄 Weekly Challenge",
            description="Mini-test: Task 1 + Task 2 prompts + self-check rubric.",
            criteria=("TA", "CC", "LR", "GRA"),
            module="Academic + Task 2",
            requires_vocab_block=True,
            user_prompt_template=(
                "Create a Sunday weekly challenge post. "
                "Give: (1) Academic Task 1 prompt ({academic_t1}), "
                "(2) Task 2 opinion prompt about {task2_topic}. "
                "Timers: 20 + 40 min. "
                "Self-check: 4 questions per criterion (16 total). "
                "Motivational closing — invite students to share results."
            ),
        ),
    ]


MORNING_PLANS: dict[int, SlotPlan] = {p.weekday: p for p in _morning_plans()}
EVENING_PLANS: dict[int, SlotPlan] = {p.weekday: p for p in _evening_plans()}


def get_rotation(week_number: int) -> dict[str, str]:
    """Return task-type variables for the current week in the 6-week cycle."""
    base = TASK_ROTATION[week_number % len(TASK_ROTATION)]
    return {
        **base,
        "task2_theme": TASK2_THEMES[week_number % len(TASK2_THEMES)],
    }


def get_slot_plan(weekday: int, slot: Slot) -> SlotPlan:
    """Look up content plan for a weekday (0=Mon) and time slot."""
    plans = MORNING_PLANS if slot == "morning" else EVENING_PLANS
    if weekday not in plans:
        raise KeyError(f"No plan for weekday={weekday} slot={slot}")
    return plans[weekday]
