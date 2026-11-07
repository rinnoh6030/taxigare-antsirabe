import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './Loading'

export default function ProtectedRoute() {
  const { chargement, estConnecte } = useAuth()
  const location = useLocation()

  if (chargement) {
    return <PageLoader label="Vérification de votre session…" />
  }

  if (!estConnecte) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
