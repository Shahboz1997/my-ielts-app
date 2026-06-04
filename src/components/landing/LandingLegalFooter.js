import { COPYRIGHT_LINE } from '@/lib/support';

export default function LandingLegalFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#F9FAFB] dark:bg-[#050505]">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 text-center">
        <p className="text-xs sm:text-sm font-medium tracking-tight text-slate-600 dark:text-slate-400">
          {COPYRIGHT_LINE}
        </p>
      </div>
    </footer>
  );
}
