import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2, XCircle, Clock, FileAudio, FileText, Mic, ChevronDown, ChevronUp } from 'lucide-react'
import { jobsAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './JobResult.css'

export default function JobResult({ jobId, onDismiss }) {
  const { updateRecentJob } = useAppStore()
  const [job, setJob] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [showRaw, setShowRaw] = useState(false)
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
    poll()
    pollRef.current = setInterval(poll, 3000)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  if (!jobId) return null
  if (!job) return (
    <div className="job-result-loading">
      <Loader2 size={20} className="animate-spin" style={{ color: '#1a73e8' }} />
      <span>Đang kết nối...</span>
      <button onClick={() => onDismiss?.(jobId)} className="cancel-link">Hủy</button>
    </div>
  )

  const isProcessing = job.status === 'pending' || job.status === 'processing'
  const isDone = job.status === 'done'
  const isFailed = job.status === 'failed'

  // Data from pipeline or compatibility fields
  const stage1 = job.pipeline?.stage1_raw || job.transcript?.content
  const stage2 = job.pipeline?.stage2_clean || job.transcript?.content
  const stage3 = job.pipeline?.stage3_summary || job.summary?.content
  const keyPoints = job.summary?.keyPoints || []
  const keywords = job.summary?.keywords || []

  const PROGRESS_STAGES = [
    { max: 33,  label: 'Model 1 (Whisper) — Chuyển giọng nói → văn bản thô...' },
    { max: 66,  label: 'Model 2 (ViT5-Correct) — Hiệu đính & chuẩn hóa...' },
    { max: 99,  label: 'Model 3 (ViT5-Summarize) — Đúc kết tri thức...' },
    { max: 100, label: 'Hoàn tất! Nạp vào Kho tri thức cá nhân...' },
  ]
  const progressLabel = PROGRESS_STAGES.find(s => job.progress <= s.max)?.label || PROGRESS_STAGES[3].label

  return (
    <div className="job-result-wrapper">
      {/* User message: file uploaded */}
      <div className="user-row">
        <div className="user-pill file-pill">
          {job.fileType === 'audio' ? <FileAudio size={14} /> : <FileText size={14} />}
          <span>{job.title || job.originalFilename}</span>
        </div>
      </div>

      {/* AI response: processing result */}
      <div className="ai-row" style={{ marginTop: 24 }}>
        <div className="ai-icon-container">
          {isProcessing
            ? <Loader2 size={20} className="animate-spin" style={{ color: '#1a73e8' }} />
            : isDone
            ? <CheckCircle size={20} style={{ color: '#1e8e3e' }} />
            : <XCircle size={20} style={{ color: '#d93025' }} />
          }
        </div>

        <div className="ai-body">
          {/* Processing state */}
          {isProcessing && (
            <div className="pipeline-progress">
              <p className="pipeline-stage-label">{progressLabel}</p>
              <div className="pipeline-bar-track">
                <div className="pipeline-bar-fill" style={{ width: `${Math.max(job.progress, 4)}%` }} />
              </div>
              <div className="pipeline-steps">
                <span className={job.progress >= 1  ? 'done' : ''}>① Nhận diện</span>
                <span className={job.progress >= 34 ? 'done' : ''}>② Hiệu đính</span>
                <span className={job.progress >= 67 ? 'done' : ''}>③ Tóm tắt</span>
                <span className={job.progress >= 99 ? 'done' : ''}>④ Nạp RAG</span>
              </div>
            </div>
          )}

          {/* Failed state */}
          {isFailed && (
            <div className="pipeline-error">
              <strong>Không thể xử lý bài giảng.</strong>
              <p>Vui lòng kiểm tra lại định dạng file hoặc thử lại sau.</p>
            </div>
          )}

          {/* Done state */}
          {isDone && (
            <div className="pipeline-result">
              {/* Tabs */}
              <div className="result-tabs">
                <button className={activeTab === 'summary'    ? 'active' : ''} onClick={() => setActiveTab('summary')}>Tóm tắt bài học</button>
                <button className={activeTab === 'keypoints'  ? 'active' : ''} onClick={() => setActiveTab('keypoints')}>Ý chính</button>
                <button className={activeTab === 'keywords'   ? 'active' : ''} onClick={() => setActiveTab('keywords')}>Từ khóa</button>
                <button className={activeTab === 'transcript' ? 'active' : ''} onClick={() => setActiveTab('transcript')}>Nội dung đã hiệu đính</button>
              </div>

              <div className="result-body">
                {/* Summary */}
                {activeTab === 'summary' && (
                  <div className="result-text">{stage3 || 'Chưa có bản tóm tắt.'}</div>
                )}

                {/* Key points */}
                {activeTab === 'keypoints' && (
                  <ul className="key-points-list">
                    {keyPoints.length > 0
                      ? keyPoints.map((kp, i) => <li key={i}>{kp}</li>)
                      : <li style={{ opacity: 0.6 }}>Chưa có ý chính nào.</li>
                    }
                  </ul>
                )}

                {/* Keywords */}
                {activeTab === 'keywords' && (
                  <div className="keywords-wrap">
                    {keywords.length > 0
                      ? keywords.map((kw, i) => <span key={i} className="kw-chip">#{kw}</span>)
                      : <span style={{ opacity: 0.6 }}>Chưa có từ khóa.</span>
                    }
                  </div>
                )}

                {/* Clean transcript */}
                {activeTab === 'transcript' && (
                  <div>
                    <div className="result-text">{stage2 || 'Chưa có nội dung.'}</div>
                    {stage1 && (
                      <div style={{ marginTop: 16 }}>
                        <button className="toggle-raw-btn" onClick={() => setShowRaw(!showRaw)}>
                          {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {showRaw ? 'Ẩn văn bản thô (Whisper)' : 'Xem văn bản thô (Whisper)'}
                        </button>
                        {showRaw && <div className="raw-text">{stage1}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
