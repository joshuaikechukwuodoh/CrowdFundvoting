export type Campaign = {
  id: number
  creator: string
  goal: string
  deadline: number
  amountRaised: string
  claimed: boolean
  title: string
  description: string | null
  imageUrl: string | null
  category: string | null
}

export type CampaignStatus = 'active' | 'successful' | 'failed' | 'claimed'

export type Category =
  | 'All'
  | 'Technology'
  | 'Art'
  | 'Community'
  | 'Education'
  | 'Environment'
  | 'Health'
  | 'Other'

export const CATEGORIES: Category[] = [
  'All',
  'Technology',
  'Art',
  'Community',
  'Education',
  'Environment',
  'Health',
  'Other',
]
