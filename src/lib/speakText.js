/**
 * Browser text-to-speech with Chrome/Safari voice-loading workarounds.
 * @param {string} text
 * @param {{ lang?: string, rate?: number }} [options]
 * @returns {boolean} false when speech is unavailable or text is empty
 */
export function speakText(text, options = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const value = String(text ?? '').trim();
  if (!value) return false;

  const synth = window.speechSynthesis;
  const lang = options.lang ?? 'en-US';
  const rate = options.rate ?? 0.9;

  synth.cancel();

  let started = false;
  const run = () => {
    if (started) return;
    started = true;

    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = lang;
    utterance.rate = rate;

    const voices = synth.getVoices();
    const voice =
      voices.find((v) => v.lang === lang && v.localService) ||
      voices.find((v) => v.lang.startsWith('en') && v.localService) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
    if (voice) utterance.voice = voice;

    if (synth.paused) synth.resume();
    synth.speak(utterance);
  };

  const voices = synth.getVoices();
  if (voices.length > 0) {
    window.setTimeout(run, 0);
    return true;
  }

  const onVoicesChanged = () => {
    synth.removeEventListener('voiceschanged', onVoicesChanged);
    window.setTimeout(run, 0);
  };

  synth.addEventListener('voiceschanged', onVoicesChanged);
  synth.getVoices();

  window.setTimeout(() => {
    synth.removeEventListener('voiceschanged', onVoicesChanged);
    run();
  }, 500);

  return true;
}

/** Warm up voice list on first client render (Chrome loads voices async). */
export function preloadSpeechVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.getVoices();
}
