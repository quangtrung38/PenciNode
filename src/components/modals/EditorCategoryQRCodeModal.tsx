"use client";

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';

interface Category {
  id?: string;
  name: string;
  display?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (action: 'create' | 'update', data: any) => void;
  editing?: Category | null;
}

export default function EditorCategoryQRCodeModal({ isOpen, onClose, onSuccess, editing }: Props) {
  const [form, setForm] = useState<Category>({ name: '', display: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editing) {
        setForm({ name: editing.name || '', display: editing.display ?? 1 });
      } else {
        setForm({ name: '', display: 1 });
      }
      setError(null);
    }
  }, [isOpen, editing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'display' ? Number(value) : value }));
  };

  const handleToggleDisplay = () => {
    setForm(prev => ({ ...prev, display: prev.display === 1 ? 0 : 1 }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!form.name || !form.name.trim()) {
      setError('Tên danh mục là bắt buộc');
      return;
    }

    setIsLoading(true);
    try {
      const url = editing ? `/api/admin/editor-category-qrcode/${editing.id}` : '/api/admin/editor-category-qrcode';
      const method = editing ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), display: form.display ?? 1 }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Có lỗi khi lưu danh mục');
      }

      onSuccess(editing ? 'update' : 'create', data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black opacity-60" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">{editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</Dialog.Title>
            <button onClick={handleClose} disabled={isLoading} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 border border-red-100">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên danh mục <span className="text-red-500">*</span></label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                  placeholder="Nhập tên danh mục"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hiển thị</label>
                <button
                  type="button"
                  onClick={handleToggleDisplay}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    form.display === 1 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.display === 1 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-600">
                  {form.display === 1 ? 'Đang hiển thị' : 'Đang ẩn'}
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 border rounded-md bg-white">
                  Hủy
                </button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  {isLoading ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo danh mục')}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
