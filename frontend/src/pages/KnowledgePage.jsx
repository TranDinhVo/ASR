import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import {
  Search, BookOpen, Mic, FileVideo, FileText, AlignLeft,
  CheckCircle2, Clock, AlertCircle, Loader2, Trash2,
  ExternalLink, Library, Hash, Calendar, Upload
} from 'lucide-react'
import './KnowledgePage.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(fileType) {
  switch (fileType) {
    case 'audio':    return <Mic size={20} color="#8b5cf6" />
    case 'video':    return <FileVideo size={20} color="#ef4444" />
    case 'document': return <FileText size={20} color="#f59e0b" />
    case 'text':     return <AlignLeft size={20} color="#10b981" />
    default:         return <BookOpen size={20} color="#1a73e8" />
  }
}

function getFileTypeLabel(type) {
  const map = { audio: 'Audio', video: 'Video', document: 'Tài liệu', text: 'Văn bản' }
  return map[type] || 'File'
}

function StatusBadge({ status }) {
  const map = {
    done:       { label: 'Đã xong', icon: <CheckCircle2 size={12} /> },
    processing: { label: 'Đang xử lý', icon: <Loader2 size={12} className="spin" /> },
    pending:    { label: 'Chờ xử lý', icon: <Clock size={12} /> },
    failed:     { label: 'Thất bại', icon: <AlertCircle size={12} /> },
  }
  const s = map[status] || map.pending
  return (
    <span className={`card-status ${status}`}>
      {s.icon} {s.label}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="skeleton-line" style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton-line" style={{ height: 14, width: '70%' }} />
          <div className="skeleton-line" style={{ height: 12, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton-line" style={{ height: 12, width: '100%' }} />
      <div className="skeleton-line" style={{ height: 12, width: '85%' }} />
      <div className="skeleton-line" style={{ height: 12, width: '60%' }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <div className="skeleton-line" style={{ height: 22, width: 60, borderRadius: 12 }} />
        <div className="skeleton-line" style={{ height: 22, width: 80, borderRadius: 12 }} />
      </div>
    </div>
  )
}

// ─── Knowledge Card ───────────────────────────────────────────────────────────

function KnowledgeCard({ job, onDelete, onClick }) {
  const [deleting, setDeleting] = useState(false)
  const keywords = job.summary?.keywords || []
  const summary = job.summary?.content || job.pipeline?.stage3_summary || null

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Xóa tài liệu "${job.title || job.originalFilename}"?`)) return
    setDeleting(true)
    try {
      await jobsAPI.deleteJob(job._id)
      onDelete(job._id)
      toast.success('Đã xóa tài liệu')
    } catch {
      toast.error('Xóa thất bại')
      setDeleting(false)
    }
  }

  const handleOpen = (e) => {
    e.stopPropagation()
    onClick(job._id)
  }

  return (
    <div
      className="knowledge-card"
      data-type={job.fileType || 'audio'}
      onClick={() => onClick(job._id)}
      title={job.title || job.originalFilename}
    >
      {/* Top row */}
      <div className="card-top">
        <div className={`card-icon-badge ${job.fileType || 'audio'}`}>
          {getFileIcon(job.fileType)}
        </div>
        <div className="card-actions">
          <button
            className="card-action-btn"
            onClick={handleOpen}
            title="Mở chi tiết"
          >
            <ExternalLink size={14} />
          </button>
          <button
            className="card-action-btn delete"
            onClick={handleDelete}
            disabled={deleting}
            title="Xóa tài liệu"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title + Status */}
      <div>
        <div className="card-title">{job.title || job.originalFilename || 'Không có tiêu đề'}</div>
        <div style={{ marginTop: 6 }}>
          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* Summary */}
      {summary ? (
        <div className="card-summary">{summary}</div>
      ) : job.status === 'done' ? (
        <div className="card-summary" style={{ fontStyle: 'italic', opacity: 0.6 }}>
          Không có bản tóm tắt.
        </div>
      ) : null}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="card-keywords">
          {keywords.slice(0, 5).map((kw, i) => (
            <span key={i} className="kw-tag">#{kw}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={11} />
          {formatDate(job.createdAt)}
        </span>
        <span>{getFileTypeLabel(job.fileType)}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const navigate = useNavigate()
  const { removeJob } = useAppStore()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')   // 'all' | 'done' | 'processing' | 'failed'
  const [uploading, setUploading] = useState(false)

  const ACCEPTED_TYPES = {
    'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
    'video/*': ['.mp4', '.webm', '.mov'],
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
  }

  // ─── Upload Handler ──────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles[0]) return
    const file = acceptedFiles[0]
    
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', 'auto')
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
      
      const res = await jobsAPI.upload(formData)
      const { jobId } = res.data
      
      // Add optimistic job to the list
      const newJob = { 
        _id: jobId, 
        title: file.name, 
        status: 'pending', 
        fileType: file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'document',
        createdAt: new Date().toISOString()
      }
      setJobs(prev => [newJob, ...prev])
      toast.success('Đã bắt đầu tải lên tài liệu mới')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải lên thất bại')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
    noClick: true,
  })

  // ─── Fetch all jobs ──────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await jobsAPI.getJobs({ limit: 100 })
      setJobs(res.data.jobs || [])
    } catch (err) {
      toast.error('Không thể tải tri thức cá nhân')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // ─── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    setJobs(prev => prev.filter(j => j._id !== id))
    removeJob(id)
  }

  // ─── Filter + Search ─────────────────────────────────────────────────────────
  const filtered = jobs.filter(j => {
    const matchFilter = filter === 'all' || j.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q
      || (j.title || '').toLowerCase().includes(q)
      || (j.originalFilename || '').toLowerCase().includes(q)
      || (j.summary?.keywords || []).some(k => k.toLowerCase().includes(q))
    return matchFilter && matchSearch
  })

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const totalKeywords = jobs.reduce((acc, j) => acc + (j.summary?.keywords?.length || 0), 0)
  const doneCount = jobs.filter(j => j.status === 'done').length

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="knowledge-page">

      {/* Header */}
      <div className="knowledge-header">
        <div className="knowledge-title-block">
          <h1>📚 Tri thức Cá nhân</h1>
          <div className="knowledge-stats">
            <span className="stat-chip">
              <Library size={13} /> {jobs.length} tài liệu
            </span>
            <span className="stat-chip">
              <CheckCircle2 size={13} /> {doneCount} đã xử lý
            </span>
            {totalKeywords > 0 && (
              <span className="stat-chip">
                <Hash size={13} /> {totalKeywords} từ khóa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="knowledge-controls">
        <div className="knowledge-search-wrap">
          <Search size={15} />
          <input
            id="knowledge-search-input"
            className="knowledge-search"
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, từ khóa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {[
            { key: 'all',        label: 'Tất cả' },
            { key: 'done',       label: '✅ Đã xong' },
            { key: 'processing', label: '⏳ Đang xử lý' },
            { key: 'failed',     label: '❌ Thất bại' },
          ].map(tab => (
            <button
              key={tab.key}
              id={`filter-tab-${tab.key}`}
              className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="upload-action" {...getRootProps()}>
          <input {...getInputProps()} />
          <button 
            className="knowledge-upload-btn" 
            onClick={open} 
            disabled={uploading}
            id="knowledge-upload-btn"
          >
            {uploading ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
            <span>Tải lên tài liệu</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="knowledge-grid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="knowledge-empty">
          <BookOpen size={56} />
          <h3>{search || filter !== 'all' ? 'Không tìm thấy tài liệu nào' : 'Chưa có tri thức nào'}</h3>
          <p>
            {search || filter !== 'all'
              ? 'Thử tìm với từ khóa khác hoặc thay đổi bộ lọc.'
              : 'Tải lên bài giảng hoặc tài liệu để bắt đầu xây dựng kho tri thức cá nhân của bạn.'}
          </p>
        </div>
      ) : (
        <div className="knowledge-grid">
          {filtered.map(job => (
            <KnowledgeCard
              key={job._id}
              job={job}
              onDelete={handleDelete}
              onClick={(id) => navigate(`/job/${id}`)}
            />
          ))}
        </div>
      )}

    </div>
  )
}
