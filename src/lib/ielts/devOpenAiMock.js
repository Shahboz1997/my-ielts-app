import {
  IELTS_TASK1_STANDARD_INSTRUCTION,
  buildTask1QuestionPaperText,
} from '@/lib/task1Prompt.js';

export function buildDevMockDescribeImageQuestion() {
  return buildTask1QuestionPaperText(
    'The chart below shows sample data for IELTS Writing Task 1 practice.'
  );
}

export function buildDevMockTask2Question(keyword) {
  const kw = String(keyword || 'technology').trim() || 'technology';
  return `Some people believe that ${kw} has more benefits than drawbacks. Others disagree. Discuss both views and give your own opinion.`;
}

export function buildDevMockLetterTask() {
  return `You recently bought a product online that arrived damaged.
• Describe what you ordered and what was wrong
• Explain the problems it has caused you
• Say what you would like the company to do

Write at least 150 words. You do not need to write any addresses. Begin your letter as follows:

Dear Sir or Madam,`;
}

export function buildDevMockGeneratedTask1Text() {
  return `${IELTS_TASK1_STANDARD_INSTRUCTION}

The line graph below shows the percentage of households with internet access in three countries between 2000 and 2020.`;
}
