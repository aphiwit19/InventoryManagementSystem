import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById, updateProduct, DEFAULT_UNITS, DEFAULT_CATEGORIES, DEFAULT_SIZES, DEFAULT_COLORS } from '../../services';
import { storage } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProductPage() {
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

        // Check custom unit/category
        if (product.unit && !DEFAULT_UNITS.includes(product.unit)) {
          setShowCustomUnit(true);
        }
        if (product.category && !DEFAULT_CATEGORIES.includes(product.category)) {
          setShowCustomCategory(true);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('ไม่พบสินค้านี้');
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
      alert('กรุณากรอกข้อมูล Variant ให้ครบถ้วน');
      return;
    }
    const exists = variants.find(v => v.size === newVariant.size && v.color === newVariant.color);
    if (exists) {
      alert('มี Variant นี้อยู่แล้ว (ไซส์ + สี ซ้ำกัน)');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (uploading) {
        throw new Error('กำลังอัพโหลดรูปภาพ กรุณารอสักครู่');
      }

      if (hasVariants) {
        if (variants.length === 0) {
          throw new Error('กรุณาเพิ่มอย่างน้อย 1 Variant');
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
        });
      } else {
        if (!simpleProduct.quantity || !simpleProduct.costPrice || !simpleProduct.sellPrice) {
          throw new Error('กรุณากรอกราคาและจำนวนสินค้า');
        }
        await updateProduct(id, {
          ...formData,
          hasVariants: false,
          ...simpleProduct,
        });
      }

      navigate('/admin/products');
    } catch (err) {
      console.error('Error updating product:', err);
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalVariantQuantity = variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <p style={{ color: '#666' }}>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', minHeight: '100vh', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 18, padding: '32px 40px', boxShadow: '0 10px 40px rgba(15,23,42,0.12)' }}>
          <h1 style={{ margin: '0 0 8px', color: '#1e40af', fontSize: 28, fontWeight: 700 }}>แก้ไขสินค้า</h1>
          <p style={{ margin: '0 0 28px', color: '#3b82f6', fontSize: 14 }}>อัพเดตข้อมูลสินค้าของคุณ</p>

          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 10, marginBottom: 20, fontSize: 14, border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ชื่อสินค้า */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                ชื่อสินค้า <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' }}
              />
            </div>

            {/* คำอธิบาย */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>คำอธิบายสินค้า</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f9fafb' }}
              />
            </div>

            {/* หน่วย + ประเภท */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* หน่วย */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  หน่วยสินค้า <span style={{ color: '#ef4444' }}>*</span>
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
                    style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', cursor: 'pointer' }}
                  >
                    <option value="">-- เลือกหน่วย --</option>
                    {DEFAULT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    <option value="__custom__">+ เพิ่มหน่วยใหม่...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                      placeholder="พิมพ์หน่วยใหม่"
                      style={{ flex: 1, padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb' }}
                    />
                    <button type="button" onClick={() => { setShowCustomUnit(false); setFormData(prev => ({ ...prev, unit: '' })); }}
                      style={{ padding: '10px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>

              {/* ประเภท */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  ประเภทสินค้า <span style={{ color: '#ef4444' }}>*</span>
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
                    style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', cursor: 'pointer' }}
                  >
                    <option value="">-- เลือกประเภท --</option>
                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__custom__">+ เพิ่มประเภทใหม่...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      placeholder="พิมพ์ประเภทใหม่"
                      style={{ flex: 1, padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb' }}
                    />
                    <button type="button" onClick={() => { setShowCustomCategory(false); setFormData(prev => ({ ...prev, category: '' })); }}
                      style={{ padding: '10px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Toggle Variants */}
            <div style={{ background: '#f0f9ff', padding: '16px 20px', borderRadius: 12, border: '1px solid #bae6fd' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#0369a1' }}>สินค้ามีหลาย Variants (ไซส์/สี)</div>
                  <div style={{ fontSize: 13, color: '#0284c7' }}>เปิดใช้งานเมื่อสินค้ามีหลายขนาดหรือสี</div>
                </div>
              </label>
            </div>

            {/* Simple Product */}
            {!hasVariants && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    ราคาต้นทุน (บาท) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={simpleProduct.costPrice}
                    onChange={handleSimpleChange}
                    required={!hasVariants}
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    ราคาขาย (บาท) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="sellPrice"
                    value={simpleProduct.sellPrice}
                    onChange={handleSimpleChange}
                    required={!hasVariants}
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    จำนวนสินค้า <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={simpleProduct.quantity}
                    onChange={handleSimpleChange}
                    required={!hasVariants}
                    min="0"
                    style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* Variants Section */}
            {hasVariants && (
              <div style={{ background: '#fefce8', padding: '20px', borderRadius: 12, border: '1px solid #fde047' }}>
                <h3 style={{ margin: '0 0 16px', color: '#854d0e', fontSize: 16 }}>
                  📦 Variants ({variants.length} รายการ, รวม {totalVariantQuantity} {formData.unit || 'ชิ้น'})
                </h3>

                {/* Existing Variants - Editable */}
                {variants.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px 100px 40px', gap: 8, padding: '8px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#713f12' }}>
                      <div>ไซส์</div>
                      <div>สี</div>
                      <div>จำนวน</div>
                      <div>ต้นทุน</div>
                      <div>ราคาขาย</div>
                      <div></div>
                    </div>
                    {variants.map(v => (
                      <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px 100px 40px', gap: 8, padding: '8px 12px', background: '#fff', borderRadius: 8, marginTop: 6, alignItems: 'center' }}>
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => handleVariantChange(v.id, 'size', e.target.value)}
                          style={{ padding: '8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}
                        />
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => handleVariantChange(v.id, 'color', e.target.value)}
                          style={{ padding: '8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}
                        />
                        <input
                          type="number"
                          value={v.quantity}
                          onChange={(e) => handleVariantChange(v.id, 'quantity', e.target.value)}
                          min="0"
                          style={{ padding: '8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}
                        />
                        <input
                          type="number"
                          value={v.costPrice}
                          onChange={(e) => handleVariantChange(v.id, 'costPrice', e.target.value)}
                          min="0"
                          step="0.01"
                          style={{ padding: '8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}
                        />
                        <input
                          type="number"
                          value={v.sellPrice}
                          onChange={(e) => handleVariantChange(v.id, 'sellPrice', e.target.value)}
                          min="0"
                          step="0.01"
                          style={{ padding: '8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}
                        />
                        <button type="button" onClick={() => removeVariant(v.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Variant */}
                <div style={{ background: '#fff', padding: '16px', borderRadius: 10, border: '1px dashed #d1d5db' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>+ เพิ่ม Variant ใหม่</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {/* Size */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#6b7280' }}>ไซส์</label>
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
                          style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
                        >
                          <option value="">-- เลือกไซส์ --</option>
                          {DEFAULT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="__custom__">+ เพิ่มไซส์ใหม่...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            name="size"
                            value={newVariant.size}
                            onChange={handleNewVariantChange}
                            placeholder="พิมพ์ไซส์"
                            style={{ flex: 1, padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
                          />
                          <button type="button" onClick={() => { setShowCustomSize(false); setNewVariant(prev => ({ ...prev, size: '' })); }}
                            style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      )}
                    </div>

                    {/* Color */}
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#6b7280' }}>สี</label>
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
                          style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
                        >
                          <option value="">-- เลือกสี --</option>
                          {DEFAULT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__custom__">+ เพิ่มสีใหม่...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            name="color"
                            value={newVariant.color}
                            onChange={handleNewVariantChange}
                            placeholder="พิมพ์สี"
                            style={{ flex: 1, padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
                          />
                          <button type="button" onClick={() => { setShowCustomColor(false); setNewVariant(prev => ({ ...prev, color: '' })); }}
                            style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#6b7280' }}>จำนวน</label>
                      <input
                        type="number"
                        name="quantity"
                        value={newVariant.quantity}
                        onChange={handleNewVariantChange}
                        min="1"
                        placeholder="0"
                        style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#6b7280' }}>ราคาต้นทุน</label>
                      <input
                        type="number"
                        name="costPrice"
                        value={newVariant.costPrice}
                        onChange={handleNewVariantChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#6b7280' }}>ราคาขาย</label>
                      <input
                        type="number"
                        name="sellPrice"
                        value={newVariant.sellPrice}
                        onChange={handleNewVariantChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addVariant}
                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                  >
                    + เพิ่ม Variant
                  </button>
                </div>
              </div>
            )}

            {/* รูปภาพ + วันที่ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>รูปภาพสินค้า</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label htmlFor="image" style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    เปลี่ยนรูป
                  </label>
                </div>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={async (e) => {
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
                      setUploadError('อัพโหลดรูปภาพล้มเหลว');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                {uploading && <div style={{ marginTop: 8, color: '#3b82f6', fontSize: 13 }}>กำลังอัพโหลดรูปภาพ...</div>}
                {uploadError && <div style={{ marginTop: 8, color: '#dc2626', fontSize: 13 }}>{uploadError}</div>}
                {imagePreview && (
                  <div style={{ marginTop: 12, width: 120, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  วันที่เพิ่มสินค้า <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  name="addDate"
                  value={formData.addDate}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* ที่ตั้งซื้อ */}
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>ที่ตั้งซื้อ / แหล่งที่ซื้อ</label>
              <input
                type="text"
                name="purchaseLocation"
                value={formData.purchaseLocation}
                onChange={handleChange}
                placeholder="เช่น ร้าน A สาขา B"
                style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', boxSizing: 'border-box' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                disabled={saving || uploading}
                style={{
                  padding: '14px 32px',
                  fontSize: 15,
                  fontWeight: 600,
                  background: saving || uploading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: saving || uploading ? 'not-allowed' : 'pointer',
                  boxShadow: saving || uploading ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
                }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                style={{ padding: '14px 32px', fontSize: 15, fontWeight: 600, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 10, cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
