export function countWords(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
