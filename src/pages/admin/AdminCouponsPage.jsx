import { useState, useEffect } from 'react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services';
import { useTranslation } from 'react-i18next';

export default function AdminCouponsPage() {
  useTranslation();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'fixed',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    usageLimit: '',
    description: '',
    active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, formData);
        setSuccess('อัพเดทคูปองสำเร็จ');
      } else {
        await createCoupon(formData);
        setSuccess('สร้างคูปองสำเร็จ');
      }
      
      await loadCoupons();
      handleCloseModal();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      type: coupon.type || 'fixed',
      value: coupon.value || '',
      minPurchase: coupon.minPurchase || '',
      maxDiscount: coupon.maxDiscount || '',
      startDate: coupon.startDate ? new Date(coupon.startDate.seconds * 1000).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate.seconds * 1000).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit || '',
      description: coupon.description || '',
      active: coupon.active !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบคูปองนี้?')) return;
    
    try {
      await deleteCoupon(id);
      setSuccess('ลบคูปองสำเร็จ');
      await loadCoupons();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'fixed',
      value: '',
      minPurchase: '',
      maxDiscount: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      usageLimit: '',
      description: '',
      active: true,
    });
    setError('');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('th-TH');
  };

  return (
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '20px 24px', borderRadius: 18, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>🎫 จัดการคูปองส่วนลด</h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>สร้างและจัดการโค้ดส่วนลด</div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
        >
          + สร้างคูปองใหม่
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, color: '#dc2626', marginBottom: 16 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', background: '#d1fae5', border: '1px solid #10b981', borderRadius: 12, color: '#059669', marginBottom: 16 }}>
          {success}
        </div>
      )}

      {/* Coupons List */}
      {loading ? (
        <div style={{ background: '#fff', padding: 50, borderRadius: 18, textAlign: 'center', color: '#64748b' }}>กำลังโหลด...</div>
      ) : coupons.length === 0 ? (
        <div style={{ background: '#fff', padding: 50, borderRadius: 18, textAlign: 'center', color: '#64748b' }}>ยังไม่มีคูปอง</div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', fontFamily: 'Kanit, sans-serif' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>รหัสคูปอง</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>ประเภท</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>ส่วนลด</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>ยอดขั้นต่ำ</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>วันหมดอายุ</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>ใช้แล้ว/ทั้งหมด</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>สถานะ</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'Kanit, sans-serif' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon, index) => (
                <tr 
                  key={coupon.id} 
                  style={{ 
                    borderBottom: index === coupons.length - 1 ? 'none' : '1px solid #f1f5f9',
                    background: '#ffffff',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  <td style={{ padding: '16px 20px', maxWidth: '250px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6', fontSize: 15, letterSpacing: '0.5px' }}>{coupon.code}</div>
                    {coupon.description && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#94a3b8', 
                        marginTop: 4, 
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '230px'
                      }}>
                        {coupon.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                    <span style={{ display: 'inline-flex', padding: '3px 10px', background: '#f1f5f9', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      {coupon.type === 'percentage' ? 'เปอร์เซ็นต์' : 'จำนวนเงิน'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `฿${coupon.value.toLocaleString()}`}
                    </div>
                    {coupon.type === 'percentage' && coupon.maxDiscount > 0 && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>สูงสุด ฿{coupon.maxDiscount.toLocaleString()}</div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                    {coupon.minPurchase > 0 ? `฿${coupon.minPurchase.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b', fontWeight: 500 }}>{formatDate(coupon.endDate)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
                      {coupon.usedCount || 0} / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      padding: '5px 14px', 
                      borderRadius: 6, 
                      fontSize: 12, 
                      fontWeight: 600, 
                      background: coupon.active ? '#dcfce7' : '#fee2e2', 
                      color: coupon.active ? '#166534' : '#991b1b',
                      border: `1px solid ${coupon.active ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      {coupon.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleEdit(coupon)} 
                        style={{ 
                          padding: '7px 16px', 
                          background: '#3b82f6', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          fontSize: 13, 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
                      >
                        แก้ไข
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)} 
                        style={{ 
                          padding: '7px 16px', 
                          background: '#ef4444', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          fontSize: 13, 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 0, maxWidth: 700, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)', border: '1px solid rgba(226,232,240,0.8)' }}>
            {/* Header */}
            <div style={{ background: '#ffffff', padding: '28px 36px', borderBottom: '2px solid #f1f5f9' }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
                {editingCoupon ? 'แก้ไขคูปอง' : 'สร้างคูปองใหม่'}
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748b', fontWeight: 400 }}>
                {editingCoupon ? 'แก้ไขข้อมูลโค้ดส่วนลดของระบบ' : 'กรอกข้อมูลเพื่อสร้างโค้ดส่วนลดใหม่'}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '36px' }}>

            {error && (
              <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 12, color: '#dc2626', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Code */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>รหัสคูปอง *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="เช่น SAVE100"
                    style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 15, fontWeight: 500, color: '#0f172a', background: '#ffffff', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ประเภทส่วนลด *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 15, fontWeight: 500, color: '#0f172a', background: '#ffffff', cursor: 'pointer', boxSizing: 'border-box' }}
                  >
                    <option value="percentage">เปอร์เซ็นต์ (%)</option>
                    <option value="fixed">จำนวนเงิน (฿)</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {formData.type === 'percentage' ? 'เปอร์เซ็นต์ส่วนลด (%) *' : 'จำนวนเงินส่วนลด (฿) *'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    min="0"
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    placeholder={formData.type === 'percentage' ? 'เช่น 20' : 'เช่น 100'}
                    style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 15, fontWeight: 500, color: '#0f172a', background: '#ffffff', transition: 'all 0.2s', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Max Discount (for percentage) */}
                {formData.type === 'percentage' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>ส่วนลดสูงสุด (฿)</label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      min="0"
                      step="0.01"
                      placeholder="500"
                      style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                )}

                {/* Min Purchase */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>ยอดซื้อขั้นต่ำ (฿)</label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14 }}
                  />
                </div>

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 35, width: '80%' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>วันเริ่มใช้ *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 15, fontWeight: 500, color: '#0f172a', background: '#ffffff', transition: 'all 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>วันหมดอายุ</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      style={{ width: '100%', padding: '13px 16px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 15, fontWeight: 500, color: '#0f172a', background: '#ffffff', transition: 'all 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>จำนวนครั้งที่ใช้ได้ (0 = ไม่จำกัด)</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    min="0"
                    placeholder="0"
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14 }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>คำอธิบาย</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="คำอธิบายคูปอง..."
                    style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, resize: 'vertical' }}
                  />
                </div>

                {/* Active */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      style={{ marginRight: 8, width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>เปิดใช้งานคูปอง</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 14, marginTop: 36, paddingTop: 28, borderTop: '1px solid #e2e8f0' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  style={{ 
                    flex: 1, 
                    padding: '13px 24px', 
                    background: '#ffffff', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: 8, 
                    fontWeight: 600, 
                    fontSize: 15,
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.01em'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 1, 
                    padding: '13px 24px', 
                    background: '#3b82f6', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: 8, 
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.01em'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'; }}
                >
                  {editingCoupon ? 'บันทึกการแก้ไข' : 'สร้างคูปอง'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
