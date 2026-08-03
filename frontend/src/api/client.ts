import type { Campaign } from '../lib/types'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (data as { detail?: string; error?: string }).detail ||
      (data as { error?: string }).error ||
      `Request failed (${res.status})`
    throw new Error(message)
  }
  return data as T
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  return request<Campaign[]>('/campaigns')
}

export async function fetchCampaign(id: number): Promise<Campaign> {
  return request<Campaign>(`/campaigns/${id}`)
}

export async function fetchContribution(
  id: number,
  address: string,
): Promise<{ amount: string }> {
  return request(`/campaigns/${id}/contributions/${address}`)
}

export async function saveMetadata(
  id: number,
  body: {
    description?: string
    imageUrl?: string
    category?: string
  },
): Promise<void> {
  await request(`/campaigns/${id}/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const data = await request<{ imageUrl: string }>('/upload', {
    method: 'POST',
    body: form,
  })
  return data.imageUrl
}

export async function healthCheck(): Promise<{ ok: boolean }> {
  return request('/health')
}
