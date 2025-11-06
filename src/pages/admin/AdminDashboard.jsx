import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { addProduct } from '../../server/products';

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
    costPrice: '',
    image: '',
    addDate: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // ใช้ฟังก์ชันจาก server/products.js
      await addProduct(formData);
      
      alert('บันทึกข้อมูลสินค้าสำเร็จ!');
      navigate('/admin/dashboard');
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
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <Link to="/admin/dashboard" style={{ color: '#007bff', textDecoration: 'none' }}>
            ← กลับไปหน้ารายการสินค้า
          </Link>
        </div>
        <h2>เพิ่มสินค้าใหม่</h2>
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: 4,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="productName" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              ชื่อสินค้า *
            </label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
          </div>

          <div>
            <label htmlFor="description" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              คำอธิบายสินค้า *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 4,
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label htmlFor="costPrice" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              ราคา (บาท) *
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
                padding: '8px 12px',
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
          </div>

          <div>
            <label htmlFor="image" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              URL รูปภาพ *
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
          </div>

          <div>
            <label htmlFor="addDate" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              วันที่เพิ่ม *
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
                padding: '8px 12px',
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
          </div>

          <div>
            <label htmlFor="quantity" style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              จำนวนสินค้าที่เพิ่ม *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 16,
                border: '1px solid #ccc',
                borderRadius: 4
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                fontSize: 16,
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              style={{
                padding: '10px 24px',
                fontSize: 16,
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ถ้าไม่ใช่หน้าเพิ่มสินค้า ให้ redirect ไปหน้า products
  return null;
}
