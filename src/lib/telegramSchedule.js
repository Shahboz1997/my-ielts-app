/** Deterministic day/slot index for rotating Telegram content. */
export function daySlotIndex(date, slot) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  const slotBit = slot === 'evening' ? 1 : 0;
  return dayOfYear * 2 + slotBit;
}

export function pickByIndex(list, index) {
  if (!Array.isArray(list) || !list.length) return null;
  return list[((index % list.length) + list.length) % list.length];
}
