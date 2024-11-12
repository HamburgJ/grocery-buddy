import { Layout } from './components/layout/Layout.jsx'
import AppRoutes from './routes.jsx'
import { MerchantProvider } from './contexts/MerchantContext'

function App() {
  return (
    <MerchantProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </MerchantProvider>
  )
}

export default App