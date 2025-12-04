import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById, updateProduct } from '../../services';
import { storage } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    purchaseLocation: '',
    costPrice: '',
    sellPrice: '',
    image: '',
    addDate: '',
    quantity: ''
  });
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
        // แปลง Timestamp เป็น date string
        const addDate = product.addDate?.toDate ? product.addDate.toDate() : new Date(product.addDate);
        const formattedDate = addDate.toISOString().split('T')[0];
        
        setFormData({
          productName: product.productName || '',
          description: product.description || '',
          purchaseLocation: product.purchaseLocation || '',
          costPrice: product.costPrice || product.price || '',
          sellPrice: product.sellPrice || product.price || '',
          image: product.image || '',
          addDate: formattedDate,
          quantity: product.quantity || ''
        });
        if (product.image) {
          setImagePreview(product.image);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (uploading) {
        throw new Error('กำลังอัพโหลดรูปภาพ กรุณารอสักครู่');
      }
      await updateProduct(id, formData);
      alert('อัพเดตข้อมูลสินค้าสำเร็จ!');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Error updating product:', err);
      setError('เกิดข้อผิดพลาดในการอัพเดตข้อมูลสินค้า: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666' }}>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '32px 24px',
        background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 18,
            padding: '28px 32px',
            boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          <h2 style={{ marginBottom: 8, fontSize: 26, color: '#1e40af', fontWeight: 700 }}>แก้ไขข้อมูลสินค้า</h2>
          <p style={{ marginBottom: 28, color: '#3b82f6', fontSize: 14 }}>อัพเดตข้อมูลสินค้าของคุณ</p>

          {error && (
            <div
              style={{
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                color: '#b91c1c',
                borderRadius: 12,
                marginBottom: 20,
                border: '1px solid #fca5a5',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ชื่อสินค้า - เต็มแถว */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                ชื่อสินค้า *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* ที่ตั้งซื้อ - เต็มแถว */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                ที่ตั้งซื้อ / แหล่งที่ซื้อ
              </label>
              <input
                type="text"
                name="purchaseLocation"
                value={formData.purchaseLocation}
                onChange={handleChange}
                placeholder="เช่น ร้าน A สาขา B หรือแหล่งที่มา"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* ราคา (ต้นทุน/ขาย) + จำนวน - 2 คอลัมน์ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                  ราคาต้นทุน (บาท) *
                </label>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />

                <label style={{ display: 'block', margin: '14px 0 8px', fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                  ราคาขาย (บาท) *
                </label>
                <input
                  type="number"
                  name="sellPrice"
                  value={formData.sellPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                  จำนวนสินค้า *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 12,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            </div>

            {/* คำอธิบาย - เต็มแถว */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                คำอธิบายสินค้า *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 15,
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* รูปภาพ + วันที่ + ปุ่ม - 2 คอลัมน์ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
              {/* คอลัมน์ซ้าย: รูปภาพ + วันที่ + ปุ่ม */}
              <div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                    รูปภาพสินค้า
                  </label>
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
                        setFormData((prev) => ({ ...prev, image: url }));
                        setImagePreview(url);
                      } catch (err) {
                        console.error(err);
                        setUploadError('อัพโหลดรูปภาพล้มเหลว');
                      } finally {
                        setUploading(false);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      border: '2px solid #e2e8f0',
                      borderRadius: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                  {uploading && <div style={{ marginTop: 8, color: '#3b82f6', fontSize: 13 }}>กำลังอัพโหลดรูปภาพ...</div>}
                  {uploadError && <div style={{ marginTop: 8, color: '#dc2626', fontSize: 13 }}>{uploadError}</div>}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                    วันที่เพิ่มสินค้า *
                  </label>
                  <input
                    type="date"
                    name="addDate"
                    value={formData.addDate}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 15,
                      border: '2px solid #e2e8f0',
                      borderRadius: 12,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>

                {/* ปุ่ม */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    style={{
                      padding: '12px 28px',
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#fff',
                      background: saving || uploading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: 999,
                      cursor: saving || uploading ? 'not-allowed' : 'pointer',
                      boxShadow: saving || uploading ? 'none' : '0 6px 20px rgba(37,99,235,0.4)',
                    }}
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/dashboard')}
                    style={{
                      padding: '12px 28px',
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#374151',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1',
                      borderRadius: 999,
                      cursor: 'pointer',
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>

              {/* คอลัมน์ขวา: ตัวอย่างรูปภาพ */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
                  ตัวอย่างรูปภาพ
                </label>
                <div
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '2px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 14 }}>ยังไม่มีรูปภาพ</span>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}