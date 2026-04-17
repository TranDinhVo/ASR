import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileAudio, Loader2, Paperclip, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { jobsAPI } from '../services/api'
import useAppStore from '../store/useAppStore'
import './AudioUploader.css'

const ACCEPTED_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/mp4': ['.m4a', '.mp4'],
  'audio/ogg': ['.ogg'],
  'audio/flac': ['.flac'],
  'audio/webm': ['.webm'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AudioUploader({ onJobStarted }) {
  const { setCurrentJob, setUploadProgress, uploadProgress, addRecentJob } = useAppStore()
  const [selectedFile, setSelectedFile] = useState(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Định dạng file không hỗ trợ hoặc file quá lớn (tối đa 100MB)')
      return
    }
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0])
      setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 100 * 1024 * 1024,
    multiple: false,
    noClick: true, // We will use a custom button to trigger open
  })

  const handleUpload = async (e) => {
    e?.preventDefault()
    if (!selectedFile || uploading) return

    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('language', 'auto')
      formData.append('title', title || selectedFile.name)

      const res = await jobsAPI.upload(formData, setUploadProgress)
      const { jobId } = res.data

      const newJob = { _id: jobId, status: 'pending', progress: 0, title: title || selectedFile.name }
      setCurrentJob(newJob)
      addRecentJob(newJob)
      
      setSelectedFile(null)
      setTitle('')
      toast.success('Đã tải lên thành công!')
      onJobStarted?.(jobId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tải lên thất bại')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeFile = (e) => {
    e.stopPropagation()
    setSelectedFile(null)
    setTitle('')
  }

  return (
    <div className="chat-input-wrapper">
      <div 
        {...getRootProps()} 
        className={`chat-input-bar ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />

        {/* Attachment Button */}
        <button 
          type="button" 
          className="attach-btn" 
          onClick={open}
          disabled={uploading}
          title="Đính kèm file âm thanh"
        >
          <Paperclip size={20} />
        </button>

        {/* Selected File Area */}
        <div className="input-content">
          {selectedFile ? (
            <div className="file-chip animate-fade-in">
              <FileAudio size={14} />
              <span className="file-chip-name">{selectedFile.name}</span>
              <button className="file-chip-remove" onClick={removeFile}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <p className="placeholder-text" onClick={open}>
              {isDragActive ? 'Thả file vào đây...' : 'Chọn hoặc kéo thả audio...'}
            </p>
          )}
        </div>

        {/* Upload/Send Button */}
        <button 
          className={`send-btn ${selectedFile && !uploading ? 'active' : ''}`}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          title="Bắt đầu xử lý"
        >
          {uploading ? (
            <div className="circular-progress">
              <span className="progress-value">{uploadProgress}%</span>
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      
      {/* Small progress bar hint for better visibility during upload */}
      {uploading && (
        <div className="mini-upload-track">
          <div className="mini-upload-fill" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
    </div>
  )
}
