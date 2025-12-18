import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProduct, DEFAULT_UNITS, DEFAULT_SIZES, DEFAULT_SHOE_SIZES, DEFAULT_COLORS, getAllCategories, getCategoryNameByLang, updateCategory } from '../../services';
import { storage } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import styles from './AddProductPage.module.css';

export default function AddProductPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Basic product info
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    purchaseLocation: '',
    image: '',
    addDate: new Date().toISOString().split('T')[0],
    unit: '',
    category: '',
    categoryId: '',
    categoryName: null,
  });

  const [categories, setCategories] = useState([]);
  const lang = useMemo(() => i18n.language || 'th', [i18n.language]);
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.categoryId) || null,
    [categories, formData.categoryId]
  );

  const loadCategories = useCallback(async () => {
    try {
      const rows = await getAllCategories({ activeOnly: true });
      setCategories(rows);
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
  const [autoUnitValue, setAutoUnitValue] = useState('');

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
  }, [formData.categoryId, sizePreset]);

  // UI states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [popupMessage, setPopupMessage] = useState('');

  const isElectronics = formData.categoryId === 'electronics';
  const isFashion = formData.categoryId === 'fashion';
  const isFoodBeverage = formData.categoryId === 'food_beverage';
  const isBeautyPersonalCare = formData.categoryId === 'beauty_personal_care';
  const isOfficeStationery = formData.categoryId === 'office_stationery';
  const isToolsHardware = formData.categoryId === 'tools_hardware';
  const isHomeKitchen = formData.categoryId === 'home_kitchen';
  const isAutomotive = formData.categoryId === 'automotive';
  const isSportsOutdoor = formData.categoryId === 'sports_outdoor';
  const isToysKids = formData.categoryId === 'toys_kids';

  const unitConfig = useMemo(() => {
    switch (formData.categoryId) {
      case 'food_beverage':
        return { defaultUnit: 'แพ็ก', preferredUnits: ['แพ็ก', 'ชิ้น', 'กล่อง'] };
      case 'beauty_personal_care':
        return { defaultUnit: 'ขวด', preferredUnits: ['ขวด', 'ชิ้น', 'กล่อง', 'แพ็ก'] };
      case 'office_stationery':
        return { defaultUnit: 'ชิ้น', preferredUnits: ['ชิ้น', 'กล่อง', 'แพ็ก', 'รีม'] };
      case 'tools_hardware':
        return { defaultUnit: 'อัน', preferredUnits: ['อัน', 'ชิ้น', 'กล่อง', 'แพ็ก'] };
      case 'fashion':
        return { defaultUnit: 'ตัว', preferredUnits: ['ตัว', 'ชิ้น', 'คู่'] };
      case 'electronics':
      case 'home_kitchen':
      case 'automotive':
      case 'sports_outdoor':
      case 'toys_kids':
        return { defaultUnit: 'ชิ้น', preferredUnits: ['ชิ้น', 'อัน', 'กล่อง', 'แพ็ก'] };
      default:
        return { defaultUnit: 'ชิ้น', preferredUnits: ['ชิ้น', 'อัน', 'กล่อง', 'แพ็ก'] };
    }
  }, [formData.categoryId]);

  const unitOptions = useMemo(() => {
    const preferred = Array.isArray(unitConfig.preferredUnits) ? unitConfig.preferredUnits : [];
    const seen = new Set();
    const ordered = [];
    for (const u of preferred) {
      if (!u || seen.has(u)) continue;
      seen.add(u);
      ordered.push(u);
    }
    for (const u of DEFAULT_UNITS) {
      if (!u || seen.has(u)) continue;
      seen.add(u);
      ordered.push(u);
    }
    return ordered;
  }, [unitConfig.preferredUnits]);

  useEffect(() => {
    if (showCustomUnit) return;
    if (!formData.categoryId) return;
    if (!unitConfig.defaultUnit) return;
    if (formData.unit && formData.unit !== autoUnitValue) return;
    setFormData((prev) => ({ ...prev, unit: unitConfig.defaultUnit }));
    setAutoUnitValue(unitConfig.defaultUnit);
  }, [formData.categoryId, formData.unit, showCustomUnit, unitConfig.defaultUnit, autoUnitValue]);
  const [inventoryMode, setInventoryMode] = useState('bulk');
  const [specs, setSpecs] = useState({
    brand: '',
    model: '',
    cpu: '',
    ramGb: '',
    storageGb: '',
    storageType: '',
  });

  const [electronicsVariationInputs, setElectronicsVariationInputs] = useState({
    ram: '',
    storage: '',
    color: '',
    screenSize: '',
    condition: '',
  });

  const [fashionVariationInputs, setFashionVariationInputs] = useState({
    fitStyle: '',
    length: '',
    pattern: '',
    gender: '',
  });

  const [foodVariationInputs, setFoodVariationInputs] = useState({
    flavor: '',
    sizeWeight: '',
    volume: '',
    packageType: '',
  });

  const [beautyVariationInputs, setBeautyVariationInputs] = useState({
    shadeTone: '',
    volume: '',
    skinType: '',
    spf: '',
  });

  const [officeVariationInputs, setOfficeVariationInputs] = useState({
    color: '',
    size: '',
    tipSize: '',
    packSize: '',
  });

  const [toolsVariationInputs, setToolsVariationInputs] = useState({
    size: '',
    material: '',
    voltagePower: '',
    type: '',
  });

  const [homeKitchenVariationInputs, setHomeKitchenVariationInputs] = useState({
    capacity: '',
    powerWattage: '',
    color: '',
  });

  const [automotiveVariationInputs, setAutomotiveVariationInputs] = useState({
    oemAftermarket: '',
    sizeDimension: '',
    material: '',
  });

  const [sportsOutdoorVariationInputs, setSportsOutdoorVariationInputs] = useState({
    level: '',
    gender: '',
    ageGroup: '',
  });

  const [toysKidsVariationInputs, setToysKidsVariationInputs] = useState({
    ageRange: '',
    batteryRequired: '',
    batteryType: '',
  });

  const [categorySpecs, setCategorySpecs] = useState({});
  const [showAddCategorySpec, setShowAddCategorySpec] = useState(false);
  const [newCategorySpec, setNewCategorySpec] = useState({ key: '', labelTh: '', labelEn: '', type: 'text' });
  const [savingCategorySpec, setSavingCategorySpec] = useState(false);
  const [showManageCategorySpecs, setShowManageCategorySpecs] = useState(false);
  const [manageCategorySpecKeys, setManageCategorySpecKeys] = useState([]);
  const [savingManageCategorySpecs, setSavingManageCategorySpecs] = useState(false);

  const saveCategorySpecKey = async () => {
    if (!formData.categoryId) {
      setPopupMessage('กรุณาเลือกหมวดหมู่ก่อน');
      return;
    }
    if (!selectedCategory) {
      setPopupMessage('ไม่พบข้อมูลหมวดหมู่');
      return;
    }

    const key = String(newCategorySpec.key || '').trim();
    const labelTh = String(newCategorySpec.labelTh || '').trim();
    const labelEn = String(newCategorySpec.labelEn || '').trim();
    const type = String(newCategorySpec.type || 'text');

    if (!key) {
      setPopupMessage('กรุณากรอก key ของสเปค');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(key)) {
      setPopupMessage('key ต้องเป็นตัวอักษร a-z ตัวเลข หรือ _ (underscore) เท่านั้น');
      return;
    }
    if (!labelTh && !labelEn) {
      setPopupMessage('กรุณากรอกชื่อสเปคอย่างน้อย 1 ภาษา');
      return;
    }

    const existing = Array.isArray(selectedCategory.specKeys) ? selectedCategory.specKeys : [];
    if (existing.some((sk) => String(sk?.key || '').trim() === key)) {
      setPopupMessage('มี key นี้อยู่แล้วในหมวดหมู่');
      return;
    }

    const nextSpecKeys = [
      ...existing,
      {
        key,
        label: {
          th: labelTh || labelEn || key,
          en: labelEn || labelTh || key,
        },
        type: type === 'number' || type === 'textarea' ? type : 'text',
      },
    ];

    const nextFeatures = {
      ...(selectedCategory?.features && typeof selectedCategory.features === 'object' ? selectedCategory.features : {}),
      specs: true,
    };

    setSavingCategorySpec(true);
    try {
      await updateCategory(formData.categoryId, {
        features: nextFeatures,
        specKeys: nextSpecKeys,
      });
      await loadCategories();
      setShowAddCategorySpec(false);
      setNewCategorySpec({ key: '', labelTh: '', labelEn: '', type: 'text' });
      setPopupMessage('เพิ่มช่องสเปคเรียบร้อย');
    } catch (e) {
      console.error(e);
      setPopupMessage('เพิ่มช่องสเปคไม่สำเร็จ');
    } finally {
      setSavingCategorySpec(false);
    }
  };

  const openManageCategorySpecs = () => {
    if (!selectedCategory) {
      setPopupMessage('ไม่พบข้อมูลหมวดหมู่');
      return;
    }
    const existing = Array.isArray(selectedCategory.specKeys) ? selectedCategory.specKeys : [];
    setManageCategorySpecKeys(
      existing.map((sk) => ({
        key: String(sk?.key || '').trim(),
        labelTh: String(sk?.label?.th || ''),
        labelEn: String(sk?.label?.en || ''),
        type: String(sk?.type || 'text'),
      }))
    );
    setShowManageCategorySpecs(true);
  };

  const saveManagedCategorySpecs = async () => {
    if (!formData.categoryId) {
      setPopupMessage('กรุณาเลือกหมวดหมู่ก่อน');
      return;
    }
    if (!selectedCategory) {
      setPopupMessage('ไม่พบข้อมูลหมวดหมู่');
      return;
    }

    const rows = Array.isArray(manageCategorySpecKeys) ? manageCategorySpecKeys : [];
    const cleaned = [];
    const seen = new Set();
    for (const r of rows) {
      const key = String(r?.key || '').trim();
      if (!key) continue;
      if (seen.has(key)) {
        setPopupMessage('พบ key ซ้ำในรายการสเปค');
        return;
      }
      seen.add(key);

      const labelTh = String(r?.labelTh || '').trim();
      const labelEn = String(r?.labelEn || '').trim();
      const type = String(r?.type || 'text');
      cleaned.push({
        key,
        label: {
          th: labelTh || labelEn || key,
          en: labelEn || labelTh || key,
        },
        type: type === 'number' || type === 'textarea' ? type : 'text',
      });
    }

    if (cleaned.length === 0) {
      setPopupMessage('ไม่มีรายการสเปคให้บันทึก');
      return;
    }

    const nextFeatures = {
      ...(selectedCategory?.features && typeof selectedCategory.features === 'object' ? selectedCategory.features : {}),
      specs: true,
    };

    setSavingManageCategorySpecs(true);
    try {
      await updateCategory(formData.categoryId, {
        features: nextFeatures,
        specKeys: cleaned,
      });
      await loadCategories();
      setShowManageCategorySpecs(false);
      setPopupMessage('บันทึกชื่อสเปคเรียบร้อย');
    } catch (e) {
      console.error(e);
      setPopupMessage('บันทึกชื่อสเปคไม่สำเร็จ');
    } finally {
      setSavingManageCategorySpecs(false);
    }
  };

  useEffect(() => {
    if (!isElectronics) {
      setInventoryMode('bulk');
      setSpecs({ brand: '', model: '', cpu: '', ramGb: '', storageGb: '', storageType: '' });
      setElectronicsVariationInputs({ ram: '', storage: '', color: '', screenSize: '', condition: '' });
    }
  }, [isElectronics]);

  useEffect(() => {
    if (!isFashion) {
      setFashionVariationInputs({ fitStyle: '', length: '', pattern: '', gender: '' });
    }
  }, [isFashion]);

  useEffect(() => {
    if (!isFoodBeverage) {
      setFoodVariationInputs({ flavor: '', sizeWeight: '', volume: '', packageType: '' });
    }
  }, [isFoodBeverage]);

  useEffect(() => {
    if (!isBeautyPersonalCare) {
      setBeautyVariationInputs({ shadeTone: '', volume: '', skinType: '', spf: '' });
    }
  }, [isBeautyPersonalCare]);

  useEffect(() => {
    if (!isOfficeStationery) {
      setOfficeVariationInputs({ color: '', size: '', tipSize: '', packSize: '' });
    }
  }, [isOfficeStationery]);

  useEffect(() => {
    if (!isToolsHardware) {
      setToolsVariationInputs({ size: '', material: '', voltagePower: '', type: '' });
    }
  }, [isToolsHardware]);

  useEffect(() => {
    if (!isHomeKitchen) {
      setHomeKitchenVariationInputs({ capacity: '', powerWattage: '', color: '' });
    }
  }, [isHomeKitchen]);

  useEffect(() => {
    if (!isAutomotive) {
      setAutomotiveVariationInputs({ oemAftermarket: '', sizeDimension: '', material: '' });
    }
  }, [isAutomotive]);

  useEffect(() => {
    if (!isSportsOutdoor) {
      setSportsOutdoorVariationInputs({ level: '', gender: '', ageGroup: '' });
    }
  }, [isSportsOutdoor]);

  useEffect(() => {
    if (!isToysKids) {
      setToysKidsVariationInputs({ ageRange: '', batteryRequired: '', batteryType: '' });
    }
  }, [isToysKids]);

  useEffect(() => {
    const specKeys = Array.isArray(selectedCategory?.specKeys) ? selectedCategory.specKeys : [];
    const allowSpecs = selectedCategory?.features?.specs === true;

    if (!allowSpecs || specKeys.length === 0 || isElectronics) {
      setCategorySpecs({});
      return;
    }

    setCategorySpecs((prev) => {
      const next = {};
      for (const sk of specKeys) {
        const key = sk?.key;
        if (!key) continue;
        next[key] = prev[key] ?? '';
      }
      return next;
    });
  }, [selectedCategory, isElectronics]);

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

      if (isElectronics) {
        const brand = String(specs.brand || '').trim();
        const model = String(specs.model || '').trim();
        if (!brand || !model) {
          throw new Error(t('product.electronics_brand_model_required'));
        }
      }

      const categorySpecsPayload =
        !isElectronics && selectedCategory?.features?.specs === true && Object.keys(categorySpecs || {}).length > 0
          ? { specs: { ...categorySpecs } }
          : {};

      const parseOptionList = (raw) =>
        String(raw || '')
          .split(/\r?\n|,/)
          .map((s) => String(s || '').trim())
          .filter(Boolean);

      let variationOptions = null;
      if (isElectronics) {
        const v = {
          ram: parseOptionList(electronicsVariationInputs.ram),
          storage: parseOptionList(electronicsVariationInputs.storage),
          color: parseOptionList(electronicsVariationInputs.color),
          screenSize: parseOptionList(electronicsVariationInputs.screenSize),
          condition: parseOptionList(electronicsVariationInputs.condition),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isFashion) {
        const v = {
          fitStyle: parseOptionList(fashionVariationInputs.fitStyle),
          length: parseOptionList(fashionVariationInputs.length),
          pattern: parseOptionList(fashionVariationInputs.pattern),
          gender: parseOptionList(fashionVariationInputs.gender),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isFoodBeverage) {
        const v = {
          flavor: parseOptionList(foodVariationInputs.flavor),
          sizeWeight: parseOptionList(foodVariationInputs.sizeWeight),
          volume: parseOptionList(foodVariationInputs.volume),
          packageType: parseOptionList(foodVariationInputs.packageType),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isBeautyPersonalCare) {
        const v = {
          shadeTone: parseOptionList(beautyVariationInputs.shadeTone),
          volume: parseOptionList(beautyVariationInputs.volume),
          skinType: parseOptionList(beautyVariationInputs.skinType),
          spf: parseOptionList(beautyVariationInputs.spf),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isOfficeStationery) {
        const v = {
          color: parseOptionList(officeVariationInputs.color),
          size: parseOptionList(officeVariationInputs.size),
          tipSize: parseOptionList(officeVariationInputs.tipSize),
          packSize: parseOptionList(officeVariationInputs.packSize),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isToolsHardware) {
        const v = {
          size: parseOptionList(toolsVariationInputs.size),
          material: parseOptionList(toolsVariationInputs.material),
          voltagePower: parseOptionList(toolsVariationInputs.voltagePower),
          type: parseOptionList(toolsVariationInputs.type),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isHomeKitchen) {
        const v = {
          capacity: parseOptionList(homeKitchenVariationInputs.capacity),
          powerWattage: parseOptionList(homeKitchenVariationInputs.powerWattage),
          color: parseOptionList(homeKitchenVariationInputs.color),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isAutomotive) {
        const v = {
          oemAftermarket: parseOptionList(automotiveVariationInputs.oemAftermarket),
          sizeDimension: parseOptionList(automotiveVariationInputs.sizeDimension),
          material: parseOptionList(automotiveVariationInputs.material),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isSportsOutdoor) {
        const v = {
          level: parseOptionList(sportsOutdoorVariationInputs.level),
          gender: parseOptionList(sportsOutdoorVariationInputs.gender),
          ageGroup: parseOptionList(sportsOutdoorVariationInputs.ageGroup),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      } else if (isToysKids) {
        const v = {
          ageRange: parseOptionList(toysKidsVariationInputs.ageRange),
          batteryRequired: parseOptionList(toysKidsVariationInputs.batteryRequired),
          batteryType: parseOptionList(toysKidsVariationInputs.batteryType),
        };
        const has = Object.values(v).some((arr) => Array.isArray(arr) && arr.length > 0);
        variationOptions = has ? v : null;
      }

      const electronicsPayload = isElectronics
        ? {
            inventoryMode,
            specs: {
              ...specs,
              ramGb: specs.ramGb === '' ? '' : parseInt(specs.ramGb, 10) || 0,
              storageGb: specs.storageGb === '' ? '' : parseInt(specs.storageGb, 10) || 0,
            },
          }
        : {};

      const variationOptionsPayload = variationOptions ? { variationOptions } : {};

      if (hasVariants) {
        if (variants.length === 0) {
          throw new Error(t('product.at_least_one_variant'));
        }
        await addProduct({
          ...formData,
          ...electronicsPayload,
          ...categorySpecsPayload,
          ...variationOptionsPayload,
          hasVariants: true,
          variants: variants.map(v => ({
            size: v.size,
            color: v.color,
            quantity: v.quantity,
            costPrice: v.costPrice,
            sellPrice: v.sellPrice,
          })),
        });
      } else {
        if (!simpleProduct.quantity || !simpleProduct.costPrice || !simpleProduct.sellPrice) {
          throw new Error(t('product.price_qty_required'));
        }
        await addProduct({
          ...formData,
          ...electronicsPayload,
          ...categorySpecsPayload,
          ...variationOptionsPayload,
          hasVariants: false,
          ...simpleProduct,
        });
      }

      navigate('/admin/products');
    } catch (err) {
      console.error('Error adding product:', err);
      setError(t('product.add_product_failed', { message: err.message || '' }));
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

  return (
    <div className={styles.pageContainer}>
      {/* Sticky Header */}
      <header className={styles.stickyHeader}>
        <div className={styles.headerContent}>
          {/* Title Row */}
          <div className={styles.headerTitleRow}>
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.pageTitle}>{t('product.add_product')}</h1>
              <p className={styles.pageSubtitle}>{t('product.fill_product_info')}</p>
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
                form="addProductForm"
                disabled={saving || uploading}
                className={styles.saveButton}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>save</span>
                {saving ? t('message.saving') : t('product.save_product')}
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

        <form id="addProductForm" onSubmit={handleSubmit}>
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
                    placeholder={t('product.enter_product_name')}
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
                    placeholder={t('product.enter_description')}
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
                            setAutoUnitValue('');
                            setFormData(prev => ({ ...prev, unit: '' }));
                          } else {
                            setAutoUnitValue('');
                            handleChange(e);
                          }
                        }}
                        required
                        className={styles.formSelect}
                      >
                        <option value="">-- {t('product.select_unit')} --</option>
                        {unitOptions.map(u => <option key={u} value={u}>{t(`units.${u}`, u)}</option>)}
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
                          onClick={() => { setShowCustomUnit(false); setAutoUnitValue(''); setFormData(prev => ({ ...prev, unit: '' })); }}
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

                    {categories.length === 0 && !showCustomCategory && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ color: '#b91c1c', fontSize: '0.8125rem' }}>
                          {t('category.load_failed')}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/categories')}
                          className={styles.cancelButton}
                          style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem' }}
                        >
                          {t('admin.categories')}
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
                  {imagePreview ? (
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
                  ) : (
                    <label className={styles.uploadPlaceholder}>
                      <span className={`material-symbols-outlined ${styles.uploadIcon}`}>add_photo_alternate</span>
                      <span className={styles.uploadText}>{t('product.select_file')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>

                {uploading && (
                  <p style={{ color: '#3b82f6', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{t('product.uploading_image')}</p>
                )}
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
                        <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>{t('product.spec_brand')}</label>
                        <input
                          value={specs.brand}
                          onChange={(e) => setSpecs((p) => ({ ...p, brand: e.target.value }))}
                          required={isElectronics}
                          className={styles.formInput}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>{t('product.spec_model')}</label>
                        <input
                          value={specs.model}
                          onChange={(e) => setSpecs((p) => ({ ...p, model: e.target.value }))}
                          required={isElectronics}
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

                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_ram')}</label>
                        <textarea
                          value={electronicsVariationInputs.ram}
                          onChange={(e) => setElectronicsVariationInputs((p) => ({ ...p, ram: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_storage')}</label>
                        <textarea
                          value={electronicsVariationInputs.storage}
                          onChange={(e) => setElectronicsVariationInputs((p) => ({ ...p, storage: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_color')}</label>
                        <textarea
                          value={electronicsVariationInputs.color}
                          onChange={(e) => setElectronicsVariationInputs((p) => ({ ...p, color: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_screen_size')}</label>
                        <textarea
                          value={electronicsVariationInputs.screenSize}
                          onChange={(e) => setElectronicsVariationInputs((p) => ({ ...p, screenSize: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('product.variation_condition')}</label>
                      <textarea
                        value={electronicsVariationInputs.condition}
                        onChange={(e) => setElectronicsVariationInputs((p) => ({ ...p, condition: e.target.value }))}
                        rows={2}
                        placeholder={t('product.variation_options_placeholder')}
                        className={styles.formTextarea}
                      />
                    </div>
                    <div className={styles.divider}></div>
                  </>
                )}

                {!isElectronics && selectedCategory && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.category_specs')}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {Array.isArray(selectedCategory?.specKeys) && selectedCategory.specKeys.length > 0 ? (
                          <button
                            type="button"
                            onClick={openManageCategorySpecs}
                            className={styles.cancelButton}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                          >
                            แก้ไขชื่อ
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setShowAddCategorySpec(true)}
                          className={styles.saveButton}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {showManageCategorySpecs && (
                      <div style={{ marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', background: '#f8fafc' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>แก้ไขชื่อ/ชนิดของสเปค</div>
                        {manageCategorySpecKeys.map((row, idx) => (
                          <div key={row.key || idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className={styles.formGroup} style={{ margin: 0 }}>
                              <label className={styles.formLabel}>key</label>
                              <input value={row.key} disabled className={styles.formInput} />
                            </div>
                            <div className={styles.formGroup} style={{ margin: 0 }}>
                              <label className={styles.formLabel}>type</label>
                              <select
                                value={row.type || 'text'}
                                onChange={(e) =>
                                  setManageCategorySpecKeys((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, type: e.target.value } : r))
                                  )
                                }
                                className={styles.formSelect}
                              >
                                <option value="text">text</option>
                                <option value="number">number</option>
                                <option value="textarea">textarea</option>
                              </select>
                            </div>
                            <div className={styles.formGroup} style={{ margin: 0 }}>
                              <label className={styles.formLabel}>ชื่อ (TH)</label>
                              <input
                                value={row.labelTh || ''}
                                onChange={(e) =>
                                  setManageCategorySpecKeys((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, labelTh: e.target.value } : r))
                                  )
                                }
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup} style={{ margin: 0 }}>
                              <label className={styles.formLabel}>Name (EN)</label>
                              <input
                                value={row.labelEn || ''}
                                onChange={(e) =>
                                  setManageCategorySpecKeys((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, labelEn: e.target.value } : r))
                                  )
                                }
                                className={styles.formInput}
                              />
                            </div>
                          </div>
                        ))}

                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setShowManageCategorySpecs(false)}
                            className={styles.cancelButton}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                            disabled={savingManageCategorySpecs}
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={saveManagedCategorySpecs}
                            className={styles.saveButton}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                            disabled={savingManageCategorySpecs}
                          >
                            {savingManageCategorySpecs ? t('message.saving') : t('common.save')}
                          </button>
                        </div>
                      </div>
                    )}

                    {showAddCategorySpec && (
                      <div style={{ marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', background: '#f8fafc' }}>
                        <div className={styles.formRow2}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>key</label>
                            <input
                              value={newCategorySpec.key}
                              onChange={(e) => setNewCategorySpec((p) => ({ ...p, key: e.target.value }))}
                              className={styles.formInput}
                              placeholder="เช่น material, warranty_period"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>type</label>
                            <select
                              value={newCategorySpec.type}
                              onChange={(e) => setNewCategorySpec((p) => ({ ...p, type: e.target.value }))}
                              className={styles.formSelect}
                            >
                              <option value="text">text</option>
                              <option value="number">number</option>
                              <option value="textarea">textarea</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.formRow2} style={{ marginTop: '0.75rem' }}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>ชื่อ (TH)</label>
                            <input
                              value={newCategorySpec.labelTh}
                              onChange={(e) => setNewCategorySpec((p) => ({ ...p, labelTh: e.target.value }))}
                              className={styles.formInput}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Name (EN)</label>
                            <input
                              value={newCategorySpec.labelEn}
                              onChange={(e) => setNewCategorySpec((p) => ({ ...p, labelEn: e.target.value }))}
                              className={styles.formInput}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => { setShowAddCategorySpec(false); setNewCategorySpec({ key: '', labelTh: '', labelEn: '', type: 'text' }); }}
                            className={styles.cancelButton}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                            disabled={savingCategorySpec}
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={saveCategorySpecKey}
                            className={styles.saveButton}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                            disabled={savingCategorySpec}
                          >
                            {savingCategorySpec ? t('message.saving') : t('common.save')}
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedCategory?.features?.specs === true && Array.isArray(selectedCategory?.specKeys) && selectedCategory.specKeys.length > 0 && (
                      <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                        {selectedCategory.specKeys.map((sk) => {
                          const key = sk?.key;
                          if (!key) return null;
                          const label = (lang.startsWith('en') ? sk?.label?.en : sk?.label?.th) || sk?.label?.th || sk?.label?.en || key;
                          const type = sk?.type || 'text';
                          const value = categorySpecs?.[key] ?? '';

                          if (type === 'textarea') {
                            return (
                              <div key={key} className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.formLabel}>{label}</label>
                                <textarea
                                  value={value}
                                  onChange={(e) => setCategorySpecs((p) => ({ ...p, [key]: e.target.value }))}
                                  rows={3}
                                  className={styles.formTextarea}
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={key} className={styles.formGroup}>
                              <label className={styles.formLabel}>{label}</label>
                              <input
                                type={type === 'number' ? 'number' : 'text'}
                                value={value}
                                onChange={(e) => setCategorySpecs((p) => ({ ...p, [key]: e.target.value }))}
                                className={styles.formInput}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className={styles.divider}></div>
                  </>
                )}

                {isFashion && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_fit_style')}</label>
                        <textarea
                          value={fashionVariationInputs.fitStyle}
                          onChange={(e) => setFashionVariationInputs((p) => ({ ...p, fitStyle: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_length')}</label>
                        <textarea
                          value={fashionVariationInputs.length}
                          onChange={(e) => setFashionVariationInputs((p) => ({ ...p, length: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_pattern')}</label>
                        <textarea
                          value={fashionVariationInputs.pattern}
                          onChange={(e) => setFashionVariationInputs((p) => ({ ...p, pattern: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_gender')}</label>
                        <textarea
                          value={fashionVariationInputs.gender}
                          onChange={(e) => setFashionVariationInputs((p) => ({ ...p, gender: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isFoodBeverage && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_flavor')}</label>
                        <textarea
                          value={foodVariationInputs.flavor}
                          onChange={(e) => setFoodVariationInputs((p) => ({ ...p, flavor: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_size_weight')}</label>
                        <textarea
                          value={foodVariationInputs.sizeWeight}
                          onChange={(e) => setFoodVariationInputs((p) => ({ ...p, sizeWeight: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_volume')}</label>
                        <textarea
                          value={foodVariationInputs.volume}
                          onChange={(e) => setFoodVariationInputs((p) => ({ ...p, volume: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_package_type')}</label>
                        <textarea
                          value={foodVariationInputs.packageType}
                          onChange={(e) => setFoodVariationInputs((p) => ({ ...p, packageType: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isBeautyPersonalCare && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_shade_tone')}</label>
                        <textarea
                          value={beautyVariationInputs.shadeTone}
                          onChange={(e) => setBeautyVariationInputs((p) => ({ ...p, shadeTone: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_volume_size')}</label>
                        <textarea
                          value={beautyVariationInputs.volume}
                          onChange={(e) => setBeautyVariationInputs((p) => ({ ...p, volume: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_skin_type')}</label>
                        <textarea
                          value={beautyVariationInputs.skinType}
                          onChange={(e) => setBeautyVariationInputs((p) => ({ ...p, skinType: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_spf')}</label>
                        <textarea
                          value={beautyVariationInputs.spf}
                          onChange={(e) => setBeautyVariationInputs((p) => ({ ...p, spf: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isOfficeStationery && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_color')}</label>
                        <textarea
                          value={officeVariationInputs.color}
                          onChange={(e) => setOfficeVariationInputs((p) => ({ ...p, color: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_size')}</label>
                        <textarea
                          value={officeVariationInputs.size}
                          onChange={(e) => setOfficeVariationInputs((p) => ({ ...p, size: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_tip_size')}</label>
                        <textarea
                          value={officeVariationInputs.tipSize}
                          onChange={(e) => setOfficeVariationInputs((p) => ({ ...p, tipSize: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_pack_size')}</label>
                        <textarea
                          value={officeVariationInputs.packSize}
                          onChange={(e) => setOfficeVariationInputs((p) => ({ ...p, packSize: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isToolsHardware && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_size')}</label>
                        <textarea
                          value={toolsVariationInputs.size}
                          onChange={(e) => setToolsVariationInputs((p) => ({ ...p, size: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_material')}</label>
                        <textarea
                          value={toolsVariationInputs.material}
                          onChange={(e) => setToolsVariationInputs((p) => ({ ...p, material: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_voltage_power')}</label>
                        <textarea
                          value={toolsVariationInputs.voltagePower}
                          onChange={(e) => setToolsVariationInputs((p) => ({ ...p, voltagePower: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_type')}</label>
                        <textarea
                          value={toolsVariationInputs.type}
                          onChange={(e) => setToolsVariationInputs((p) => ({ ...p, type: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isHomeKitchen && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_capacity')}</label>
                        <textarea
                          value={homeKitchenVariationInputs.capacity}
                          onChange={(e) =>
                            setHomeKitchenVariationInputs((p) => ({ ...p, capacity: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_power_wattage')}</label>
                        <textarea
                          value={homeKitchenVariationInputs.powerWattage}
                          onChange={(e) =>
                            setHomeKitchenVariationInputs((p) => ({ ...p, powerWattage: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_color')}</label>
                        <textarea
                          value={homeKitchenVariationInputs.color}
                          onChange={(e) =>
                            setHomeKitchenVariationInputs((p) => ({ ...p, color: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isAutomotive && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_oem_aftermarket')}</label>
                        <textarea
                          value={automotiveVariationInputs.oemAftermarket}
                          onChange={(e) =>
                            setAutomotiveVariationInputs((p) => ({ ...p, oemAftermarket: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_size_dimension')}</label>
                        <textarea
                          value={automotiveVariationInputs.sizeDimension}
                          onChange={(e) =>
                            setAutomotiveVariationInputs((p) => ({ ...p, sizeDimension: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_material')}</label>
                        <textarea
                          value={automotiveVariationInputs.material}
                          onChange={(e) =>
                            setAutomotiveVariationInputs((p) => ({ ...p, material: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isSportsOutdoor && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_level')}</label>
                        <textarea
                          value={sportsOutdoorVariationInputs.level}
                          onChange={(e) =>
                            setSportsOutdoorVariationInputs((p) => ({ ...p, level: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_gender')}</label>
                        <textarea
                          value={sportsOutdoorVariationInputs.gender}
                          onChange={(e) =>
                            setSportsOutdoorVariationInputs((p) => ({ ...p, gender: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_age_group')}</label>
                        <textarea
                          value={sportsOutdoorVariationInputs.ageGroup}
                          onChange={(e) =>
                            setSportsOutdoorVariationInputs((p) => ({ ...p, ageGroup: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.divider}></div>
                  </>
                )}

                {isToysKids && (
                  <>
                    <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem' }}>
                        <span className={`material-symbols-outlined ${styles.cardTitleIcon}`}>tune</span>
                        {t('product.variation_options')}
                      </h3>
                    </div>

                    <div className={styles.formRow2} style={{ marginTop: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_age_range')}</label>
                        <textarea
                          value={toysKidsVariationInputs.ageRange}
                          onChange={(e) => setToysKidsVariationInputs((p) => ({ ...p, ageRange: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_battery_required')}</label>
                        <textarea
                          value={toysKidsVariationInputs.batteryRequired}
                          onChange={(e) =>
                            setToysKidsVariationInputs((p) => ({ ...p, batteryRequired: e.target.value }))
                          }
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
                      </div>
                    </div>

                    <div className={styles.formRow2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('product.variation_battery_type')}</label>
                        <textarea
                          value={toysKidsVariationInputs.batteryType}
                          onChange={(e) => setToysKidsVariationInputs((p) => ({ ...p, batteryType: e.target.value }))}
                          rows={2}
                          placeholder={t('product.variation_options_placeholder')}
                          className={styles.formTextarea}
                        />
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
                            placeholder="0.00"
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
                            placeholder="0.00"
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
                            placeholder="0"
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
                                    {v.quantity}
                                  </div>
                                </td>
                                <td>฿{parseFloat(v.costPrice).toLocaleString()}</td>
                                <td style={{ color: '#16a34a', fontWeight: 600 }}>฿{parseFloat(v.sellPrice).toLocaleString()}</td>
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

                    {/* Date and Location for variants */}
                    <div className={styles.divider}></div>
                    <div className={styles.formRow2}>
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
              </div>
            </div>

            {/* Right Column (Sidebar/Meta) - Empty for Add Product */}
            <div className={styles.sideColumn}>
              {/* Can add additional cards here if needed */}
            </div>
          </div>
        </form>

        {/* Footer spacing */}
        <div className={styles.footerSpacing}></div>
      </div>

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
  );
}
