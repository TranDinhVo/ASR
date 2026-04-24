import { motion } from 'framer-motion'
import { Diamond, ThumbsUp, ThumbsDown, RefreshCw, Copy, MoreVertical } from 'lucide-react'
import './ChatMessage.css'

export default function ChatMessage({ role, content, children, type }) {
  const isAi = (type === 'ai' || role === 'assistant')
  const text = content || children

  if (!isAi) {
    // User: pill aligned to the RIGHT
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="user-row"
      >
        <div className="user-pill">{text}</div>
      </motion.div>
    )
  }

  // AI: diamond icon + plain text on the left
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="ai-row"
    >
      <div className="ai-icon-container">
        <Diamond size={22} fill="#1557CC" color="#1557CC" />
      </div>

      <div className="ai-body">
        <div className="ai-text">{text}</div>
        <div className="ai-actions-bar">
          <button className="icon-btn-sm"><ThumbsUp size={16} /></button>
          <button className="icon-btn-sm"><ThumbsDown size={16} /></button>
          <button className="icon-btn-sm"><RefreshCw size={16} /></button>
          <button className="icon-btn-sm"><Copy size={16} /></button>
          <button className="icon-btn-sm"><MoreVertical size={16} /></button>
        </div>
      </div>
    </motion.div>
  )
}
