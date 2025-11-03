'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm, { ProductFormData, ProductOptions, ProductFormPreviewUrls } from '@/components/admin/forms/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [initialData, setInitialData] = useState<ProductFormData | null>(null);
  const [previewUrls, setPreviewUrls] = useState<ProductFormPreviewUrls>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Mock data for selects
  const productOptions: ProductOptions = {
    sizes: [
      { value: 'small', label: 'Nhỏ (500x500px)' },
      { value: 'medium', label: 'Trung bình (1000x1000px)' },
      { value: 'large', label: 'Lớn (2000x2000px)' },
      { value: 'custom', label: 'Tùy chỉnh' },
    ],
    aspectRatios: [
      { value: '1:1', label: '1:1 (Vuông)' },
      { value: '4:3', label: '4:3 (Chữ nhật)' },
      { value: '16:9', label: '16:9 (Rộng)' },
      { value: '3:4', label: '3:4 (Dọc)' },
    ],
    templateTypeOptions: [
      { value: 'business', text: 'Business', selected: false },
      { value: 'creative', text: 'Creative', selected: false },
      { value: 'minimal', text: 'Minimal', selected: false },
      { value: 'modern', text: 'Modern', selected: false },
    ],
    contentTypeOptions: [
      { value: 'image', text: 'Hình ảnh', selected: false },
      { value: 'video', text: 'Video', selected: false },
      { value: 'text', text: 'Văn bản', selected: false },
    ],
    textStyleOptions: [
      { value: 'bold', text: 'In đậm', selected: false },
      { value: 'italic', text: 'In nghiêng', selected: false },
      { value: 'uppercase', text: 'Chữ hoa', selected: false },
    ],
    qrSuggestionOptions: [
      { value: 'website', text: 'Website', selected: false },
      { value: 'social', text: 'Mạng xã hội', selected: false },
      { value: 'contact', text: 'Liên hệ', selected: false },
    ],
    aiToolOptions: [
      { value: 'chatgpt', text: 'ChatGPT', selected: false },
      { value: 'midjourney', text: 'Midjourney', selected: false },
      { value: 'dalle', text: 'DALL-E', selected: false },
    ],
  };

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${productId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Không thể tải dữ liệu sản phẩm');
        }

        const product = result.product;

        // Convert API data to form data (map from API response)
        const formData: ProductFormData = {
          productName: product.productName || '',
          tgiaCategory: product.tgiaCategory || '',
          product: product.product || '',
          category: product.category || '',
          selectSize: product.selectSize || false,
          width: product.width || '',
          height: product.height || '',
          sizeDv: product.sizeDv || 'px',
          aspectRatio: product.aspectRatio || '',
          selectImageSq: product.selectImageSq || false,
          imageSizeW: product.imageSizeW || '',
          imageSizeH: product.imageSizeH || '',
          imageQuality: product.imageQuality || '80',
          showMockup: product.showMockup || false,
          chooseMainMockup: product.chooseMainMockup || false,
          outline: product.outline || '18',
          sizeExport: product.sizeExport || '',
          textBanner: product.textBanner || '',
          position: product.position || '',
          numProducts: product.numProducts || '',
          numColumns: product.numColumns || '',
          showProduct: product.showProduct || false,
          canAddPages: product.canAddPages || false,
          pageContext: product.pageContext || [{ id: 1, name: '', img: '' }],
          productIcon: product.productIcon || '',
          productImage: product.productImage || '',
          penciImage: product.penciImage || '',
          bannerImage: product.bannerImage || '',
          templateTypes: product.templateTypes || [],
          collections: product.collections || [],
          textStyles: product.textStyles || [],
          frames: product.frames || [],
          images: product.images || [],
          qrCodes: product.qrCodes || [],
        };

        // Set preview URLs
        const urls: ProductFormPreviewUrls = {
          productIconPreview: product.productIcon || '',
          productImagePreview: product.productImage || '',
          penciImagePreview: product.penciImage || '',
          bannerImagePreview: product.bannerImage || '',
        };

        setInitialData(formData);
        setPreviewUrls(urls);

      } catch (error) {
        console.error('Error loading product:', error);
        alert('Có lỗi xảy ra khi tải dữ liệu sản phẩm');
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleSubmit = async (formData: ProductFormData) => {
    setIsLoading(true);

    try {
      // Send data directly to API - API handles validation and mapping
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra khi cập nhật sản phẩm');
      }

      alert('Sản phẩm đã được cập nhật thành công!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
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

  return (
    <ProductForm
      mode="edit"
      initialData={initialData || {}}
      previewUrls={previewUrls}
      options={productOptions}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}