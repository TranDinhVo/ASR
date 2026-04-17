import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Trash2, Search, FileAudio, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { jobsAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './HistoryPage.css'

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatBytes = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const StatusBadge = ({ status }) => {
  const labels = { pending: 'Chờ', processing: 'Đang xử lý', done: 'Xong', failed: 'Lỗi' }
  return <span className={`badge badge-${status}`}>{labels[status]}</span>
}

export default function HistoryPage() {
  const { jobs, totalJobs, setJobs, removeJob } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState(null)
  const LIMIT = 10

  const fetchJobs = async (p = 1, q = '') => {
    try {
      setLoading(true)
      const res = await jobsAPI.getJobs({ page: p, limit: LIMIT, search: q })
      setJobs(res.data.jobs, res.data.total, p)
      setTotalPages(res.data.totalPages)
    } catch {
      toast.error('Không thể tải lịch sử')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs(1, '') }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchJobs(1, search)
  }

  const handleDelete = async (jobId, e) => {
    e.preventDefault()
    if (!window.confirm('Bạn có chắc muốn xóa job này?')) return
    try {
      setDeleting(jobId)
      await jobsAPI.deleteJob(jobId)
      removeJob(jobId)
      toast.success('Đã xóa')
    } catch {
      toast.error('Xóa thất bại')
    } finally {
      setDeleting(null)
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchJobs(newPage, search)
  }

  return (
    <div className="container">
      <div className="history-page page-content">
        {/* Header */}
        <div className="history-header animate-fade-in">
          <div>
            <h1 className="history-title">
              <History size={24} />
              Lịch sử xử lý
            </h1>
            <p className="history-subtitle">Tổng cộng {totalJobs} file đã xử lý</p>
          </div>

          {/* Search */}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="input-search"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" id="btn-search">Tìm</button>
          </form>
        </div>

        {/* List */}
        <div className="history-list animate-fade-in">
          {loading ? (
            <div className="history-loading">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <p>Đang tải...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <FileAudio size={48} />
              <h3>Chưa có file nào</h3>
              <p>Tải lên file âm thanh đầu tiên của bạn</p>
              <Link to="/" className="btn btn-primary">Bắt đầu ngay</Link>
            </div>
          ) : (
            jobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="job-card animate-fade-in"
                id={`job-card-${job._id}`}
              >
                <div className="job-card-icon">
                  <FileAudio size={22} />
                </div>

                <div className="job-card-info">
                  <div className="job-card-top">
                    <h3 className="job-card-title">{job.title}</h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="job-card-meta">
                    {job.originalFilename} · {formatBytes(job.fileSize)} · {formatDate(job.createdAt)}
                  </p>
                  {job.status === 'done' && job.transcript?.wordCount > 0 && (
                    <p className="job-card-words">{job.transcript.wordCount.toLocaleString()} từ</p>
                  )}
                </div>

                <div className="job-card-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => handleDelete(job._id, e)}
                    disabled={deleting === job._id}
                    id={`btn-delete-${job._id}`}
                  >
                    {deleting === job._id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination animate-fade-in">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >← Trước</button>
            <span className="pagination-info">Trang {page} / {totalPages}</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >Sau →</button>
          </div>
        )}
      </div>
    </div>
  )
}
