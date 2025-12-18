import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createOrReplaceCategory, getAllCategories, seedDefaultCategories, updateCategory } from '../../services';
import styles from './AdminCategoriesPage.module.css';

export default function AdminCategoriesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState(null);

  const lang = useMemo(() => i18n.language || 'th', [i18n.language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getAllCategories({ activeOnly: false });
      setCategories(rows);
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
    setNewCategory(null);
    setError('');
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
    </div>
  );
}
