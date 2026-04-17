import { useEffect, useRef } from 'react'
import { Mic, Sparkles, Clock, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import AudioUploader from '../components/AudioUploader'
import JobResult from '../components/JobResult'
import './HomePage.css'

export default function HomePage() {
  const { user, recentJobs, updateRecentJob } = useAppStore()
  const scrollRef = useRef(null)

  const handleDismiss = (jobId) => {
    useAppStore.setState(state => ({
      recentJobs: state.recentJobs.filter(j => j._id !== jobId)
    }));
  }

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [recentJobs])

  return (
    <div className="container">
      <div className="home-page page-content">
        {/* Hero — Chỉ hiện khi chưa có tin nhắn */}
        {recentJobs.length === 0 && (
          <div className="hero animate-fade-in">
            <div className="hero-badge">
              <Sparkles size={14} />
              Hệ thống nhận dạng giọng nói AI
            </div>
            <h1 className="hero-title">
              <span className="gradient-text">Chuyển giọng nói</span> thành văn bản
            </h1>
            <p className="hero-subtitle">
              Tải lên file âm thanh để chuyển đổi sang văn bản, tóm tắt ý chính và trích xuất từ khóa tự động bằng công nghệ AI tiên tiến.
            </p>
            <div className="hero-stats">
              <div className="stat-item"><Mic size={16} /> <span>Hỗ trợ mọi định dạng</span></div>
              <div className="stat-item"><Clock size={16} /> <span>Xử lý trong giây lát</span></div>
              <div className="stat-item"><Sparkles size={16} /> <span>Kết quả chính xác</span></div>
            </div>
          </div>
        )}

        {/* Main content - Wrapped in a shadow card frame */}
        <div className={`home-content chat-layout ${recentJobs.length > 0 ? 'chat-main-card' : ''}`}>
          {/* Result section (Chat thread) */}
          <div className="chat-thread">
            {recentJobs.map(job => (
              <JobResult key={job._id} jobId={job._id} onDismiss={handleDismiss} />
            ))}
            <div ref={scrollRef} style={{ height: 1 }} />
          </div>

          {/* Upload section (Chat input) */}
          <div className="chat-input-area">
            <AudioUploader />
          </div>

          {/* Guest CTA — chỉ hiện khi không có jobs */}
          {!user && recentJobs.length === 0 && (
            <div className="guest-cta glass-card animate-fade-in">
              <div className="guest-cta-content">
                <UserPlus size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <p className="guest-cta-title">Muốn lưu lịch sử xử lý?</p>
                  <p className="guest-cta-sub">Tạo tài khoản miễn phí để xem lại kết quả bất cứ lúc nào.</p>
                </div>
              </div>
              <div className="guest-cta-actions">
                <Link to="/register" className="btn btn-primary btn-sm" id="btn-cta-register">Đăng ký miễn phí</Link>
                <Link to="/login" className="btn btn-ghost btn-sm" id="btn-cta-login">Đăng nhập</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
