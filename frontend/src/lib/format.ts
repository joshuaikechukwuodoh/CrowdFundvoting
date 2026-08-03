import type { Campaign, CampaignStatus } from './types'

export function shortAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`
}

export function formatEth(value: string | number, digits = 4): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '0'
  if (n === 0) return '0'
  if (n < 0.0001) return '<0.0001'
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const target = timestamp * 1000
  const diff = target - now
  const abs = Math.abs(diff)
  const days = Math.floor(abs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diff > 0) {
    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h left`
    return 'Ending soon'
  }
  if (days > 0) return `Ended ${days}d ago`
  return 'Ended'
}

export function progressPercent(raised: string, goal: string): number {
  const r = Number(raised)
  const g = Number(goal)
  if (!g || !Number.isFinite(r) || !Number.isFinite(g)) return 0
  return Math.min(100, Math.max(0, (r / g) * 100))
}

export function getCampaignStatus(campaign: Campaign): CampaignStatus {
  const now = Math.floor(Date.now() / 1000)
  if (campaign.claimed) return 'claimed'
  if (now < campaign.deadline) return 'active'
  if (Number(campaign.amountRaised) >= Number(campaign.goal)) return 'successful'
  return 'failed'
}

export function statusLabel(status: CampaignStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'successful':
      return 'Successful'
    case 'failed':
      return 'Failed'
    case 'claimed':
      return 'Claimed'
  }
}
