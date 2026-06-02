import { useCallback, useEffect, useRef, useState } from 'react';
import { renderColoredEssayText } from '@/lib/writer/renderColoredEssay';
import { buildLexicalReplacements } from '@/lib/writer/lexicalApply';
import {
  buildLinkingWordInsertion,
  findWordOccurrences,
  formatWordForSentence,
  replaceOccurrenceInText,
  replaceWordAtIndex,
} from '@/lib/writer/essayEditing';
import {
  handleEditorScroll,
  playClickSound,
  syncEditorHeights,
} from '@/lib/writer/editorUi';

export function useWriterEditorTools({
  activeTab,
  essayT1,
  essayT2,
  setEssayT1,
  setEssayT2,
  activeResult,
  darkMode,
  mergedLexicalUpgrade,
  weakWordsSet,
  setAppliedCorrections,
}) {
  const editorRef = useRef(null);
  const highlightRef = useRef(null);
  const [searchState, setSearchState] = useState({ word: '', index: -1, count: 0, current: 0 });
  const [, setHighlightedWord] = useState(null);

  useEffect(() => {
    syncEditorHeights(editorRef, highlightRef);
  }, [essayT1, essayT2, activeTab]);

  const getEssayState = useCallback(() => {
    const isT1 = activeTab === 'Task 1';
    return {
      isT1,
      text: isT1 ? essayT1 : essayT2,
      setText: isT1 ? setEssayT1 : setEssayT2,
    };
  }, [activeTab, essayT1, essayT2, setEssayT1, setEssayT2]);

  const renderColoredText = useCallback(() => {
    const text = (activeTab === 'Task 1' ? essayT1 : essayT2) || '';
    return renderColoredEssayText({
      text,
      analysis: activeResult?.analysis || {},
      weakWordsSet,
      darkMode,
    });
  }, [activeTab, essayT1, essayT2, activeResult, weakWordsSet, darkMode]);

  const handleApplyAllUpgrades = useCallback(() => {
    const { text, setText } = getEssayState();
    const result = buildLexicalReplacements(mergedLexicalUpgrade, text);
    if (!result) return;
    setText(result);
    setTimeout(() => syncEditorHeights(editorRef, highlightRef), 50);
  }, [getEssayState, mergedLexicalUpgrade]);

  const triggerHighlight = useCallback(
    (word) => {
      const editor = editorRef.current;
      if (!editor || !word) return;

      const { text } = getEssayState();
      const { indices, lowerWord } = findWordOccurrences(text, word);

      if (indices.length === 0) {
        alert('Word not found in text');
        return;
      }

      let nextOccurrence = 0;
      if (searchState.word === lowerWord) {
        nextOccurrence = (searchState.current + 1) % indices.length;
      }

      const targetIndex = indices[nextOccurrence];
      const finalWord = formatWordForSentence(text, targetIndex, lowerWord);

      setSearchState({
        word: lowerWord,
        index: targetIndex,
        count: indices.length,
        current: nextOccurrence,
      });

      editor.focus();
      editor.setSelectionRange(targetIndex, targetIndex + lowerWord.length);

      const linesBefore = text.substring(0, targetIndex).split('\n').length;
      const lineHeight = parseInt(window.getComputedStyle(editor).lineHeight, 10) || 24;
      editor.scrollTo({
        top: (linesBefore - 1) * lineHeight - 80,
        behavior: 'smooth',
      });

      setHighlightedWord(finalWord);
      setTimeout(() => setHighlightedWord(null), 2000);
    },
    [getEssayState, searchState]
  );

  const replaceNext = useCallback(
    (oldWord, newWord) => {
      const editor = editorRef.current;
      if (!editor || !oldWord || !newWord) return;

      const { text, setText } = getEssayState();
      let targetIndex = searchState.index;

      if (targetIndex === -1 || searchState.word !== oldWord.toLowerCase().trim()) {
        const firstIdx = text.toLowerCase().indexOf(oldWord.toLowerCase().trim());
        if (firstIdx === -1) return alert('Word not found');
        targetIndex = firstIdx;
      }

      setText(replaceWordAtIndex(text, oldWord, newWord, targetIndex));
      setTimeout(() => triggerHighlight(oldWord), 50);
    },
    [getEssayState, searchState, triggerHighlight]
  );

  const handleReplaceWord = useCallback(
    (original, fixed, occurrenceIndex = 1, correctionIdx) => {
      const { setText } = getEssayState();
      setText((prevText) => replaceOccurrenceInText(prevText, original, fixed, occurrenceIndex));
      setAppliedCorrections((prev) => [...prev, correctionIdx]);
      setTimeout(() => syncEditorHeights(editorRef, highlightRef), 50);
    },
    [getEssayState, setAppliedCorrections]
  );

  const insertLinkingWord = useCallback(
    (word) => {
      playClickSound();
      const textarea = editorRef.current;
      if (!textarea) return;

      const { text, setText } = getEssayState();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const { formattedWord, newText } = buildLinkingWordInsertion({ before, after, word });

      setText(newText);
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + formattedWord.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        syncEditorHeights(editorRef, highlightRef, 320);
      }, 10);
    },
    [getEssayState]
  );

  const handleScroll = useCallback(
    (e) => {
      handleEditorScroll(e, highlightRef);
    },
    []
  );

  return {
    editorRef,
    highlightRef,
    searchState,
    renderColoredText,
    handleApplyAllUpgrades,
    replaceNext,
    triggerHighlight,
    handleReplaceWord,
    insertLinkingWord,
    handleScroll,
    playClickSound,
  };
}
