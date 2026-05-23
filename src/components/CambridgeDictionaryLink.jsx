import { BookOpen, ExternalLink } from 'lucide-react';
import { cambridgeLookupUrl, pickLookupTermFromError } from '@/lib/cambridgeDictionary';

export default function CambridgeDictionaryLink({
  term,
  fromError,
  label,
  className = '',
  compact = false,
}) {
  const lookupTerm = fromError ? pickLookupTermFromError(fromError) : String(term || '').trim();
  if (!lookupTerm || !/[a-zA-Z]/.test(lookupTerm)) return null;

  const href = cambridgeLookupUrl(lookupTerm);
  const text = label || (compact ? 'Cambridge' : 'Check in Cambridge');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors ${className}`}
      title={`Look up "${lookupTerm}" in Cambridge Learner's Dictionary`}
    >
      <BookOpen className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden />
      <span>{text}</span>
      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" strokeWidth={1.5} aria-hidden />
    </a>
  );
}
