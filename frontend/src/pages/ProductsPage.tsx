import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Category, Product } from '../types/api';

export function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const categoryMap = useMemo(
    () =>
      categories.reduce<Record<string, string>>((accumulator, category) => {
        accumulator[category.id] = category.name;
        return accumulator;
      }, {}),
    [categories],
  );

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get<Category[]>('/catalog/categories'),
      api.get<Product[]>('/catalog/products'),
    ])
      .then(([categoriesResponse, productsResponse]) => {
        if (!mounted) {
          return;
        }

        setCategories(categoriesResponse.data);
        setProducts(productsResponse.data);
      })
      .catch(() => {
        if (mounted) {
          setMessage('Urunler yuklenemedi.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <section className="panel-card">Urunler yukleniyor...</section>;
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>Urunler</h3>
        <button
          className="tiny"
          type="button"
          onClick={() => navigate('/dashboard/products/new')}
        >
          Urun Ekle
        </button>
      </div>

      {message ? <p className="message">{message}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Urun</th>
              <th>SKU</th>
              <th>Kategori</th>
              <th>Stok</th>
              <th>Satis</th>
              <th>Onerilen</th>
              <th>Maliyet</th>
              <th>KDV</th>
              <th>Varyant</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>
                  {product.category?.name ??
                    (product.category?.id ? categoryMap[product.category.id] : 'Kategori Yok')}
                </td>
                <td>{product.stock}</td>
                <td>{product.price}</td>
                <td>{product.pricingSummary?.suggestedSalePrice ?? '-'}</td>
                <td>{product.costPrice ?? '-'}</td>
                <td>
                  %{product.taxRate} {product.vatIncluded ? '(dahil)' : '(haric)'}
                </td>
                <td>{product.variants.length}</td>
                <td>{product.isActive ? 'Aktif' : 'Pasif'}</td>
                <td>
                  <button
                    className="tiny secondary"
                    type="button"
                    onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                  >
                    Duzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
