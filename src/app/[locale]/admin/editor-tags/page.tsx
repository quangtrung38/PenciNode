'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EditorTagModal from '@/components/modals/EditorTagModal';

// SVG Icons
const EditorTagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// EditorTag interface
interface EditorTag {
  id: string;
  name: string;
  slug: string;
  display: number;
  display_cate: number;
  position: number;
  is_cate: boolean;
  img: string | null;
  createdAt: string;
  updatedAt: string;
}

// Sortable Tag Item Component
function SortableTagItem({ tag, onEdit, onDelete, onToggleDisplay, openDropdown, setOpenDropdown, formatDate }: {
  tag: EditorTag;
  onEdit: (tag: EditorTag) => void;
  onDelete: (id: string, name: string) => void;
  onToggleDisplay: (tag: EditorTag) => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  formatDate: (dateString: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Kéo để sắp xếp"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        {/* Image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          {tag.img ? (
            <img src={tag.img} alt={tag.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <EditorTagIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        {/* Tag Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{tag.name}</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Slug: {tag.slug}</div>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Vị trí: {tag.position}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tag.display === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}`}>{tag.display === 1 ? 'Hiển thị' : 'Ẩn'}</span>
            <span>{formatDate(tag.createdAt)}</span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle Display Switch */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDisplay(tag);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${tag.display === 1 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title={tag.display === 1 ? 'Ẩn danh mục' : 'Hiển thị danh mục'}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tag.display === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          {/* Dropdown Menu Button */}
          <div className="relative dropdown-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === tag.id ? null : tag.id);
              }}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
              title="Menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {openDropdown === tag.id && (
              <div className="absolute top-10 right-0 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 dropdown-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(tag);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(tag.id, tag.name);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorTagsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterDisplay, setFilterDisplay] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<EditorTag | null>(null);

  // REST API state
  const [editorTags, setEditorTags] = useState<EditorTag[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DnD sensors - must be called at the top level, not conditionally
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilterChange = (setter: (v: any) => void) => (e: any) => {
    setter(e.target.value);
    setPage(1);
  };

  // Fetch editor tags from REST API
  const fetchEditorTags = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsTableLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        display: filterDisplay,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/editor-tags?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setEditorTags(data.editorTags || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch editor tags');
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsTableLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchEditorTags(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch editor tags when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchEditorTags(false);
    }
  }, [searchTerm, filterDisplay, page]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Modal handlers
  const handleAddTag = () => {
    setEditingTag(null);
    setIsModalOpen(true);
  };

  const handleEditTag = (tag: EditorTag) => {
    setEditingTag(tag);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTag(null);
  };

  const handleModalSuccess = () => {
    fetchEditorTags(false);
  };

  // Delete tag with confirmation
  const deleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${tagName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/editor-tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      setEditorTags((prevTags) =>
        prevTags.filter((tag) => tag.id !== tagId),
      );

      setTotalCount((prev) => prev - 1);

      alert('Xóa danh mục thành công');
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Có lỗi xảy ra khi xóa danh mục');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-96"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <EditorTagIcon className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Đã xảy ra lỗi'}</p>
          <button
            onClick={() => fetchEditorTags()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Quản lý danh mục Graphics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý tất cả danh mục graphics trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <EditorTagIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số danh mục</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddTag}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Tạo danh mục mới
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc slug..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-32">
              <select
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={filterDisplay}
                onChange={handleFilterChange(setFilterDisplay)}
              >
                <option value="all">Tất cả hiển thị</option>
                <option value="1">Hiển thị</option>
                <option value="0">Ẩn</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Tags List with DnD and Display Switch */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="p-6">
          {isTableLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : editorTags.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={async (event: DragEndEvent) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = editorTags.findIndex((item) => item.id === active.id);
                  const newIndex = editorTags.findIndex((item) => item.id === over.id);
                  const newTags = arrayMove(editorTags, oldIndex, newIndex);
                  setEditorTags(newTags);
                  // Update positions in backend
                  try {
                    const updates = newTags.map((tag, idx) => ({ id: tag.id, position: idx + 1 }));
                    await fetch('/api/admin/editor-tags/batch-update-positions', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ updates }),
                    });
                  } catch (err) {
                    alert('Lỗi cập nhật vị trí');
                  }
                }
              }}
            >
              <SortableContext items={editorTags.map(tag => tag.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {editorTags.map((tag) => (
                    <SortableTagItem
                      key={tag.id}
                      tag={tag}
                      onEdit={handleEditTag}
                      onDelete={deleteTag}
                      onToggleDisplay={async (tag) => {
                        const newDisplay = tag.display === 1 ? 0 : 1;
                        setEditorTags(prev => prev.map(t => t.id === tag.id ? { ...t, display: newDisplay } : t));
                        try {
                          await fetch(`/api/admin/editor-tags/${tag.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ display: newDisplay }),
                          });
                        } catch (err) {
                          alert('Lỗi cập nhật trạng thái hiển thị');
                        }
                      }}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12">
              <EditorTagIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy danh mục</h3>
              <p className="text-gray-500 dark:text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc tạo danh mục mới</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {editorTags.length > 0 && totalPages > 1 && (
        <div className="flex justify-between items-center rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Hiển thị <span className="font-medium">{((page - 1) * limit) + 1}</span> đến{' '}
            <span className="font-medium">{Math.min(page * limit, totalCount)}</span> trong tổng số{' '}
            <span className="font-medium">{totalCount}</span> danh mục
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-400">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Editor Tag Modal */}
      <EditorTagModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingTag={editingTag}
      />
    </div>
  );
}