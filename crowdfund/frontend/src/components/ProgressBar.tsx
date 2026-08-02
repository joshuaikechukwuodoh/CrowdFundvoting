export function ProgressBar({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10 ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 shadow-[0_0_16px_rgba(52,211,153,0.45)] transition-all duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
