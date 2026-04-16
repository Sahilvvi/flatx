interface Props {
  size?: 'sm' | 'md';
  withLabel?: boolean;
}

/** Checkmark badge shown next to verified (phone-OTP passed) users. */
export function VerifiedBadge({ size = 'sm', withLabel = false }: Props) {
  const dim = size === 'md' ? 18 : 14;
  return (
    <span
      title="Verified by phone OTP"
      aria-label="Verified user"
      className="inline-flex items-center gap-1 text-emerald-700"
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="drop-shadow-sm"
        aria-hidden="true"
      >
        <path d="M12 .75 9.6 3.3 6.15 2.85l-.7 3.3-3.3.7L2.6 10.2.75 12l1.85 1.8-.45 3.35 3.3.7.7 3.3 3.45-.45L12 23.25l2.4-2.55 3.45.45.7-3.3 3.3-.7-.45-3.35L23.25 12l-1.85-1.8.45-3.35-3.3-.7-.7-3.3-3.45.45L12 .75Zm-1.35 15.1-4.1-4.1 1.6-1.6 2.5 2.5 5.55-5.55 1.6 1.6-7.15 7.15Z" />
      </svg>
      {withLabel && <span className="text-[11px] font-semibold uppercase tracking-wide">Verified</span>}
    </span>
  );
}
