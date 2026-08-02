import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCampaigns } from '../api/client'
import { CampaignCard } from '../components/CampaignCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { getCampaignStatus } from '../lib/format'
import { CATEGORIES, type Campaign, type Category } from '../lib/types'

type FilterStatus = 'all' | 'active' | 'successful' | 'failed' | 'claimed'

export function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('All')
  const [status, setStatus] = useState<FilterStatus>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCampaigns()
      setCampaigns(data.reverse())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    const totalRaised = campaigns.reduce(
      (sum, c) => sum + Number(c.amountRaised || 0),
      0,
    )
    const active = campaigns.filter((c) => getCampaignStatus(c) === 'active').length
    return {
      count: campaigns.length,
      active,
      raised: totalRaised,
    }
  }, [campaigns])

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q)

      const matchesCategory =
        category === 'All' || (c.category || 'Other') === category

      const matchesStatus =
        status === 'all' || getCampaignStatus(c) === status

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [campaigns, search, category, status])

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-emerald-950/30 px-6 py-12 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Decentralized crowdfunding
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Fund ideas that{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                live on-chain
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Launch campaigns, contribute ETH, and claim or refund with full
              transparency. Every pledge is secured by a smart contract.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/create" className="btn-primary text-base px-6 py-3">
                Start a campaign
              </Link>
              <a href="#campaigns" className="btn-secondary text-base px-6 py-3">
                Browse projects
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Campaigns', value: stats.count.toString() },
              { label: 'Active', value: stats.active.toString() },
              {
                label: 'ETH raised',
                value:
                  stats.raised >= 100
                    ? stats.raised.toFixed(0)
                    : stats.raised.toFixed(2),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur sm:p-5"
              >
                <div className="text-2xl font-bold text-white sm:text-3xl">
                  {item.value}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section id="campaigns" className="scroll-mt-24 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Explore campaigns</h2>
            <p className="mt-1 text-sm text-slate-400">
              Discover projects and back the ones you believe in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="btn-ghost self-start sm:self-auto"
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or creator…"
              className="input pl-10"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    category === cat
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                      : 'bg-white/5 text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All'],
                  ['active', 'Active'],
                  ['successful', 'Successful'],
                  ['failed', 'Failed'],
                  ['claimed', 'Claimed'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    status === key
                      ? 'bg-white/15 text-white'
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <LoadingSpinner label="Loading campaigns…" />}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-8 text-center">
            <p className="font-medium text-rose-200">Could not load campaigns</p>
            <p className="mt-2 text-sm text-rose-200/70">{error}</p>
            <p className="mt-3 text-xs text-slate-500">
              Make sure the backend is running on port 3001 and Hardhat node is up.
            </p>
            <button type="button" onClick={() => void load()} className="btn-secondary mt-5">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={campaigns.length === 0 ? 'No campaigns yet' : 'No matches'}
            description={
              campaigns.length === 0
                ? 'Be the first to launch a fundraising campaign on the blockchain.'
                : 'Try a different search or filter combination.'
            }
            actionLabel={campaigns.length === 0 ? 'Create campaign' : undefined}
            actionTo={campaigns.length === 0 ? '/create' : undefined}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
