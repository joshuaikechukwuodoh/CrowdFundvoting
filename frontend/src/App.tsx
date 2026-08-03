import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { WalletProvider } from './hooks/useWallet'
import { CampaignDetail } from './pages/CampaignDetail'
import { CreateCampaign } from './pages/CreateCampaign'
import { Home } from './pages/Home'

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="create" element={<CreateCampaign />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  )
}
