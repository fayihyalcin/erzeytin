@extends('layouts.admin')

@section('title', 'Ürünler - Er Zeytinyağı')
@section('admin_search_placeholder', 'Ürün ara... (SKU, barkod, ad, kategori)')
@section('admin_content_class', 'product-admin')

@section('admin_shell_attributes')
    x-data="{
            sidebarOpen: false,
            sidebarCollapsed: false,
            productModalOpen: false,
            deleteModalOpen: false,
            modalMode: 'create',
            selectedProduct: null,
            formAction: @js(route('admin.products.store')),
            formMethod: 'POST',
            uploadStatus: '',
            uploadMeta: null,
            productForm: {
                name: '',
                sku: '',
                category_id: @js((string) $categories->first()?->id),
                price: '',
                compare_price: '',
                stock: '',
                status: 'Aktif',
                visibility: 'Vitrinde',
                description: '',
                image_path: '',
                image_url: ''
            },
            openCreate() {
                this.modalMode = 'create';
                this.formAction = @js(route('admin.products.store'));
                this.formMethod = 'POST';
                this.uploadStatus = '';
                this.uploadMeta = null;
                this.productForm = { name: '', sku: '', category_id: @js((string) $categories->first()?->id), price: '', compare_price: '', stock: '', status: 'Aktif', visibility: 'Vitrinde', description: '', image_path: '', image_url: '' };
                this.productModalOpen = true;
                document.body.classList.add('modal-open');
            },
            openEdit(product) {
                this.modalMode = 'edit';
                this.formAction = product.update_url;
                this.formMethod = 'PATCH';
                this.uploadStatus = '';
                this.uploadMeta = null;
                this.productForm = { ...product };
                this.productModalOpen = true;
                document.body.classList.add('modal-open');
            },
            async uploadImage(event) {
                const file = event.target.files[0];
                if (! file) return;
                this.uploadStatus = 'Görsel yükleniyor ve sıkıştırılıyor...';
                this.uploadMeta = null;

                const formData = new FormData();
                formData.append('image', file);
                formData.append('type', 'product');

                try {
                    const response = await fetch(@js(route('admin.images.store')), {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
                            'Accept': 'application/json'
                        },
                        body: formData
                    });
                    const data = await response.json();

                    if (! response.ok) {
                        throw new Error(data.message || 'Görsel yüklenemedi.');
                    }

                    this.productForm.image_path = data.path;
                    this.productForm.image_url = data.url;
                    this.uploadMeta = data;
                    this.uploadStatus = 'Görsel sıkıştırıldı ve yüklendi.';
                } catch (error) {
                    this.uploadStatus = error.message;
                } finally {
                    event.target.value = '';
                }
            },
            openDelete(product) {
                this.selectedProduct = product;
                this.deleteModalOpen = true;
                document.body.classList.add('modal-open');
            },
            closeModals() {
                this.productModalOpen = false;
                this.deleteModalOpen = false;
                document.body.classList.remove('modal-open');
            }
        }"
@endsection

@section('admin_topbar_actions')
<button class="admin-action-button" type="button" x-on:click="openCreate()">
                        <span>+</span>
                        Yeni Ürün
                    </button>
                    <button class="admin-action-button" type="button">
                        <span class="admin-icon-box"></span>
                        Stok Güncelle
                    </button>
@endsection

@section('content')
<div class="admin-heading-row">
                    <div>
                        <h1>Ürün Yönetimi</h1>
                        <p>Ürünleri, stokları, fiyatları, vitrin durumlarını ve satış görünürlüğünü yönetin.</p>
                    </div>
                    <button class="category-primary-button" type="button" x-on:click="openCreate()">
                        <span>+</span>
                        Yeni Ürün Ekle
                    </button>
                </div>

                @if (session('status'))
                    <div class="panel-card admin-flash">{{ session('status') }}</div>
                @endif

                <section class="category-summary-grid product-summary-grid" aria-label="Ürün özeti">
                    <article><span>Toplam Ürün</span><strong>{{ $products->count() }}</strong><small>{{ $products->where('status', 'Aktif')->count() }} aktif ürün</small></article>
                    <article><span>Kritik Stok</span><strong>{{ $products->where('stock', '<=', 8)->where('stock', '>', 0)->count() }}</strong><small>Hızlı tedarik gerekli</small></article>
                    <article><span>Vitrindeki Ürün</span><strong>{{ $products->where('visibility', 'Vitrinde')->count() }}</strong><small>Anasayfada görünür</small></article>
                    <article><span>Pasif Ürün</span><strong>{{ $products->where('status', 'Pasif')->count() }}</strong><small>Yayına kapalı</small></article>
                </section>

                <section class="panel-card category-tools product-tools">
                    <div class="category-tools-grid product-tools-grid">
                        <label>
                            <span>Kategori</span>
                            <select>
                                <option>Tüm Kategoriler</option>
                                @foreach ($categories as $category)
                                    <option>{{ $category->name }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            <span>Durum</span>
                            <select>
                                <option>Tümü</option>
                                <option>Aktif</option>
                                <option>Pasif</option>
                                <option>Taslak</option>
                            </select>
                        </label>
                        <label>
                            <span>Stok</span>
                            <select>
                                <option>Tüm stoklar</option>
                                <option>Kritik stok</option>
                                <option>Stokta yok</option>
                                <option>Stokta var</option>
                            </select>
                        </label>
                        <label>
                            <span>Fiyat Aralığı</span>
                            <select>
                                <option>Tüm fiyatlar</option>
                                <option>0 - 250 TL</option>
                                <option>250 - 750 TL</option>
                                <option>750 TL üzeri</option>
                            </select>
                        </label>
                        <button type="button">Filtrele</button>
                    </div>
                </section>

                <section class="panel-card product-bulk-card">
                    <div class="bulk-actions">
                        <label><input type="checkbox"> Tümünü seç</label>
                        <button type="button">Toplu Aktif Et</button>
                        <button type="button">Toplu Pasif Et</button>
                        <button type="button">Stok Güncelle</button>
                        <button type="button">Excel Dışa Aktar</button>
                    </div>
                </section>

                <section class="panel-card product-table-card">
                    <div class="panel-header">
                        <h2>Ürün Listesi</h2>
                        <div class="category-table-actions">
                            <button type="button">İçe Aktar</button>
                            <button type="button">Dışa Aktar</button>
                            <button type="button" x-on:click="openCreate()">Yeni Ürün</button>
                        </div>
                    </div>

                    <div class="product-table-wrap">
                        <table class="product-table">
                            <thead>
                                <tr>
                                    <th>Ürün</th>
                                    <th>SKU</th>
                                    <th>Kategori</th>
                                    <th>Fiyat</th>
                                    <th>Stok</th>
                                    <th>Görünüm</th>
                                    <th>Durum</th>
                                    <th>Güncelleme</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($products as $product)
                                    <tr>
                                        <td data-label="Ürün">
                                            <div class="product-cell">
                                                <img src="{{ $product->image_path ? asset('storage/'.$product->image_path) : asset('images/hero-olive-oil.jpg') }}" alt="">
                                                <span><strong>{{ $product->name }}</strong><small>{{ $product->category->name }}</small></span>
                                            </div>
                                        </td>
                                        <td data-label="SKU"><code>{{ $product->sku }}</code></td>
                                        <td data-label="Kategori">{{ $product->category->name }}</td>
                                        <td data-label="Fiyat">
                                            <strong>₺{{ number_format($product->price, 2, ',', '.') }}</strong>
                                            @if ($product->compare_price)
                                                <small>₺{{ number_format($product->compare_price, 2, ',', '.') }}</small>
                                            @endif
                                        </td>
                                        <td data-label="Stok">
                                            <span class="stock-pill {{ $product->stock <= 0 ? 'is-empty' : ($product->stock <= 8 ? 'is-low' : 'is-ok') }}">{{ $product->stock }} adet</span>
                                        </td>
                                        <td data-label="Görünüm">{{ $product->visibility }}</td>
                                        <td data-label="Durum">
                                            <span class="category-status {{ $product->status === 'Aktif' ? 'is-active' : 'is-passive' }}">{{ $product->status }}</span>
                                        </td>
                                        <td data-label="Güncelleme">{{ $product->updated_at->format('d.m.Y') }}</td>
                                        <td data-label="İşlem">
                                            <div class="category-row-actions">
                                                <button
                                                    type="button"
                                                    x-on:click="openEdit({
                                                        update_url: @js(route('admin.products.update', $product)),
                                                        name: @js($product->name),
                                                        sku: @js($product->sku),
                                                        category_id: @js((string) $product->category_id),
                                                        price: @js((string) $product->price),
                                                        compare_price: @js((string) $product->compare_price),
                                                        stock: @js((string) $product->stock),
                                                        status: @js($product->status),
                                                        visibility: @js($product->visibility),
                                                        image_path: @js($product->image_path ?? ''),
                                                        image_url: @js($product->image_path ? asset('storage/'.$product->image_path) : ''),
                                                        description: @js($product->description ?? '')
                                                    })"
                                                >Edit</button>
                                                <form method="POST" action="{{ route('admin.products.destroy', $product) }}">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit">Sil</button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </section>

                <div class="category-modal-overlay" x-cloak x-show="productModalOpen" x-transition.opacity x-on:click.self="closeModals()" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
                    <form class="category-modal product-modal" x-show="productModalOpen" x-transition.scale.origin.center method="POST" :action="formAction">
                        @csrf
                        <input type="hidden" name="_method" :value="formMethod">
                        <div class="category-modal-header">
                            <div>
                                <span x-text="modalMode === 'create' ? 'Yeni Ürün' : 'Ürün Düzenleme'"></span>
                                <h2 id="product-modal-title" x-text="modalMode === 'create' ? 'Ürün ekle' : 'Ürünü düzenle'"></h2>
                            </div>
                            <button type="button" x-on:click="closeModals()" aria-label="Modalı kapat">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6 6l12 12M18 6 6 18"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="product-form-layout">
                            <div class="product-upload-box">
                                <template x-if="productForm.image_url">
                                    <img class="upload-preview-image" :src="productForm.image_url" alt="">
                                </template>
                                <span class="admin-icon-bottle" x-show="! productForm.image_url"></span>
                                <strong>Ürün Görseli</strong>
                                <small>JPG, PNG veya WebP. Yükleme sonrası hedef boyut 500 KB.</small>
                                <input type="file" x-ref="productImageInput" accept="image/jpeg,image/png,image/webp" x-on:change="uploadImage($event)" hidden>
                                <input type="hidden" name="image_path" x-model="productForm.image_path">
                                <button type="button" x-on:click="$refs.productImageInput.click()">Görsel Seç</button>
                                <p class="upload-status" x-show="uploadStatus" x-text="uploadStatus"></p>
                                <p class="upload-status is-success" x-show="uploadMeta" x-text="`${Math.round(uploadMeta.original_size / 1024)} KB → ${Math.round(uploadMeta.compressed_size / 1024)} KB, %${uploadMeta.saved_percent} kazanç`"></p>
                            </div>

                            <div class="category-form-grid product-form-grid">
                                <label class="category-field-wide">
                                    <span>Ürün Adı</span>
                                    <input type="text" name="name" x-model="productForm.name" placeholder="Örn. Natürel Sızma Zeytinyağı 1L">
                                </label>
                                <label>
                                    <span>SKU / Barkod</span>
                                    <input type="text" name="sku" x-model="productForm.sku" placeholder="ER-ZY-001">
                                </label>
                                <label>
                                    <span>Kategori</span>
                                    <select name="category_id" x-model="productForm.category_id">
                                        @foreach ($categories as $category)
                                            <option value="{{ $category->id }}">{{ $category->name }}</option>
                                        @endforeach
                                    </select>
                                </label>
                                <label>
                                    <span>Satış Fiyatı</span>
                                    <input type="text" name="price" x-model="productForm.price" placeholder="499,00">
                                </label>
                                <label>
                                    <span>Karşılaştırma Fiyatı</span>
                                    <input type="text" name="compare_price" x-model="productForm.compare_price" placeholder="549,00">
                                </label>
                                <label>
                                    <span>Stok</span>
                                    <input type="number" name="stock" x-model="productForm.stock" min="0">
                                </label>
                                <label>
                                    <span>Durum</span>
                                    <select name="status" x-model="productForm.status">
                                        <option>Aktif</option>
                                        <option>Pasif</option>
                                        <option>Taslak</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Görünüm</span>
                                    <select name="visibility" x-model="productForm.visibility">
                                        <option>Vitrinde</option>
                                        <option>Menüde</option>
                                        <option>Gizli</option>
                                    </select>
                                </label>
                                <label class="category-field-wide">
                                    <span>Açıklama</span>
                                    <textarea name="description" x-model="productForm.description" rows="4" placeholder="Ürün açıklaması"></textarea>
                                </label>
                            </div>
                        </div>

                        <div class="category-modal-actions">
                            <button type="button" x-on:click="closeModals()">Vazgeç</button>
                            <button type="submit" x-text="modalMode === 'create' ? 'Ürün Ekle' : 'Değişiklikleri Kaydet'"></button>
                        </div>
                    </form>
                </div>

                <div class="category-modal-overlay" x-cloak x-show="deleteModalOpen" x-transition.opacity x-on:click.self="closeModals()" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div class="delete-modal" x-show="deleteModalOpen" x-transition.scale.origin.center>
                        <h2 id="delete-modal-title">Ürünü sil?</h2>
                        <p><strong x-text="selectedProduct?.name"></strong> ürünü listeden kaldırılacak. Bu işlem sipariş geçmişini etkilemez, ancak ürün vitrinden gizlenir.</p>
                        <div class="delete-modal-actions">
                            <button type="button" x-on:click="closeModals()">Vazgeç</button>
                            <button type="button" x-on:click="closeModals()">Sil</button>
                        </div>
                    </div>
                </div>
@endsection
