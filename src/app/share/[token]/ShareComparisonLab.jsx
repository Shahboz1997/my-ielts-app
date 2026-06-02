'use client';

import { CheckCircle } from 'lucide-react';
import ComparisonLab from '@/components/ComparisonLab';

function buildCriteriaForLab(task) {
  const isTask1 = task.type === 'TASK_1';
  const taskKey = isTask1 ? 'Task_Achievement' : 'Task_Response';
  return {
    [taskKey]: { score: task.criteria?.task, comment: task.criteria?.taskComment ?? '' },
    Coherence_and_Cohesion: { score: task.criteria?.cc, comment: task.criteria?.ccComment ?? '' },
    Lexical_Resource: { score: task.criteria?.lr, comment: task.criteria?.lrComment ?? '' },
    Grammatical_Range_and_Accuracy: {
      score: task.criteria?.gra,
      comment: task.criteria?.graComment ?? '',
    },
  };
}

export default function ShareComparisonLab({ task }) {
  const draft = String(task.originalEssay || '').trim();
  const rewrite = String(task.suggestedRewrite || '').trim();
  if (!draft || !rewrite) return null;

  const activeTab = task.type === 'TASK_1' ? 'Task 1' : 'Task 2';
  const activeResult = {
    text: draft,
    content: draft,
    suggested_rewrite: rewrite,
    corrections: task.corrections ?? [],
    errors: task.errors ?? [],
    highlights: task.highlights ?? [],
    overall_band: task.band,
    criteria: buildCriteriaForLab(task),
  };

  return (
    <section className="mt-8">
      <div className="mb-4 flex w-full items-center gap-3 sm:mb-6">
        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={1.5} aria-hidden />
        <h3 className="shrink-0 text-sm font-extrabold uppercase tracking-[0.2em] text-slate-900 sm:text-base">
          Comparison Lab
        </h3>
        <div className="h-px flex-1 bg-slate-200" aria-hidden />
      </div>
      <ComparisonLab activeTab={activeTab} activeResult={activeResult} className="w-full" />
    </section>
  );
}
