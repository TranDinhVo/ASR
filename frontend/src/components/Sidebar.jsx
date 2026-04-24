import { Link, useLocation } from 'react-router-dom'
import { 
  Menu, Search, Plus,
  BookText, Settings, MoreVertical
} from 'lucide-react'
import useAppStore from '../store/useAppStore'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, recentJobs, startNewChat } = useAppStore()
  const location = useLocation()

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar gemini-style ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-top-nav">
          <button className="icon-btn-ghost" onClick={onClose} title="Đóng menu">
            <Menu size={20} />
          </button>
          <Link 
            to="/knowledge" 
            className="icon-btn-ghost" 
            title="Tìm kiếm tài liệu"
            onClick={() => window.innerWidth < 768 && onClose()}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Search size={20} />
          </Link>
        </div>

        <div className="sidebar-scrollable">
          <Link 
            to="/" 
            className="new-chat-btn" 
            onClick={() => {
              startNewChat()
              if (window.innerWidth < 768) onClose()
            }}
          >
            <Plus size={20} />
            <span>Cuộc trò chuyện mới</span>
          </Link>

          <div className="nav-section">
            <Link 
              to="/knowledge" 
              className="nav-item-link"
              onClick={() => window.innerWidth < 768 && onClose()}
            >
              <BookText size={18} />
              <span>Nội dung của tôi</span>
            </Link>
          </div>


          <div className="conversations-section">
            <div className="section-title">Gần đây</div>
            <div className="conversation-list">
              {recentJobs.length > 0 ? (
                recentJobs.slice(0, 10).map(job => (
                  <Link 
                    key={job._id} 
                    to={`/job/${job._id}`} 
                    className={`conv-item ${location.pathname.includes(job._id) ? 'active' : ''}`}
                    onClick={() => window.innerWidth < 768 && onClose()}
                  >
                    <span>{job.title || job.originalFilename || 'Cuộc hội thoại mới'}</span>
                    <MoreVertical size={14} className="more-icon" />
                  </Link>
                ))
              ) : (
                <div className="conv-item-placeholder" style={{ padding: '8px 12px', fontSize: '13px', opacity: 0.6 }}>
                  Chưa có bài giảng nào
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-bottom-actions">
          <button className="nav-item-link footer-link">
            <Settings size={18} />
            <span>Cài đặt và trợ giúp</span>
          </button>
        </div>
      </aside>
    </>
  )
}
