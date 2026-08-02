import { Link } from 'react-router-dom'

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-14 text-center backdrop-blur">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-1 ring-white/10">
        <svg
          className="h-8 w-8 text-emerald-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m6-6H6"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="btn-primary mt-6 inline-flex"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
