import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './AuthPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAppStore()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      return toast.error('Mật khẩu tối thiểu 6 ký tự')
    }
    try {
      setLoading(true)
      const res = await authAPI.register(form)
      // Không đăng nhập ngay, hiển thị thông báo
      toast.success(res.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email.', { duration: 5000 })
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <div className="logo-icon">
            <Mic size={20} />
          </div>
          <h1 className="auth-brand">ASR</h1>
        </div>

        <h2 className="auth-title">Tạo tài khoản mới</h2>
        <p className="auth-subtitle">Bắt đầu chuyển đổi giọng nói miễn phí</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Họ tên</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

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
                placeholder="Tối thiểu 6 ký tự..."
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

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="btn-register">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Đang tạo...</> : 'Đăng ký'}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
