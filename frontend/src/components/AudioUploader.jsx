import { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, FileAudio, FileText, Video, Loader2, Mic, Plus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { jobsAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './AudioUploader.css'

const ACCEPTED_TYPES = {
  'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
  'video/*': ['.mp4', '.webm', '.mov'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
}

export default function AudioUploader({ onJobStarted, onTextSend }) {
  const { setCurrentJob, setUploadProgress, uploadProgress, addRecentJob } = useAppStore()
  const [selectedFile, setSelectedFile] = useState(null)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Định dạng file không hỗ trợ hoặc file quá lớn')
      return
    }
    if (acceptedFiles[0]) setSelectedFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 100 * 1024 * 1024,
    multiple: false,
    noClick: true,
  })

  const handleAction = () => {
    if (selectedFile) {
      handleFileUpload()
    } else if (text.trim()) {
      onTextSend?.(text)
      setText('')
    }
  }

  const handleFileUpload = async () => {
    if (uploading) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('language', 'auto')
      formData.append('title', selectedFile.name.replace(/\.[^/.]+$/, ''))

      const res = await jobsAPI.upload(formData, setUploadProgress)
      const { jobId } = res.data

      const newJob = { _id: jobId, status: 'pending', progress: 0, title: selectedFile.name }
      setCurrentJob(newJob)
      addRecentJob(newJob)
      setSelectedFile(null)
      toast.success('Đã tải lên bài giảng để phân tích!')
      onJobStarted?.(jobId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải lên thất bại')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data)
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mpeg' })
        const file = new File([audioBlob], `ghi-am-${Date.now()}.mp3`, { type: 'audio/mpeg' })
        setSelectedFile(file)
      }
      mediaRecorder.current.start()
      setIsRecording(true)
    } catch {
      toast.error('Không thể truy cập Microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('audio/')) return <FileAudio size={14} />
    if (file.type.startsWith('video/')) return <Video size={14} />
    return <FileText size={14} />
  }

  return (
    <div className="gemini-input-box" {...getRootProps()} data-drag={isDragActive}>
      <input {...getInputProps()} />

      {/* File preview */}
      {selectedFile && (
        <div className="gemini-file-chip">
          {getFileIcon(selectedFile)}
          <span>{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)}><X size={12} /></button>
          {uploading && <Loader2 size={12} className="animate-spin" />}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="gemini-progress">
          <div className="gemini-progress-fill" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* Top row: placeholder text */}
      <div className="gemini-input-top">
        <input
          type="text"
          className="gemini-text-input"
          placeholder={
            isRecording
              ? 'Đang ghi âm bài giảng...'
              : selectedFile
              ? 'Thêm ghi chú về file này...'
              : 'Hỏi trợ lý bài giảng của bạn...'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAction()}
          disabled={uploading}
        />
      </div>

      {/* Bottom row: actions */}
      <div className="gemini-input-bottom">
        <div className="gemini-input-left-actions">
          <button className="gemini-icon-btn" onClick={open} title="Tải lên bài giảng / tài liệu">
            <Plus size={20} />
          </button>
          <button className="gemini-tool-btn" onClick={open}>
            <RefreshCw size={15} />
            <span>Bài giảng</span>
          </button>
        </div>

        <div className="gemini-input-right-actions">
          <div className="gemini-model-selector" onClick={() => setModelOpen(!modelOpen)}>
            <span>Nhanh</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
          <button
            className={`gemini-mic-btn ${isRecording ? 'active' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Dừng ghi âm' : 'Ghi âm bài giảng'}
          >
            <Mic size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}