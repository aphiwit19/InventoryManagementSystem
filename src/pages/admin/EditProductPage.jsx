import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProductById, updateProduct, DEFAULT_UNITS, DEFAULT_CATEGORIES, DEFAULT_SIZES, DEFAULT_COLORS } from '../../services';
import { storage } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import styles from './EditProductPage.module.css';

export default function EditProductPage() {
  const { t } = useTranslation();
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
  });

  // Toggle for variants mode
  const [hasVariants, setHasVariants] = useState(false);

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

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await getProductById(id);
        
        // Parse date
        const addDate = product.addDate?.toDate ? product.addDate.toDate() : new Date(product.addDate);
        const formattedDate = addDate.toISOString().split('T')[0];

        setFormData({
          productName: product.productName || '',
          description: product.description || '',
          purchaseLocation: product.purchaseLocation || '',
          image: product.image || '',
          addDate: formattedDate,
          unit: product.unit || '',
          category: product.category || '',
        });

        if (product.image) {
          setImagePreview(product.image);
        }

        // Check if has variants
        if (product.hasVariants && Array.isArray(product.variants)) {
          setHasVariants(true);
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
        if (product.category && !DEFAULT_CATEGORIES.includes(product.category)) {
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
  }, [id]);

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
      alert(t('product.variant_incomplete'));
      return;
    }
    const exists = variants.find(v => v.size === newVariant.size && v.color === newVariant.color);
    if (exists) {
      alert(t('product.variant_duplicate'));
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
          {/* Breadcrumbs */}
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <ol className={styles.breadcrumbList}>
              <li className={styles.breadcrumbItem}>
                <Link to="/admin/dashboard" className={styles.breadcrumbLink}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', marginRight: '0.25rem' }}>home</span>
                  {t('common.home')}
                </Link>
              </li>
              <li className={styles.breadcrumbItem}>
                <span className={`material-symbols-outlined ${styles.breadcrumbSeparator}`}>chevron_right</span>
                <Link to="/admin/products" className={styles.breadcrumbLink}>{t('admin.products')}</Link>
              </li>
              <li className={styles.breadcrumbItem}>
                <span className={`material-symbols-outlined ${styles.breadcrumbSeparator}`}>chevron_right</span>
                <span className={styles.breadcrumbCurrent}>{t('product.edit_product')}</span>
              </li>
            </ol>
          </nav>

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
                        name="category"
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setShowCustomCategory(true);
                            setFormData(prev => ({ ...prev, category: '' }));
                          } else {
                            handleChange(e);
                          }
                        }}
                        required
                        className={styles.formSelect}
                      >
                        <option value="">-- {t('product.select_category')} --</option>
                        {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`, c)}</option>)}
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
                          onClick={() => { setShowCustomCategory(false); setFormData(prev => ({ ...prev, category: '' })); }}
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

              {/* Pricing & Inventory Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>
                    <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>payments</span>
                    {t('product.pricing_inventory')}
                  </h2>
                </div>

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
                              {DEFAULT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
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
      </div>
    </div>
  );
}
