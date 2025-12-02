import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllWithdrawals, updateWithdrawalShipping } from '../../services';

const carriers = ['EMS', 'ไปรษณีย์ไทย', 'Kerry', 'J&T', 'Flash'];
const statuses = ['รอดำเนินการ', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];
const pickupStatuses = ['รอดำเนินการ', 'รับของแล้ว'];

export default function AdminOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialSource = params.get('source') || 'all';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState(initialSource); // all | customer | staff
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // all | shipping | pickup
  const [edits, setEdits] = useState({}); // { [id]: { shippingCarrier, trackingNumber, shippingStatus } }
  const [savedOk, setSavedOk] = useState({}); // { [id]: true when last save succeeded }

  const headingTitle = sourceFilter === 'customer'
    ? 'จัดการคำสั่งซื้อ'
    : sourceFilter === 'staff'
      ? 'จัดการคำสั่งเบิก'
      : 'จัดการคำสั่งซื้อ/การจัดส่ง';

  const searchPlaceholder = sourceFilter === 'customer'
    ? 'ค้นหา (ชื่อผู้สั่งซื้อ/ที่อยู่/Tracking)'
    : sourceFilter === 'staff'
      ? 'ค้นหา (ชื่อผู้เบิก/ผู้รับ/Tracking)'
      : 'ค้นหา (ชื่อผู้เบิก/ผู้รับ/Tracking)';

  // ซิงก์ sourceFilter เมื่อ query string เปลี่ยน (เช่น คลิกเมนู Sidebar คนละประเภท)
  useEffect(() => {
    setSourceFilter(initialSource);
  }, [initialSource]);

  // (UX revert) remove badge styling helper

  const load = async () => {
    setLoading(true);
    try {
      const list = await getAllWithdrawals();
      setOrders(list);
      // initialize edit state
      const init = {};
      const savedInit = {};
      list.forEach(o => {
        init[o.id] = {
          shippingCarrier: o.shippingCarrier || '',
          trackingNumber: o.trackingNumber || '',
          shippingStatus: o.shippingStatus || 'รอดำเนินการ',
        };
        savedInit[o.id] = !!(o.shippingCarrier && o.trackingNumber && o.shippingStatus);
      });
      setEdits(init);
      setSavedOk(savedInit);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลใหม่เมื่อเข้าหน้านี้ครั้งแรกหรือเมื่อกลับมาหน้าด้วย history (location.key เปลี่ยน)
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [location.key]);

  const filtered = orders.filter(o => {
    const hit = (
      o.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.requestedBy?.toLowerCase().includes(search.toLowerCase()) ||
      o.receivedBy?.toLowerCase().includes(search.toLowerCase())
    );
    const statusOk = statusFilter === 'all' || (o.shippingStatus || 'รอดำเนินการ') === statusFilter;
    const sourceOk = sourceFilter === 'all' || (o.createdSource || '') === sourceFilter;
    const deliveryOk = deliveryFilter === 'all' || ((o.deliveryMethod || 'shipping') === deliveryFilter);
    return hit && statusOk && sourceOk && deliveryOk;
  });

  const canSave = (id) => {
    const order = orders.find(o => o.id === id);
    const e = edits[id] || {};
    const isPickup = (order?.deliveryMethod || 'shipping') === 'pickup';
    if (isPickup) {
      return !!e.shippingStatus;
    }
    return (e.shippingCarrier && e.trackingNumber && e.shippingStatus);
  };

  const saveRow = async (id) => {
    if (!canSave(id)) return;
    const e = edits[id];
    const order = orders.find(o => o.id === id);
    setSavingId(id);
    try {
      await updateWithdrawalShipping(id, {
        shippingCarrier: e.shippingCarrier,
        trackingNumber: e.trackingNumber.trim(),
        shippingStatus: e.shippingStatus,
      }, order?.createdByUid);
      // optimistic update without reload
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...e } : o));
      setSavedOk(prev => ({ ...prev, [id]: true }));
    } finally {
      setSavingId(null);
    }
  };

  // (UX revert) no counters in filters

  const goDetail = (order) => {
    if (!order?.id) return;
    navigate(`/admin/orders/${order.id}`, { state: { order } });
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{
        background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>{headingTitle}</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={searchPlaceholder} style={{ padding: '10px 40px 10px 12px', borderRadius: 20, border: '1px solid #ddd', width: 220 }}/>
            <span style={{ position:'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color:'#999' }}>🔍</span>
          </div>
          {initialSource === 'all' && (
            <select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: 20, border: '1px solid #ddd' }}>
              <option value="all">ทั้งหมด</option>
              <option value="customer">ผู้ซื้อ</option>
              <option value="staff">ผู้เบิก</option>
            </select>
          )}
          {sourceFilter === 'staff' && (
            <div style={{ display: 'inline-flex', borderRadius: 20, border: '1px solid #ddd', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setDeliveryFilter('shipping')}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  background: deliveryFilter === 'shipping' ? '#4CAF50' : '#fff',
                  color: deliveryFilter === 'shipping' ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: deliveryFilter === 'shipping' ? 600 : 400,
                  borderRight: '1px solid #ddd'
                }}
              >
                จัดส่ง
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter('pickup')}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  background: deliveryFilter === 'pickup' ? '#4CAF50' : '#fff',
                  color: deliveryFilter === 'pickup' ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: deliveryFilter === 'pickup' ? 600 : 400,
                }}
              >
                รับเอง
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ background:'#fff', padding: 40, borderRadius: 8, textAlign: 'center' }}>กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'#fff', padding: 40, borderRadius: 8, textAlign: 'center', color:'#777' }}>ไม่พบรายการ</div>
      ) : (
        <div style={{ background:'#fff', borderRadius: 8, overflowX:'auto', boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>
          {sourceFilter === 'customer' ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '0.9fr 1fr 1.6fr 0.8fr 1fr 1fr 0.9fr 0.7fr 0.8fr',
                  gap: 8,
                  padding: '12px 16px',
                  background: '#f8f9fa',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <div>วันที่</div>
                <div>ผู้สั่งซื้อ</div>
                <div>สินค้า / จำนวน</div>
                <div>ยอดรวม</div>
                <div>ที่อยู่</div>
                <div>ขนส่ง</div>
                <div>Tracking</div>
                <div>สถานะ</div>
                <div style={{ textAlign: 'center' }}>บันทึก</div>
              </div>
              {filtered.map((o) => {
                const dateText = new Date(
                  o.withdrawDate?.seconds
                    ? o.withdrawDate.seconds * 1000
                    : o.withdrawDate
                ).toLocaleDateString('th-TH');
                const totalText =
                  typeof o.total === 'number'
                    ? o.total.toLocaleString()
                    : (parseFloat(o.total || 0) || 0).toLocaleString();
                const items = o.items || [];
                const itemsText = items.length
                  ? items
                      .map(
                        (it) =>
                          `${it.productName || ''} x${it.quantity || 0}`
                      )
                      .join('\n')
                  : '-';

                return (
                  <div
                    key={o.id}
                    onClick={(e) => { e.stopPropagation(); goDetail(o); }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '0.9fr 1fr 1.6fr 0.8fr 1fr 1fr 0.9fr 0.7fr 0.8fr',
                      gap: 8,
                      padding: '12px 16px',
                      borderTop: '1px solid #eee',
                      alignItems: 'flex-start',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <div>{dateText}</div>
                    <div>{o.requestedBy || '-'}</div>
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        color: '#555',
                        fontSize: 12,
                        lineHeight: 1.3,
                      }}
                    >
                      {itemsText}
                    </div>
                    <div style={{ fontWeight: 600 }}>฿{totalText}</div>
                    <div
                      style={{ whiteSpace: 'pre-wrap', color: '#555' }}
                    >
                      {o.requestedAddress || '-'}
                    </div>
                    <div>
                      <select
                        disabled={(o.deliveryMethod || 'shipping') === 'pickup'}
                        value={edits[o.id]?.shippingCarrier || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          setEdits((s) => ({
                            ...s,
                            [o.id]: {
                              ...s[o.id],
                              shippingCarrier: e.target.value,
                            },
                          }));
                          setSavedOk((prev) => ({ ...prev, [o.id]: false }));
                        }}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                        }}
                      >
                        <option value="">เลือกผู้ให้บริการ</option>
                        {carriers.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        disabled={(o.deliveryMethod || 'shipping') === 'pickup'}
                        value={edits[o.id]?.trackingNumber || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setEdits((s) => ({
                            ...s,
                            [o.id]: {
                              ...s[o.id],
                              trackingNumber: e.target.value,
                            },
                          }));
                          setSavedOk((prev) => ({ ...prev, [o.id]: false }));
                        }}
                        placeholder="เช่น EX123456789TH"
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                          width: '100%',
                        }}
                      />
                    </div>
                    <div>
                      <select
                        value={edits[o.id]?.shippingStatus || 'รอดำเนินการ'}
                        onChange={(e) => {
                          setEdits((s) => ({
                            ...s,
                            [o.id]: {
                              ...s[o.id],
                              shippingStatus: e.target.value,
                            },
                          }));
                          setSavedOk((prev) => ({ ...prev, [o.id]: false }));
                        }}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #ddd',
                          borderRadius: 6,
                        }}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); saveRow(o.id); }}
                        disabled={savingId === o.id || !canSave(o.id)}
                        style={{
                          padding: '8px 10px',
                          minWidth: 88,
                          background: savedOk[o.id]
                            ? '#4CAF50'
                            : canSave(o.id)
                            ? '#2196F3'
                            : '#9e9e9e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor:
                            savingId === o.id || !canSave(o.id)
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: 12,
                        }}
                      >
                        {savingId === o.id
                          ? 'กำลังบันทึก...'
                          : savedOk[o.id]
                          ? 'บันทึกแล้ว'
                          : 'บันทึก'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {(() => {
                const hideShippingFields = sourceFilter === 'staff' && deliveryFilter === 'pickup';
                return (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: hideShippingFields
                          ? '1.1fr 1.1fr 1.1fr 1fr 0.8fr'
                          : '1.1fr 1.1fr 1.1fr 1.1fr 1.4fr 1.1fr 1.1fr 1fr 0.8fr',
                        gap: 8,
                        padding: '12px 16px',
                        background: '#f8f9fa',
                        fontWeight: 600,
                      }}
                    >
                      <div>วันที่</div>
                      <div>ผู้เบิก</div>
                      <div>ผู้รับ</div>
                      {!hideShippingFields && <div>วิธีรับ</div>}
                      {!hideShippingFields && <div>ที่อยู่</div>}
                      {!hideShippingFields && <div>ขนส่ง</div>}
                      {!hideShippingFields && <div>Tracking</div>}
                      {hideShippingFields && <div>สถานะ</div>}
                      {hideShippingFields && <div style={{ textAlign: 'center' }}>บันทึก</div>}
                      {!hideShippingFields && <div>สถานะ</div>}
                      {!hideShippingFields && <div style={{ textAlign: 'center' }}>บันทึก</div>}
                    </div>
                    {filtered.map((o) => {
                      const address = o.receivedAddress || '-';
                      const isPickupRow = (o.deliveryMethod || 'shipping') === 'pickup';
                      const showCompactPickup = hideShippingFields && isPickupRow;
                      return (
                        <div
                          key={o.id}
                          onClick={() => goDetail(o)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: showCompactPickup
                              ? '1.1fr 1.1fr 1.1fr 1fr 0.8fr'
                              : '1.1fr 1.1fr 1.1fr 1.1fr 1.4fr 1.1fr 1.1fr 1fr 0.8fr',
                            gap: 8,
                            padding: '12px 16px',
                            borderTop: '1px solid #eee',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            {new Date(
                              o.withdrawDate?.seconds
                                ? o.withdrawDate.seconds * 1000
                                : o.withdrawDate
                            ).toLocaleDateString('th-TH')}
                          </div>
                          <div>{o.requestedBy || '-'}</div>
                          <div>
                            {o.receivedBy ||
                              ((o.createdSource || '') === 'customer' ? '-' : '-')}
                          </div>
                          {!showCompactPickup && (
                            <div>
                              {(o.deliveryMethod || 'shipping') === 'pickup'
                                ? 'รับเอง'
                                : 'จัดส่ง'}
                            </div>
                          )}
                          {!showCompactPickup && (
                            <div style={{ whiteSpace: 'pre-wrap', color: '#555' }}>
                              {address}
                            </div>
                          )}
                          {!showCompactPickup && (
                            <div>
                              <select
                                disabled={(o.deliveryMethod || 'shipping') === 'pickup'}
                                value={edits[o.id]?.shippingCarrier ?? ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  setEdits((s) => ({
                                    ...s,
                                    [o.id]: {
                                      ...s[o.id],
                                      shippingCarrier: e.target.value,
                                    },
                                  }));
                                  setSavedOk((prev) => ({ ...prev, [o.id]: false }));
                                }}
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: 6,
                                }}
                              >
                                <option value="">เลือกผู้ให้บริการ</option>
                                {carriers.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {!showCompactPickup && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                disabled={(o.deliveryMethod || 'shipping') === 'pickup'}
                                value={edits[o.id]?.trackingNumber ?? ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  setEdits((s) => ({
                                    ...s,
                                    [o.id]: {
                                      ...s[o.id],
                                      trackingNumber: e.target.value,
                                    },
                                  }));
                                  setSavedOk((prev) => ({ ...prev, [o.id]: false }));
                                }}
                                placeholder="เช่น EX123456789TH"
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: 6,
                                  width: '100%',
                                }}
                              />
                            </div>
                          )}
                          <div>
                            <select
                              value={edits[o.id]?.shippingStatus ?? 'รอดำเนินการ'}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                setEdits((s) => ({
                                  ...s,
                                  [o.id]: {
                                    ...s[o.id],
                                    shippingStatus: e.target.value,
                                  },
                                }));
                                setSavedOk((prev) => ({ ...prev, [o.id]: false }));
                              }}
                              style={{
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                              }}
                            >
                              {((o.deliveryMethod || 'shipping') === 'pickup'
                                ? pickupStatuses
                                : statuses
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); saveRow(o.id); }}
                              disabled={savingId === o.id || !canSave(o.id)}
                              style={{
                                padding: '8px 14px',
                                minWidth: 96,
                                background: savedOk[o.id]
                                  ? '#4CAF50'
                                  : canSave(o.id)
                                  ? '#2196F3'
                                  : '#9e9e9e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                cursor:
                                  savingId === o.id || !canSave(o.id)
                                    ? 'not-allowed'
                                    : 'pointer',
                              }}
                            >
                              {savingId === o.id
                                ? 'กำลังบันทึก...'
                                : savedOk[o.id]
                                ? 'บันทึกแล้ว'
                                : 'บันทึก'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
