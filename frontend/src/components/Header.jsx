import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Share2, LayoutGrid, LogOut, LogIn, BookOpen, User } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import './Header.css'

export default function Header({ sidebarOpen, onMenuClick }) {
  const { user, logout } = useAppStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login')
  }

  const avatarLetter = user?.name?.[0]?.toUpperCase() || '?'
  // Pick a consistent color based on the first letter
  const avatarColors = [
    '#6750A4', '#1a73e8', '#0f9d58', '#e37400',
    '#d93025', '#4285f4', '#34a853', '#ea4335',
  ]
  const colorIndex = (avatarLetter.charCodeAt(0) || 0) % avatarColors.length
  const avatarColor = avatarColors[colorIndex]

  return (
    <header className="gemini-header">
      <div className="header-left">
        {!sidebarOpen && (
          <button className="menu-btn" onClick={onMenuClick} title="Mở sidebar">
            <Menu size={22} />
          </button>
        )}
        <div className="header-brand">StudentAI</div>
      </div>

      <div className="header-center">
        <div className="header-chat-title">Hỗ trợ học tập cá nhân</div>
      </div>

      <div className="header-right">
        <button className="icon-btn" title="Chia sẻ"><Share2 size={18} /></button>
        <button className="icon-btn" title="Ứng dụng"><LayoutGrid size={18} /></button>

        {/* ── Avatar / Profile Dropdown ──────────────────────────────── */}
        {user ? (
          <div className="profile-wrap" ref={dropdownRef}>
            <button
              id="header-avatar-btn"
              className="user-avatar-small"
              style={{ background: avatarColor }}
              onClick={() => setDropdownOpen(prev => !prev)}
              title="Hồ sơ cá nhân"
            >
              {avatarLetter}
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown" id="profile-dropdown">
                {/* User info */}
                <div className="profile-dropdown-header">
                  <div
                    className="profile-dropdown-avatar"
                    style={{ background: avatarColor }}
                  >
                    {avatarLetter}
                  </div>
                  <div className="profile-dropdown-info">
                    <div className="profile-name">{user.name}</div>
                    <div className="profile-email">{user.email}</div>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                {/* Menu items */}
                <Link
                  to="/profile"
                  className="profile-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                  id="dropdown-profile-link"
                >
                  <User size={16} />
                  <span>Hồ sơ cá nhân</span>
                </Link>

                <Link
                  to="/knowledge"
                  className="profile-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                  id="dropdown-knowledge-link"
                >
                  <BookOpen size={16} />
                  <span>Tri thức cá nhân</span>
                </Link>

                <div className="profile-dropdown-divider" />

                <button
                  id="dropdown-logout-btn"
                  className="profile-dropdown-item danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Login Button ─────────────────────────────────────────── */
          <Link to="/login" className="header-login-btn" id="header-login-btn">
            <LogIn size={16} />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </header>
  )
}
