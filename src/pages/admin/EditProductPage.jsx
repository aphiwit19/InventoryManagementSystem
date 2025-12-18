import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getProductById,
  updateProduct,
  DEFAULT_UNITS,
  DEFAULT_SIZES,
  DEFAULT_SHOE_SIZES,
  DEFAULT_COLORS,
  getAllCategories,
  getCategoryNameByLang,
  listSerialItems,
  bulkImportSerialItems,
} from '../../services';
import { storage } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import styles from './EditProductPage.module.css';

export default function EditProductPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  // Basic product info
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    purchaseLocation: '',
    image: '',
    addDate: '',
    unit: '',
    category: '',
    categoryId: '',
    categoryName: null,
  });

  const [categories, setCategories] = useState([]);
  const lang = useMemo(() => i18n.language || 'th', [i18n.language]);

  const [inventoryMode, setInventoryMode] = useState('bulk');
  const [specs, setSpecs] = useState({
    brand: '',
    model: '',
    cpu: '',
    ramGb: '',
    storageGb: '',
    storageType: '',
  });
  const [warranty, setWarranty] = useState({
    type: 'manufacturer',
    months: '',
    startPolicy: 'activated_date',
  });

  const [serialStatusFilter, setSerialStatusFilter] = useState('');
  const [serialItems, setSerialItems] = useState([]);
  const [serialLoading, setSerialLoading] = useState(false);
  const [serialImportText, setSerialImportText] = useState('');
  const [serialImportResult, setSerialImportResult] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const rows = await getAllCategories({ activeOnly: true });
        setCategories(rows);
      } catch (e) {
        console.error('Error loading categories:', e);
      }
    };
    loadCategories();
  }, []);

  // Toggle for variants mode
  const [hasVariants, setHasVariants] = useState(false);

  const [sizePreset, setSizePreset] = useState('clothing');

  // For non-variant products
  const [simpleProduct, setSimpleProduct] = useState({
    costPrice: '',
    sellPrice: '',
    quantity: '',
  });

  // For variant products
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    quantity: '',
    costPrice: '',
    sellPrice: '',
  });

  // Custom input toggles
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [showCustomColor, setShowCustomColor] = useState(false);

  // Promotion state
  const [promotion, setPromotion] = useState({
    active: false,
    type: 'percentage',
    value: '',
    startDate: '',
    endDate: '',
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [popupMessage, setPopupMessage] = useState('');

  const isElectronics = formData.categoryId === 'electronics';
  const isSerialized = inventoryMode === 'serialized';

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await getProductById(id);
        
        // Parse date
        const addDate = product.addDate?.toDate ? product.addDate.toDate() : new Date(product.addDate);
        const formattedDate = addDate.toISOString().split('T')[0];

        const resolvedCategoryId = product.categoryId || '';
        const resolvedCategoryName = product.categoryName && typeof product.categoryName === 'object' ? product.categoryName : null;

        setFormData({
          productName: product.productName || '',
          description: product.description || '',
          purchaseLocation: product.purchaseLocation || '',
          image: product.image || '',
          addDate: formattedDate,
          unit: product.unit || '',
          category: product.category || '',
          categoryId: resolvedCategoryId,
          categoryName: resolvedCategoryName,
        });

        setInventoryMode(product.inventoryMode || 'bulk');

        const pSpecs = product.specs && typeof product.specs === 'object' ? product.specs : {};
        setSpecs({
          brand: pSpecs.brand || '',
          model: pSpecs.model || '',
          cpu: pSpecs.cpu || '',
          ramGb: pSpecs.ramGb ?? '',
          storageGb: pSpecs.storageGb ?? '',
          storageType: pSpecs.storageType || '',
        });

        const pWarranty = product.warranty && typeof product.warranty === 'object' ? product.warranty : {};
        setWarranty({
          type: pWarranty.type || 'manufacturer',
          months: pWarranty.months ?? '',
          startPolicy: 'activated_date',
        });

        if (product.image) {
          setImagePreview(product.image);
        }

        // Check if has variants
        if (product.hasVariants && Array.isArray(product.variants)) {
          setHasVariants(true);

          const looksLikeShoeSizes = product.variants.some((v) => {
            const s = String(v.size || '').trim();
            return s !== '' && /^\d+(\.\d+)?$/.test(s);
          });
          setSizePreset(looksLikeShoeSizes ? 'shoe' : 'clothing');

          setVariants(product.variants.map((v, idx) => ({
            ...v,
            id: idx,
          })));
        } else {
          setHasVariants(false);
          setSimpleProduct({
            costPrice: product.costPrice || '',
            sellPrice: product.sellPrice || product.price || '',
            quantity: product.quantity || '',
          });
        }

        // Load promotion data
        if (product.promotion) {
          setPromotion({
            active: product.promotion.active || false,
            type: product.promotion.type || 'percentage',
            value: product.promotion.value || '',
            startDate: product.promotion.startDate || '',
            endDate: product.promotion.endDate || '',
          });
        }

        // Check custom unit/category
        if (product.unit && !DEFAULT_UNITS.includes(product.unit)) {
          setShowCustomUnit(true);
        }
        if (!product.categoryId && product.category) {
          // legacy string-only category
          setShowCustomCategory(true);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError(t('product.not_found'));
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, t]);

  useEffect(() => {
    const refreshSerials = async () => {
      if (!id) return;
      if (!isElectronics || !isSerialized) return;

      setSerialLoading(true);
      try {
        const rows = await listSerialItems(id, { status: serialStatusFilter || undefined });
        setSerialItems(rows);
      } catch (e) {
        console.error('Error loading serial items:', e);
        setPopupMessage(t('product.serial_load_failed', { message: e.message || '' }));
      } finally {
        setSerialLoading(false);
      }
    };

    refreshSerials();
  }, [id, isElectronics, isSerialized, serialStatusFilter, t]);

  const availableSizes = useMemo(() => {
    if (formData.categoryId === 'fashion' && sizePreset === 'shoe') return DEFAULT_SHOE_SIZES;
    return DEFAULT_SIZES;
  }, [formData.categoryId, sizePreset]);

  useEffect(() => {
    if (formData.categoryId !== 'fashion' && sizePreset !== 'clothing') {
      setSizePreset('clothing');
      setShowCustomSize(false);
      setNewVariant(prev => ({ ...prev, size: '' }));
    }
  }, [formData.categoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSimpleChange = (e) => {
    const { name, value } = e.target;
    setSimpleProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleNewVariantChange = (e) => {
    const { name, value } = e.target;
    setNewVariant(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (id, field, value) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    if (!newVariant.size || !newVariant.color || !newVariant.quantity || !newVariant.costPrice || !newVariant.sellPrice) {
      setPopupMessage(t('product.variant_incomplete'));
      return;
    }
    const exists = variants.find(v => v.size === newVariant.size && v.color === newVariant.color);
    if (exists) {
      setPopupMessage(t('product.variant_duplicate'));
      return;
    }
    setVariants(prev => [...prev, { ...newVariant, id: Date.now() }]);
    setNewVariant({ size: '', color: '', quantity: '', costPrice: '', sellPrice: '' });
    setShowCustomSize(false);
    setShowCustomColor(false);
  };

  const removeVariant = (id) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) return;
    try {
      setUploading(true);
      const path = `products/${Date.now()}_${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      setFormData(prev => ({ ...prev, image: url }));
      setImagePreview(url);
    } catch (err) {
      console.error(err);
      setUploadError(t('product.image_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (uploading) {
        throw new Error(t('product.image_uploading_wait'));
      }

      // Calculate promotion price if active
      let promotionData = null;
      
      if (promotion.active || promotion.value) {
        const basePrice = hasVariants ? 0 : parseFloat(simpleProduct.sellPrice || 0);
        let promotionPrice = basePrice;
        
        if (!hasVariants && promotion.value) {
          if (promotion.type === 'percentage') {
            promotionPrice = basePrice - (basePrice * parseFloat(promotion.value) / 100);
          } else {
            promotionPrice = basePrice - parseFloat(promotion.value);
          }
          promotionPrice = Math.max(0, promotionPrice);
        }

        promotionData = {
          active: promotion.active,
          type: promotion.type,
          value: promotion.value ? parseFloat(promotion.value) : 0,
          startDate: promotion.startDate || '',
          endDate: promotion.endDate || '',
          promotionPrice: !hasVariants && promotion.value ? promotionPrice : null,
        };
      }

      if (hasVariants) {
        if (variants.length === 0) {
          throw new Error(t('product.at_least_one_variant'));
        }
        await updateProduct(id, {
          ...formData,
          inventoryMode,
          specs: isElectronics ? {
            ...specs,
            ramGb: specs.ramGb === '' ? '' : parseInt(specs.ramGb) || 0,
            storageGb: specs.storageGb === '' ? '' : parseInt(specs.storageGb) || 0,
          } : null,
          warranty: isElectronics ? {
            ...warranty,
            months: warranty.months === '' ? '' : parseInt(warranty.months) || 0,
            startPolicy: 'activated_date',
          } : null,
          hasVariants: true,
          variants: variants.map(v => ({
            size: v.size,
            color: v.color,
            quantity: v.quantity,
            costPrice: v.costPrice,
            sellPrice: v.sellPrice,
            reserved: v.reserved || 0,
            staffReserved: v.staffReserved || 0,
          })),
          promotion: promotionData,
        });
      } else {
        if (!simpleProduct.quantity || !simpleProduct.costPrice || !simpleProduct.sellPrice) {
          throw new Error(t('product.price_qty_required'));
        }
        await updateProduct(id, {
          ...formData,
          inventoryMode,
          specs: isElectronics ? {
            ...specs,
            ramGb: specs.ramGb === '' ? '' : parseInt(specs.ramGb) || 0,
            storageGb: specs.storageGb === '' ? '' : parseInt(specs.storageGb) || 0,
          } : null,
          warranty: isElectronics ? {
            ...warranty,
            months: warranty.months === '' ? '' : parseInt(warranty.months) || 0,
            startPolicy: 'activated_date',
          } : null,
          hasVariants: false,
          ...simpleProduct,
          promotion: promotionData,
        });
      }

      navigate('/admin/products');
    } catch (err) {
      console.error('Error updating product:', err);
      setError(t('product.update_product_failed', { message: err.message || '' }));
    } finally {
      setSaving(false);
    }
  };

  const totalVariantQuantity = variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);

  const calculateProfitMargin = () => {
    const cost = parseFloat(simpleProduct.costPrice) || 0;
    const sell = parseFloat(simpleProduct.sellPrice) || 0;
    if (sell === 0) return 0;
    return Math.round(((sell - cost) / sell) * 100);
  };

  const calculatePromotionPrice = () => {
    const basePrice = parseFloat(simpleProduct.sellPrice) || 0;
    if (!promotion.value) return basePrice;
    if (promotion.type === 'percentage') {
      return Math.max(0, basePrice - (basePrice * parseFloat(promotion.value) / 100));
    }
    return Math.max(0, basePrice - parseFloat(promotion.value));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Sticky Header */}
      <header className={styles.stickyHeader}>
        <div className={styles.headerContent}>
          {/* Title Row */}
          <div className={styles.headerTitleRow}>
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.pageTitle}>
                {t('product.edit_product')}: {formData.productName || 'Product'}
              </h1>
              <p className={styles.pageSubtitle}>{t('product.update_product_info')}</p>
            </div>
            <div className={styles.headerActions}>
              <button 
                type="button" 
                onClick={() => navigate('/admin/products')} 
                className={styles.cancelButton}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>close</span>
                {t('common.cancel')}
              </button>
              <button 
                type="submit" 
                form="editProductForm"
                disabled={saving || uploading}
                className={styles.saveButton}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>save</span>
                {saving ? t('message.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className={styles.formContent}>
        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <form id="editProductForm" onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            {/* Left Column (Main Data) */}
            <div className={styles.mainColumn}>
              {/* Basic Info Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>info</span>
                    {t('product.basic_info')}
                  </h2>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                    {t('product.product_name')}
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('product.description')}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t('product.description_placeholder') || 'Enter product description...'}
                    className={styles.formTextarea}
                  />
                </div>

                <div className={styles.formRow2}>
                  {/* Unit */}
                  <div className={styles.formGroup}>
                    <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                      {t('common.unit')}
                    </label>
                    {!showCustomUnit ? (
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setShowCustomUnit(true);
                            setFormData(prev => ({ ...prev, unit: '' }));
                          } else {
                            handleChange(e);
                          }
                        }}
                        required
                        className={styles.formSelect}
                      >
                        <option value="">-- {t('product.select_unit')} --</option>
                        {DEFAULT_UNITS.map(u => <option key={u} value={u}>{t(`units.${u}`, u)}</option>)}
                        <option value="__custom__">+ {t('product.add_new_unit')}</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          name="unit"
                          value={formData.unit}
                          onChange={handleChange}
                          required
                          placeholder={t('product.type_new_unit')}
                          className={styles.formInput}
                        />
                        <button 
                          type="button" 
                          onClick={() => { setShowCustomUnit(false); setFormData(prev => ({ ...prev, unit: '' })); }}
                          className={styles.cancelButton}
                          style={{ padding: '0.5rem 0.75rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className={styles.formGroup}>
                    <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                      {t('product.category')}
                    </label>
                    {!showCustomCategory ? (
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setShowCustomCategory(true);
                            setFormData(prev => ({ ...prev, category: '', categoryId: '', categoryName: null }));
                          } else {
                            const selected = categories.find(c => c.id === e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              categoryId: e.target.value,
                              categoryName: selected?.name || null,
                              category: selected?.name?.th || '',
                            }));
                          }
                        }}
                        required
                        className={styles.formSelect}
                      >
                        <option value="">-- {t('product.select_category')} --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {getCategoryNameByLang(c, lang)}
                          </option>
                        ))}
                        <option value="__custom__">+ {t('product.add_new_category')}</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          placeholder={t('product.type_new_category')}
                          className={styles.formInput}
                        />
                        <button 
                          type="button" 
                          onClick={() => { setShowCustomCategory(false); setFormData(prev => ({ ...prev, category: '', categoryId: '', categoryName: null })); }}
                          className={styles.cancelButton}
                          style={{ padding: '0.5rem 0.75rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Media Gallery Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>imagesmode</span>
                    {t('product.product_media')}
                  </h2>
                </div>

                <div className={styles.mediaGrid}>
                  {/* Current Image */}
                  {imagePreview && (
                    <div className={styles.imagePreview}>
                      <img src={imagePreview} alt="preview" />
                      <div className={styles.imageOverlay}>
                        <label className={styles.imageActionButton}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#0f172a' }}>edit</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                      <div className={styles.mainBadge}>{t('product.main_badge')}</div>
                    </div>
                  )}

                </div>

                {uploadError && (
                  <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{uploadError}</p>
                )}
              </div>

              {isElectronics && isSerialized && (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>
                      <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>qr_code_scanner</span>
                      {t('product.serial_manager')}
                    </h2>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setSerialLoading(true);
                          const rows = await listSerialItems(id, { status: serialStatusFilter || undefined });
                          setSerialItems(rows);
                        } catch (e) {
                          console.error('Error loading serial items:', e);
                          setPopupMessage(t('product.serial_load_failed', { message: e.message || '' }));
                        } finally {
                          setSerialLoading(false);
                        }
                      }}
                      className={styles.cancelButton}
                      style={{ padding: '0.5rem 0.75rem' }}
                      disabled={serialLoading}
                    >
                      {t('common.refresh') || 'Refresh'}
                    </button>
                  </div>

                  <div className={styles.formRow2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('product.serial_filter_status')}</label>
                      <select
                        value={serialStatusFilter}
                        onChange={(e) => setSerialStatusFilter(e.target.value)}
                        className={styles.formSelect}
                      >
                        <option value="">{t('common.all')}</option>
                        <option value="available">{t('product.serial_status_available')}</option>
                        <option value="reserved">{t('product.serial_status_reserved')}</option>
                        <option value="sold">{t('product.serial_status_sold')}</option>
                        <option value="returned">{t('product.serial_status_returned')}</option>
                        <option value="damaged">{t('product.serial_status_damaged')}</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('product.serial_count')}</label>
                      <input
                        value={serialLoading ? t('common.loading') : String(serialItems.length)}
                        readOnly
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.divider}></div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t('product.serial_import')}</label>
                    <textarea
                      value={serialImportText}
                      onChange={(e) => setSerialImportText(e.target.value)}
                      rows={6}
                      placeholder={t('product.serial_import_placeholder')}
                      className={styles.formTextarea}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => { setSerialImportText(''); setSerialImportResult(null); }}
                        className={styles.cancelButton}
                        style={{ padding: '0.5rem 0.75rem' }}
                      >
                        {t('common.clear') || 'Clear'}
                      </button>
                      <button
                        type="button"
                        className={styles.saveButton}
                        style={{ padding: '0.5rem 0.75rem' }}
                        disabled={serialLoading}
                        onClick={async () => {
                          try {
                            setSerialLoading(true);
                            const res = await bulkImportSerialItems(id, serialImportText, {
                              costPrice: simpleProduct.costPrice || null,
                              warrantyProvider: warranty.type === 'store' ? 'store' : 'manufacturer',
                              warrantyMonths: warranty.months,
                              variantKey: null,
                            });
                            setSerialImportResult(res);
                            const rows = await listSerialItems(id, { status: serialStatusFilter || undefined });
                            setSerialItems(rows);
                          } catch (e) {
                            console.error('Error importing serial items:', e);
                            setPopupMessage(t('product.serial_import_failed', { message: e.message || '' }));
                          } finally {
                            setSerialLoading(false);
                          }
                        }}
                      >
                        {t('product.serial_import_button')}
                      </button>
                    </div>

                    {serialImportResult && (
                      <div className={styles.statusDescription} style={{ marginTop: 10 }}>
                        {t('product.serial_import_result', {
                          created: serialImportResult.created || 0,
                          skippedExisting: serialImportResult.skippedExisting || 0,
                          duplicatesInInput: serialImportResult.duplicatesInInput || 0,
                        })}
                      </div>
                    )}
                  </div>

                  <div className={styles.divider}></div>

                  {serialItems.length === 0 ? (
                    <div style={{ fontSize: 14, color: '#9ca3af' }}>{t('product.serial_no_items')}</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.variantsTable}>
                        <thead className={styles.variantsTableHead}>
                          <tr>
                            <th>{t('product.serial')}</th>
                            <th>{t('common.status')}</th>
                            <th>{t('order.order_id') || 'Order'}</th>
                            <th>{t('product.warranty')}</th>
                          </tr>
                        </thead>
                        <tbody className={styles.variantsTableBody}>
                          {serialItems.map((s) => (
                            <tr key={s.id}>
                              <td style={{ fontFamily: 'ui-monospace, monospace' }}>{s.serial || s.id}</td>
                              <td>{s.status || '-'}</td>
                              <td>{s.order?.orderId || '-'}</td>
                              <td>
                                {s.warranty?.startAt ? (s.warranty?.months ? `${s.warranty.months}m` : '-') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing & Inventory Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>payments</span>
                    {t('product.pricing_inventory')}
                  </h2>
                </div>

                {isElectronics && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('product.inventory_mode')}</label>
                      <select
                        value={inventoryMode}
                        onChange={(e) => setInventoryMode(e.target.value)}
                        className={styles.formSelect}
                      >
                        <option value="bulk">{t('product.inventory_mode_bulk')}</option>
                        <option value="serialized">{t('product.inventory_mode_serialized')}</option>
                      </select>
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>memory</span>
                        {t('product.electronics_specs')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.spec_brand')}</label>
                        <input
                          value={specs.brand}
                          onChange={(e) => setSpecs((p) => ({ ...p, brand: e.target.value }))}
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.spec_model')}</label>
                        <input
                          value={specs.model}
                          onChange={(e) => setSpecs((p) => ({ ...p, model: e.target.value }))}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.spec_cpu')}</label>
                        <input
                          value={specs.cpu}
                          onChange={(e) => setSpecs((p) => ({ ...p, cpu: e.target.value }))}
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.spec_ram_gb')}</label>
                        <input
                          type="number"
                          min="0"
                          value={specs.ramGb}
                          onChange={(e) => setSpecs((p) => ({ ...p, ramGb: e.target.value }))}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.spec_storage_gb')}</label>
                        <input
                          type="number"
                          min="0"
                          value={specs.storageGb}
                          onChange={(e) => setSpecs((p) => ({ ...p, storageGb: e.target.value }))}
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.spec_storage_type')}</label>
                        <input
                          value={specs.storageType}
                          onChange={(e) => setSpecs((p) => ({ ...p, storageType: e.target.value }))}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>verified</span>
                        {t('product.warranty')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.warranty_type')}</label>
                        <select
                          value={warranty.type}
                          onChange={(e) => setWarranty((p) => ({ ...p, type: e.target.value }))}
                          className={styles.formSelect}
                        >
                          <option value="none">{t('product.warranty_type_none')}</option>
                          <option value="manufacturer">{t('product.warranty_type_manufacturer')}</option>
                          <option value="store">{t('product.warranty_type_store')}</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.warranty_months')}</label>
                        <input
                          type="number"
                          min="0"
                          value={warranty.months}
                          onChange={(e) => setWarranty((p) => ({ ...p, months: e.target.value }))}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <div className={styles.statusDescription}>
                        {t('product.warranty_start_policy_activated_date')}
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {/* Variants Toggle */}
                <label className={styles.variantsToggle}>
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className={styles.variantsCheckbox}
                  />
                  <div className={styles.variantsToggleText}>
                    <div className={styles.variantsToggleTitle}>{t('product.has_variants')}</div>
                    <div className={styles.variantsToggleDesc}>{t('product.variants_description')}</div>
                  </div>
                </label>

                {/* Simple Product Pricing */}
                {!hasVariants && (
                  <>
                    <div className={styles.divider}></div>
                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                          {t('product.sell_price')}
                        </label>
                        <div className={styles.priceInputWrapper}>
                          <span className={styles.priceSymbol}>฿</span>
                          <input
                            type="number"
                            name="sellPrice"
                            value={simpleProduct.sellPrice}
                            onChange={handleSimpleChange}
                            required={!hasVariants}
                            min="0"
                            step="0.01"
                            className={`${styles.formInput} ${styles.priceInput}`}
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                          {t('product.cost_price')}
                        </label>
                        <div className={styles.priceInputWrapper}>
                          <span className={styles.priceSymbol}>฿</span>
                          <input
                            type="number"
                            name="costPrice"
                            value={simpleProduct.costPrice}
                            onChange={handleSimpleChange}
                            required={!hasVariants}
                            min="0"
                            step="0.01"
                            className={`${styles.formInput} ${styles.priceInput}`}
                          />
                        </div>
                        {simpleProduct.costPrice && simpleProduct.sellPrice && (
                          <p className={styles.profitMargin}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>trending_up</span>
                            {t('product.profit_margin')}: {calculateProfitMargin()}%
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.formRow3}>
                      <div className={styles.formGroup}>
                        <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                          {t('common.quantity')}
                        </label>
                        <div className={styles.quantityWrapper}>
                          <button 
                            type="button" 
                            onClick={() => setSimpleProduct(prev => ({ ...prev, quantity: Math.max(0, (parseInt(prev.quantity) || 0) - 1).toString() }))}
                            className={`${styles.quantityButton} ${styles.quantityButtonLeft}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>remove</span>
                          </button>
                          <input
                            type="number"
                            name="quantity"
                            value={simpleProduct.quantity}
                            onChange={handleSimpleChange}
                            required={!hasVariants}
                            min="0"
                            className={styles.quantityInput}
                          />
                          <button 
                            type="button" 
                            onClick={() => setSimpleProduct(prev => ({ ...prev, quantity: ((parseInt(prev.quantity) || 0) + 1).toString() }))}
                            className={`${styles.quantityButton} ${styles.quantityButtonRight}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                          </button>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.date_added')}</label>
                        <input
                          type="date"
                          name="addDate"
                          value={formData.addDate}
                          onChange={handleChange}
                          className={styles.formInput}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.purchase_location')}</label>
                        <input
                          type="text"
                          name="purchaseLocation"
                          value={formData.purchaseLocation}
                          onChange={handleChange}
                          placeholder={t('product.purchase_location_placeholder')}
                          className={styles.formInput}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Variants Section */}
                {hasVariants && (
                  <>
                    <div className={styles.divider}></div>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>style</span>
                        {t('product.variants_label')} ({variants.length} {t('common.items')}, {t('common.total')} {totalVariantQuantity} {formData.unit || t('common.piece')})
                      </h3>
                    </div>

                    {/* Variants Table */}
                    {variants.length > 0 && (
                      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                        <table className={styles.variantsTable}>
                          <thead className={styles.variantsTableHead}>
                            <tr>
                              <th>{t('product.size')} / {t('product.color')}</th>
                              <th>{t('common.quantity')}</th>
                              <th>{t('product.cost_price')}</th>
                              <th>{t('product.sell_price')}</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody className={styles.variantsTableBody}>
                            {variants.map(v => (
                              <tr key={v.id}>
                                <td>
                                  <div className={styles.variantCell}>
                                    <div className={styles.variantColorBox}></div>
                                    <span className={styles.variantName}>{v.size} / {v.color}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className={styles.stockIndicator}>
                                    <span className={`${styles.stockDot} ${(v.quantity || 0) > 10 ? styles.stockDotGreen : (v.quantity || 0) > 0 ? styles.stockDotOrange : styles.stockDotRed}`}></span>
                                    <input
                                      type="number"
                                      value={v.quantity}
                                      onChange={(e) => handleVariantChange(v.id, 'quantity', e.target.value)}
                                      min="0"
                                      style={{ width: '60px', padding: '0.25rem 0.5rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={v.costPrice}
                                    onChange={(e) => handleVariantChange(v.id, 'costPrice', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={v.sellPrice}
                                    onChange={(e) => handleVariantChange(v.id, 'sellPrice', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                  />
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => removeVariant(v.id)} 
                                    className={styles.variantDeleteButton}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add New Variant */}
                    <div className={styles.addVariantForm}>
                      <div className={styles.addVariantTitle}>+ {t('product.add_variant')}</div>

                      {formData.categoryId === 'fashion' && (
                        <div className={styles.formRow2} style={{ marginBottom: '0.75rem' }}>
                          <div>
                            <label className={styles.formLabel}>{t('product.size_preset')}</label>
                            <select
                              value={sizePreset}
                              onChange={(e) => {
                                setSizePreset(e.target.value);
                                setShowCustomSize(false);
                                setNewVariant(prev => ({ ...prev, size: '' }));
                              }}
                              className={styles.formSelect}
                            >
                              <option value="clothing">{t('product.size_preset_clothing')}</option>
                              <option value="shoe">{t('product.size_preset_shoe')}</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className={styles.formRow2} style={{ marginBottom: '0.75rem' }}>
                        {/* Size */}
                        <div>
                          {!showCustomSize ? (
                            <select
                              name="size"
                              value={newVariant.size}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setShowCustomSize(true);
                                  setNewVariant(prev => ({ ...prev, size: '' }));
                                } else {
                                  handleNewVariantChange(e);
                                }
                              }}
                              className={styles.formSelect}
                            >
                              <option value="">-- {t('product.select_size')} --</option>
                              {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                              <option value="__custom__">+ {t('product.add_new_size')}</option>
                            </select>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                name="size"
                                value={newVariant.size}
                                onChange={handleNewVariantChange}
                                placeholder={t('product.type_size')}
                                className={styles.formInput}
                              />
                              <button type="button" onClick={() => { setShowCustomSize(false); setNewVariant(prev => ({ ...prev, size: '' })); }}
                                style={{ padding: '0.5rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer' }}>✕</button>
                            </div>
                          )}
                        </div>

                        {/* Color */}
                        <div>
                          {!showCustomColor ? (
                            <select
                              name="color"
                              value={newVariant.color}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setShowCustomColor(true);
                                  setNewVariant(prev => ({ ...prev, color: '' }));
                                } else {
                                  handleNewVariantChange(e);
                                }
                              }}
                              className={styles.formSelect}
                            >
                              <option value="">-- {t('product.select_color')} --</option>
                              {DEFAULT_COLORS.map(c => <option key={c} value={c}>{t(`colors.${c}`, c)}</option>)}
                              <option value="__custom__">+ {t('product.add_new_color')}</option>
                            </select>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                name="color"
                                value={newVariant.color}
                                onChange={handleNewVariantChange}
                                placeholder={t('product.type_color')}
                                className={styles.formInput}
                              />
                              <button type="button" onClick={() => { setShowCustomColor(false); setNewVariant(prev => ({ ...prev, color: '' })); }}
                                style={{ padding: '0.5rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer' }}>✕</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.formRow3} style={{ marginBottom: '0.75rem' }}>
                        <input
                          type="number"
                          name="quantity"
                          value={newVariant.quantity}
                          onChange={handleNewVariantChange}
                          min="1"
                          placeholder={t('common.quantity')}
                          className={styles.formInput}
                        />
                        <input
                          type="number"
                          name="costPrice"
                          value={newVariant.costPrice}
                          onChange={handleNewVariantChange}
                          min="0"
                          step="0.01"
                          placeholder={t('product.cost_price')}
                          className={styles.formInput}
                        />
                        <input
                          type="number"
                          name="sellPrice"
                          value={newVariant.sellPrice}
                          onChange={handleNewVariantChange}
                          min="0"
                          step="0.01"
                          placeholder={t('product.sell_price')}
                          className={styles.formInput}
                        />
                      </div>

                      <button type="button" onClick={addVariant} className={styles.addVariantButton}>
                        + {t('product.add_variant')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column (Sidebar/Meta) */}
            <div className={styles.sideColumn}>
              {/* Promotions Card */}
              <div className={styles.card}>
                <div className={styles.promotionToggle}>
                  <h2 className={styles.cardTitleSmall} style={{ margin: 0 }}>{t('product.promotions')}</h2>
                  <div 
                    className={`${styles.promotionSwitch} ${promotion.active ? styles.active : ''}`}
                    onClick={() => setPromotion({ ...promotion, active: !promotion.active })}
                  >
                    <div className={styles.promotionSwitchThumb}></div>
                  </div>
                </div>

                {promotion.active && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        {promotion.type === 'percentage' ? t('product.discount_percent') : t('product.discount_amount')}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <select
                          value={promotion.type}
                          onChange={(e) => setPromotion({ ...promotion, type: e.target.value })}
                          className={styles.formSelect}
                          style={{ width: 'auto' }}
                        >
                          <option value="percentage">{t('product.percent')}</option>
                          <option value="fixed">{t('product.fixed_amount')}</option>
                        </select>
                      </div>
                      <input
                        type="number"
                        value={promotion.value}
                        onChange={(e) => setPromotion({ ...promotion, value: e.target.value })}
                        min="0"
                        step={promotion.type === 'percentage' ? '1' : '0.01'}
                        placeholder={promotion.type === 'percentage' ? t('product.eg_20') : t('product.eg_100')}
                        className={`${styles.formInput} ${styles.promotionPriceInput}`}
                      />
                    </div>

                    <div className={styles.promotionDateGrid}>
                      <div>
                        <label className={styles.promotionDateLabel}>{t('product.start_date')}</label>
                        <input
                          type="date"
                          value={promotion.startDate}
                          onChange={(e) => setPromotion({ ...promotion, startDate: e.target.value })}
                          className={styles.promotionDateInput}
                        />
                      </div>
                      <div>
                        <label className={styles.promotionDateLabel}>{t('product.end_date')}</label>
                        <input
                          type="date"
                          value={promotion.endDate}
                          onChange={(e) => setPromotion({ ...promotion, endDate: e.target.value })}
                          className={styles.promotionDateInput}
                        />
                      </div>
                    </div>

                    {/* Price Preview */}
                    {!hasVariants && promotion.value && simpleProduct.sellPrice && (
                      <div className={styles.pricePreview}>
                        <div className={styles.pricePreviewLabel}>💵 {t('product.price_after_discount')}:</div>
                        <div className={styles.pricePreviewRow}>
                          <span className={styles.pricePreviewNew}>
                            ฿{calculatePromotionPrice().toLocaleString()}
                          </span>
                          <span className={styles.pricePreviewOld}>
                            ฿{parseFloat(simpleProduct.sellPrice).toLocaleString()}
                          </span>
                          <span className={styles.pricePreviewBadge}>
                            🔥 {t('product.discount')} {promotion.type === 'percentage' ? `${promotion.value}%` : `฿${promotion.value}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer spacing */}
        <div className={styles.footerSpacing}></div>

        {popupMessage && (
          <div
            onClick={() => setPopupMessage('')}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '28rem',
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{t('common.notice')}</div>
                <button
                  type="button"
                  onClick={() => setPopupMessage('')}
                  style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '1rem 1.25rem', color: '#0f172a' }}>{popupMessage}</div>
              <div style={{ padding: '0 1.25rem 1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPopupMessage('')}
                  className={styles.saveButton}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {t('common.ok')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
