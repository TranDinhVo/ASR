import { Navigate, Outlet } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

export default function GuestRoute({ children }) {
  const { token } = useAppStore()
  
  if (token) {
    return <Navigate to="/" replace />
  }

  return children ? children : <Outlet />
}
