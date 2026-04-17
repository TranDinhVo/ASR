import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mic, History, LogOut, UserCircle } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Mic size={18} />
          </div>
          <span className="logo-text">
            ASR
          </span>
        </Link>

        {/* Nav links — hiện với cả guest */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Mic size={16} />
            Tải lên
          </Link>
          {/* Lịch sử chỉ hiện khi đã đăng nhập */}
          {user && (
            <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
              <History size={16} />
              Lịch sử
            </Link>
          )}
        </div>

        {/* User info hoặc login/register */}
        {user ? (
          <div className="navbar-user">
            <div className="user-info">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" id="btn-logout">
              <LogOut size={15} />
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="navbar-auth">
            <Link to="/login" className="btn btn-ghost btn-sm" id="btn-nav-login">
              <UserCircle size={15} />
              Đăng nhập
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" id="btn-nav-register">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
