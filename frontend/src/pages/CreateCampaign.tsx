import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseEther } from 'ethers'
import { saveMetadata, uploadImage } from '../api/client'
import { useWallet } from '../hooks/useWallet'
import { getContract } from '../lib/contract'
import { CATEGORIES, type Category } from '../lib/types'

export function CreateCampaign() {
  const navigate = useNavigate()
  const { address, connect, getSigner, isCorrectNetwork, switchNetwork } =
    useWallet()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState('30')
  const [category, setCategory] = useState<Exclude<Category, 'All'>>('Technology')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<string | null>(null)

  function onFileChange(file: File | null) {
    setImageFile(file)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!address) {
      await connect()
      return
    }
    if (!isCorrectNetwork) {
      await switchNetwork()
      return
    }

    const goalNum = Number(goal)
    const days = Number(duration)
    if (!title.trim()) {
      setError('Please enter a campaign title.')
      return
    }
    if (!Number.isFinite(goalNum) || goalNum <= 0) {
      setError('Goal must be a positive amount of ETH.')
      return
    }
    if (!Number.isInteger(days) || days <= 0) {
      setError('Duration must be at least 1 day.')
      return
    }

    setSubmitting(true)
    try {
      setStep('Waiting for wallet confirmation…')
      const signer = await getSigner()
      const contract = getContract(signer)
      const tx = await contract.createCampaign(
        parseEther(goal),
        days,
        title.trim(),
      )
      setStep('Transaction submitted — confirming on-chain…')
      const receipt = await tx.wait()

      // Parse CampaignCreated event for id
      let campaignId: number | null = null
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          })
          if (parsed?.name === 'CampaignCreated') {
            campaignId = Number(parsed.args.id)
            break
          }
        } catch {
          /* not our event */
        }
      }

      // Fallback: campaignCount - 1
      if (campaignId == null) {
        const count = await contract.campaignCount()
        campaignId = Number(count) - 1
      }

      let imageUrl: string | undefined
      if (imageFile) {
        setStep('Uploading cover image…')
        try {
          imageUrl = await uploadImage(imageFile)
        } catch {
          // Image upload is optional; campaign still exists on-chain
          console.warn('Image upload failed; continuing without image')
        }
      }

      setStep('Saving campaign details…')
      try {
        await saveMetadata(campaignId, {
          description: description.trim() || undefined,
          imageUrl,
          category,
        })
      } catch {
        console.warn('Metadata save failed; campaign still exists on-chain')
      }

      navigate(`/campaigns/${campaignId}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create campaign'
      if (message.toLowerCase().includes('user rejected')) {
        setError('Transaction rejected in wallet.')
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
      setStep(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Launch a campaign
        </h1>
        <p className="mt-2 text-slate-400">
          Create an on-chain fundraiser. Goals and deadlines are enforced by the
          smart contract.
        </p>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8"
      >
        {/* Cover image */}
        <div>
          <label className="label">Cover image</label>
          <div
            className={`relative mt-2 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-slate-950/50 transition hover:border-emerald-400/40 ${
              imagePreview ? 'aspect-[21/9]' : 'aspect-[21/9]'
            }`}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
                <svg
                  className="h-10 w-10 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16l5-5 4 4 6-7 3 3v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-1z"
                  />
                </svg>
                <span className="text-sm">Click or drop an image (optional)</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
          {imageFile && (
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="mt-2 text-xs text-slate-500 hover:text-rose-300"
            >
              Remove image
            </button>
          )}
        </div>

        <div>
          <label htmlFor="title" className="label">
            Title
          </label>
          <input
            id="title"
            className="input mt-2"
            placeholder="e.g. Open-source climate dashboard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            className="input mt-2 min-h-[120px] resize-y"
            placeholder="Tell supporters what you're building and why it matters…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="goal" className="label">
              Goal (ETH)
            </label>
            <input
              id="goal"
              type="number"
              min="0"
              step="any"
              className="input mt-2"
              placeholder="1.5"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="duration" className="label">
              Duration (days)
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              step="1"
              className="input mt-2"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="label">
              Category
            </label>
            <select
              id="category"
              className="input mt-2"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Exclude<Category, 'All'>)
              }
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100/80">
          <p className="font-semibold text-cyan-300">How it works</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-cyan-100/60">
            <li>Title, goal, and deadline are stored on the blockchain.</li>
            <li>If the goal is met by the deadline, you can claim the funds.</li>
            <li>If not, contributors can refund their ETH.</li>
          </ul>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {step && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {step}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!address
              ? 'Connect wallet to continue'
              : !isCorrectNetwork
                ? 'Switch network & launch'
                : submitting
                  ? 'Creating…'
                  : 'Create campaign'}
          </button>
          <p className="text-xs text-slate-500">
            You will confirm a transaction in your wallet.
          </p>
        </div>
      </form>
    </div>
  )
}
