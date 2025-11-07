'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface EditorQRCode {
  id: string;
  md5_id: string;
  name: string;
  img: string | null;
  elements: string | null;
  tags: string | null;
  display: number;
  cate_dn: string;
  user_id: number;
  createdAt: string;
  updatedAt: string;
}

interface QRCodeDropdownMenuProps {
  qrCode: EditorQRCode;
  isOpen: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onEdit: (qrCode: EditorQRCode) => void;
  onDelete: (qrCodeId: string, qrCodeName?: string) => void;
  onDisplayToggle: (qrCodeId: string, currentDisplay: number) => Promise<void>;
}

export default function QRCodeDropdownMenu({
  qrCode,
  isOpen,
  buttonRef,
  onEdit,
  onDelete,
  onDisplayToggle,
}: QRCodeDropdownMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 160; // w-40 = 160px
    const menuHeight = 160; // approximate height

    // Position menu to the right and slightly below button
    let left = buttonRect.right + 8; // 8px gap from button
    let top = buttonRect.top;

    // Check if menu would go off-screen to the right
    if (left + menuWidth > window.innerWidth) {
      left = buttonRect.left - menuWidth - 8; // Position to the left instead
    }

    // Check if menu would go off-screen at the bottom
    if (top + menuHeight > window.innerHeight) {
      top = Math.max(0, buttonRect.bottom - menuHeight);
    }

    setPosition({ top, left });
  }, [isOpen, buttonRef]);

  if (!isOpen || !position) return null;

  const menuContent = (
    <div
      className="fixed z-[9999] w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-0.5 dropdown-menu"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toggle Display Button */}
      <div className="px-2 py-1.5 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg
              className={`w-3 h-3 ${qrCode.display === 1 ? 'text-green-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-xs text-gray-700 dark:text-gray-300">Hiển thị</span>
          </div>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await onDisplayToggle(qrCode.id, qrCode.display);
            }}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              qrCode.display === 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                qrCode.display === 1 ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Edit Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(qrCode);
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <span>Sửa</span>
      </button>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(qrCode.id, qrCode.name);
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <span>Xóa</span>
      </button>
    </div>
  );

  return createPortal(menuContent, document.body);
}
