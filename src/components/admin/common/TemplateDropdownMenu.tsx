'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface EditorTemplate {
  id: string;
  name: string;
  slug: string;
  img: string | null;
  display: number;
  is_favorite: 'Y' | 'N';
  cate_dn: string | null;
  collection_id: string | null;
  views: number;
  img_download_count: number;
  pdf_download_count: number;
  use_count: number;
  homePenci: number;
  is_confirm: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  template: EditorTemplate;
  isOpen: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onEdit: (template: EditorTemplate) => void;
  onDelete: (id: string, name?: string) => void;
  onDisplayToggle: (id: string, currentDisplay: number) => void;
  onFavoriteToggle: (id: string, currentFavorite: 'Y' | 'N') => void;
}

export default function TemplateDropdownMenu({
  template,
  isOpen,
  buttonRef,
  onEdit,
  onDelete,
  onDisplayToggle,
  onFavoriteToggle,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuElement = menuRef.current;

      // Position dropdown relative to button
      menuElement.style.position = 'fixed';
      menuElement.style.top = `${buttonRect.bottom + 4}px`;
      menuElement.style.left = `${buttonRect.left - 160}px`; // Align to right edge of button
    }
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  const menuContent = (
    <div
      ref={menuRef}
      className="dropdown-menu w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
    >
      <button
        onClick={() => onEdit(template)}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Chỉnh sửa
      </button>

      <button
        onClick={() => onDisplayToggle(template.id, template.display)}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        {template.display === 1 ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Ẩn template
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Hiển thị template
          </>
        )}
      </button>

      <button
        onClick={() => onFavoriteToggle(template.id, template.is_favorite)}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        {template.is_favorite === 'Y' ? (
          <>
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Bỏ yêu thích
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Đánh dấu yêu thích
          </>
        )}
      </button>

      <hr className="my-1 border-gray-200 dark:border-gray-700" />

      <button
        onClick={() => onDelete(template.id, template.name)}
        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Xóa
      </button>
    </div>
  );

  return createPortal(menuContent, document.body);
}
