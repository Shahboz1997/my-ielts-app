/**
 * Deterministic /api/check payload when E2E_MOCK_OPENAI=1 (no OpenAI call).
 */
export function buildE2eMockCheckResult({ userText, promptText, isT1 }) {
  const taskCriteriaName = isT1 ? 'Task_Achievement' : 'Task_Response';
  const snippet = String(userText || '').trim().slice(0, 80);
  return {
    overall_band: 6.5,
    word_count: userText.trim().split(/\s+/).filter(Boolean).length,
    improvement_strategy: 'E2E mock analysis — structure and task response are adequate for a practice run.',
    criteria: {
      [taskCriteriaName]: { score: 6.5, comment: 'Addresses the task with clear position.' },
      Coherence_and_Cohesion: { score: 6.0, comment: 'Logical paragraphing.' },
      Lexical_Resource: { score: 6.5, comment: 'Adequate range for the band.' },
      Grammatical_Range_and_Accuracy: { score: 6.0, comment: 'Mixed complexity with some errors.' },
    },
    errors: [],
    logical_errors: [],
    highlights: [],
    corrections: [],
    lexical_upgrade: [],
    analysis: {
      summary: `E2E check for: ${snippet || 'essay'}`,
      prompt: promptText || 'E2E practice prompt',
    },
    suggested_rewrite: userText.trim(),
  };
}
