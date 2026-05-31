'use client';

const BADGE_CLASS = 'h-[22px] w-auto shrink-0 rounded-[3px]';

function VisaIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 38 24" className={BADGE_CLASS}>
      <rect width="38" height="24" rx="3" fill="#1434CB" />
      <text
        x="19"
        y="16"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fontStyle="italic"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#fff"
        letterSpacing="-0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 38 24" className={BADGE_CLASS}>
      <rect width="38" height="24" rx="3" className="fill-slate-100 dark:fill-slate-800" />
      <circle cx="15" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="23" cy="12" r="6.5" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

function ApplePayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 38 24" className={BADGE_CLASS}>
      <rect width="38" height="24" rx="3" className="fill-black dark:fill-white" />
      <g className="fill-white dark:fill-black" transform="translate(7.5, 4.5) scale(0.42)">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.034-3.913 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.086-3.623-2.323-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z" />
        <path d="M15.53 3.273c.843-1.012 1.4-2.427 1.245-3.831-1.207.052-2.662.805-3.532 1.818-.781.896-1.454 2.338-1.267 3.714 1.338.104 2.715-.687 3.554-1.701z" />
      </g>
      <text
        x="21"
        y="16"
        fontSize="9.5"
        fontWeight="500"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        className="fill-white dark:fill-black"
      >
        Pay
      </text>
    </svg>
  );
}

export default function PaymentMethodsBadges({ className = '' }) {
  return (
    <div
      className={`flex flex-wrap justify-center items-center gap-x-3 gap-y-2 ${className}`}
      aria-label="We accept Visa, Mastercard, and Apple Pay"
    >
      <span className="text-xs text-slate-400 dark:text-slate-500">We accept</span>
      <span className="inline-flex items-center gap-2">
        <VisaIcon />
        <MastercardIcon />
        <ApplePayIcon />
      </span>
    </div>
  );
}
