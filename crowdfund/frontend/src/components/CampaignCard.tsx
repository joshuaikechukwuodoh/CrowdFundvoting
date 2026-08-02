import { Link } from 'react-router-dom'
import type { Campaign } from '../lib/types'
import {
  formatEth,
  formatRelativeTime,
  getCampaignStatus,
  progressPercent,
  shortAddress,
} from '../lib/format'
import { ProgressBar } from './ProgressBar'
import { StatusBadge } from './StatusBadge'

const gradients = [
  'from-emerald-600/80 via-teal-700/60 to-slate-900',
  'from-cyan-600/80 via-sky-700/60 to-slate-900',
  'from-violet-600/80 via-fuchsia-700/50 to-slate-900',
  'from-amber-600/70 via-orange-700/50 to-slate-900',
  'from-rose-600/70 via-pink-700/50 to-slate-900',
  'from-indigo-600/80 via-blue-700/60 to-slate-900',
]

function placeholderGradient(id: number) {
  return gradients[id % gradients.length]
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const status = getCampaignStatus(campaign)
  const pct = progressPercent(campaign.amountRaised, campaign.goal)

  return (
    <Link
      to={`/campaigns/${campaign.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-emerald-500/10"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-end bg-gradient-to-br ${placeholderGradient(campaign.id)} p-5`}
          >
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-emerald-400/30 blur-2xl" />
            </div>
            <span className="relative text-4xl font-black tracking-tighter text-white/90">
              #{campaign.id}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <StatusBadge status={status} />
          {campaign.category && (
            <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur ring-1 ring-white/10">
              {campaign.category}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-white transition group-hover:text-emerald-300">
            {campaign.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">
            {campaign.description || 'No description provided for this campaign.'}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-end justify-between text-sm">
            <div>
              <span className="text-lg font-bold text-white">
                {formatEth(campaign.amountRaised)}
              </span>
              <span className="ml-1 text-slate-400">
                / {formatEth(campaign.goal)} ETH
              </span>
            </div>
            <span className="font-medium text-emerald-300">{pct.toFixed(0)}%</span>
          </div>
          <ProgressBar value={pct} />
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
            <span>{shortAddress(campaign.creator)}</span>
            <span>{formatRelativeTime(campaign.deadline)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
