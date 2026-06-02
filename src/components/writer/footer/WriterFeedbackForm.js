'use client';

const fieldClass = (darkMode) =>
  `w-full px-4 py-3 text-sm rounded-2xl border outline-none transition-colors ${
    darkMode
      ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500'
  }`;

export default function WriterFeedbackForm({ darkMode, onSubmit, firstFieldRef, className = 'space-y-3' }) {
  return (
    <form onSubmit={onSubmit} className={className}>
      <input
        ref={firstFieldRef}
        name="name"
        type="text"
        placeholder="Name"
        required
        className={fieldClass(darkMode)}
      />
      <input name="email" type="email" placeholder="Email" required className={fieldClass(darkMode)} />
      <textarea
        name="message"
        placeholder="How can we help?"
        required
        rows={4}
        className={`${fieldClass(darkMode)} resize-none`}
      />
      <button
        type="submit"
        className="btn-stratum w-full py-3 rounded-2xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
      >
        <div className="shimmer-layer animate-shimmer" aria-hidden />
        <span className="btn-stratum-text">EMAIL · STRATUM</span>
      </button>
    </form>
  );
}
