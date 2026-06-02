/** Code-split jspdf + autotable — load only when user downloads a report. */
export async function generateStratumWritingPdf(options) {
  const { generateStratumWritingPdf: run } = await import('@/lib/stratumWritingPdf');
  return run(options);
}

export async function generateStratumWritingPdfFromCheck(check) {
  const { generateStratumWritingPdfFromCheck: run } = await import('@/lib/stratumWritingPdf');
  return run(check);
}

export async function generateStratumWritingPdfFromArchivePayload(payload) {
  const { generateStratumWritingPdfFromArchivePayload: run } = await import('@/lib/stratumWritingPdf');
  return run(payload);
}
