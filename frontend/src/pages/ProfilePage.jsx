import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Calendar, BookOpen, Lock,
  Save, Eye, EyeOff, CheckCircle2, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './ProfilePage.css'

const AVATAR_COLORS = [
  '#6750A4', '#1a73e8', '#0f9d58', '#e37400',
  '#d93025', '#4285f4', '#34a853', '#ea4335',
]

function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export default function ProfilePage() {
  const { user, setAuth, token } = useAppStore()
  const navigate = useNavigate()

  // ─── Profile info state ──────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // ─── Edit name ───────────────────────────────────────────────────────────────
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // ─── Change password ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [savingPw, setSavingPw] = useState(false)

  // ─── Fetch full profile ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await authAPI.getMe()
        setProfileData(res.data.user)
        setNewName(res.data.user.name)
      } catch {
        toast.error('Không thể tải thông tin profile')
      } finally {
        setLoadingProfile(false)
      }
    }
    load()
  }, [])

  // ─── Update name ─────────────────────────────────────────────────────────────
  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return toast.error('Tên không được để trống')
    if (newName.trim() === profileData?.name) return toast('Tên chưa thay đổi')
    setSavingName(true)
    try {
      const res = await authAPI.updateMe({ name: newName.trim() })
      const updated = res.data.user
      setProfileData(updated)
      setAuth(updated, token)
      toast.success('Đã cập nhật tên!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSavingName(false)
    }
  }

  // ─── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!pwForm.current || !pwForm.next || !pwForm.confirm)
      return toast.error('Vui lòng điền đầy đủ các trường mật khẩu')
    if (pwForm.next !== pwForm.confirm)
      return toast.error('Mật khẩu xác nhận không khớp')
    if (pwForm.next.length < 6)
      return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')

    setSavingPw(true)
    try {
      await authAPI.updateMe({ currentPassword: pwForm.current, newPassword: pwForm.next })
      setPwForm({ current: '', next: '', confirm: '' })
      toast.success('Đã đổi mật khẩu thành công!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally {
      setSavingPw(false)
    }
  }

  const avatarColor = getAvatarColor(profileData?.name)
  const initial = (profileData?.name || user?.name || '?')[0].toUpperCase()

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="profile-skeleton">
          <div className="skel-circle" />
          <div className="skel-line" style={{ width: 160, height: 22 }} />
          <div className="skel-line" style={{ width: 220, height: 16 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">

      {/* ── Hero Card ─────────────────────────────────────────────────── */}
      <div className="profile-hero-card">
        <div className="profile-big-avatar" style={{ background: avatarColor }}>
          {initial}
        </div>
        <div className="profile-hero-info">
          <h1 className="profile-hero-name">{profileData?.name}</h1>
          <div className="profile-hero-email">
            <Mail size={14} /> {profileData?.email}
          </div>
          {profileData?.isVerified && (
            <span className="verified-badge">
              <ShieldCheck size={13} /> Đã xác thực
            </span>
          )}
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="profile-stats-row">
        <div className="profile-stat-card">
          <div className="profile-stat-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div className="profile-stat-value">{profileData?.totalJobs || 0}</div>
            <div className="profile-stat-label">Tài liệu đã xử lý</div>
          </div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="profile-stat-value">
              {profileData?.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
            </div>
            <div className="profile-stat-label">Trạng thái tài khoản</div>
          </div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="profile-stat-value">{formatDate(profileData?.createdAt)}</div>
            <div className="profile-stat-label">Ngày tham gia</div>
          </div>
        </div>
      </div>

      <div className="profile-forms-row">

        {/* ── Edit Name Form ─────────────────────────────────────────── */}
        <div className="profile-card">
          <div className="profile-card-header">
            <User size={18} />
            <h2>Thông tin cá nhân</h2>
          </div>

          <form onSubmit={handleSaveName} className="profile-form">
            <div className="profile-form-group">
              <label htmlFor="profile-name-input">Họ và tên</label>
              <input
                id="profile-name-input"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nhập tên của bạn"
                maxLength={100}
              />
            </div>

            <div className="profile-form-group">
              <label>Email</label>
              <input
                type="email"
                value={profileData?.email || ''}
                disabled
                className="disabled"
                title="Email không thể thay đổi"
              />
              <small>Email không thể thay đổi</small>
            </div>

            <button
              id="save-name-btn"
              type="submit"
              className="profile-save-btn"
              disabled={savingName}
            >
              {savingName ? (
                <span className="btn-loading">Đang lưu...</span>
              ) : (
                <><Save size={15} /> Lưu thay đổi</>
              )}
            </button>
          </form>
        </div>

        {/* ── Change Password Form ───────────────────────────────────── */}
        <div className="profile-card">
          <div className="profile-card-header">
            <Lock size={18} />
            <h2>Đổi mật khẩu</h2>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form">
            {[
              { key: 'current', label: 'Mật khẩu hiện tại', id: 'pw-current' },
              { key: 'next',    label: 'Mật khẩu mới',      id: 'pw-new' },
              { key: 'confirm', label: 'Xác nhận mật khẩu mới', id: 'pw-confirm' },
            ].map(({ key, label, id }) => (
              <div className="profile-form-group" key={key}>
                <label htmlFor={id}>{label}</label>
                <div className="pw-wrap">
                  <input
                    id={id}
                    type={showPw[key] ? 'text' : 'password'}
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    tabIndex={-1}
                  >
                    {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            <button
              id="save-password-btn"
              type="submit"
              className="profile-save-btn"
              disabled={savingPw}
            >
              {savingPw ? (
                <span className="btn-loading">Đang đổi...</span>
              ) : (
                <><Lock size={15} /> Đổi mật khẩu</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
