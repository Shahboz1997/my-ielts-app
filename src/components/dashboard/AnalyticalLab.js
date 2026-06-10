'use client';
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, Zap, BookOpen, GitBranch, ChevronDown, Sparkles } from 'lucide-react';
import { generateStratumWritingPdfFromCheck } from '@/lib/lazyStratumPdf';
import SuggestedRewriteKaraoke, { getPlainTextForKaraoke } from './SuggestedRewriteKaraoke';
import LexicalUpgradePanel from '@/components/LexicalUpgradePanel';
import AddToWordListButton from '@/components/AddToWordListButton';
import { mergeLexicalUpgrades, getWeakWordsSet } from '@/lib/lexicalUpgrade';
import {
  FEED_LABEL,
  ERROR_TYPE_BADGE_CLASS,
  ERROR_TYPE_BADGE_LABEL,
  CEFR_LEVELS,
  CEFR_COLORS,
  RIGHT_PANEL_TABS,
} from './analytical-lab/constants';
import {
  ErrorHighlightLegend,
  normalizeClientErrorType,
  renderHighlighterSpans,
  buildWordLevelsMap,
  buildErrorWordsSet,
  renderTextWithWordLevels,
  buildSegments,
  buildSegmentsFromErrors,
  normalizeCefrStats,
} from './analytical-lab/textHighlight';
import { getAudioFilenameBase, fetchTtsWithTimestamps } from './analytical-lab/ttsHelpers';

/**
 * AnalyticalLab — feedback view for a single check.
 * To enable Click-to-Fix (replace error with suggestion in the text), pass setUserText from the parent
 * (e.g. the Writer page or any page that owns editable userText state).
 */
export default function AnalyticalLab({ handleReplaceWord, ...props }) {
  const { check, analysis: analysisProp, userText: userTextProp, taskType: taskTypeProp, isLoading: isLoadingProp, setUserText } = props;
  const isLoading = Boolean(isLoadingProp);
  const feedback = useMemo(() => {
    const raw = analysisProp ?? check?.feedback;
    if (raw == null) return {};
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    } catch {
      return {};
    }
  }, [analysisProp, check?.feedback]);

  const userText = userTextProp ?? check?.content ?? '';
  const promptTextRaw = props?.promptText ?? check?.promptText ?? '';
  const promptText = typeof promptTextRaw === 'string' ? promptTextRaw.trim() : '';
  const taskTypeRaw = check?.type ?? taskTypeProp;
  const taskTypeNormalized = (taskTypeRaw === 'TASK_1' || taskTypeRaw === 'task1') ? 'task1' : 'task2';
  const taskTypeForAudio = taskTypeNormalized === 'task1' ? 'TASK_1' : 'TASK_2';

  const [viewMode, setViewMode] = useState('feedback');
  /** On small screens, feedback lives below the fold — scroll so the toggle feels responsive. */
  const scrollMobileFeedbackInsights = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.setTimeout(() => {
      if (!window.matchMedia('(max-width: 1279px)').matches) return;
      document.getElementById('archive-feedback-insights')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }, []);
  const [rightPanelTab, setRightPanelTab] = useState('vocabulary');
  const [focusedId, setFocusedId] = useState(null);
  /** Краткая подсветка карточки после клика по подсветке в тексте (click-to-focus). */
  const [flashErrorCardId, setFlashErrorCardId] = useState(null);
  const [accordionOpen, setAccordionOpen] = useState(null);
  const errorCardRefs = useRef({});
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState('');
  const criteria = feedback.criteria || {};
  const taskKey = taskTypeNormalized === 'task1' ? 'Task_Achievement' : 'Task_Response';
  const ta = criteria[taskKey]?.score ?? 0;
  const cc = criteria.Coherence_and_Cohesion?.score ?? 0;
  const lr = criteria.Lexical_Resource?.score ?? 0;
  const gra = criteria.Grammatical_Range_and_Accuracy?.score ?? 0;
  const band = feedback.overall_band != null ? Number(feedback.overall_band) : null;
  const ideaDevelopment = feedback?.idea_development && typeof feedback.idea_development === 'object'
    ? feedback.idea_development
    : null;
  const ideaDevScore = Number.isFinite(Number(ideaDevelopment?.overall?.score_0_5))
    ? Math.max(0, Math.min(5, Number(ideaDevelopment.overall.score_0_5)))
    : null;
  const ideaDevSummary = typeof ideaDevelopment?.overall?.summary === 'string'
    ? ideaDevelopment.overall.summary
    : '';
  const ideaDevParagraphs = Array.isArray(ideaDevelopment?.paragraphs) ? ideaDevelopment.paragraphs : [];

  const highlights = Array.isArray(feedback.highlights) ? feedback.highlights : [];
  const corrections = Array.isArray(feedback.corrections) ? feedback.corrections : [];
  const errors = useMemo(() => {
    const raw =
      Array.isArray(feedback.errors) && feedback.errors.length > 0 ? feedback.errors : corrections;
    return raw.map((e, i) => {
      const type = normalizeClientErrorType(e.type ?? e.category);
      const fixed = String(e.fixed ?? '').trim();
      const suggest = String(e.suggestion ?? '').trim();
      const replacement = fixed || suggest;
      return {
        id: e.id ?? `error-${i}`,
        type,
        original: e.original ?? e.word ?? e.text ?? '',
        fixed: replacement,
        suggestion: replacement,
        explanation: String(e.explanation ?? e.impact ?? '').trim(),
      };
    });
  }, [feedback.errors, corrections]);
  const lexicalUpgradeRaw = Array.isArray(feedback.lexical_upgrade) ? feedback.lexical_upgrade : [];
  const lexicalUpgrade = useMemo(
    () =>
      mergeLexicalUpgrades({
        apiRows: lexicalUpgradeRaw,
        essayText: userText || '',
        isT1: taskTypeNormalized === 'task1',
      }),
    [lexicalUpgradeRaw, userText, taskTypeNormalized]
  );
  const linkingWords = feedback?.analysis?.linking_words ?? feedback?.linking_words ?? null;
  const repetitionAlertsRaw = feedback?.analysis?.word_repetition ?? feedback?.word_repetition ?? [];
  const repetitionAlerts = Array.isArray(repetitionAlertsRaw) ? repetitionAlertsRaw : [];
  const suggestedRewrite = feedback.suggested_rewrite || '';
  const audioRef = useRef(null);
  const audioFilenameBase = getAudioFilenameBase(taskTypeForAudio);
  const audioDownloadName = `${audioFilenameBase}.mp3`;
  /** Prefer error-based spans; if none match the saved text, fall back to highlights/corrections. */
  const feedbackEssaySegments = useMemo(() => {
    const fromErrors = buildSegmentsFromErrors(userText, errors);
    if (fromErrors.some((s) => s.kind === 'error')) return fromErrors;
    const merged = buildSegments(userText, highlights, corrections);
    return merged.map((s) => (s.kind ? s : { ...s, kind: 'text', text: s.text ?? '' }));
  }, [userText, errors, highlights, corrections]);
  const hasFeedbackInlineDecor = useMemo(
    () =>
      feedbackEssaySegments.some(
        (s) => s.kind === 'error' || s.kind === 'highlight' || s.kind === 'correction'
      ),
    [feedbackEssaySegments]
  );
  const cefrStats = useMemo(() => normalizeCefrStats(feedback.cefr_stats), [feedback.cefr_stats]);

  const wordLevelsMap = useMemo(() => buildWordLevelsMap(feedback.word_levels), [feedback.word_levels]);
  const errorWordsSet = useMemo(() => buildErrorWordsSet(feedback.errors, corrections), [feedback.errors, corrections]);
  const weakWordsSet = useMemo(() => getWeakWordsSet(lexicalUpgrade), [lexicalUpgrade]);
  const useTypedErrorHighlight = viewMode === 'feedback' && errors.length > 0;

  const handleInsertLinkingWord = useCallback((w) => {
    if (!setUserText) return;
    const word = String(w || '').trim();
    if (!word) return;
    setUserText((prev) => {
      const current = String(prev || '');
      const sep = current && !/\s$/.test(current) ? ' ' : '';
      return `${current}${sep}${word}`;
    });
  }, [setUserText]);

  const replaceNextWordOccurrence = useCallback((wordRaw, replacementRaw) => {
    if (!setUserText) return;
    const word = String(wordRaw || '').trim();
    const replacement = String(replacementRaw || '').trim();
    if (!word || !replacement) return;
    setUserText((prev) => {
      const current = String(prev || '');
      // Replace first whole-word occurrence, case-insensitive.
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'i');
      if (!re.test(current)) return current;
      return current.replace(re, replacement);
    });
  }, [setUserText]);
  const useWordLevelRendering =
    viewMode === 'feedback' && wordLevelsMap && wordLevelsMap.size > 0 && !useTypedErrorHighlight;

  const formatTime = useCallback((seconds) => {
    const s = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(seconds)) : 0;
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, []);

  const [suggestedRewriteWordTimestamps, setSuggestedRewriteWordTimestamps] = useState([]);

  const feedItems = useMemo(() => {
    const fromErrors = errors.map((e) => ({
      id: e.id,
      type: e.type,
      label: ERROR_TYPE_BADGE_LABEL[e.type] || FEED_LABEL[e.type] || e.type,
      text: e.original,
      suggestion: e.explanation,
      fixed: e.fixed,
      impact: 'medium',
      kind: 'error',
    }));
    if (fromErrors.length > 0) return fromErrors;
    const list = [];
    highlights.forEach((h, i) =>
      list.push({
        id: `h-${i}`,
        type: normalizeClientErrorType(h.type),
        label: FEED_LABEL[h.type] || h.type,
        text: h.text,
        suggestion: h.suggestion,
        kind: 'highlight',
      })
    );
    corrections.forEach((c, i) => {
      const type = normalizeClientErrorType(c.category);
      list.push({
        id: `c-${i}`,
        type,
        label: c.category || ERROR_TYPE_BADGE_LABEL[type],
        text: c.original,
        suggestion: c.explanation,
        fixed: c.fixed,
        impact: c.impact,
        kind: 'correction',
      });
    });
    return list;
  }, [errors, highlights, corrections]);

  /** Build bullet lists and quick-fix per criterion for the feedback dashboard. */
  const feedbackCards = useMemo(() => {
    const toBullets = (text) => {
      if (!text || typeof text !== 'string') return [];
      return text
        .split(/\n+|\.\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);
    };
    const grammarItems = feedItems.filter((i) => i.type === 'grammar');
    const lexicalItems = feedItems.filter((i) => i.type === 'lexical');
    const cohesionItems = feedItems.filter((i) => i.type === 'cohesion' || i.type === 'logic');
    const pickQuickFix = (items) => {
      const high = items.find((i) => i.impact === 'high');
      return high?.suggestion || (items[0] && (items[0].suggestion || (items[0].fixed ? `Use "${items[0].fixed}"` : null))) || null;
    };
    return [
      {
        key: 'grammar',
        title: 'Grammar',
        Icon: Zap,
        score: gra,
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        comment: criteria.Grammatical_Range_and_Accuracy?.comment,
        items: grammarItems,
        quickFix: pickQuickFix(grammarItems) || (criteria.Grammatical_Range_and_Accuracy?.comment ? toBullets(criteria.Grammatical_Range_and_Accuracy.comment)[0] : null),
      },
      {
        key: 'vocabulary',
        title: 'Vocabulary',
        Icon: BookOpen,
        score: lr,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        comment: criteria.Lexical_Resource?.comment,
        items: lexicalItems,
        quickFix: pickQuickFix(lexicalItems) || (criteria.Lexical_Resource?.comment ? toBullets(criteria.Lexical_Resource.comment)[0] : null),
      },
      {
        key: 'cohesion',
        title: 'Cohesion',
        Icon: GitBranch,
        score: cc,
        iconColor: 'text-amber-600 dark:text-amber-400',
        comment: criteria.Coherence_and_Cohesion?.comment,
        items: cohesionItems,
        quickFix: pickQuickFix(cohesionItems) || (criteria.Coherence_and_Cohesion?.comment ? toBullets(criteria.Coherence_and_Cohesion.comment)[0] : null),
      },
    ];
  }, [feedItems, criteria, gra, lr, cc]);

  const handleGenerateAudio = useCallback(async () => {
    if (!suggestedRewrite || isAudioLoading) return;
    const cleanText = getPlainTextForKaraoke(suggestedRewrite);
    if (!cleanText) return;
    setIsAudioLoading(true);
    setAudioError('');
    try {
      const { blob, wordTimestamps } = await fetchTtsWithTimestamps({
        text: cleanText,
        filenameBase: audioFilenameBase,
      });
      const url = window.URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setSuggestedRewriteWordTimestamps(Array.isArray(wordTimestamps) ? wordTimestamps : []);
      setIsPlaying(false);
      setAudioProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (e) {
      setAudioError(e?.message || 'Unable to generate audio right now.');
    } finally {
      setIsAudioLoading(false);
    }
  }, [suggestedRewrite, audioFilenameBase, isAudioLoading]);

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current || !audioUrl || isAudioLoading) return;
    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch {
      // ignore (e.g. user gesture restriction)
    }
  }, [audioUrl, isAudioLoading]);

  const handleSeek = useCallback((e) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  }, []);

  const handleDownloadMp3 = useCallback(() => {
    if (!audioBlob) return;
    const url = window.URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = audioDownloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  }, [audioBlob, audioDownloadName]);

  /** Click-to-Fix: replace first occurrence of error with suggestion. Only runs in Feedback mode when setUserText is passed. */
  const handleAutoFix = useCallback((original, replacement) => {
    if (viewMode !== 'feedback') return;
    if (!setUserText || !replacement) return;
    const current = userText;
    if (!current || typeof original !== 'string') return;
    const newText = current.replace(original, replacement);
    if (newText !== current) setUserText(newText);
  }, [viewMode, setUserText, userText]);

  /** Use parent's handleReplaceWord when provided, else fallback to handleAutoFix (2-arg). */
  const onReplaceWord = useCallback((original, fixed, occurrenceIndex, idx) => {
    if (handleReplaceWord) {
      handleReplaceWord(original, fixed, occurrenceIndex ?? 1, idx);
      return;
    }
    handleAutoFix(original, fixed);
  }, [handleReplaceWord, handleAutoFix]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const duration = el.duration || 0;
      const current = el.currentTime || 0;
      setAudioProgress(duration > 0 ? current / duration : 0);
      setAudioTime(current);
      setAudioDuration(duration);
    };
    const onLoaded = () => {
      const duration = el.duration || 0;
      setAudioDuration(duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setAudioProgress(1);
    };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('ended', onEnded);
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) window.URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (flashErrorCardId == null) return;
    const t = window.setTimeout(() => setFlashErrorCardId(null), 1000);
    return () => window.clearTimeout(t);
  }, [flashErrorCardId]);

  const cardRefs = React.useRef({});
  const scrollToCard = useCallback((id) => {
    setFocusedId(id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  /** Open the tab that lists this error and scroll the main page so the matching card is in view. */
  const scrollToErrorCard = useCallback((errorId, errorType) => {
    if (errorId == null) return;
    const type = normalizeClientErrorType(errorType);
    setRightPanelTab(type === 'grammar' ? 'grammar' : 'vocabulary');
    setFocusedId(errorId);
    setFlashErrorCardId(errorId);
    const runScroll = () => {
      const el = errorCardRefs.current[errorId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runScroll();
        window.setTimeout(runScroll, 100);
        window.setTimeout(runScroll, 280);
      });
    });
  }, []);

  const errorCardShellClass = (errId) =>
    [
      'scroll-mt-28 transition-all duration-300',
      flashErrorCardId === errId
        ? 'ring-2 ring-indigo-500/60 dark:ring-indigo-400/55 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 shadow-lg shadow-indigo-500/15 z-[1] motion-safe:animate-pulse'
        : '',
      focusedId === errId && flashErrorCardId !== errId
        ? 'ring-1 ring-indigo-200/70 dark:ring-indigo-500/35'
        : '',
    ]
      .filter(Boolean)
      .join(' ');

  /** Single feedback card content (shared by desktop card and accordion body) */
  const renderFeedbackCardContent = (card) => {
    const Icon = card.Icon;
    const isActive = card.items.some((it) => it.id === focusedId);
    const commentBullets = (card.comment && typeof card.comment === 'string')
      ? card.comment.split(/\n+|\.\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 6)
      : [];
    const listItems = [
      ...commentBullets.map((b) => ({ type: 'comment', text: b })),
      ...card.items.map((it) => ({
        type: 'item',
        text: it.fixed ? `"${it.text}" → "${it.fixed}"` : (it.suggestion || `"${it.text}"`),
        id: it.id,
      })),
    ].slice(0, 12);
    return (
      <>
        {/* Band score circle — top-right anchor */}
        <div className="absolute top-4 right-4 h-9 w-9 shrink-0">
          <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-200 dark:text-slate-700" />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={card.score != null ? `${(card.score / 9) * 100}, 100` : '0, 100'}
              strokeLinecap="round"
              className="text-indigo-500 dark:text-indigo-400 transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
            {card.score != null ? card.score.toFixed(1) : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 pr-10">
          <Icon className={`w-4 h-4 shrink-0 ${card.iconColor}`} aria-hidden />
          <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-700 dark:text-slate-300">
            {card.title}
          </h3>
        </div>
        {card.quickFix && (
          <div className="mt-2">
            <span className="inline-block bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-medium">
              Quick Fix
            </span>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">{card.quickFix}</p>
          </div>
        )}
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400 list-disc list-inside pl-0.5">
          {listItems.length === 0 ? (
            <li>No specific feedback for this criterion.</li>
          ) : (
            listItems.map((entry, idx) => (
              <li
                key={entry.id || idx}
                ref={entry.id ? (el) => { cardRefs.current[entry.id] = el; } : undefined}
                className={entry.id === focusedId ? 'text-indigo-700 dark:text-indigo-300 font-medium' : ''}
              >
                {entry.text}
              </li>
            ))
          )}
        </ul>
      </>
    );
  };

  if (isLoading || (!check && !analysisProp)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 xl:pb-12" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="flex flex-col gap-10 max-w-none mx-auto min-w-0 w-full px-3 sm:px-5 md:px-6 py-4 sm:py-6">
          <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-grow xl:w-3/5 space-y-4">
              <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-4 sm:p-6 lg:p-8 shadow-sm animate-pulse">
                <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
                <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800 mb-4" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 mb-2" />
                <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full xl:w-[400px]">
              <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-6 shadow-sm animate-pulse">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
                <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 xl:pb-12" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col xl:flex-row gap-8 w-full min-w-0 max-w-none mx-auto px-3 sm:px-5 md:px-6 py-4 sm:py-6 items-start">
        {/* Center: Main Content — Your Answer + Lexical + Action Bar */}
        <div className="order-1 flex min-w-0 w-full flex-1 flex-col gap-8 xl:order-1">
          <div className="flex items-center">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              My Archive
            </Link>
          </div>
          {/* Your Answer — header + toggle + legend + text */}
          <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-4 sm:p-6 lg:p-8 shadow-sm min-w-0 overflow-x-hidden">
            <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-4 sm:gap-y-2">
              <div className="min-w-0">
                {viewMode === 'original' ? (
                  <h2 className="text-slate-900 dark:text-white font-bold tracking-tight text-lg sm:text-xl break-words">
                    Your Answer
                  </h2>
                ) : null}
              </div>
              <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-full sm:justify-self-end sm:justify-end">
                <div className="flex min-w-0 flex-1 basis-[12rem] rounded-full bg-slate-100 p-0.5 dark:bg-slate-800 sm:flex-none sm:basis-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode('original')}
                    className={`min-w-0 flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-4 sm:py-2 sm:text-sm ${viewMode === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('feedback');
                      scrollMobileFeedbackInsights();
                    }}
                    className={`min-w-0 flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-4 sm:py-2 sm:text-sm ${viewMode === 'feedback' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Feedback
                  </button>
                </div>
              </div>
            </div>
            {promptText && (
              <div className="mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {taskTypeNormalized === 'task1' ? 'Task 1 prompt' : 'Task 2 prompt'}
                </div>
                <div className="mt-2 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {promptText}
                </div>
              </div>
            )}
            {viewMode === 'feedback' && useTypedErrorHighlight && (
              <div className="mb-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <ErrorHighlightLegend />
              </div>
            )}
            {viewMode === 'feedback' && !useWordLevelRendering && !hasFeedbackInlineDecor && (
              <p className="mb-3 text-sm text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 leading-relaxed">
                No inline highlights match this saved text. Use{' '}
                <strong className="text-slate-800 dark:text-slate-200">band scores and the tabs below</strong> for full
                feedback.
              </p>
            )}
            <div className="text-slate-800 dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap break-words transition-all duration-200" spellCheck={false}>
              {viewMode === 'original'
                ? userText
                : useWordLevelRendering
                  ? renderTextWithWordLevels(userText, wordLevelsMap, errorWordsSet, () => setRightPanelTab('vocabulary'), weakWordsSet)
                  : renderHighlighterSpans(feedbackEssaySegments, {
                      handleAutoFix,
                      setUserText,
                      scrollToErrorCard,
                    })}
            </div>
          </div>

          {/* Mobile: analytics blocks right after essay */}
          <div id="archive-feedback-insights" className="xl:hidden flex flex-col gap-6 scroll-mt-24">
            <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm p-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Band score</h2>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="2.5" className="dark:stroke-slate-700" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray={band != null ? `${(band / 9) * 100}, 100` : '0, 100'} strokeLinecap="round" className="transition-all duration-700" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white tracking-tight">{band != null ? band.toFixed(1) : '—'}</span>
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'TA', value: ta, label: taskKey === 'Task_Achievement' ? 'TA' : 'TR' },
                    { key: 'CC', value: cc, label: 'CC' },
                    { key: 'LR', value: lr, label: 'LR' },
                    { key: 'GRA', value: gra, label: 'GRA' },
                  ].map(({ key, value, label }) => (
                    <div key={key}>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-0.5">
                        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${((value ?? 0) / 9) * 100}%` }} />
                      </div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{value != null ? value.toFixed(1) : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
              {feedback.improvement_strategy && (
                <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{feedback.improvement_strategy}</p>
              )}
            </div>

            <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm p-6">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                {RIGHT_PANEL_TABS.map((tab) => {
                  const label = tab.key === 'task' ? (taskTypeNormalized === 'task1' ? tab.labelTask1 : tab.labelTask2) : tab.label;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setRightPanelTab(tab.key)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${rightPanelTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6">
                {rightPanelTab === 'task' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{taskTypeNormalized === 'task1' ? 'Task Achievement' : 'Task Response'}</span>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{ta != null ? ta.toFixed(1) : '—'}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria[taskKey]?.comment || 'No specific feedback for this criterion.'}</p>
                    {taskTypeNormalized === 'task2' && ideaDevelopment && (
                      <div className="mt-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                              Idea development
                            </div>
                            {ideaDevSummary ? (
                              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                {ideaDevSummary}
                              </p>
                            ) : null}
                          </div>
                          <div className="shrink-0 rounded-xl border border-indigo-200/70 dark:border-indigo-500/30 bg-white/80 dark:bg-slate-950/40 px-3 py-2 text-center">
                            <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                              Depth
                            </div>
                            <div className="text-lg font-black tracking-tight text-indigo-600 dark:text-indigo-300 tabular-nums">
                              {ideaDevScore != null ? `${ideaDevScore}/5` : '—'}
                            </div>
                          </div>
                        </div>

                        {ideaDevParagraphs.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {ideaDevParagraphs.slice(0, 6).map((p, i) => {
                              const label = typeof p?.label === 'string' ? p.label : `Paragraph ${i + 1}`;
                              const mainIdea = typeof p?.main_idea === 'string' ? p.main_idea : '';
                              const missing = Array.isArray(p?.missing) ? p.missing : [];
                              const upgrades = Array.isArray(p?.upgrades) ? p.upgrades : [];
                              return (
                                <div
                                  key={`${label}-${i}`}
                                  className="rounded-xl border border-slate-200/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/30 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                      {label}
                                    </div>
                                    {missing.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {missing.slice(0, 5).map((m, mi) => (
                                          <span
                                            key={`${m}-${mi}`}
                                            className="inline-flex items-center rounded-full border border-amber-200/70 dark:border-amber-600/30 bg-amber-50/60 dark:bg-amber-900/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-200"
                                            title="Missing piece to add depth"
                                          >
                                            {String(m).replace(/_/g, ' ')}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {mainIdea ? (
                                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100">Main idea:</span>{' '}
                                      {mainIdea}
                                    </p>
                                  ) : null}
                                  {upgrades.length > 0 && (
                                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                                      {upgrades.slice(0, 2).map((u, ui) => (
                                        <li key={`${label}-u-${ui}`}>{u}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {rightPanelTab === 'coherence' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Coherence & Cohesion</span>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{cc != null ? cc.toFixed(1) : '—'}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria.Coherence_and_Cohesion?.comment || 'No specific feedback for this criterion.'}</p>
                  </div>
                )}
                {rightPanelTab === 'vocabulary' && (
                  <div className="space-y-4">
                    {errors.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                            Errors & corrections
                          </h3>
                          <ErrorHighlightLegend className="opacity-90" />
                        </div>
                        {errors.map((err, idx) => {
                          const applyText = err.fixed || err.suggestion;
                          const canApply =
                            applyText &&
                            String(applyText).trim().length > 0 &&
                            String(applyText).trim().toLowerCase() !== String(err.original).trim().toLowerCase();
                          const badgeCls = ERROR_TYPE_BADGE_CLASS[err.type] || ERROR_TYPE_BADGE_CLASS.grammar;
                          const badgeLabel = ERROR_TYPE_BADGE_LABEL[err.type] || err.type;
                          return (
                            <div
                              key={err.id || idx}
                              ref={(el) => { if (errorCardRefs.current) errorCardRefs.current[err.id] = el; }}
                              className={`group relative rounded-2xl border border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/30 ${errorCardShellClass(err.id)}`}
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeCls}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <span className="text-red-500 dark:text-red-400 line-through text-sm font-medium break-words">
                                    {err.original}
                                  </span>
                                  <span className="text-slate-400 shrink-0" aria-hidden>→</span>
                                  {canApply ? (
                                    <button
                                      type="button"
                                      onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
                                      className="text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-500/20 text-left break-words"
                                      title="Click to apply this fix"
                                    >
                                      {applyText}
                                    </button>
                                  ) : (
                                    <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                                      No one-click fix — revise using the explanation below.
                                    </span>
                                  )}
                                </div>

                                {canApply && (
                                  <button
                                    type="button"
                                    onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all active:scale-95 shadow-lg shadow-emerald-600/20 shrink-0"
                                  >
                                    <svg xmlns="http://www.w3.org" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                    Apply
                                  </button>
                                )}
                              </div>

                              <AddToWordListButton
                                word={err.original}
                                taskType={taskTypeNormalized}
                                source="correction"
                                note={applyText || err.explanation || null}
                                compact
                                className="mt-1"
                              />

                              {err.explanation ? (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                  <span className={`font-bold ${err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                    Why?
                                  </span>{' '}
                                  <span
                                    className={`font-semibold ${
                                      err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-indigo-900 dark:text-indigo-200'
                                    }`}
                                  >
                                    {err.type === 'logic' ? '⚠️ ' : null}
                                    {err.explanation}
                                  </span>
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {rightPanelTab === 'grammar' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Grammatical Range & Accuracy</span>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{gra != null ? gra.toFixed(1) : '—'}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria.Grammatical_Range_and_Accuracy?.comment || 'No specific feedback for this criterion.'}</p>
                    {errors.some((e) => e.type === 'grammar') && (
                      <div className="space-y-3 mt-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Grammar corrections</h3>
                        {errors.filter((e) => e.type === 'grammar').map((err, idx) => {
                          const applyText = err.fixed || err.suggestion;
                          const canApply =
                            applyText &&
                            String(applyText).trim().length > 0 &&
                            String(applyText).trim().toLowerCase() !== String(err.original).trim().toLowerCase();
                          const badgeCls = ERROR_TYPE_BADGE_CLASS.grammar;
                          return (
                            <div
                              key={err.id}
                              ref={(el) => { if (errorCardRefs.current) errorCardRefs.current[err.id] = el; }}
                              className={`rounded-2xl border border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-white/5 ${errorCardShellClass(err.id)}`}
                            >
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${badgeCls}`}>
                                Grammar
                              </span>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-red-500 dark:text-red-400 line-through text-sm font-medium">{err.original}</span>
                                <span className="text-slate-400" aria-hidden>→</span>
                                {canApply ? (
                                  <button
                                    type="button"
                                    onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
                                    className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline text-left"
                                  >
                                    {applyText}
                                  </button>
                                ) : (
                                  <span className="text-sm text-slate-500 dark:text-slate-400">—</span>
                                )}
                              </div>
                              <AddToWordListButton
                                word={err.original}
                                taskType={taskTypeNormalized}
                                source="correction"
                                note={applyText || err.explanation || null}
                                compact
                                className="mt-1"
                              />
                              {err.explanation ? (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                  <span
                                    className={`font-semibold ${
                                      err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    Why?
                                  </span>{' '}
                                  <span
                                    className={`font-semibold ${
                                      err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-indigo-900 dark:text-indigo-200'
                                    }`}
                                  >
                                    {err.type === 'logic' ? '⚠️ ' : null}
                                    {err.explanation}
                                  </span>
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>


          {(linkingWords || repetitionAlerts.length > 0) && (
            <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-slate-50 text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-200" aria-hidden>
                    📌
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Quick cheat sheet
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Linking words + repetition fixes
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-4">
                <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/60 p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100">
                      Linguistic insights
                    </span>
                    {linkingWords?.score != null && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/40 px-2 py-0.5 rounded-lg">
                        Score: {linkingWords.score}/9.0
                      </span>
                    )}
                  </div>

                  {linkingWords && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100">
                            Linking Words
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(linkingWords.found) ? linkingWords.found : []).slice(0, 10).map((w, i) => (
                            <span
                              key={`${w}-${i}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200"
                              title="Found in your essay"
                            >
                              {w}
                            </span>
                          ))}
                          {(Array.isArray(linkingWords.found) ? linkingWords.found : []).length === 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                              No linking words detected yet.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border-2 border-dashed border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10 p-3">
                        <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">
                            Suggested additions
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(linkingWords.suggestions) ? linkingWords.suggestions : []).slice(0, 8).map((s, i) => (
                            <button
                              key={`${s}-${i}`}
                              type="button"
                              onClick={() => handleInsertLinkingWord(s)}
                              disabled={!setUserText}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-950/40 border border-amber-100 dark:border-amber-800/50 text-[10px] font-semibold text-amber-700 dark:text-amber-200 hover:border-amber-400 dark:hover:border-amber-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                              title={setUserText ? `Insert "${s}"` : 'Read-only'}
                            >
                              <span className="opacity-60" aria-hidden>＋</span>
                              {s}
                            </button>
                          ))}
                          {(Array.isArray(linkingWords.suggestions) ? linkingWords.suggestions : []).length === 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                              Great flow! No extra suggestions needed.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {repetitionAlerts.length > 0 && (
                  <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-800 dark:text-slate-100">
                        Frequency alert
                      </span>
                    </div>

                    <div className="space-y-2">
                      {repetitionAlerts.slice(0, 4).map((item, i) => {
                        const wordText = typeof item === 'object' ? (item.word ?? '') : String(item || '');
                        const count = typeof item === 'object' ? Number(item.count ?? 0) : 0;
                        const alternatives = typeof item === 'object' && Array.isArray(item.alternatives) ? item.alternatives : [];
                        const cleanWord = String(wordText || '').trim();
                        if (!cleanWord) return null;
                        return (
                          <div
                            key={`${cleanWord}-${i}`}
                            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                                  “{cleanWord}”
                                </span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800/40">
                                  {count > 0 ? `${count}x` : 'repeated'}
                                </span>
                              </div>
                            </div>

                            {alternatives.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5">
                                  Band 8.0+ replacements
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {alternatives.slice(0, 8).map((syn) => (
                                    <button
                                      key={`${cleanWord}-${syn}`}
                                      type="button"
                                      onClick={() => replaceNextWordOccurrence(cleanWord, syn)}
                                      disabled={!setUserText}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                      title={setUserText ? `Replace next "${cleanWord}" with "${syn}"` : 'Read-only'}
                                    >
                                      {syn}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <LexicalUpgradePanel
            rows={lexicalUpgrade}
            onReplaceWord={onReplaceWord}
            setUserText={setUserText}
            userText={userText}
            taskType={taskTypeNormalized}
          />

          <div className="w-full min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadMp3}
                disabled={!audioBlob || isAudioLoading}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 disabled:pointer-events-none transition-colors ${isPlaying ? 'ring-1 ring-indigo-400/40' : ''}`}
                title="Download MP3"
              >
                <Download className="w-4 h-4 shrink-0" />
                MP3
              </button>
              <button
                type="button"
                onClick={() => check && void generateStratumWritingPdfFromCheck(check)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
                title="Download PDF"
              >
                <Download className="w-4 h-4 shrink-0" />
                PDF
              </button>
            </div>
            {suggestedRewrite && (
              <SuggestedRewriteKaraoke
                fillWidth
                suggestedRewrite={suggestedRewrite}
                wordTimestamps={suggestedRewriteWordTimestamps}
                audioRef={audioRef}
                audioUrl={audioUrl}
                audioDuration={audioDuration}
                isAudioLoading={isAudioLoading}
                isPlaying={isPlaying}
                audioProgress={audioProgress}
                audioTime={audioTime}
                audioError={audioError}
                onGenerateAudio={handleGenerateAudio}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                formatTime={formatTime}
              />
            )}
          </div>
        </div>

        {/* Right: Detailed Analytics Panel — Band, pill tabs, CEFR bars, errors */}
        <div className="order-2 hidden w-full shrink-0 flex-col gap-6 xl:order-2 xl:flex xl:w-[400px] xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Band score</h2>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="2.5" className="dark:stroke-slate-700" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray={band != null ? `${(band / 9) * 100}, 100` : '0, 100'} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white tracking-tight">{band != null ? band.toFixed(1) : '—'}</span>
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'TA', value: ta, label: taskKey === 'Task_Achievement' ? 'TA' : 'TR' },
                  { key: 'CC', value: cc, label: 'CC' },
                  { key: 'LR', value: lr, label: 'LR' },
                  { key: 'GRA', value: gra, label: 'GRA' },
                ].map(({ key, value, label }) => (
                  <div key={key}>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-0.5">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${((value ?? 0) / 9) * 100}%` }} />
                    </div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{value != null ? value.toFixed(1) : '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            {feedback.improvement_strategy && (
              <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{feedback.improvement_strategy}</p>
            )}
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm p-6">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
              {RIGHT_PANEL_TABS.map((tab) => {
                const label = tab.key === 'task' ? (taskTypeNormalized === 'task1' ? tab.labelTask1 : tab.labelTask2) : tab.label;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRightPanelTab(tab.key)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${rightPanelTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              {rightPanelTab === 'task' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{taskTypeNormalized === 'task1' ? 'Task Achievement' : 'Task Response'}</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{ta != null ? ta.toFixed(1) : '—'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria[taskKey]?.comment || 'No specific feedback for this criterion.'}</p>
                  {taskTypeNormalized === 'task2' && ideaDevelopment && (
                    <div className="mt-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            Idea development
                          </div>
                          {ideaDevSummary ? (
                            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                              {ideaDevSummary}
                            </p>
                          ) : null}
                        </div>
                        <div className="shrink-0 rounded-xl border border-indigo-200/70 dark:border-indigo-500/30 bg-white/80 dark:bg-slate-950/40 px-3 py-2 text-center">
                          <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                            Depth
                          </div>
                          <div className="text-lg font-black tracking-tight text-indigo-600 dark:text-indigo-300 tabular-nums">
                            {ideaDevScore != null ? `${ideaDevScore}/5` : '—'}
                          </div>
                        </div>
                      </div>

                      {ideaDevParagraphs.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {ideaDevParagraphs.slice(0, 6).map((p, i) => {
                            const label = typeof p?.label === 'string' ? p.label : `Paragraph ${i + 1}`;
                            const mainIdea = typeof p?.main_idea === 'string' ? p.main_idea : '';
                            const missing = Array.isArray(p?.missing) ? p.missing : [];
                            const upgrades = Array.isArray(p?.upgrades) ? p.upgrades : [];
                            return (
                              <div
                                key={`${label}-${i}`}
                                className="rounded-xl border border-slate-200/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/30 p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    {label}
                                  </div>
                                  {missing.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {missing.slice(0, 5).map((m, mi) => (
                                        <span
                                          key={`${m}-${mi}`}
                                          className="inline-flex items-center rounded-full border border-amber-200/70 dark:border-amber-600/30 bg-amber-50/60 dark:bg-amber-900/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-200"
                                          title="Missing piece to add depth"
                                        >
                                          {String(m).replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {mainIdea ? (
                                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">Main idea:</span>{' '}
                                    {mainIdea}
                                  </p>
                                ) : null}
                                {upgrades.length > 0 && (
                                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                                    {upgrades.slice(0, 2).map((u, ui) => (
                                      <li key={`${label}-u-${ui}`}>{u}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {rightPanelTab === 'coherence' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Coherence & Cohesion</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{cc != null ? cc.toFixed(1) : '—'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria.Coherence_and_Cohesion?.comment || 'No specific feedback for this criterion.'}</p>
                </div>
              )}
              {rightPanelTab === 'vocabulary' && (
                <div className="space-y-4">
                  {errors.length > 0 && (
  <div className="space-y-3">
    <div className="flex flex-col gap-2 mb-1">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
        Errors & corrections
      </h3>
      <ErrorHighlightLegend className="opacity-90" />
    </div>
    {errors.map((err, idx) => {
      const applyText = err.fixed || err.suggestion;
      const canApply =
        applyText &&
        String(applyText).trim().length > 0 &&
        String(applyText).trim().toLowerCase() !== String(err.original).trim().toLowerCase();
      const badgeCls = ERROR_TYPE_BADGE_CLASS[err.type] || ERROR_TYPE_BADGE_CLASS.grammar;
      const badgeLabel = ERROR_TYPE_BADGE_LABEL[err.type] || err.type;
      return (
      <div
        key={err.id || idx}
        ref={(el) => { if (errorCardRefs.current) errorCardRefs.current[err.id] = el; }}
        className={`group relative rounded-2xl border border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/30 ${errorCardShellClass(err.id)}`}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeCls}`}>
            {badgeLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-red-500 dark:text-red-400 line-through text-sm font-medium break-words">
              {err.original}
            </span>
            <span className="text-slate-400 shrink-0" aria-hidden>→</span>
            {canApply ? (
              <button
                type="button"
                onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
                className="text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-500/20 text-left break-words"
                title="Click to apply this fix"
              >
                {applyText}
              </button>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                No one-click fix — revise using the explanation below.
              </span>
            )}
          </div>

          {canApply && (
            <button
              type="button"
              onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all active:scale-95 shadow-lg shadow-emerald-600/20 shrink-0"
            >
              <svg xmlns="http://www.w3.org" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Apply
            </button>
          )}
        </div>

        <AddToWordListButton
          word={err.original}
          taskType={taskTypeNormalized}
          source="correction"
          note={applyText || err.explanation || null}
          compact
          className="mt-1"
        />

        {err.explanation ? (
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            <span className={`font-bold ${err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>
              Why?
            </span>{' '}
            <span
              className={`font-semibold ${
                err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-indigo-900 dark:text-indigo-200'
              }`}
            >
              {err.type === 'logic' ? '⚠️ ' : null}
              {err.explanation}
            </span>
          </p>
        ) : null}
      </div>
    );
    })}
  </div>
)}
 </div>
              )}
              {rightPanelTab === 'grammar' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Grammatical Range & Accuracy</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{gra != null ? gra.toFixed(1) : '—'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{criteria.Grammatical_Range_and_Accuracy?.comment || 'No specific feedback for this criterion.'}</p>
                  {errors.some((e) => e.type === 'grammar') && (
                    <div className="space-y-3 mt-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Grammar corrections</h3>
                      {errors.filter((e) => e.type === 'grammar').map((err, idx) => {
                        const applyText = err.fixed || err.suggestion;
                        const canApply =
                          applyText &&
                          String(applyText).trim().length > 0 &&
                          String(applyText).trim().toLowerCase() !== String(err.original).trim().toLowerCase();
                        const badgeCls = ERROR_TYPE_BADGE_CLASS.grammar;
                        return (
                        <div
                          key={err.id}
                          ref={(el) => { if (errorCardRefs.current) errorCardRefs.current[err.id] = el; }}
                          className={`rounded-2xl border border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-white/5 ${errorCardShellClass(err.id)}`}
                        >
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${badgeCls}`}>
                            Grammar
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-red-500 dark:text-red-400 line-through text-sm font-medium">{err.original}</span>
                            <span className="text-slate-400" aria-hidden>→</span>
                            {canApply ? (
                              <button
                                type="button"
                                onClick={() => onReplaceWord(err.original, applyText, (err.occurrenceIndex || 1), idx)}
                                className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline text-left"
                              >
                                {applyText}
                              </button>
                            ) : (
                              <span className="text-sm text-slate-500 dark:text-slate-400">—</span>
                            )}
                          </div>
                          <AddToWordListButton
                            word={err.original}
                            taskType={taskTypeNormalized}
                            source="correction"
                            note={applyText || err.explanation || null}
                            compact
                            className="mt-1"
                          />
                          {err.explanation ? (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                              <span
                                className={`font-semibold ${
                                  err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                Why?
                              </span>{' '}
                              <span
                                className={`font-semibold ${
                                  err.type === 'logic' ? 'text-sky-600 dark:text-sky-300' : 'text-indigo-900 dark:text-indigo-200'
                                }`}
                              >
                                {err.type === 'logic' ? '⚠️ ' : null}
                                {err.explanation}
                              </span>
                            </p>
                          ) : null}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
