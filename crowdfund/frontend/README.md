# CrowdFund Frontend

Modern React + Vite UI for the CrowdFund dApp: explore campaigns, connect a wallet, launch fundraisers, contribute ETH, claim funds, or refund.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- ethers.js v6
- React Router

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` with your deployed contract address and API URL:

```env
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ADDRESS=0xYourDeployedAddress
VITE_CHAIN_ID=31337
```

## Run

Start Hardhat node, deploy the contract, and run the backend first. Then:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

- **Explore** — search, category, and status filters with live progress bars
- **Create** — on-chain campaign + optional image/description metadata
- **Contribute / Claim / Refund** — wallet transactions via MetaMask
- **Network helper** — switch or add Hardhat local network automatically

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Dev server (port 5173)   |
| `npm run build`| Production build         |
| `npm run preview` | Preview production    |
