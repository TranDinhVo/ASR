import { useEffect, useRef, useState } from 'react'
import useAppStore from '../store/useAppStore'
import { chatAPI } from '../services/api'
import toast from 'react-hot-toast'
import AudioUploader from '../components/AudioUploader'
import JobResult from '../components/JobResult'
import ChatMessage from '../components/ChatMessage'
import './HomePage.css'

export default function HomePage() {
  const { user, triggerNewChat } = useAppStore()
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [chatTitle, setChatTitle] = useState('')
  const scrollRef = useRef(null)

  const handleJobStarted = (jobId) => {
    setMessages(prev => [...prev, { type: 'job', id: jobId }])
  }

  const handleTextSend = async (text) => {
    if (!text.trim()) return

    // Set dynamic header title from first message
    if (!chatTitle) setChatTitle(text.slice(0, 60))

    setMessages(prev => [...prev, { type: 'chat', role: 'user', content: text }])
    setIsThinking(true)

    try {
      const res = await chatAPI.sendMessage(text)
      const aiMsg = res.data.message || res.data.reply || ''
      setMessages(prev => [...prev, { type: 'chat', role: 'assistant', content: aiMsg }])
    } catch (err) {
      toast.error('Không thể kết nối tới trợ lý')
      console.error(err)
    } finally {
      setIsThinking(false)
    }
  }

  const handleDismiss = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear chat when sidebar "Cuộc trò chuyện mới" is clicked
  useEffect(() => {
    if (triggerNewChat > 0) {
      setMessages([])
      setChatTitle('')
    }
  }, [triggerNewChat])

  const isNewChat = messages.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>

      {/* ── EMPTY STATE ─────────────────────────────────────────────────────────── */}
      {isNewChat && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '180px',
        }}>
          {/* Suggestion chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            <button className="chip" onClick={() => handleTextSend('Tóm tắt bài giảng vừa xử lý')}>📝 Tóm tắt bài giảng</button>
            <button className="chip" onClick={() => handleTextSend('Giải thích các thuật ngữ chuyên ngành trong bài')}>🧪 Giải thích thuật ngữ</button>
            <button className="chip" onClick={() => handleTextSend('Đặt câu hỏi ôn tập từ nội dung bài học')}>📚 Ôn luyện kiến thức</button>
            <button className="chip" onClick={() => handleTextSend('Liệt kê các ý chính trong tài liệu')}>🎯 Trích xuất ý chính</button>
          </div>
        </div>
      )}

      {/* ── ACTIVE CHAT THREAD ──────────────────────────────────────────────────── */}
      {!isNewChat && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 0',
        }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
            <div className="chat-thread">
              {messages.map((m, idx) =>
                m.type === 'job' ? (
                  <JobResult key={m.id || idx} jobId={m.id} onDismiss={() => handleDismiss(m.id)} />
                ) : (
                  <ChatMessage key={idx} role={m.role} content={m.content} />
                )
              )}

              {isThinking && (
                <ChatMessage role="assistant">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </ChatMessage>
              )}

              <div ref={scrollRef} />
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER INPUT ────────────────────────────────────────────────────────── */}
      <div className="chat-footer-input">
        <div>
          <AudioUploader
            onJobStarted={handleJobStarted}
            onTextSend={handleTextSend}
          />
          <p className="footer-disclaimer">
            AI có thể đưa ra câu trả lời không chính xác, hãy kiểm tra lại các thông tin quan trọng.
          </p>
        </div>
      </div>
    </div>
  )
}
