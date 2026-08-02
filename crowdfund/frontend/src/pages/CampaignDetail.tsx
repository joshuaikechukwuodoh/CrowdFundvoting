import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCampaign, fetchContribution } from '../api/client'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ProgressBar } from '../components/ProgressBar'
import { StatusBadge } from '../components/StatusBadge'
import { useWallet } from '../hooks/useWallet'
import { ethToWei, getContract } from '../lib/contract'
import {
  formatDate,
  formatEth,
  formatRelativeTime,
  getCampaignStatus,
  progressPercent,
  shortAddress,
} from '../lib/format'
import type { Campaign } from '../lib/types'

export function CampaignDetail() {
  const { id } = useParams()
  const campaignId = Number(id)
  const { address, connect, getSigner, isCorrectNetwork, switchNetwork } =
    useWallet()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [contribution, setContribution] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState('0.1')
  const [txPending, setTxPending] = useState(false)
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!Number.isInteger(campaignId) || campaignId < 0) {
      setError('Invalid campaign id')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCampaign(campaignId)
      setCampaign(data)
      if (address) {
        try {
          const c = await fetchContribution(campaignId, address)
          setContribution(c.amount)
        } catch {
          setContribution(null)
        }
      } else {
        setContribution(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }, [campaignId, address])

  useEffect(() => {
    void load()
  }, [load])

  async function ensureWallet() {
    if (!address) {
      await connect()
      return false
    }
    if (!isCorrectNetwork) {
      await switchNetwork()
      return false
    }
    return true
  }

  async function runTx(action: () => Promise<void>, successMsg: string) {
    setTxError(null)
    setTxMessage(null)
    const ok = await ensureWallet()
    if (!ok && !address) return
    if (!isCorrectNetwork) return

    setTxPending(true)
    try {
      setTxMessage('Confirm in your wallet…')
      await action()
      setTxMessage(successMsg)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed'
      if (message.toLowerCase().includes('user rejected')) {
        setTxError('Transaction rejected in wallet.')
      } else {
        setTxError(message)
      }
      setTxMessage(null)
    } finally {
      setTxPending(false)
    }
  }

  async function onContribute(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setTxError('Enter a positive ETH amount.')
      return
    }
    await runTx(async () => {
      const signer = await getSigner()
      const contract = getContract(signer)
      const tx = await contract.contribute(campaignId, {
        value: ethToWei(amount),
      })
      setTxMessage('Contribution submitted — waiting for confirmation…')
      await tx.wait()
    }, 'Contribution successful! Thank you for supporting this campaign.')
  }

  async function onClaim() {
    await runTx(async () => {
      const signer = await getSigner()
      const contract = getContract(signer)
      const tx = await contract.claim(campaignId)
      setTxMessage('Claim submitted — waiting for confirmation…')
      await tx.wait()
    }, 'Funds claimed successfully.')
  }

  async function onRefund() {
    await runTx(async () => {
      const signer = await getSigner()
      const contract = getContract(signer)
      const tx = await contract.refund(campaignId)
      setTxMessage('Refund submitted — waiting for confirmation…')
      await tx.wait()
    }, 'Refund received.')
  }

  if (loading) return <LoadingSpinner label="Loading campaign…" />

  if (error || !campaign) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-rose-500/30 bg-rose-500/10 px-8 py-12 text-center">
        <p className="font-semibold text-rose-200">Campaign not found</p>
        <p className="mt-2 text-sm text-rose-200/70">{error}</p>
        <Link to="/" className="btn-secondary mt-6 inline-flex">
          Back to explore
        </Link>
      </div>
    )
  }

  const status = getCampaignStatus(campaign)
  const pct = progressPercent(campaign.amountRaised, campaign.goal)
  const isCreator =
    !!address && address.toLowerCase() === campaign.creator.toLowerCase()
  const hasContribution = contribution != null && Number(contribution) > 0
  const canContribute = status === 'active'
  const canClaim = isCreator && status === 'successful'
  const canRefund = !isCreator && status === 'failed' && hasContribution

  return (
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <span aria-hidden>←</span> Back to campaigns
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Main */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40">
            <div className="relative aspect-[21/9] sm:aspect-[2.2/1]">
              {campaign.imageUrl ? (
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-700/50 via-slate-900 to-cyan-900/40">
                  <span className="text-6xl font-black text-white/20">
                    #{campaign.id}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <StatusBadge status={status} />
                  {campaign.category && (
                    <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur ring-1 ring-white/10">
                      {campaign.category}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {campaign.title}
                </h1>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div>
                  <span className="text-slate-500">Creator </span>
                  <span className="font-mono text-slate-300" title={campaign.creator}>
                    {shortAddress(campaign.creator, 6)}
                  </span>
                </div>
                <span className="hidden text-slate-700 sm:inline">·</span>
                <div>
                  <span className="text-slate-500">Deadline </span>
                  <span className="text-slate-300">
                    {formatDate(campaign.deadline)} ({formatRelativeTime(campaign.deadline)})
                  </span>
                </div>
                <span className="hidden text-slate-700 sm:inline">·</span>
                <div>
                  <span className="text-slate-500">ID </span>
                  <span className="text-slate-300">#{campaign.id}</span>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  About
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-300">
                  {campaign.description ||
                    'The creator has not added a description for this campaign yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur shadow-xl shadow-black/20">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-bold text-white">
                  {formatEth(campaign.amountRaised)}
                  <span className="ml-1 text-base font-medium text-slate-400">
                    ETH
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  raised of {formatEth(campaign.goal)} ETH goal
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-300">
                  {pct.toFixed(0)}%
                </div>
                <p className="text-xs text-slate-500">funded</p>
              </div>
            </div>

            <ProgressBar value={pct} className="mt-4" />

            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
                <div className="text-sm font-semibold text-white">
                  {formatRelativeTime(campaign.deadline)}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
                  Time
                </div>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
                <div className="text-sm font-semibold text-white">
                  {campaign.claimed ? 'Yes' : 'No'}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
                  Claimed
                </div>
              </div>
            </div>

            {address && contribution != null && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
                <span className="text-emerald-200/70">Your contribution: </span>
                <span className="font-semibold text-emerald-300">
                  {formatEth(contribution)} ETH
                </span>
              </div>
            )}

            {canContribute && (
              <form onSubmit={(e) => void onContribute(e)} className="mt-6 space-y-3">
                <label htmlFor="amount" className="label">
                  Contribute (ETH)
                </label>
                <div className="flex gap-2">
                  <input
                    id="amount"
                    type="number"
                    min="0"
                    step="any"
                    className="input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={txPending}
                  />
                  <button
                    type="submit"
                    disabled={txPending}
                    className="btn-primary shrink-0 disabled:opacity-60"
                  >
                    {txPending ? '…' : 'Contribute'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['0.01', '0.05', '0.1', '0.5', '1'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                    >
                      {preset} ETH
                    </button>
                  ))}
                </div>
              </form>
            )}

            {canClaim && (
              <button
                type="button"
                onClick={() => void onClaim()}
                disabled={txPending}
                className="btn-primary mt-6 w-full disabled:opacity-60"
              >
                {txPending ? 'Processing…' : `Claim ${formatEth(campaign.amountRaised)} ETH`}
              </button>
            )}

            {canRefund && (
              <button
                type="button"
                onClick={() => void onRefund()}
                disabled={txPending}
                className="btn-secondary mt-6 w-full disabled:opacity-60"
              >
                {txPending
                  ? 'Processing…'
                  : `Refund ${formatEth(contribution || '0')} ETH`}
              </button>
            )}

            {status === 'claimed' && (
              <p className="mt-6 text-center text-sm text-violet-300">
                Funds have been claimed by the creator.
              </p>
            )}

            {status === 'successful' && !isCreator && (
              <p className="mt-6 text-center text-sm text-sky-300">
                Goal reached! Waiting for the creator to claim.
              </p>
            )}

            {status === 'failed' && !hasContribution && (
              <p className="mt-6 text-center text-sm text-slate-400">
                Campaign ended without reaching its goal.
              </p>
            )}

            {!address && status === 'active' && (
              <button
                type="button"
                onClick={() => void connect()}
                className="btn-primary mt-6 w-full"
              >
                Connect wallet to contribute
              </button>
            )}

            {txMessage && (
              <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {txMessage}
              </p>
            )}
            {txError && (
              <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {txError}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-400">On-chain transparency</p>
            <p className="mt-2">
              Contributions go directly to the CrowdFund smart contract. Raised
              amounts and deadlines cannot be altered by anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
