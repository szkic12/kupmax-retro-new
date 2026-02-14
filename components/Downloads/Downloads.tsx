'use client';

import { useState, useEffect } from 'react';
import { useDownloads } from '../../hooks/useDownloads';

export default function Downloads() {
  const { files, loading, error, fetchFiles, uploadFile, downloadFile, stats } = useDownloads();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await (uploadFile as any)(
      selectedFile,
      description,
      category,
      (progress: number) => setUploadProgress(progress)
    );

    if (result.success) {
      alert('✅ File uploaded successfully!');
      setSelectedFile(null);
      setDescription('');
      setCategory('');
      setUploadProgress(0);
      setShowUpload(false);
      fetchFiles(); // Refresh list
    } else {
      alert(`❌ Upload failed: ${result.error}`);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    // downloadFile automatically opens URL in new tab
    const result = await downloadFile(fileId);
    if (!result.success) {
      alert(`❌ Download failed: ${result.error}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && files.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin text-4xl">💿</div>
        <p className="mt-2 text-gray-600">Loading files...</p>
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={() => fetchFiles()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Upload button */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold">📦 Available Downloads ({stats.totalFiles || files.length})</h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 font-bold text-white rounded transition-all hover:scale-105"
          style={{
            background: showUpload ? '#cc0000' : 'linear-gradient(180deg, #009900 0%, #006600 100%)',
            border: '2px outset #00cc00',
          }}
        >
          {showUpload ? '❌ Cancel' : '⬆️ Upload File'}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div
          className="mb-6 p-4 rounded"
          style={{
            background: '#fffff0',
            border: '3px ridge #ffcc00',
          }}
        >
          <h4 className="font-bold mb-3 text-blue-800">📤 Upload New File</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">Select File:</label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 rounded"
                style={{
                  background: '#ffffff',
                  border: '2px inset #808080',
                }}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Description (optional):</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the file..."
                className="w-full px-3 py-2 rounded"
                style={{
                  background: '#ffffff',
                  border: '2px inset #808080',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Category (optional):</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded"
                style={{
                  background: '#ffffff',
                  border: '2px inset #808080',
                }}
              >
                <option value="">-- Select Category --</option>
                <option value="Audio">🎵 Audio</option>
                <option value="Video">🎬 Video</option>
                <option value="Utilities">🔧 Utilities</option>
                <option value="Games">🎮 Games</option>
                <option value="Graphics">🎨 Graphics</option>
                <option value="Internet">🌐 Internet Tools</option>
                <option value="Development">💻 Development</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>

            {uploadProgress > 0 && (
              <div>
                <div
                  className="h-6 rounded overflow-hidden"
                  style={{
                    background: '#ffffff',
                    border: '2px inset #808080',
                  }}
                >
                  <div
                    className="h-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(180deg, #0000ff 0%, #000099 100%)',
                    }}
                  >
                    {uploadProgress >= 10 && `${Math.floor(uploadProgress)}%`}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1 text-center">
                  {uploadProgress < 100 ? 'Uploading...' : '✅ Upload complete!'}
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadProgress > 0}
              className="w-full py-2 font-bold text-white rounded transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(180deg, #009900 0%, #006600 100%)',
                border: '2px outset #00cc00',
              }}
            >
              {uploadProgress > 0 ? '⏳ Uploading...' : '⬆️ Upload File'}
            </button>
          </div>
        </div>
      )}

      {/* Files list */}
      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📂</p>
          <p>No files uploaded yet. Be the first to upload!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file: any) => (
            <div
              key={file.id}
              className="p-3 rounded flex items-center justify-between hover:shadow-lg transition-all"
              style={{
                background: '#f9f9f9',
                border: '2px solid #ccc',
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {file.category === 'Audio' && '🎵'}
                    {file.category === 'Video' && '🎬'}
                    {file.category === 'Utilities' && '🔧'}
                    {file.category === 'Games' && '🎮'}
                    {file.category === 'Graphics' && '🎨'}
                    {file.category === 'Internet' && '🌐'}
                    {file.category === 'Development' && '💻'}
                    {(!file.category || file.category === 'Other') && '📦'}
                  </span>
                  <div>
                    <h4 className="font-bold text-blue-800">{file.name}</h4>
                    {file.description && (
                      <p className="text-sm text-gray-600">{file.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>📁 {formatFileSize(file.size)}</span>
                  {file.downloadCount > 0 && <span>⬇️ {file.downloadCount} downloads</span>}
                  <span>📅 {formatDate(file.uploadedAt)}</span>
                  {file.category && <span>🏷️ {file.category}</span>}
                </div>
              </div>

              <button
                onClick={() => handleDownload(file.id, file.name)}
                className="ml-4 px-4 py-2 font-bold text-white rounded transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(180deg, #009900 0%, #006600 100%)',
                  border: '2px outset #00cc00',
                }}
              >
                ⬇️ Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
