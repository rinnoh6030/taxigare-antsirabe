import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PublicLayout from './components/PublicLayout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import BookingPage from './pages/BookingPage'
import PaymentPage from './pages/PaymentPage'
import TicketPage from './pages/TicketPage'
import DeparturesPage from './pages/DeparturesPage'
import { PageLoader } from './components/Loading'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminVehiclesPage from './pages/AdminVehiclesPage'
import NotFoundPage from './pages/NotFoundPage'

const AdminScanPage = lazy(() => import('./pages/AdminScanPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/recherche" element={<SearchPage />} />
              <Route path="/reserver/:vehiculeId" element={<BookingPage />} />
              <Route path="/paiement/:code" element={<PaymentPage />} />
              <Route path="/ticket/:code" element={<TicketPage />} />
              <Route path="/departs" element={<DeparturesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="vehicules" element={<AdminVehiclesPage />} />
                <Route path="scan" element={<AdminScanPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
