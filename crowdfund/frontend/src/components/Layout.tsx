import { Link, Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { CONTRACT_ADDRESS } from '../lib/contract'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
)

export function Layout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-24 top-40 h-[24rem] w-[24rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-violet-600/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-white/10 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-white">CrowdFund</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Transparent fundraising powered by smart contracts.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Pages
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="font-medium text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
                >
                  Explore campaigns
                </Link>
              </li>
              <li>
                <Link
                  to="/create"
                  className="font-medium text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
                >
                  Launch a campaign
                </Link>
              </li>
              <li>
                <a
                  href="/#campaigns"
                  className="font-medium text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
                >
                  Campaign list
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Local services
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="http://localhost:5173"
                  className="font-medium text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Frontend · localhost:5173
                </a>
              </li>
              <li>
                <a
                  href={`${API_URL}/health`}
                  className="font-medium text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Backend health · {API_URL}/health
                </a>
              </li>
              <li>
                <a
                  href={`${API_URL}/campaigns`}
                  className="font-medium text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Campaigns API · {API_URL}/campaigns
                </a>
              </li>
              <li className="break-all text-xs text-slate-500">
                Contract:{' '}
                <span className="font-mono text-slate-400">{CONTRACT_ADDRESS}</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-7xl px-4 text-center text-xs text-slate-600 sm:px-6 lg:px-8">
          Built with Hardhat · Express · React
        </p>
      </footer>
    </div>
  )
}
