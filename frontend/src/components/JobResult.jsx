import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2, XCircle, Clock, Zap } from 'lucide-react'
import { jobsAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import TranscriptView from './TranscriptView'
import SummaryCard from './SummaryCard'
import ChatMessage from './ChatMessage'
import './JobResult.css'

const STATUS_LABELS = {
  pending: 'Đang chờ...',
  processing: 'Đang xử lý...',
  done: 'Hoàn thành',
  failed: 'Thất bại',
}

const STATUS_ICONS = {
  pending: <Clock size={18} className="animate-pulse" />,
  processing: <Loader2 size={18} className="animate-spin" />,
  done: <CheckCircle size={18} />,
  failed: <XCircle size={18} />,
}

export default function JobResult({ jobId, onDismiss }) {
  const { updateRecentJob } = useAppStore()
  const [activeTab, setActiveTab] = useState('transcript')
  const [job, setJob] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const res = await jobsAPI.getJob(jobId)
        const updatedJob = res.data.job
        setJob(updatedJob)
        updateRecentJob(jobId, updatedJob)

        if (updatedJob.status === 'done' || updatedJob.status === 'failed') {
          clearInterval(pollRef.current)
        }
      } catch (err) {
        console.error('Poll error:', err)
        clearInterval(pollRef.current)
      }
    }

    poll() // immediate
    pollRef.current = setInterval(poll, 3000) // every 3s

    return () => clearInterval(pollRef.current)
  }, [jobId])

  if (!jobId) return null
  if (!job) return (
    <div className="job-result glass-card animate-fade-in">
      <div className="job-result-loading" style={{ gap: 24 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 8, fontWeight: 500 }}>Đang tải...</p>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => onDismiss?.(jobId)}
            style={{ fontSize: 12, opacity: 0.7 }}
            id="btn-cancel-loading"
          >
            Hủy và quay lại
          </button>
        </div>
      </div>
    </div>
  )

  const isProcessing = job.status === 'pending' || job.status === 'processing'
  const isDone = job.status === 'done'
  const isFailed = job.status === 'failed'

  return (
    <div className="job-thread-segment" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 8 }}>
      {/* User Message: The File */}
      <ChatMessage type="user">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={18} style={{ opacity: 0.8 }} />
          <div>
            <p style={{ fontWeight: 600, margin: 0, fontSize: 15 }}>{job.title}</p>
            <p style={{ fontSize: 11, opacity: 0.8, margin: 0 }}>{job.originalFilename}</p>
          </div>
        </div>
      </ChatMessage>

      {/* AI Message: The Processing & Result */}
      <ChatMessage type="ai">
        <div className={`ai-response-content ${isFailed ? 'has-error' : ''}`} style={{ minWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
             <div className={`badge badge-${job.status}`}>
                {STATUS_ICONS[job.status]}
                <span style={{ marginLeft: 6 }}>{STATUS_LABELS[job.status]}</span>
             </div>
             <button className="btn btn-ghost btn-sm dismiss-btn" onClick={() => onDismiss?.(jobId)} style={{ padding: 2, height: 'auto' }}>
               <XCircle size={14} />
             </button>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="job-progress animate-fade-in" style={{ padding: 0, border: 'none', background: 'transparent', margin: 0 }}>
              <div className="job-progress-header" style={{ marginBottom: 8 }}>
                <span className="job-progress-step" style={{ fontSize: 13 }}>
                  {job.status === 'pending' ? 'Đang chuẩn bị...' : 'Đang xử lý âm thanh...'}
                </span>
                <span style={{ fontSize: 13 }}>{job.progress}%</span>
              </div>
              <div className="progress-bar-track" style={{ height: 6 }}>
                <div className="progress-bar-fill" style={{ width: `${Math.max(job.progress, 5)}%` }} />
              </div>
            </div>
          )}

          {/* Error */}
          {isFailed && (
            <div className="job-error-friendly animate-fade-in">
              <div className="error-title">
                <XCircle size={16} />
                <span>Không thể xử lý âm thanh</span>
              </div>
              <p className="error-msg">
                Đã có lỗi xảy ra khi kết nối tới máy chủ AI. Vui lòng kiểm tra lại file hoặc thử lại sau giây lát.
              </p>
              {/* Optional: raw error in small text if needed for dev, but hidden for user-friendly feel */}
              {/* <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{job.errorMessage}</div> */}
            </div>
          )}

          {/* Results */}
          {isDone && (
            <div className="job-result-content animate-fade-in chat-result-tabs">
              <div className="tabs" style={{ marginBottom: 16, gap: 8 }}>
                <button className={`tab-btn tab-btn-sm ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')} style={{ fontSize: 12, padding: '4px 10px' }}>Nội dung</button>
                <button className={`tab-btn tab-btn-sm ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')} style={{ fontSize: 12, padding: '4px 10px' }}>Tóm tắt</button>
                <button className={`tab-btn tab-btn-sm ${activeTab === 'keywords' ? 'active' : ''}`} onClick={() => setActiveTab('keywords')} style={{ fontSize: 12, padding: '4px 10px' }}>Từ khóa</button>
              </div>

              <div className="compact-result-view" style={{ fontSize: 14 }}>
                {activeTab === 'transcript' && <TranscriptView transcript={job.transcript} />}
                {activeTab === 'summary' && <SummaryCard summary={job.summary} />}
                {activeTab === 'keywords' && (
                  <div className="keywords-grid">
                    {job.summary?.keywords?.map((kw, i) => (
                      <span key={i} className="keyword-chip" style={{ fontSize: 11 }}>{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ChatMessage>
    </div>
  )
}
