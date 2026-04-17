import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './AuthPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAppStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [needVerify, setNeedVerify] = useState(false)
  const [resending, setResending] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await authAPI.login(form)
      setAuth(res.data.user, res.data.token)
      toast.success(`Chào mừng, ${res.data.user.name}!`)
      navigate('/')
    } catch (err) {
      if (err.response?.data?.needVerification) {
        setNeedVerify(true)
        toast.error(err.response.data.message || 'Tài khoản chưa được xác thực')
      } else {
        toast.error(err.response?.data?.message || 'Đăng nhập thất bại')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <Mic size={20} />
          </div>
          <h1 className="auth-brand">ASR</h1>
        </div>

        <h2 className="auth-title">Chào mừng trở lại</h2>
        <p className="auth-subtitle">Đăng nhập để tiếp tục</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Nhập mật khẩu..."
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPass(s => !s)}
                id="btn-toggle-password"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="btn-login">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Đang đăng nhập...</> : 'Đăng nhập'}
          </button>

          {needVerify && (
            <button 
              type="button" 
              className="btn btn-ghost btn-lg auth-submit" 
              style={{ marginTop: '10px' }}
              disabled={resending} 
              onClick={async () => {
                try {
                  setResending(true)
                  await authAPI.resendVerification(form.email)
                  toast.success('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.')
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Không thể gửi lại email')
                } finally {
                  setResending(false)
                }
              }}
            >
              {resending ? <><Loader2 size={18} className="animate-spin" /> Đang gửi...</> : 'Gửi lại email xác thực'}
            </button>
          )}
        </form>

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}
