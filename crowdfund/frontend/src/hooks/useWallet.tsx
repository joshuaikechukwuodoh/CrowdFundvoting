import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { BrowserProvider, formatEther, type Eip1193Provider } from 'ethers'
import { CHAIN_ID } from '../lib/contract'

type WalletState = {
  address: string | null
  balance: string | null
  chainId: number | null
  connecting: boolean
  error: string | null
  isCorrectNetwork: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: () => Promise<void>
  getSigner: () => Promise<Awaited<ReturnType<BrowserProvider['getSigner']>>>
  provider: BrowserProvider | null
}

const WalletContext = createContext<WalletState | null>(null)

function getEthereum(): EthereumProvider | undefined {
  return window.ethereum
}

function asEip1193(eth: EthereumProvider): Eip1193Provider {
  return eth as unknown as Eip1193Provider
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)

  const refreshAccount = useCallback(async (eth: EthereumProvider, acc: string) => {
    const browserProvider = new BrowserProvider(asEip1193(eth))
    setProvider(browserProvider)
    setAddress(acc)
    const network = await browserProvider.getNetwork()
    setChainId(Number(network.chainId))
    const bal = await browserProvider.getBalance(acc)
    setBalance(formatEther(bal))
  }, [])

  const connect = useCallback(async () => {
    const eth = getEthereum()
    if (!eth) {
      setError('MetaMask not found. Install a Web3 wallet to continue.')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const accounts = (await eth.request({
        method: 'eth_requestAccounts',
      })) as string[]
      if (!accounts[0]) throw new Error('No account selected')
      await refreshAccount(eth, accounts[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }, [refreshAccount])

  const disconnect = useCallback(() => {
    setAddress(null)
    setBalance(null)
    setChainId(null)
    setProvider(null)
    setError(null)
  }, [])

  const switchNetwork = useCallback(async () => {
    const eth = getEthereum()
    if (!eth) return
    const hexId = `0x${CHAIN_ID.toString(16)}`
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexId }],
      })
    } catch (err) {
      const code = (err as { code?: number }).code
      if (code === 4902 && CHAIN_ID === 31337) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexId,
              chainName: 'Hardhat Local',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545'],
            },
          ],
        })
      } else {
        setError(err instanceof Error ? err.message : 'Failed to switch network')
      }
    }
  }, [])

  const getSigner = useCallback(async () => {
    if (!provider) throw new Error('Wallet not connected')
    return provider.getSigner()
  }, [provider])

  useEffect(() => {
    const eth = getEthereum()
    if (!eth) return

    const onAccounts = (...args: unknown[]) => {
      const list = args[0] as string[]
      if (!list?.length) {
        disconnect()
        return
      }
      void refreshAccount(eth, list[0])
    }

    const onChain = () => {
      if (address) void refreshAccount(eth, address)
      else {
        void (async () => {
          const browserProvider = new BrowserProvider(asEip1193(eth))
          const network = await browserProvider.getNetwork()
          setChainId(Number(network.chainId))
        })()
      }
    }

    void (async () => {
      try {
        const accounts = (await eth.request({ method: 'eth_accounts' })) as string[]
        if (accounts[0]) await refreshAccount(eth, accounts[0])
      } catch {
        /* ignore */
      }
    })()

    eth.on?.('accountsChanged', onAccounts)
    eth.on?.('chainChanged', onChain)
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts)
      eth.removeListener?.('chainChanged', onChain)
    }
  }, [address, disconnect, refreshAccount])

  const value = useMemo<WalletState>(
    () => ({
      address,
      balance,
      chainId,
      connecting,
      error,
      isCorrectNetwork: chainId === CHAIN_ID,
      connect,
      disconnect,
      switchNetwork,
      getSigner,
      provider,
    }),
    [
      address,
      balance,
      chainId,
      connecting,
      error,
      connect,
      disconnect,
      switchNetwork,
      getSigner,
      provider,
    ],
  )

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
