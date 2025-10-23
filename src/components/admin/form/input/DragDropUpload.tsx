import React, { useState, useRef, useCallback } from 'react';

interface DragDropUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  previewUrl?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  label?: string;
  placeholder?: string;
  error?: string;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFileSelect,
  selectedFile,
  previewUrl,
  accept = "image/*",
  maxSize = 10,
  className = "",
  label,
  placeholder = "Kéo thả hình ảnh vào đây hoặc click để chọn",
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Chỉ chấp nhận file hình ảnh';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File không được vượt quá ${maxSize}MB`;
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          alert(validationError);
          return;
        }
        onFileSelect(file);
      }
    }
  }, [onFileSelect, maxSize]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          alert(validationError);
          return;
        }
        onFileSelect(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = selectedFile ? URL.createObjectURL(selectedFile) : previewUrl;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {!displayUrl ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-25 dark:hover:bg-blue-900/10'
            }
            ${error ? 'border-red-300 dark:border-red-600' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF, WebP (tối đa {maxSize}MB)
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Image Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ảnh hiện tại
            </label>
            <div className="relative">
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Xóa hình ảnh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Drag & Drop Zone for changing image */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-25 dark:hover:bg-blue-900/10'
              }
              ${error ? 'border-red-300 dark:border-red-600' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className="space-y-2">
              <div className="mx-auto w-8 h-8 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kéo thả hình ảnh mới vào đây hoặc click để chọn file
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WebP (tối đa {maxSize}MB)
                </p>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default DragDropUpload;