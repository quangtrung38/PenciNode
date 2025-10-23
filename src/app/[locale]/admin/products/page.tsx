'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import Pagination from "@/components/admin/tables/Pagination";
import Image from "next/image";
import Label from "@/components/admin/form/Label";
import Input from "@/components/admin/form/input/InputField";
import DragDropUpload from "@/components/admin/form/input/DragDropUpload";
import Switch from "@/components/admin/form/switch/Switch";

// SVG Icons
const ProductsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Product interface
interface Product {
  id: string;
  name: string | null;
  img: string | null;
  category: string | null;
  category_id: string | null;
  display: number;
  display_home: number;
  isShowPage: number;
  homePenci: number;
  isSocical: number;
  enableBg: number;
  enableBgmk: number;
  outline: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// Category interface for filter
interface Category {
  id: string;
  name: string | null;
  slug?: string | null;
  img?: string | null;
  imgIcon?: string | null;
  position?: number;
  display?: number;
  displayTgia?: number;
  displayPenci?: number;
}

// Modal Components
const AddCategoryModal = ({ isOpen, onClose, onSubmit, categoryName, setCategoryName, categoryPosition, setCategoryPosition, categoryDisplay, setCategoryDisplay, categoryDisplayTgia, setCategoryDisplayTgia, categoryDisplayPenci, setCategoryDisplayPenci, categoryImg, setCategoryImg, categoryImgIcon, setCategoryImgIcon, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  categoryName: string;
  setCategoryName: (name: string) => void;
  categoryPosition: number;
  setCategoryPosition: (position: number) => void;
  categoryDisplay: boolean;
  setCategoryDisplay: (display: boolean) => void;
  categoryDisplayTgia: boolean;
  setCategoryDisplayTgia: (display: boolean) => void;
  categoryDisplayPenci: boolean;
  setCategoryDisplayPenci: (display: boolean) => void;
  categoryImg: File | null;
  setCategoryImg: (file: File | null) => void;
  categoryImgIcon: File | null;
  setCategoryImgIcon: (file: File | null) => void;
  isLoading: boolean;
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-99999">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-75 backdrop-blur-sm" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              Thêm danh mục mới
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="category-name">
                  Tên danh mục <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="category-name"
                  type="text"
                  placeholder="Nhập tên danh mục"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>

              {/* Position */}
              <div>
                <Label htmlFor="category-position">
                  Vị trí
                </Label>
                <Input
                  id="category-position"
                  type="number"
                  placeholder="0"
                  value={categoryPosition}
                  onChange={(e) => setCategoryPosition(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Display Switches */}
              <div>
                <div className="flex items-center space-x-6">
                  <Switch
                    label="Hiển thị"
                    defaultChecked={categoryDisplay}
                    onChange={setCategoryDisplay}
                  />
                  <Switch
                    label="Hiển thị TGIA"
                    defaultChecked={categoryDisplayTgia}
                    onChange={setCategoryDisplayTgia}
                  />
                  <Switch
                    label="Hiển thị Penci"
                    defaultChecked={categoryDisplayPenci}
                    onChange={setCategoryDisplayPenci}
                  />
                </div>
              </div>

              {/* Icon Image */}
              <DragDropUpload
                label="Hình icon"
                placeholder="Kéo thả hình icon hoặc click để chọn"
                selectedFile={categoryImgIcon}
                onFileSelect={setCategoryImgIcon}
                maxSize={5}
              />

              {/* Main Image */}
              <DragDropUpload
                label="Hình đại diện"
                placeholder="Kéo thả hình đại diện hoặc click để chọn"
                selectedFile={categoryImg}
                onFileSelect={setCategoryImg}
                maxSize={10}
              />
            </form>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo...' : 'Thêm danh mục'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const EditCategoryModal = ({ isOpen, onClose, onSubmit, categoryName, setCategoryName, categoryPosition, setCategoryPosition, categoryDisplay, setCategoryDisplay, categoryDisplayTgia, setCategoryDisplayTgia, categoryDisplayPenci, setCategoryDisplayPenci, categoryImg, setCategoryImg, categoryImgIcon, setCategoryImgIcon, editingCategory, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  categoryName: string;
  setCategoryName: (name: string) => void;
  categoryPosition: number;
  setCategoryPosition: (position: number) => void;
  categoryDisplay: boolean;
  setCategoryDisplay: (display: boolean) => void;
  categoryDisplayTgia: boolean;
  setCategoryDisplayTgia: (display: boolean) => void;
  categoryDisplayPenci: boolean;
  setCategoryDisplayPenci: (display: boolean) => void;
  categoryImg: File | null;
  setCategoryImg: (file: File | null) => void;
  categoryImgIcon: File | null;
  setCategoryImgIcon: (file: File | null) => void;
  editingCategory: Category | null;
  isLoading: boolean;
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-99999">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-75 backdrop-blur-sm" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              Sửa danh mục
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="edit-category-name">
                  Tên danh mục <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-category-name"
                  type="text"
                  placeholder="Nhập tên danh mục"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>

              {/* Position */}
              <div>
                <Label htmlFor="edit-category-position">
                  Vị trí
                </Label>
                <Input
                  id="edit-category-position"
                  type="number"
                  placeholder="0"
                  value={categoryPosition}
                  onChange={(e) => setCategoryPosition(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Display Switches */}
              <div>
                <div className="flex items-center space-x-6">
                  <Switch
                    label="Hiển thị"
                    defaultChecked={categoryDisplay}
                    onChange={setCategoryDisplay}
                  />
                  <Switch
                    label="Hiển thị TGIA"
                    defaultChecked={categoryDisplayTgia}
                    onChange={setCategoryDisplayTgia}
                  />
                  <Switch
                    label="Hiển thị Penci"
                    defaultChecked={categoryDisplayPenci}
                    onChange={setCategoryDisplayPenci}
                  />
                </div>
              </div>

              {/* Icon Image */}
              <DragDropUpload
                label="Hình icon"
                placeholder="Kéo thả hình icon mới hoặc click để chọn"
                selectedFile={categoryImgIcon}
                previewUrl={editingCategory?.imgIcon || undefined}
                onFileSelect={setCategoryImgIcon}
                maxSize={5}
              />

              {/* Main Image */}
              <DragDropUpload
                label="Hình đại diện"
                placeholder="Kéo thả hình đại diện mới hoặc click để chọn"
                selectedFile={categoryImg}
                previewUrl={editingCategory?.img || undefined}
                onFileSelect={setCategoryImg}
                maxSize={10}
              />
            </form>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default function ProductsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDisplay, setFilterDisplay] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // REST API state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCategoryModalLoading, setIsCategoryModalLoading] = useState(false);
  const [showCategoryActions, setShowCategoryActions] = useState(false);

  // Category modal states
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryPosition, setCategoryPosition] = useState(0);
  const [categoryDisplay, setCategoryDisplay] = useState(true);
  const [categoryDisplayTgia, setCategoryDisplayTgia] = useState(false);
  const [categoryDisplayPenci, setCategoryDisplayPenci] = useState(false);
  const [categoryImg, setCategoryImg] = useState<File | null>(null);
  const [categoryImgIcon, setCategoryImgIcon] = useState<File | null>(null);

  const handleFilterChange = (setter: (v: any) => void) => (e: any) => {
    setter(e.target.value);
    setPage(1);
  };

  // Fetch products from REST API
  const fetchProducts = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsTableLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        categoryId: filterCategory,
        display: filterDisplay,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/products?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setProducts(data.products || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsTableLoading(false);
      }
    }
  };

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories-products');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setCategoriesCount(data.categories?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchProducts(true);
      await fetchCategories();
    };
    loadInitialData();
  }, []);

  // Debounce search input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch products when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchProducts(false);
    }
  }, [filterCategory, filterDisplay, searchTerm, page]);

  // Close category actions dropdown when clicking outside
  useEffect(() => {
    if (!showCategoryActions) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.category-dropdown')) {
        setShowCategoryActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryActions]);

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product.id));
    }
  };

  // Toggle switches with optimistic updates
  const handleToggle = async (productId: string, field: string, currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    
    // Optimistic update - update UI immediately
    setProducts(prev => prev.map(product =>
      product.id === productId
        ? { ...product, [field]: newValue }
        : product
    ));

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: newValue }),
      });

      if (!response.ok) {
        // Revert on failure
        setProducts(prev => prev.map(product =>
          product.id === productId
            ? { ...product, [field]: currentValue }
            : product
        ));
        console.error('Failed to update product toggle');
      }
    } catch (err) {
      // Revert on error
      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { ...product, [field]: currentValue }
          : product
      ));
      console.error('Failed to update product toggle:', err);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(prev => prev.filter(product => product.id !== productId));
        setTotalCount(prev => prev - 1);
        alert('Sản phẩm đã được xóa thành công!');
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi xóa sản phẩm');
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Lỗi khi xóa sản phẩm');
    }
  };

  // Handle add category
  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setIsCategoryModalLoading(true);
      let imgUrl = null;
      let imgIconUrl = null;

      // Upload imgIcon if selected
      if (categoryImgIcon) {
        const formData = new FormData();
        formData.append('file', categoryImgIcon);
        const uploadResponse = await fetch('/api/admin/categories-products/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imgIconUrl = uploadData.fileUrl;
        } else {
          alert('Lỗi upload hình icon');
          return;
        }
      }

      // Upload img if selected
      if (categoryImg) {
        const formData = new FormData();
        formData.append('file', categoryImg);
        const uploadResponse = await fetch('/api/admin/categories-products/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imgUrl = uploadData.fileUrl;
        } else {
          alert('Lỗi upload hình đại diện');
          return;
        }
      }

      const response = await fetch('/api/admin/categories-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          position: categoryPosition,
          display: categoryDisplay ? 1 : 0,
          displayTgia: categoryDisplayTgia ? 1 : 0,
          displayPenci: categoryDisplayPenci ? 1 : 0,
          img: imgUrl,
          imgIcon: imgIconUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(prev => [...prev, data.category]);
        setCategoriesCount(prev => prev + 1);
        setShowAddCategoryModal(false);
        setCategoryName('');
        setCategoryPosition(0);
        setCategoryDisplay(true);
        setCategoryDisplayTgia(false);
        setCategoryDisplayPenci(false);
        setCategoryImg(null);
        setCategoryImgIcon(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi tạo danh mục');
      }
    } catch (err) {
      console.error('Failed to add category:', err);
      alert('Lỗi khi tạo danh mục');
    } finally {
      setIsCategoryModalLoading(false);
    }
  };

  // Handle edit category
  const handleEditCategory = async () => {
    if (!editingCategory || !categoryName.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setIsCategoryModalLoading(true);
      let imgUrl = editingCategory.img || null;
      let imgIconUrl = editingCategory.imgIcon || null;

      // Upload imgIcon if selected
      if (categoryImgIcon) {
        const formData = new FormData();
        formData.append('file', categoryImgIcon);
        const uploadResponse = await fetch('/api/admin/categories-products/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imgIconUrl = uploadData.fileUrl;
        } else {
          alert('Lỗi upload hình icon');
          return;
        }
      }

      // Upload img if selected
      if (categoryImg) {
        const formData = new FormData();
        formData.append('file', categoryImg);
        const uploadResponse = await fetch('/api/admin/categories-products/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imgUrl = uploadData.fileUrl;
        } else {
          alert('Lỗi upload hình đại diện');
          return;
        }
      }

      const response = await fetch(`/api/admin/categories-products/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          position: categoryPosition,
          display: categoryDisplay ? 1 : 0,
          displayTgia: categoryDisplayTgia ? 1 : 0,
          displayPenci: categoryDisplayPenci ? 1 : 0,
          img: imgUrl,
          imgIcon: imgIconUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? data.category : cat));
        setShowEditCategoryModal(false);
        setEditingCategory(null);
        setCategoryName('');
        setCategoryPosition(0);
        setCategoryDisplay(false);
        setCategoryDisplayTgia(false);
        setCategoryDisplayPenci(false);
        setCategoryImg(null);
        setCategoryImgIcon(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi cập nhật danh mục');
      }
    } catch (err) {
      console.error('Failed to edit category:', err);
      alert('Lỗi khi cập nhật danh mục');
    } finally {
      setIsCategoryModalLoading(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
      const response = await fetch(`/api/admin/categories-products/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        setCategoriesCount(prev => prev - 1);
        // Reset filter if deleted category was selected
        if (filterCategory === categoryId) {
          setFilterCategory('all');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi xóa danh mục');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Lỗi khi xóa danh mục');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>

        {/* Stats skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse">
                  <div className="w-6 h-6"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Search skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            <div className="md:w-48">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            <div className="md:w-48">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-96"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <ProductsIcon className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || 'Đã xảy ra lỗi'}</p>
          <button
            onClick={() => fetchProducts()}
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
          Quản lý sản phẩm
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Quản lý tất cả sản phẩm trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Products Stats */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <ProductsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                {isTableLoading && (
                  <span className="text-xs text-blue-600 flex items-center">
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tải...
                  </span>
                )}
              </div>
            </div>

            {/* Categories Stats */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số danh mục</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{categoriesCount}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm danh mục
            </button>
            <button
              onClick={() => router.push('/admin/products/add')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-80 relative">
            <button
              type="button"
              onClick={() => setShowCategoryActions(!showCategoryActions)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white flex items-center justify-between category-dropdown"
            >
              <span className="truncate">
                {filterCategory === 'all'
                  ? 'Tất cả danh mục'
                  : categories.find(cat => cat.id === filterCategory)?.name || 'Tất cả danh mục'
                }
              </span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCategoryActions && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto category-dropdown">
                <div
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setFilterCategory('all');
                    setShowCategoryActions(false);
                    setPage(1);
                  }}
                >
                  Tất cả danh mục
                </div>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setFilterCategory(category.id);
                        setShowCategoryActions(false);
                        setPage(1);
                      }}
                    >
                      {category.name}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setCategoryName(category.name || '');
                          setCategoryPosition(category.position || 0);
                          setCategoryDisplay(category.display === 1);
                          setCategoryDisplayTgia(category.displayTgia === 1);
                          setCategoryDisplayPenci(category.displayPenci === 1);
                          setCategoryImg(null);
                          setCategoryImgIcon(null);
                          setShowEditCategoryModal(true);
                          setShowCategoryActions(false);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        title="Chỉnh sửa danh mục"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"? Hành động này không thể hoàn tác.`)) {
                            handleDeleteCategory(category.id);
                          }
                        }}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        title="Xóa danh mục"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Display Filter */}
          <div className="md:w-48">
            <select
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={filterDisplay}
              onChange={handleFilterChange(setFilterDisplay)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="1">Hiển thị</option>
              <option value="0">Ẩn</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && products.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-300">
                Đã chọn {selectedProducts.length} sản phẩm
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-full">
              {/* Table Header */}
              <TableHeader>
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Hình ảnh
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Danh mục
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Hiển thị
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isTableLoading ? (
                  // Loading rows
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="space-y-1">
                          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <TableCell className="px-5 py-4 text-start">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {product.name || 'Chưa có tên'}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="w-12 h-12 overflow-hidden rounded">
                        {product.img ? (
                          <Image
                            width={48}
                            height={48}
                            src={product.img}
                            alt={product.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <ProductsIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                        {product.category || 'Chưa phân loại'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="space-y-2">
                        {/* Bật/tắt */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggle(product.id, 'display', product.display)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              product.display === 1 ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.display === 1 ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-500">Bật/tắt:</span>
                        </div>

                        {/* Thư viện */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggle(product.id, 'display_home', product.display_home)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              product.display_home === 1 ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.display_home === 1 ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-500">Thư viện:</span>
                        </div>

                        {/* Home TGIA */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggle(product.id, 'isShowPage', product.isShowPage)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              product.isShowPage === 1 ? 'bg-purple-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.isShowPage === 1 ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-500">Home TGIA:</span>
                        </div>

                        {/* Home Penci */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggle(product.id, 'homePenci', product.homePenci)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              product.homePenci === 1 ? 'bg-orange-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.homePenci === 1 ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-500">Home Penci:</span>
                        </div>

                        {/* Mạng xã hội */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggle(product.id, 'isSocical', product.isSocical)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              product.isSocical === 1 ? 'bg-pink-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                product.isSocical === 1 ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-500">Mạng xã hội:</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Chỉnh sửa"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Xóa"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>
        </div>

        {products.length === 0 && !isTableLoading && (
          <div className="text-center py-12">
            <ProductsIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 dark:text-gray-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {products.length > 0 && totalPages > 1 && (
        <div className="flex justify-between items-center rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="text-sm text-gray-700 dark:text-gray-400">
            Hiển thị <span className="font-medium">{((page - 1) * limit) + 1}</span> đến{' '}
            <span className="font-medium">{Math.min(page * limit, totalCount)}</span> trong tổng số{' '}
            <span className="font-medium">{totalCount}</span> sản phẩm
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modals */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => {
          setShowAddCategoryModal(false);
          setCategoryName('');
          setCategoryPosition(0);
          setCategoryDisplay(true);
          setCategoryDisplayTgia(false);
          setCategoryDisplayPenci(false);
          setCategoryImg(null);
          setCategoryImgIcon(null);
        }}
        onSubmit={handleAddCategory}
        categoryName={categoryName}
        setCategoryName={setCategoryName}
        categoryPosition={categoryPosition}
        setCategoryPosition={setCategoryPosition}
        categoryDisplay={categoryDisplay}
        setCategoryDisplay={setCategoryDisplay}
        categoryDisplayTgia={categoryDisplayTgia}
        setCategoryDisplayTgia={setCategoryDisplayTgia}
        categoryDisplayPenci={categoryDisplayPenci}
        setCategoryDisplayPenci={setCategoryDisplayPenci}
        categoryImg={categoryImg}
        setCategoryImg={setCategoryImg}
        categoryImgIcon={categoryImgIcon}
        setCategoryImgIcon={setCategoryImgIcon}
        isLoading={isCategoryModalLoading}
      />
      <EditCategoryModal
        isOpen={showEditCategoryModal}
        onClose={() => {
          setShowEditCategoryModal(false);
          setEditingCategory(null);
          setCategoryName('');
          setCategoryPosition(0);
          setCategoryDisplay(false);
          setCategoryDisplayTgia(false);
          setCategoryDisplayPenci(false);
          setCategoryImg(null);
          setCategoryImgIcon(null);
        }}
        onSubmit={handleEditCategory}
        categoryName={categoryName}
        setCategoryName={setCategoryName}
        categoryPosition={categoryPosition}
        setCategoryPosition={setCategoryPosition}
        categoryDisplay={categoryDisplay}
        setCategoryDisplay={setCategoryDisplay}
        categoryDisplayTgia={categoryDisplayTgia}
        setCategoryDisplayTgia={setCategoryDisplayTgia}
        categoryDisplayPenci={categoryDisplayPenci}
        setCategoryDisplayPenci={setCategoryDisplayPenci}
        categoryImg={categoryImg}
        setCategoryImg={setCategoryImg}
        categoryImgIcon={categoryImgIcon}
        setCategoryImgIcon={setCategoryImgIcon}
        editingCategory={editingCategory}
        isLoading={isCategoryModalLoading}
      />

    </div>
  );
}