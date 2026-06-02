/** Lightweight placeholder while a dynamic chunk loads. */
export default function PageLoadingBlock({ className = 'min-h-[40vh]' }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-600" />
    </div>
  );
}
