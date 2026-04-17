import { motion } from 'framer-motion'
import { User, Bot } from 'lucide-react'
import './ChatMessage.css'

export default function ChatMessage({ type, children, avatar }) {
  const isAi = type === 'ai'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`chat-message-container ${isAi ? 'ai-msg' : 'user-msg'}`}
    >
      <div className="chat-avatar">
        {isAi ? (
          <div className="avatar-ai"><Bot size={18} /></div>
        ) : (
          <div className="avatar-user"><User size={18} /></div>
        )}
      </div>
      <div className="chat-bubble-wrapper">
        <div className="chat-bubble">
          {children}
        </div>
      </div>
    </motion.div>
  )
}
