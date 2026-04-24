import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAppStore from './store/useAppStore'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import JobDetailPage from './pages/JobDetailPage'
import KnowledgePage from './pages/KnowledgePage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import PrivateRoute from './components/PrivateRoute'
import GuestRoute from './components/GuestRoute'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { token, fetchRecentJobs } = useAppStore()

  useEffect(() => {
    if (token) {
      fetchRecentJobs()
    }
  }, [token, fetchRecentJobs])

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Toaster position="top-right" />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="content-area">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            
            {/* Auth Routes (Guest Only) */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/verify-email" element={<GuestRoute><VerifyEmailPage /></GuestRoute>} />

            {/* Protected Routes */}
            <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/knowledge" element={<PrivateRoute><KnowledgePage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>    
  )
}
