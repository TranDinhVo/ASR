import { Copy, Check, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import './SummaryCard.css'

export default function SummaryCard({ summary }) {
  const [copiedSummary, setCopiedSummary] = useState(false)

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'summary') setCopiedSummary(true)
      toast.success('Đã copy')
      setTimeout(() => {
        if (type === 'summary') setCopiedSummary(false)
      }, 2000)
    } catch {
      toast.error('Không thể copy')
    }
  }

  if (!summary?.content && !summary?.keyPoints?.length) {
    return <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Không có tóm tắt</p>
  }

  return (
    <div className="summary-card animate-fade-in">
      {/* Paragraph summary */}
      {summary.content && (
        <div className="summary-section">
          <div className="summary-section-header">
            <h3>Tóm tắt</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleCopy(summary.content, 'summary')}
              id="btn-copy-summary"
            >
              {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
              {copiedSummary ? 'Đã copy' : 'Copy'}
            </button>
          </div>
          <div className="summary-text">{summary.content}</div>
        </div>
      )}

      {/* Key points */}
      {summary.keyPoints?.length > 0 && (
        <div className="summary-section">
          <div className="summary-section-header">
            <h3>Ý chính</h3>
          </div>
          <ul className="key-points-list">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="key-point-item">
                <div className="key-point-icon">
                  <CheckCircle2 size={15} />
                </div>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
