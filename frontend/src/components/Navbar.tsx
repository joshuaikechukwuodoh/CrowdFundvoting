import { Link, NavLink } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { formatEth, shortAddress } from '../lib/format'
import { CHAIN_ID } from '../lib/contract'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-white/15 text-white ring-1 ring-white/20'
      : 'text-slate-200 hover:bg-white/10 hover:text-white'
  }`

export function Navbar() {
  const {
    address,
    balance,
    connecting,
    connect,
    disconnect,
    isCorrectNetwork,
    switchNetwork,
    chainId,
  } = useWallet()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/25 transition group-hover:shadow-emerald-400/40">
              <svg
                className="h-5 w-5 text-slate-950"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2L18.5 8 12 11.8 5.5 8 12 4.2zM5 9.7l6 3.4v6.7l-6-3.3V9.7zm8 10.1v-6.7l6-3.4v6.8l-6 3.3z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-white">
                CrowdFund
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-400 sm:block">
                on-chain
              </span>
            </div>
          </Link>

          {/* Always visible navigation links */}
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Explore
            </NavLink>
            <NavLink to="/create" className={navLinkClass}>
              Launch
            </NavLink>
            <a
              href="#campaigns"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white sm:inline-flex"
              onClick={(e) => {
                // If not on home, go home then scroll
                if (window.location.pathname !== '/') {
                  e.preventDefault()
                  window.location.href = '/#campaigns'
                }
              }}
            >
              Campaigns
            </a>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {address && !isCorrectNetwork && (
            <button
              type="button"
              onClick={() => void switchNetwork()}
              className="rounded-xl bg-amber-500/15 px-2.5 py-2 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-amber-500/25 sm:px-3 sm:text-xs"
            >
              Switch network
              {chainId != null && (
                <span className="ml-1 hidden opacity-70 sm:inline">
                  ({CHAIN_ID === 31337 ? 'Hardhat' : CHAIN_ID})
                </span>
              )}
            </button>
          )}

          {address ? (
            <div className="flex items-center gap-2">
              {balance != null && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-medium text-slate-200 sm:px-3 sm:text-xs">
                  <span className="text-emerald-300">{formatEth(balance, 3)}</span>{' '}
                  ETH
                </div>
              )}
              <button
                type="button"
                onClick={disconnect}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-500/10 sm:px-3 sm:text-sm"
                title="Click to disconnect"
              >
                {shortAddress(address)}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void connect()}
              disabled={connecting}
              className="btn-primary px-3 py-2 text-xs sm:text-sm"
            >
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
