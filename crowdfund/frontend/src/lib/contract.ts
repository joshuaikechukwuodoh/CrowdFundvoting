import { BrowserProvider, Contract, parseEther, type Signer } from 'ethers'

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 31337)

export const CROWDFUND_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_goal', type: 'uint256' },
      { internalType: 'uint256', name: '_durationInDays', type: 'uint256' },
      { internalType: 'string', name: '_title', type: 'string' },
    ],
    name: 'createCampaign',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'contribute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'getCampaign',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'creator', type: 'address' },
          { internalType: 'uint256', name: 'goal', type: 'uint256' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint256', name: 'amountRaised', type: 'uint256' },
          { internalType: 'bool', name: 'claimed', type: 'bool' },
          { internalType: 'string', name: 'title', type: 'string' },
        ],
        internalType: 'struct CrowdFund.Campaign',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_id', type: 'uint256' },
      { internalType: 'address', name: '_user', type: 'address' },
    ],
    name: 'getContribution',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'campaignCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      { indexed: false, internalType: 'uint256', name: 'goal', type: 'uint256' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      { indexed: false, internalType: 'string', name: 'title', type: 'string' },
    ],
    name: 'CampaignCreated',
    type: 'event',
  },
] as const

export function getContract(signerOrProvider: Signer | BrowserProvider) {
  return new Contract(CONTRACT_ADDRESS, CROWDFUND_ABI, signerOrProvider)
}

export function ethToWei(amount: string) {
  return parseEther(amount)
}
