# CrowdFund — Blockchain Crowdfunding Monorepo

Decentralized Kickstarter-style crowdfunding on Ethereum. People create campaigns, others donate ETH, and if the goal is met the creator claims the funds; otherwise donors can refund.

## Structure

```
.
├── contracts/   # Hardhat smart contracts (CrowdFund.sol)
├── backend/     # Express API + PostgreSQL + Cloudinary
├── frontend/    # React + Vite + Tailwind + MetaMask
└── README.md
```

| Layer | Role |
|-------|------|
| **contracts/** | On-chain money & rules: create / donate / claim / refund |
| **backend/** | Off-chain metadata (description, image, category) + chain reads |
| **frontend/** | UI + wallet; writes go through MetaMask to the contract |

## Quick start

### 1. Smart contracts

```bash
cd contracts
npm install          # if needed
npx hardhat compile
npx hardhat node     # local chain on http://127.0.0.1:8545
# in another terminal:
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the deployed address into backend and frontend env files.

### 2. Backend

```bash
cd backend
npm install
# set .env (see backend/.env.example)
npm run db:push
npm run dev          # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
# set .env (see frontend/.env.example)
npm run dev          # http://localhost:5173
```

## Environment

**backend/.env** — `DATABASE_URL`, `CONTRACT_ADDRESS`, `RPC_URL`, Cloudinary keys  
**frontend/.env** — `VITE_CONTRACT_ADDRESS`, `VITE_API_URL`, chain settings

## Docs

More detail lives in `contracts/PROJECT_EXPLANATION.txt`.
