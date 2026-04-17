import { useState } from 'react'
import { Copy, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import './TranscriptView.css'

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function TranscriptView({ transcript }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript?.content || '')
      setCopied(true)
      toast.success('Đã copy nội dung')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể copy')
    }
  }

  if (!transcript?.content) {
    return <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Không có nội dung</p>
  }

  const hasSegments = transcript.segments?.length > 0

  return (
    <div className="transcript-view animate-fade-in">
      {/* Toolbar */}
      <div className="transcript-toolbar">
        <span className="transcript-wordcount">
          {transcript.wordCount?.toLocaleString()} từ
        </span>
        <div className="transcript-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleCopy} id="btn-copy-transcript">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Đã copy' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Segments view (nếu có timestamp) */}
      {hasSegments ? (
        <div className="segments-list">
          {transcript.segments.map((seg, i) => (
            <div key={i} className="segment-item">
              <span className="segment-time">
                <Clock size={11} />
                {formatTime(seg.start)}
              </span>
              <p className="segment-text">{seg.text}</p>
            </div>
          ))}
        </div>
      ) : (
        /* Full text view */
        <div className="transcript-text">
          {transcript.content}
        </div>
      )}
    </div>
  )
}
