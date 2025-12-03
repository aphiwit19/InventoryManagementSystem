import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { addProduct } from '../../services';

import { storage } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  
  // ตรวจสอบว่าเป็นหน้าเพิ่มสินค้าหรือไม่
  const isAddProductPage = location.pathname === '/admin/addproduct';
  
  // State สำหรับฟอร์มเพิ่มสินค้า
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    purchaseLocation: '',
    costPrice: '',
    image: '',
    addDate: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // Redirect ถ้าไม่ใช่หน้าเพิ่มสินค้า
  useEffect(() => {
    if (!isAddProductPage) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAddProductPage, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (uploading) {
        throw new Error('กำลังอัพโหลดรูปภาพ กรุณารอสักครู่');
      }
      if (!formData.image) {
        throw new Error('กรุณาอัพโหลดรูปภาพสินค้า');
      }
      // ใช้ฟังก์ชันจาก server/products.js
      await addProduct(formData);
      
      navigate('/admin/products');
    } catch (err) {
      console.error('Error adding product:', err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ถ้าเป็นหน้าเพิ่มสินค้า ให้แสดงฟอร์ม
  if (isAddProductPage) {
    return (
      <div
        style={{
          padding: '32px 24px',
          minHeight: '100vh',
          background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Form Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              padding: '32px 40px',
              boxShadow: '0 10px 40px rgba(15,23,42,0.12)',
            }}
          >
            {/* Header */}
            <h1
              style={{
                margin: '0 0 8px',
                color: '#1e40af',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              เพิ่มสินค้าใหม่
            </h1>
            <p style={{ margin: '0 0 28px', color: '#3b82f6', fontSize: 14 }}>
              กรอกข้อมูลสินค้าของคุณ
            </p>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: 14,
                  border: '1px solid #fecaca',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* ชื่อสินค้า */}
              <div>
                <label
                  htmlFor="productName"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  ชื่อสินค้า <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  placeholder="กรอกชื่อสินค้า"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#f9fafb',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#f9fafb';
                  }}
                />
              </div>

              {/* คำอธิบายสินค้า */}
              <div>
                <label
                  htmlFor="description"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  คำอธิบายสินค้า <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="รายละเอียดสินค้า คุณสมบัติ และข้อมูลสำคัญ"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    background: '#f9fafb',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#f9fafb';
                  }}
                />
              </div>

              {/* ที่ตั้ง / แหล่งที่ซื้อ */}
              <div>
                <label
                  htmlFor="purchaseLocation"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  ที่ตั้งซื้อ / แหล่งที่ซื้อ
                </label>
                <input
                  type="text"
                  id="purchaseLocation"
                  name="purchaseLocation"
                  value={formData.purchaseLocation}
                  onChange={handleChange}
                  placeholder="เช่น ร้าน A สาขา B หรือแหล่งที่มา"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#f9fafb',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = '#f9fafb';
                  }}
                />
              </div>

              {/* ราคา + จำนวนสินค้า (2 คอลัมน์) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label
                    htmlFor="costPrice"
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    ราคา (บาท) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="กรอกราคาสินค้า"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 15,
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#f9fafb',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = '#f9fafb';
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="quantity"
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    จำนวนสินค้า <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="กรอกจำนวนสินค้า"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 15,
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#f9fafb',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = '#f9fafb';
                    }}
                  />
                </div>
              </div>

              {/* รูปภาพสินค้า + ตัวอย่างรูปภาพ (2 คอลัมน์) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    รูปภาพสินค้า
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label
                      htmlFor="image"
                      style={{
                        padding: '10px 20px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#374151',
                      }}
                    >
                      เลือกไฟล์
                    </label>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>
                      {formData.image ? 'เลือกไฟล์แล้ว' : 'ไม่ได้เลือกไฟล์ใด'}
                    </span>
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
                        setFormData((prev) => ({ ...prev, image: url }));
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
                  {uploading && (
                    <div style={{ marginTop: 8, color: '#3b82f6', fontSize: 13 }}>
                      กำลังอัพโหลดรูปภาพ...
                    </div>
                  )}
                  {uploadError && (
                    <div style={{ marginTop: 8, color: '#dc2626', fontSize: 13 }}>
                      {uploadError}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    ตัวอย่างรูปภาพ
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: 180,
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      background: '#f9fafb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 14 }}>ยังไม่มีรูปภาพ</span>
                    )}
                  </div>
                </div>
              </div>

              {/* วันที่เพิ่มสินค้า + ปุ่ม (2 คอลัมน์) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'end' }}>
                <div>
                  <label
                    htmlFor="addDate"
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    วันที่เพิ่มสินค้า <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="addDate"
                    name="addDate"
                    value={formData.addDate}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 15,
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#f9fafb',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = '#f9fafb';
                    }}
                  />
                </div>

                {/* ปุ่ม */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    style={{
                      padding: '14px 32px',
                      fontSize: 15,
                      fontWeight: 600,
                      background:
                        loading || uploading
                          ? '#9ca3af'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      cursor: loading || uploading ? 'not-allowed' : 'pointer',
                      boxShadow:
                        loading || uploading ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
                    }}
                  >
                    {loading ? 'กำลังบันทึก...' : uploading ? 'กำลังอัพโหลดรูป...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/products')}
                    style={{
                      padding: '14px 32px',
                      fontSize: 15,
                      fontWeight: 600,
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: 10,
                      cursor: 'pointer',
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    );
  }

  // ถ้าไม่ใช่หน้าเพิ่มสินค้า ให้ redirect ไปหน้า products
  return null;
}