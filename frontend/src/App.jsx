import { Routes, Route, Navigate } from 'react-router-dom'
import useAppStore from './store/useAppStore'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import JobDetailPage from './pages/JobDetailPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

// Route chỉ dành cho người đã đăng nhập (lịch sử, v.v.)
const PrivateRoute = ({ children }) => {
  const { token } = useAppStore()
  return token ? children : <Navigate to="/login" replace />
}

// Route chỉ cho khách chưa đăng nhập
const GuestRoute = ({ children }) => {
  const { token } = useAppStore()
  return !token ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />

      <main className="main-content page-content">
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/verify-email" element={<GuestRoute><VerifyEmailPage /></GuestRoute>} />

          {/* Public — không cần đăng nhập */}
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />

          {/* Private — cần đăng nhập */}
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
