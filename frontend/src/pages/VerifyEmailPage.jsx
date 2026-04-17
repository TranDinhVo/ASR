import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mic, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './AuthPage.css'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { setAuth } = useAppStore()

  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Không tìm thấy mã xác thực. Vui lòng kiểm tra lại link trong email.')
      return
    }

    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token)
        setStatus('success')
        setMessage(res.data.message)
        // Auto login
        if (res.data.user && res.data.token) {
          setAuth(res.data.user, res.data.token)
          // Redirect home after 3s
          setTimeout(() => navigate('/'), 3000)
        }
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Xác thực thất bại. Vui lòng thử lại.')
      }
    }

    verify()
  }, [token, navigate, setAuth])

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <div className="logo-icon">
            <Mic size={20} />
          </div>
          <h1 className="auth-brand">ASR</h1>
        </div>

        {status === 'verifying' && (
          <div className="verify-state animate-fade-in">
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent)', margin: '20px auto' }} />
            <h2 className="auth-title">Đang xác thực email...</h2>
            <p className="auth-subtitle">Vui lòng đợi giây lát</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-state animate-fade-in">
            <CheckCircle size={48} style={{ color: 'var(--success)', margin: '20px auto' }} />
            <h2 className="auth-title" style={{ color: '#059669' }}>Xác thực thành công!</h2>
            <p className="auth-subtitle">{message}</p>
            <p className="auth-subtitle" style={{ fontSize: '13px', marginTop: '12px' }}>
              Đang chuyển hướng về trang chủ...
            </p>
            <Link to="/" className="btn btn-primary auth-submit" style={{ marginTop: '24px' }}>
              Về Trang Chủ Ngay
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-state animate-fade-in">
            <XCircle size={48} style={{ color: 'var(--danger)', margin: '20px auto' }} />
            <h2 className="auth-title" style={{ color: 'var(--danger)' }}>Úi, có lỗi xảy ra</h2>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="btn btn-primary auth-submit" style={{ marginTop: '24px' }}>
              Quay lại Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
