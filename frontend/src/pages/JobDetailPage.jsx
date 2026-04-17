import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileAudio, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { jobsAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import TranscriptView from '../components/TranscriptView'
import SummaryCard from '../components/SummaryCard'


const formatDate = (d) => new Date(d).toLocaleString('vi-VN')

const STATUS_LABELS = {
  pending: 'Đang chờ...',
  processing: 'Đang xử lý...',
  done: 'Hoàn thành',
  failed: 'Thất bại',
}

const STATUS_ICONS = {
  pending: <Clock size={16} className="animate-pulse" />,
  processing: <Loader2 size={16} className="animate-spin" />,
  done: <CheckCircle size={16} />,
  failed: <XCircle size={16} />,
}

const StatusBadge = ({ status }) => (
  <div className={`badge badge-${status}`}>
    {STATUS_ICONS[status]}
    <span style={{ marginLeft: 6 }}>{STATUS_LABELS[status]}</span>
  </div>
)

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('transcript')
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await jobsAPI.getJob(id)
        setJob(res.data.job)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không tìm thấy job')
        navigate('/history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  )

  if (!job) return null

  return (
    <div className="container">
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 0 80px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Back */}
        <Link to="/" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={14} /> Trở về rò chuyện
        </Link>

        {/* Job info card */}
        <div className="animate-fade-in" style={{ padding: 32, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, background: 'var(--bg-secondary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
              <FileAudio size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: '#111827' }}>{job.title}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {job.originalFilename} · {job.language?.toUpperCase()} · {formatDate(job.createdAt)}
              </p>
            </div>
            <StatusBadge status={job.status} />
          </div>

          {/* Tabs + Content */}
          {job.status === 'done' && (
            <>
              <div className="tabs" style={{ marginBottom: 24 }}>
                <button className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')} id="tab-transcript">
                  Nội dung ({job.transcript?.wordCount || 0})
                </button>
                <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')} id="tab-summary">
                  Tóm tắt
                </button>
                <button className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`} onClick={() => setActiveTab('keywords')} id="tab-keywords">
                  Từ khóa
                </button>
              </div>

              {activeTab === 'transcript' && <TranscriptView transcript={job.transcript} />}
              {activeTab === 'summary' && <SummaryCard summary={job.summary} />}
              {activeTab === 'keywords' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 0' }}>
                  {job.summary?.keywords?.map((kw, i) => (
                    <span key={i} style={{ padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{kw}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {job.status === 'failed' && (
            <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, color: 'var(--danger)', fontSize: 14 }}>
              ❌ {job.errorMessage || 'Đã xảy ra lỗi'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
