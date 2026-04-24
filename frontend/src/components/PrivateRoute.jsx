import { Navigate, Outlet } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

export default function PrivateRoute({ children }) {
  const { token } = useAppStore()
  
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children ? children : <Outlet />
}
