'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm, { ProductFormData, ProductOptions } from '@/components/admin/forms/ProductForm';

export default function AddProductPage() {
  const router = useRouter();

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Options for the form
  const options: ProductOptions = {
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

  const handleSubmit = async (data: ProductFormData) => {
    setIsLoading(true);

    try {
      // Send data directly to API - API handles validation and mapping
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra khi tạo sản phẩm');
      }

      alert('Sản phẩm đã được tạo thành công!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductForm
      mode="add"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      options={options}
    />
  );
}