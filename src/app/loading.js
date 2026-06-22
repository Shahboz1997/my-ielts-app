/** Shown while the server renders the route (reduces blank screen on cold start). */
export default function RootLoading() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-[#F9FAFB] dark:bg-[#050505] text-slate-600 dark:text-slate-400"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-10 w-10 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm font-medium tracking-tight normal-case">STRATUM</p>
    </div>
  );
}
