import { useState, useRef } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      handleFileSelection(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      handleFileSelection(file)
    }
  }

  const handleFileSelection = (file: File) => {
    // Validate file type
    const validExtensions = ['.jtl', '.csv', '.log', '.json']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Please upload: ${validExtensions.join(', ')}`)
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    if (file.size > maxSize) {
      alert('File size exceeds 100MB limit')
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="file-upload-container">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jtl,.csv,.log,.json"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {selectedFile ? (
          <div className="file-selected">
            <div className="file-icon" style={{color: '#3b82f6'}}>■</div>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
            <div className="file-status" style={{color: '#22c55e'}}>Ready to upload</div>
          </div>
        ) : (
          <div className="drop-zone-content">
            <div className="upload-icon" style={{color: '#8b5cf6', fontSize: '3rem'}}>◆</div>
            <h3>Drag & Drop your test results</h3>
            <p>or click to browse</p>
            <div className="supported-formats">
              <span>Supported: JTL, CSV, LOG, JSON</span>
            </div>
          </div>
        )}
      </div>

      {selectedFile && (
        <button 
          className="change-file-btn"
          onClick={handleButtonClick}
        >
          Change File
        </button>
      )}
    </div>
  )
}

export default FileUpload
