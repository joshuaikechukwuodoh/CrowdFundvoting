import type { CampaignStatus } from '../lib/types'
import { statusLabel } from '../lib/format'

const styles: Record<CampaignStatus, string> = {
  active:
    'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 shadow-[0_0_20px_-8px_rgba(52,211,153,0.6)]',
  successful:
    'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30 shadow-[0_0_20px_-8px_rgba(56,189,248,0.6)]',
  failed:
    'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30',
  claimed:
    'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30',
}

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'active'
            ? 'bg-emerald-400 animate-pulse'
            : status === 'successful'
              ? 'bg-sky-400'
              : status === 'failed'
                ? 'bg-rose-400'
                : 'bg-violet-400'
        }`}
      />
      {statusLabel(status)}
    </span>
  )
}
