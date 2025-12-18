import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createOrReplaceCategory, deleteCategory, getAllCategories, seedDefaultCategories, updateCategory } from '../../services';
import styles from './AdminCategoriesPage.module.css';

export default function AdminCategoriesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [baselineById, setBaselineById] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState(null);
  const confirmActionRef = useRef(null);
  const [confirmState, setConfirmState] = useState({ open: false, message: '' });

  const lang = useMemo(() => i18n.language || 'th', [i18n.language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getAllCategories({ activeOnly: false });
      setCategories(rows);
      setBaselineById(
        rows.reduce((acc, c) => {
          acc[c.id] = {
            name: c?.name && typeof c.name === 'object' ? c.name : { th: '', en: '' },
            active: c?.active !== false,
            sortOrder: Number(c?.sortOrder) || 0,
          };
          return acc;
        }, {})
      );
    } catch (e) {
      console.error(e);
      setError(t('category.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onChangeField = (id, updater) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updater(c) } : c))
    );
  };

  const openConfirm = (message, onConfirm) => {
    confirmActionRef.current = typeof onConfirm === 'function' ? onConfirm : null;
    setConfirmState({ open: true, message: String(message || '') });
  };

  const closeConfirm = () => {
    confirmActionRef.current = null;
    setConfirmState({ open: false, message: '' });
  };

  const confirmOk = () => {
    const fn = confirmActionRef.current;
    closeConfirm();
    if (typeof fn === 'function') {
      Promise.resolve(fn()).catch((e) => {
        console.error(e);
      });
    }
  };

  const cancelEdit = (id) => {
    const row = categories.find((c) => c.id === id);
    if (!row) return;

    openConfirm(`ต้องการลบหมวดหมู่ "${id}" หรือไม่?`, async () => {
      try {
        setSavingId(id);
        setError('');
        await deleteCategory(id);

        setCategories((prev) => (Array.isArray(prev) ? prev.filter((c) => c.id !== id) : prev));
        setBaselineById((prev) => {
          const next = { ...(prev || {}) };
          delete next[id];
          return next;
        });

        await load();
      } catch (e) {
        console.error(e);
        setError(t('category.save_failed'));
      } finally {
        setSavingId('');
      }
    });
  };

  const saveCategory = async (c) => {
    setSavingId(c.id);
    setError('');
    try {
      await updateCategory(c.id, {
        name: c.name,
        active: c.active !== false,
        sortOrder: Number(c.sortOrder) || 0,
        features: c.features || {},
        specKeys: Array.isArray(c.specKeys) ? c.specKeys : [],
      });
      setBaselineById((prev) => ({
        ...(prev || {}),
        [c.id]: {
          name: c?.name && typeof c.name === 'object' ? c.name : { th: '', en: '' },
          active: c?.active !== false,
          sortOrder: Number(c?.sortOrder) || 0,
        },
      }));
    } catch (e) {
      console.error(e);
      setError(t('category.save_failed'));
    } finally {
      setSavingId('');
    }
  };

  const startAdd = () => {
    setError('');
    setNewCategory({
      id: '',
      name: { th: '', en: '' },
      active: true,
      sortOrder: Number(categories?.length || 0) + 1,
      features: {},
      specKeys: [],
    });
  };

  const cancelAdd = () => {
    openConfirm('ต้องการยกเลิกการเพิ่มหมวดหมู่นี้หรือไม่?', () => {
      setNewCategory(null);
      setError('');
    });
  };

  const saveNewCategory = async () => {
    if (!newCategory) return;

    const rawId = String(newCategory.id || '').trim();
    const categoryId = rawId;

    if (!categoryId) {
      setError(t('category.save_failed'));
      return;
    }

    if (!/^[a-z0-9_]+$/.test(categoryId)) {
      setError(t('category.save_failed'));
      return;
    }

    const exists = categories.some((c) => c.id === categoryId);
    if (exists) {
      setError(t('category.save_failed'));
      return;
    }

    setSavingId(categoryId);
    setError('');
    try {
      await createOrReplaceCategory(categoryId, {
        name: {
          th: String(newCategory?.name?.th || '').trim(),
          en: String(newCategory?.name?.en || '').trim(),
        },
        active: newCategory.active !== false,
        sortOrder: Number(newCategory.sortOrder) || 0,
        features: newCategory.features || {},
        specKeys: Array.isArray(newCategory.specKeys) ? newCategory.specKeys : [],
      });
      setNewCategory(null);
      await load();
    } catch (e) {
      console.error(e);
      setError(t('category.save_failed'));
    } finally {
      setSavingId('');
    }
  };

  const seed = async () => {
    setSeeding(true);
    setError('');
    try {
      await seedDefaultCategories();
      await load();
    } catch (e) {
      console.error(e);
      setError(t('category.seed_failed'));
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>{t('common.loading')}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('category.manage_categories')}</h1>
          <p className={styles.subtitle}>{t('category.manage_categories_subtitle')}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.seedButton} onClick={seed} disabled={seeding}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>playlist_add</span>
            {seeding ? t('category.seeding') : t('category.seed_defaults')}
          </button>
          <button
            className={styles.refreshButton}
            onClick={startAdd}
            disabled={!!newCategory}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>add</span>
            {t('common.add')}
          </button>
          <button className={styles.refreshButton} onClick={load}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>refresh</span>
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('category.category_id')}</th>
              <th>{t('category.name_th')}</th>
              <th>{t('category.name_en')}</th>
              <th>{t('category.active')}</th>
              <th>{t('category.sort_order')}</th>
              <th>{t('common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {newCategory ? (
              <tr key="__new__">
                <td className={styles.mono}>
                  <input
                    className={styles.input}
                    value={newCategory.id}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...(prev || {}),
                        id: e.target.value,
                      }))
                    }
                    placeholder={t('category.category_id')}
                  />
                </td>
                <td>
                  <input
                    className={styles.input}
                    value={newCategory?.name?.th || ''}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...(prev || {}),
                        name: { ...(prev?.name || {}), th: e.target.value },
                      }))
                    }
                    placeholder={t('category.name_th')}
                  />
                </td>
                <td>
                  <input
                    className={styles.input}
                    value={newCategory?.name?.en || ''}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...(prev || {}),
                        name: { ...(prev?.name || {}), en: e.target.value },
                      }))
                    }
                    placeholder={t('category.name_en')}
                  />
                </td>
                <td>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={newCategory.active !== false}
                      onChange={(e) =>
                        setNewCategory((prev) => ({
                          ...(prev || {}),
                          active: e.target.checked,
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </td>
                <td>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    value={Number(newCategory.sortOrder ?? 0)}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...(prev || {}),
                        sortOrder: e.target.value,
                      }))
                    }
                  />
                </td>
                <td>
                  <button
                    className={styles.saveButton}
                    onClick={saveNewCategory}
                    disabled={savingId === String(newCategory.id || '').trim()}
                  >
                    {savingId === String(newCategory.id || '').trim()
                      ? t('message.saving')
                      : t('common.save')}
                  </button>
                  <button
                    className={styles.refreshButton}
                    onClick={cancelAdd}
                    style={{ marginLeft: 8 }}
                    type="button"
                  >
                    {t('common.cancel')}
                  </button>
                </td>
              </tr>
            ) : null}

            {categories.map((c) => (
              <tr key={c.id}>
                <td className={styles.mono}>{c.id}</td>
                <td>
                  <input
                    className={styles.input}
                    value={c?.name?.th || ''}
                    onChange={(e) =>
                      onChangeField(c.id, (prev) => ({
                        name: { ...(prev.name || {}), th: e.target.value },
                      }))
                    }
                    placeholder={t('category.name_th')}
                  />
                </td>
                <td>
                  <input
                    className={styles.input}
                    value={c?.name?.en || ''}
                    onChange={(e) =>
                      onChangeField(c.id, (prev) => ({
                        name: { ...(prev.name || {}), en: e.target.value },
                      }))
                    }
                    placeholder={t('category.name_en')}
                  />
                </td>
                <td>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={c.active !== false}
                      onChange={(e) =>
                        onChangeField(c.id, () => ({ active: e.target.checked }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </td>
                <td>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    value={Number(c.sortOrder ?? 0)}
                    onChange={(e) =>
                      onChangeField(c.id, () => ({ sortOrder: e.target.value }))
                    }
                  />
                </td>
                <td>
                  <button
                    className={styles.saveButton}
                    onClick={() => saveCategory(c)}
                    disabled={savingId === c.id}
                  >
                    {savingId === c.id ? t('message.saving') : t('common.save')}
                  </button>
                  <button
                    className={styles.refreshButton}
                    onClick={() => cancelEdit(c.id)}
                    style={{ marginLeft: 8 }}
                    type="button"
                    disabled={savingId === c.id}
                  >
                    {t('common.cancel')}
                  </button>
                  <div className={styles.hint}>
                    {lang.startsWith('en') ? (c?.name?.en || c?.name?.th || '') : (c?.name?.th || c?.name?.en || '')}
                  </div>
                </td>
              </tr>
            ))}

            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  {t('common.no_data')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {confirmState.open ? (
        <div
          onClick={closeConfirm}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              background: '#fff',
              borderRadius: '0.75rem',
              border: '1px solid #e7ebf3',
              boxShadow: '0 20px 40px rgba(2, 6, 23, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e7ebf3', fontWeight: 800, color: '#0d121b' }}>
              ยืนยัน
            </div>
            <div style={{ padding: '1rem 1.25rem', color: '#0d121b' }}>{confirmState.message}</div>
            <div style={{ padding: '0 1.25rem 1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className={styles.refreshButton} onClick={closeConfirm}>
                {t('common.cancel')}
              </button>
              <button type="button" className={styles.saveButton} onClick={confirmOk}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
