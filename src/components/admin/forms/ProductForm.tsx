import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/admin/form/input/InputField';
import Select from '@/components/admin/form/Select';
import TextArea from '@/components/admin/form/input/TextArea';
import Switch from '@/components/admin/form/switch/Switch';
import DragDropUpload from '@/components/admin/form/input/DragDropUpload';
import MultiSelect from '@/components/admin/form/MultiSelect';
import Button from '@/components/admin/ui/button/Button';
import Label from '@/components/admin/form/Label';

// Custom hook to fetch TGIA categories from API
const useTgiaCategories = () => {
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://thegioiinan.com/site/getcateproduct');
        const data = await response.json();

        if (data.result === 0 && data.record) {
          const formattedCategories = data.record.map((item: any) => ({
            value: item.dm_tin_id,
            label: item.dm_tin_ten,
          }));
          setCategories(formattedCategories);
        } else {
          throw new Error(data.message || 'Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching TGIA categories:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty array
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Custom hook to fetch TGIA products from API
const useTgiaProducts = () => {
  const [products, setProducts] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://thegioiinan.com/site/getcateproductdetail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            // _token: 'zwKTkCF0kULeGyewZ7WqoIbtgSToN7i9IxC7sor4',
            id: '0',
          }),
        });

        const data = await response.json();

        if (data.result === 0 && data.record) {
          const formattedProducts = data.record.map((item: any) => ({
            value: item.tin_id,
            label: item.tin_tieude,
          }));
          setProducts(formattedProducts);
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching TGIA products:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty array
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

// Custom hook to fetch editor categories from API
const useEditorCategories = () => {
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/editor-categories');
        const data = await response.json();

        if (response.ok && data.categories) {
          const formattedCategories = data.categories.map((item: any) => ({
            value: item.id?.toString() || item.name,
            label: item.name,
          }));
          setCategories(formattedCategories);
        } else {
          throw new Error(data.error || 'Failed to fetch editor categories');
        }
      } catch (err) {
        console.error('Error fetching editor categories:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty array
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Custom hook to fetch multiselect options from API
const useMultiselectOptions = () => {
  const [options, setOptions] = useState<{
    template_types: Array<{ value: string; label: string; slug?: string }>;
    collections: Array<{ value: string; label: string; slug?: string }>;
    text_styles: Array<{ value: string; label: string; slug?: string }>;
    frames: Array<{ value: string; label: string; img?: string; img_thumb?: string }>;
    images: Array<{ value: string; label: string; img?: string; img_thumb?: string }>;
    qr_codes: Array<{ value: string; label: string; img?: string; img_thumb?: string }>;
  }>({
    template_types: [],
    collections: [],
    text_styles: [],
    frames: [],
    images: [],
    qr_codes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/admin/editor-tags/multiselect-options');
        const data = await response.json();

        if (response.ok && data) {
          setOptions({
            template_types: data.template_types?.map((item: any) => ({
              value: item.id?.toString() || item.slug,
              label: item.name,
              slug: item.slug,
            })) || [],
            collections: data.collections?.map((item: any) => ({
              value: item.id?.toString() || item.slug,
              label: item.name,
              slug: item.slug,
            })) || [],
            text_styles: data.text_styles?.map((item: any) => ({
              value: item.id?.toString() || item.slug,
              label: item.name,
              slug: item.slug,
            })) || [],
            frames: data.frames?.map((item: any) => ({
              value: item.id?.toString(),
              label: item.name,
              img: item.img,
              img_thumb: item.img_thumb,
            })) || [],
            images: data.images?.map((item: any) => ({
              value: item.id?.toString(),
              label: item.name,
              img: item.img,
              img_thumb: item.img_thumb,
            })) || [],
            qr_codes: data.qr_codes?.map((item: any) => ({
              value: item.id?.toString(),
              label: item.name,
              img: item.img,
              img_thumb: item.img_thumb,
            })) || [],
          });
        } else {
          throw new Error(data.error || 'Failed to fetch multiselect options');
        }
      } catch (err) {
        console.error('Error fetching multiselect options:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty objects
        setOptions({
          template_types: [],
          collections: [],
          text_styles: [],
          frames: [],
          images: [],
          qr_codes: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return { options, loading, error };
};

export interface ProductFormData {
  productName: string;
  tgiaCategory: string;
  product: string;
  category: string;
  selectSize: boolean;
  width: string;
  height: string;
  sizeDv: string;
  aspectRatio: string;
  selectImageSq: boolean;
  imageSizeW: string;
  imageSizeH: string;
  imageQuality: string;
  showMockup: boolean;
  chooseMainMockup: boolean;
  outline: string;
  sizeExport: string;
  textBanner: string;
  position: string;
  numProducts: string;
  numColumns: string;
  showProduct: boolean;
  canAddPages: boolean;
  pageContext: Array<{ id: number; name: string; img: string }>;
  productIcon: string; // Changed from File | null to string
  productImage: string; // Changed from File | null to string
  penciImage: string; // Changed from File | null to string
  bannerImage: string; // Changed from File | null to string
  templateTypes: string[];
  collections: string[];
  textStyles: string[];
  frames: string[];
  images: string[];
  qrCodes: string[];
}

export interface ProductFormProps {
  mode: 'add' | 'edit';
  initialData?: Partial<ProductFormData>;
  productId?: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface ProductOptions {
  sizes: Array<{ value: string; label: string }>;
  aspectRatios: Array<{ value: string; label: string }>;
  templateTypeOptions: Array<{ value: string; text: string; selected: boolean }>;
  contentTypeOptions: Array<{ value: string; text: string; selected: boolean }>;
  textStyleOptions: Array<{ value: string; text: string; selected: boolean }>;
  qrSuggestionOptions: Array<{ value: string; text: string; selected: boolean }>;
  aiToolOptions: Array<{ value: string; text: string; selected: boolean }>;
  imageOptions?: Array<{ value: string; text: string; selected: boolean }>;
}

export interface ProductFormPreviewUrls {
  productIconPreview?: string;
  productImagePreview?: string;
  penciImagePreview?: string;
  bannerImagePreview?: string;
}

export interface ProductFormComponentProps extends ProductFormProps {
  options?: ProductOptions; // Made optional since we now fetch multiselect options from API
  previewUrls?: ProductFormPreviewUrls;
}

// Save icon component
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const ProductForm: React.FC<ProductFormComponentProps> = ({
  mode,
  initialData = {},
  productId: _productId,
  onSubmit,
  isLoading = false,
  previewUrls = {},
}) => {
  const router = useRouter();
  const { categories: tgiaCategories, loading: tgiaCategoriesLoading, error: tgiaCategoriesError } = useTgiaCategories();
  const { products: tgiaProducts, loading: tgiaProductsLoading, error: tgiaProductsError } = useTgiaProducts();
  const { categories: editorCategories, loading: editorCategoriesLoading, error: editorCategoriesError } = useEditorCategories();
  const { options: multiselectOptions, error: multiselectError } = useMultiselectOptions();

  // Main form state
  const [productName, setProductName] = useState(initialData.productName || '');
  const [tgiaCategory, setTgiaCategory] = useState(initialData.tgiaCategory || '');
  const [product, setProduct] = useState(initialData.product || '');
  const [category, setCategory] = useState(initialData.category || '');
  const [selectSize, setSelectSize] = useState(initialData.selectSize || false);
  const [width, setWidth] = useState(initialData.width || '');
  const [height, setHeight] = useState(initialData.height || '');
  const [sizeDv, setSizeDv] = useState(initialData.sizeDv || 'px');
  const [aspectRatio, setAspectRatio] = useState(initialData.aspectRatio || '');
  const [selectImageSq, setSelectImageSq] = useState(initialData.selectImageSq || false);
  const [imageSizeW, setImageSizeW] = useState(initialData.imageSizeW || '');
  const [imageSizeH, setImageSizeH] = useState(initialData.imageSizeH || '');
  const [imageQuality, setImageQuality] = useState(initialData.imageQuality || '');
  const [showMockup, setShowMockup] = useState(initialData.showMockup || false);
  const [chooseMainMockup, setChooseMainMockup] = useState(initialData.chooseMainMockup || false);
  const [outline, setOutline] = useState(initialData.outline || '18');
  const [sizeExport, setSizeExport] = useState(initialData.sizeExport || '');
  const [textBanner, setTextBanner] = useState(initialData.textBanner || '');
  const [position, setPosition] = useState(initialData.position || '');
  const [numProducts, setNumProducts] = useState(initialData.numProducts || '');
  const [numColumns, setNumColumns] = useState(initialData.numColumns || '');
  const [showProduct, setShowProduct] = useState(initialData.showProduct !== false);
  const [pageContext, setPageContext] = useState<Array<{ id: number; name: string; img: string }>>(initialData.pageContext || [{ id: 1, name: '', img: '' }]);
  const [canAddPages, setCanAddPages] = useState(initialData.canAddPages || false);

  // File uploads - now store URLs instead of File objects
  const [productIcon, setProductIcon] = useState<string>(initialData.productIcon || '');
  const [productImage, setProductImage] = useState<string>(initialData.productImage || '');
  const [penciImage, setPenciImage] = useState<string>(initialData.penciImage || '');
  const [bannerImage, setBannerImage] = useState<string>(initialData.bannerImage || '');

  // Loading states for uploads
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPenci, setUploadingPenci] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Upload functions
  const uploadImage = async (file: File, type: 'icon' | 'image' | 'penci' | 'banner'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/admin/products/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.fileUrl;
  };

  // File selection handlers
  const handleProductIconSelect = async (file: File | null) => {
    if (file) {
      setUploadingIcon(true);
      try {
        const url = await uploadImage(file, 'icon');
        setProductIcon(url);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Có lỗi xảy ra khi upload icon sản phẩm');
      } finally {
        setUploadingIcon(false);
      }
    } else {
      setProductIcon('');
    }
  };

  const handleProductImageSelect = async (file: File | null) => {
    if (file) {
      setUploadingImage(true);
      try {
        const url = await uploadImage(file, 'image');
        setProductImage(url);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Có lỗi xảy ra khi upload hình sản phẩm');
      } finally {
        setUploadingImage(false);
      }
    } else {
      setProductImage('');
    }
  };

  const handlePenciImageSelect = async (file: File | null) => {
    if (file) {
      setUploadingPenci(true);
      try {
        const url = await uploadImage(file, 'penci');
        setPenciImage(url);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Có lỗi xảy ra khi upload hình Penci');
      } finally {
        setUploadingPenci(false);
      }
    } else {
      setPenciImage('');
    }
  };

  const handleBannerImageSelect = async (file: File | null) => {
    if (file) {
      setUploadingBanner(true);
      try {
        const url = await uploadImage(file, 'banner');
        setBannerImage(url);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Có lỗi xảy ra khi upload hình banner');
      } finally {
        setUploadingBanner(false);
      }
    } else {
      setBannerImage('');
    }
  };

  // Tag groups
  const [templateTypes, setTemplateTypes] = useState<string[]>(initialData.templateTypes || []);
  const [collections, setCollections] = useState<string[]>(initialData.collections || []);
  const [textStyles, setTextStyles] = useState<string[]>(initialData.textStyles || []);
  const [frames, setFrames] = useState<string[]>(initialData.frames || []);
  const [images, setImages] = useState<string[]>(initialData.images || []);
  const [qrCodes, setQrCodes] = useState<string[]>(initialData.qrCodes || []);

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData.productName !== undefined) setProductName(initialData.productName);
    if (initialData.tgiaCategory !== undefined) setTgiaCategory(initialData.tgiaCategory);
    if (initialData.product !== undefined) setProduct(initialData.product);
    if (initialData.category !== undefined) setCategory(initialData.category);
    if (initialData.selectSize !== undefined) setSelectSize(initialData.selectSize);
    if (initialData.width !== undefined) setWidth(initialData.width);
    if (initialData.height !== undefined) setHeight(initialData.height);
    if (initialData.sizeDv !== undefined) setSizeDv(initialData.sizeDv);
    if (initialData.aspectRatio !== undefined) setAspectRatio(initialData.aspectRatio);
    if (initialData.selectImageSq !== undefined) setSelectImageSq(initialData.selectImageSq);
    if (initialData.imageSizeW !== undefined) setImageSizeW(initialData.imageSizeW);
    if (initialData.imageSizeH !== undefined) setImageSizeH(initialData.imageSizeH);
    if (initialData.imageQuality !== undefined) setImageQuality(initialData.imageQuality);
    if (initialData.showMockup !== undefined) setShowMockup(initialData.showMockup);
    if (initialData.chooseMainMockup !== undefined) setChooseMainMockup(initialData.chooseMainMockup);
    if (initialData.outline !== undefined) setOutline(initialData.outline);
    if (initialData.sizeExport !== undefined) setSizeExport(initialData.sizeExport);
    if (initialData.textBanner !== undefined) setTextBanner(initialData.textBanner);
    if (initialData.position !== undefined) setPosition(initialData.position);
    if (initialData.numProducts !== undefined) setNumProducts(initialData.numProducts);
    if (initialData.numColumns !== undefined) setNumColumns(initialData.numColumns);
    if (initialData.showProduct !== undefined) setShowProduct(initialData.showProduct);
    if (initialData.canAddPages !== undefined) setCanAddPages(initialData.canAddPages);
    if (initialData.pageContext !== undefined) setPageContext(initialData.pageContext);
    if (initialData.productIcon !== undefined) setProductIcon(initialData.productIcon);
    if (initialData.productImage !== undefined) setProductImage(initialData.productImage);
    if (initialData.penciImage !== undefined) setPenciImage(initialData.penciImage);
    if (initialData.bannerImage !== undefined) setBannerImage(initialData.bannerImage);
    if (initialData.templateTypes !== undefined) setTemplateTypes(initialData.templateTypes);
    if (initialData.collections !== undefined) setCollections(initialData.collections);
    if (initialData.textStyles !== undefined) setTextStyles(initialData.textStyles);
    if (initialData.frames !== undefined) setFrames(initialData.frames);
    if (initialData.images !== undefined) setImages(initialData.images);
    if (initialData.qrCodes !== undefined) setQrCodes(initialData.qrCodes);
  }, [initialData]);

  const handleSave = async () => {
    const formData: ProductFormData = {
      productName,
      tgiaCategory,
      product,
      category,
      selectSize,
      width,
      height,
      sizeDv,
      aspectRatio,
      selectImageSq,
      imageSizeW,
      imageSizeH,
      imageQuality,
      showMockup,
      chooseMainMockup,
      outline,
      sizeExport,
      textBanner,
      position,
      numProducts,
      numColumns,
      showProduct,
      canAddPages,
      pageContext,
      productIcon,
      productImage,
      penciImage,
      bannerImage,
      templateTypes: templateTypes || [],
      collections: collections || [],
      textStyles: textStyles || [],
      frames: frames || [],
      images: images || [],
      qrCodes: qrCodes || [],
    };

    await onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {mode === 'add' ? 'Thêm sản phẩm' : 'Cập nhật sản phẩm'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {mode === 'add' ? 'Tạo sản phẩm mới trong hệ thống' : 'Chỉnh sửa thông tin sản phẩm'}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thông tin cơ bản
            </h2>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <Label htmlFor="product-name">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-name"
                  type="text"
                  placeholder="Nhập tên sản phẩm"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              {/* TGIA Category */}
              <div>
                <Label htmlFor="tgia-category">TGIA - Danh mục</Label>
                <Select
                  options={tgiaCategories}
                  placeholder={tgiaCategoriesLoading ? "Đang tải..." : "Chọn danh mục TGIA"}
                  onChange={setTgiaCategory}
                  defaultValue={tgiaCategory}
                />
                {tgiaCategoriesError && (
                  <p className="text-sm text-red-500 mt-1">Lỗi tải danh mục: {tgiaCategoriesError}</p>
                )}
              </div>

              {/* Product */}
              <div>
                <Label htmlFor="product">Sản phẩm</Label>
                <Select
                  options={tgiaProducts}
                  placeholder={tgiaProductsLoading ? "Đang tải..." : "Chọn sản phẩm"}
                  onChange={setProduct}
                  defaultValue={product}
                />
                {tgiaProductsError && (
                  <p className="text-sm text-red-500 mt-1">Lỗi tải sản phẩm: {tgiaProductsError}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  options={editorCategories}
                  placeholder={editorCategoriesLoading ? "Đang tải..." : "Chọn danh mục"}
                  onChange={setCategory}
                  defaultValue={category}
                />
                {editorCategoriesError && (
                  <p className="text-sm text-red-500 mt-1">Lỗi tải danh mục: {editorCategoriesError}</p>
                )}
              </div>

              {/* Size */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Kích thước
                </h3>
                <div className="space-y-4">
                  {/* Custom Size Switch */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      label=""
                      defaultChecked={selectSize}
                      onChange={setSelectSize}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Có thể tùy chỉnh kích thước
                    </span>
                  </div>

                  {/* Width and Height inputs - Always visible */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="width">Chiều rộng</Label>
                      <Input
                        id="width"
                        type="number"
                        placeholder="0"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Chiều cao</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="0"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="size-unit">Đơn vị</Label>
                      <Select
                        options={[
                          { value: 'px', label: 'px' },
                          { value: 'cm', label: 'cm' },
                        ]}
                        placeholder="Chọn đơn vị"
                        onChange={setSizeDv}
                        defaultValue={sizeDv}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <Label htmlFor="aspect-ratio">Tỉ lệ màn hình (%)</Label>
                <Input
                  id="aspect-ratio"
                  type="number"
                  placeholder="Ví dụ: 100%"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                />
              </div>

              {/* Image Size Settings */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Size upload
                </h3>
                <div className="space-y-4">
                  {/* Select Image Square Switch */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      label=""
                      defaultChecked={selectImageSq}
                      onChange={setSelectImageSq}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Chọn hình vuông
                    </span>
                  </div>

                  {/* Image Size inputs - Always visible */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="image-size-w">Chiều rộng hình</Label>
                      <Input
                        id="image-size-w"
                        type="number"
                        placeholder="0"
                        value={imageSizeW}
                        onChange={(e) => setImageSizeW(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-size-h">Chiều cao hình</Label>
                      <Input
                        id="image-size-h"
                        type="number"
                        placeholder="0"
                        value={imageSizeH}
                        onChange={(e) => setImageSizeH(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-quality">Chất lượng hình</Label>
                      <Input
                        id="image-quality"
                        type="number"
                        placeholder="80"
                        value={imageQuality}
                        onChange={(e) => setImageQuality(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    label=""
                    defaultChecked={showMockup}
                    onChange={setShowMockup}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Xuất hình mockup
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    label=""
                    defaultChecked={chooseMainMockup}
                    onChange={setChooseMainMockup}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn hình mockup làm đại diện
                  </span>
                </div>

                {/* Outline Input */}
                <div>
                  <Label htmlFor="outline">Outline hình</Label>
                  <Input
                    id="outline"
                    type="number"
                    placeholder="(outline hình, mặc định 18, có thể tăng giảm tuỳ theo độ dày)"
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">(outline hình, mặc định 18, có thể tăng giảm tuỳ theo độ dày)</p>
                  <p className="text-xs text-gray-500 mt-1">Tuỳ chỉnh thông số xuất hình.</p>
                  <ul className="list-disc list-inside text-xs text-gray-500 mt-1">
                    <li>Có thể tuỳ chỉnh màu nền mockup</li>
                    <li>mã màu #000000 khi cài đặt là không nền</li>
                    <li>Mặc định xoá hình nền khi chọn</li>
                  </ul>
                </div>

                {/* Size Export Input */}
                <div>
                  <Label htmlFor="size-export">Kích thước tải file in px</Label>
                  <Input
                    id="size-export"
                    type="number"
                    placeholder="Ví dụ: 3000"
                    value={sizeExport}
                    onChange={(e) => setSizeExport(e.target.value)}
                  />
                </div>

                {/* Text Banner Textarea */}
                <div>
                  <Label htmlFor="text-banner">Nội dung banner</Label>
                  <TextArea
                    placeholder="Nhập nội dung banner..."
                    rows={4}
                    value={textBanner}
                    onChange={setTextBanner}
                  />
                </div>
              </div>

              {/* Product Settings */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cài đặt hiển thị sản phẩm
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="position">Vị trí</Label>
                    <Input
                      id="position"
                      type="number"
                      placeholder="0"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="num-products">Số SP</Label>
                    <Input
                      id="num-products"
                      type="number"
                      placeholder="10"
                      value={numProducts}
                      onChange={(e) => setNumProducts(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="num-columns">Số Cột</Label>
                    <Input
                      id="num-columns"
                      type="number"
                      placeholder="3"
                      value={numColumns}
                      onChange={(e) => setNumColumns(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hình ảnh và tệp tin
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Icon */}
              <DragDropUpload
                label="Icon sản phẩm"
                placeholder="Upload icon sản phẩm"
                selectedFile={null}
                previewUrl={productIcon || previewUrls.productIconPreview}
                onFileSelect={handleProductIconSelect}
                maxSize={2}
                accept="image/*"
                isLoading={uploadingIcon}
              />

              {/* Product Image */}
              <DragDropUpload
                label="Hình sản phẩm"
                placeholder="Upload hình sản phẩm"
                selectedFile={null}
                previewUrl={productImage || previewUrls.productImagePreview}
                onFileSelect={handleProductImageSelect}
                maxSize={5}
                accept="image/*"
                isLoading={uploadingImage}
              />

              {/* Penci Image */}
              <DragDropUpload
                label="Hình trên Penci"
                placeholder="Upload hình cho Penci"
                selectedFile={null}
                previewUrl={penciImage || previewUrls.penciImagePreview}
                onFileSelect={handlePenciImageSelect}
                maxSize={5}
                accept="image/*"
                isLoading={uploadingPenci}
              />

              {/* Banner Image */}
              <DragDropUpload
                label="Hình banner"
                placeholder="Upload hình banner"
                selectedFile={null}
                previewUrl={bannerImage || previewUrls.bannerImagePreview}
                onFileSelect={handleBannerImageSelect}
                maxSize={10}
                accept="image/*"
                isLoading={uploadingBanner}
              />
            </div>
          </div>

          {/* Page Management */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Số Page
            </h2>

            <div className="space-y-4">
              {/* Page Settings */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <Switch
                    label=""
                    defaultChecked={canAddPages}
                    onChange={setCanAddPages}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Có thể thêm số page
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = Math.max(...pageContext.map(p => p.id), 0) + 1;
                    setPageContext([...pageContext, { id: newId, name: '', img: '' }]);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {/* Page Inputs - Always visible */}
              {pageContext.map((page, index) => (
                <div key={page.id} className="p-4 border border-gray-200 rounded-lg dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page {index + 1}
                    </span>
                    {pageContext.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPageContext(pageContext.filter(p => p.id !== page.id));
                        }}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Nhập tên page hoặc bỏ trống"
                      value={page.name}
                      onChange={(e) => {
                        const updatedPages = [...pageContext];
                        if (updatedPages[index]) {
                          updatedPages[index].name = e.target.value;
                          setPageContext(updatedPages);
                        }
                      }}
                    />
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Handle image upload here
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const updatedPages = [...pageContext];
                              if (updatedPages[index]) {
                                // Create preview URL for the image
                                const previewUrl = URL.createObjectURL(file);
                                updatedPages[index].img = previewUrl;
                                setPageContext(updatedPages);
                              }
                            }
                          };
                          input.click();
                        }}
                      >
                        Thêm background
                      </Button>
                      {page.img && (
                        <div className="flex items-center space-x-2">
                          <img
                            src={page.img}
                            alt={`Page ${index + 1} background`}
                            className="w-8 h-8 object-cover rounded border"
                          />
                          <span className="text-xs text-gray-500">Background đã chọn</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Show Product Switch */}
          <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg dark:border-gray-600 bg-white dark:bg-white/[0.03]">
            <Switch
              label=""
              defaultChecked={showProduct}
              onChange={setShowProduct}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hiển thị sản phẩm
            </span>
          </div>
        </div>

        {/* Right Column - Tags */}
        <div className="space-y-6">
          {/* Template Types */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Kiểu mẫu
            </h3>
            <MultiSelect
              label=""
              options={multiselectOptions.template_types.map(option => ({
                value: option.value,
                text: option.label,
                selected: false,
              }))}
              defaultSelected={templateTypes}
              onChange={setTemplateTypes}
            />
            {multiselectError && (
              <p className="text-sm text-red-500 mt-1">Lỗi tải kiểu mẫu: {multiselectError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Chọn các kiểu mẫu phù hợp</p>
          </div>

          {/* Collections */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bộ sưu tập
            </h3>
            <MultiSelect
              label=""
              options={multiselectOptions.collections.map(option => ({
                value: option.value,
                text: option.label,
                selected: false,
              }))}
              defaultSelected={collections}
              onChange={setCollections}
            />
            {multiselectError && (
              <p className="text-sm text-red-500 mt-1">Lỗi tải bộ sưu tập: {multiselectError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Chọn bộ sưu tập phù hợp</p>
          </div>

          {/* Text Styles */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Textstyles
            </h3>
            <MultiSelect
              label=""
              options={multiselectOptions.text_styles.map(option => ({
                value: option.value,
                text: option.label,
                selected: false,
              }))}
              defaultSelected={textStyles}
              onChange={setTextStyles}
            />
            {multiselectError && (
              <p className="text-sm text-red-500 mt-1">Lỗi tải kiểu chữ: {multiselectError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Chọn kiểu chữ hỗ trợ</p>
          </div>

          {/* Frames */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Frames
            </h3>
            <MultiSelect
              label=""
              options={multiselectOptions.frames.map(option => ({
                value: option.value,
                text: option.label,
                selected: false,
              }))}
              defaultSelected={frames}
              onChange={setFrames}
            />
            {multiselectError && (
              <p className="text-sm text-red-500 mt-1">Lỗi tải khung hình: {multiselectError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Chọn khung hình hỗ trợ</p>
          </div>

          {/* Images */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hình ảnh
            </h3>
            <MultiSelect
              label=""
              options={multiselectOptions.images.map(option => ({
                value: option.value,
                text: option.label,
                selected: false,
              }))}
              defaultSelected={images}
              onChange={setImages}
            />
            {multiselectError && (
              <p className="text-sm text-red-500 mt-1">Lỗi tải hình ảnh: {multiselectError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Chọn hình ảnh hỗ trợ</p>
          </div>

          {/* QR Codes */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              QR Codes
            </h3>
            <MultiSelect
              label=""
              options={multiselectOptions.qr_codes.map(option => ({
                value: option.value,
                text: option.label,
                selected: false,
              }))}
              defaultSelected={qrCodes}
              onChange={setQrCodes}
            />
            {multiselectError && (
              <p className="text-sm text-red-500 mt-1">Lỗi tải QR code: {multiselectError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Chọn các loại QR code</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/products')}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isLoading}
          startIcon={<SaveIcon />}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;