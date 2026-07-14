'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getPlainTextForKaraoke } from '@/components/dashboard/SuggestedRewriteKaraoke';
import {
  fetchTtsWithTimestamps,
  playAudioElement,
} from '@/components/dashboard/analytical-lab/ttsHelpers';

/**
 * Audio player state for SuggestedRewriteKaraoke (Band / TTS / waveform).
 */
export function useSuggestedRewriteAudio(suggestedRewrite, filenameBase) {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [wordTimestamps, setWordTimestamps] = useState([]);
  const [timingAlignment, setTimingAlignment] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef(null);
  const pendingAutoPlayRef = useRef(false);

  const formatTime = useCallback((s) => {
    const n = Number.isFinite(Number(s)) ? Math.max(0, Math.floor(s)) : 0;
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }, []);

  const handleGenerateAudio = useCallback(async ({ autoPlay = false } = {}) => {
    if (!suggestedRewrite || isAudioLoading) return;
    const cleanText = getPlainTextForKaraoke(suggestedRewrite);
    if (!cleanText) return;
    setIsAudioLoading(true);
    setAudioError('');
    pendingAutoPlayRef.current = autoPlay;
    try {
      const { blob, wordTimestamps: ts, alignment } = await fetchTtsWithTimestamps({
        text: cleanText,
        filenameBase: filenameBase || 'Stratum_Rewrite',
      });
      const url = window.URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return url;
      });
      setWordTimestamps(Array.isArray(ts) ? ts : []);
      setTimingAlignment(alignment || null);
      if (!alignment || !Array.isArray(ts) || ts.length === 0) {
        console.warn('Karaoke word sync unavailable; highlighting may drift.');
      }
      setIsPlaying(false);
      setAudioProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (e) {
      pendingAutoPlayRef.current = false;
      setAudioError(e?.message || 'Unable to generate audio.');
    } finally {
      setIsAudioLoading(false);
    }
  }, [suggestedRewrite, filenameBase, isAudioLoading]);

  /** Drop stale audio when the rewrite text changes (force fresh Whisper sync). */
  const rewriteTextKeyRef = useRef(null);
  useEffect(() => {
    const nextKey = getPlainTextForKaraoke(suggestedRewrite || '');
    if (rewriteTextKeyRef.current === null) {
      rewriteTextKeyRef.current = nextKey;
      return;
    }
    if (rewriteTextKeyRef.current === nextKey) return;
    rewriteTextKeyRef.current = nextKey;

    setAudioUrl((prev) => {
      if (prev) window.URL.revokeObjectURL(prev);
      return null;
    });
    setAudioBlob(null);
    setWordTimestamps([]);
    setTimingAlignment(null);
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioTime(0);
    setAudioDuration(0);
    setAudioError('');
    pendingAutoPlayRef.current = false;
  }, [suggestedRewrite]);

  const handleTogglePlay = useCallback(async () => {
    if (isAudioLoading) return;
    if (!audioUrl) {
      await handleGenerateAudio({ autoPlay: true });
      return;
    }
    if (!audioRef.current) return;
    try {
      if (audioRef.current.paused) {
        await playAudioElement(audioRef.current);
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      setAudioError(e?.message || 'Unable to play audio.');
      setIsPlaying(false);
    }
  }, [audioUrl, isAudioLoading, handleGenerateAudio]);

  const handleSeek = useCallback((e) => {
    if (!audioRef.current?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  }, []);

  useEffect(() => {
    if (!audioUrl || !pendingAutoPlayRef.current) return;
    pendingAutoPlayRef.current = false;
    const el = audioRef.current;
    if (!el) return;
    void playAudioElement(el)
      .then(() => setIsPlaying(true))
      .catch((e) => {
        setAudioError(e?.message || 'Unable to play audio.');
        setIsPlaying(false);
      });
  }, [audioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdate = () => {
      const d = el.duration || 0;
      const c = el.currentTime || 0;
      setAudioProgress(d > 0 ? c / d : 0);
      setAudioTime(c);
      setAudioDuration(d);
    };
    const onLoaded = () => setAudioDuration(el.duration || 0);
    const onEnded = () => setIsPlaying(false);
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

  return {
    audioRef,
    audioUrl,
    audioBlob,
    audioDuration,
    wordTimestamps,
    timingAlignment,
    isAudioLoading,
    isPlaying,
    audioProgress,
    audioTime,
    audioError,
    onGenerateAudio: () => handleGenerateAudio({ autoPlay: true }),
    onTogglePlay: handleTogglePlay,
    onSeek: handleSeek,
    formatTime,
  };
}
