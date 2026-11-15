@extends('layouts.admin')

@section('title', 'Kategoriler - Er Zeytinyağı')
@section('admin_search_placeholder', 'Kategori ara... (zeytinyağı, zeytin, kampanya)')
@section('admin_content_class', 'category-admin')

@section('admin_shell_attributes')
    x-data="{
            sidebarOpen: false,
            sidebarCollapsed: false,
            categoryModalOpen: false,
            modalMode: 'create',
            formAction: @js(route('admin.categories.store')),
            formMethod: 'POST',
            uploadStatus: '',
            uploadMeta: null,
            categoryForm: {
                name: '',
                parent_id: '',
                slug: '',
                status: 'Aktif',
                visibility: 'Vitrinde',
                sort_order: '10',
                description: '',
                image_path: '',
                image_url: ''
            },
            openCreate() {
                this.modalMode = 'create';
                this.formAction = @js(route('admin.categories.store'));
                this.formMethod = 'POST';
                this.uploadStatus = '';
                this.uploadMeta = null;
                this.categoryForm = { name: '', parent_id: '', slug: '', status: 'Aktif', visibility: 'Vitrinde', sort_order: '10', description: '', image_path: '', image_url: '' };
                this.categoryModalOpen = true;
                document.body.classList.add('modal-open');
            },
            openEdit(category) {
                this.modalMode = 'edit';
                this.formAction = category.update_url;
                this.formMethod = 'PATCH';
                this.uploadStatus = '';
                this.uploadMeta = null;
                this.categoryForm = { ...category };
                this.categoryModalOpen = true;
                document.body.classList.add('modal-open');
            },
            async uploadImage(event) {
                const file = event.target.files[0];
                if (! file) return;
                this.uploadStatus = 'Görsel yükleniyor ve sıkıştırılıyor...';
                this.uploadMeta = null;

                const formData = new FormData();
                formData.append('image', file);
                formData.append('type', 'category');

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

                    this.categoryForm.image_path = data.path;
                    this.categoryForm.image_url = data.url;
                    this.uploadMeta = data;
                    this.uploadStatus = 'Görsel sıkıştırıldı ve yüklendi.';
                } catch (error) {
                    this.uploadStatus = error.message;
                } finally {
                    event.target.value = '';
                }
            },
            closeModal() {
                this.categoryModalOpen = false;
                document.body.classList.remove('modal-open');
            },
            makeSlug() {
                this.categoryForm.slug = this.categoryForm.name
                    .toLocaleLowerCase('tr-TR')
                    .replaceAll('ı', 'i')
                    .replaceAll('ğ', 'g')
                    .replaceAll('ü', 'u')
                    .replaceAll('ş', 's')
                    .replaceAll('ö', 'o')
                    .replaceAll('ç', 'c')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
            }
        }"
@endsection

@section('admin_topbar_actions')
<button class="admin-action-button" type="button" x-on:click="openCreate()">
                        <span>+</span>
                        Yeni Kategori
                    </button>
                    <button class="admin-action-button" type="button">
                        <span class="admin-icon-bottle"></span>
                        Ürün Ekle
                    </button>
@endsection

@section('content')
<div class="admin-heading-row">
                    <div>
                        <h1>Kategori Yönetimi</h1>
                        <p>Mağaza kategori ağacını, vitrin sıralamasını ve hızlı düzenleme akışını yönetin.</p>
                    </div>
                    <button class="category-primary-button" type="button" x-on:click="openCreate()">
                        <span>+</span>
                        Yeni Kategori Ekle
                    </button>
                </div>

                @if (session('status'))
                    <div class="panel-card admin-flash">{{ session('status') }}</div>
                @endif

                <section class="category-summary-grid" aria-label="Kategori özeti">
                    <article><span>Toplam Kategori</span><strong>{{ $categories->count() }}</strong><small>{{ $categories->where('status', 'Aktif')->count() }} aktif kategori</small></article>
                    <article><span>Vitrin Kategorisi</span><strong>{{ $categories->where('visibility', 'Vitrinde')->count() }}</strong><small>Anasayfada görünür</small></article>
                    <article><span>Pasif Kategori</span><strong>{{ $categories->where('status', 'Pasif')->count() }}</strong><small>Yayına kapalı</small></article>
                    <article><span>Ürünsüz Kategori</span><strong>{{ $categories->where('products_count', 0)->count() }}</strong><small>İçerik bekliyor</small></article>
                </section>

                <section class="panel-card category-tools">
                    <div class="category-tools-grid">
                        <label>
                            <span>Durum</span>
                            <select>
                                <option>Tümü</option>
                                <option>Aktif</option>
                                <option>Pasif</option>
                            </select>
                        </label>
                        <label>
                            <span>Üst Kategori</span>
                            <select>
                                <option>Tüm Ana Kategoriler</option>
                                @foreach ($parents as $parent)
                                    <option>{{ $parent->name }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            <span>Sıralama</span>
                            <select>
                                <option>Vitrin sırası</option>
                                <option>Ürün sayısı</option>
                                <option>Son güncelleme</option>
                            </select>
                        </label>
                        <button type="button">Filtrele</button>
                    </div>
                </section>

                <section class="panel-card category-table-card">
                    <div class="panel-header">
                        <h2>Kategori Listesi</h2>
                        <div class="category-table-actions">
                            <button type="button">Dışa Aktar</button>
                            <button type="button" x-on:click="openCreate()">Yeni Kategori</button>
                        </div>
                    </div>

                    <div class="category-table-wrap">
                        <table class="category-table">
                            <thead>
                                <tr>
                                    <th>Kategori</th>
                                    <th>Üst Kategori</th>
                                    <th>Slug</th>
                                    <th>Ürün</th>
                                    <th>Sıra</th>
                                    <th>Görünüm</th>
                                    <th>Durum</th>
                                    <th>Güncelleme</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($categories as $category)
                                    <tr>
                                        <td data-label="Kategori">
                                            <strong>{{ $category['name'] }}</strong>
                                            <small>{{ $category->products_count === 0 ? 'Ürün bekliyor' : 'Aktif ürün grubu' }}</small>
                                        </td>
                                        <td data-label="Üst Kategori">{{ $category->parent?->name ?? 'Ana Kategori' }}</td>
                                        <td data-label="Slug"><code>/{{ $category->slug }}</code></td>
                                        <td data-label="Ürün">{{ $category->products_count }}</td>
                                        <td data-label="Sıra">{{ $category->sort_order }}</td>
                                        <td data-label="Görünüm">{{ $category->visibility }}</td>
                                        <td data-label="Durum">
                                            <span class="category-status {{ $category->status === 'Aktif' ? 'is-active' : 'is-passive' }}">{{ $category->status }}</span>
                                        </td>
                                        <td data-label="Güncelleme">{{ $category->updated_at->format('d.m.Y') }}</td>
                                        <td data-label="İşlem">
                                            <div class="category-row-actions">
                                                <button
                                                    type="button"
                                                    x-on:click="openEdit({
                                                        id: @js($category->id),
                                                        update_url: @js(route('admin.categories.update', $category)),
                                                        name: @js($category->name),
                                                        parent_id: @js((string) $category->parent_id),
                                                        slug: @js($category->slug),
                                                        status: @js($category->status),
                                                        visibility: @js($category->visibility),
                                                        sort_order: @js((string) $category->sort_order),
                                                        image_path: @js($category->image_path ?? ''),
                                                        image_url: @js($category->image_path ? asset('storage/'.$category->image_path) : ''),
                                                        description: @js($category->description ?? '')
                                                    })"
                                                >Hızlı Edit</button>
                                                <form method="POST" action="{{ route('admin.categories.destroy', $category) }}">
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

                <div class="category-modal-overlay" x-cloak x-show="categoryModalOpen" x-transition.opacity x-on:click.self="closeModal()" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
                    <form class="category-modal" x-show="categoryModalOpen" x-transition.scale.origin.center method="POST" :action="formAction">
                        @csrf
                        <input type="hidden" name="_method" :value="formMethod">
                        <div class="category-modal-header">
                            <div>
                                <span x-text="modalMode === 'create' ? 'Yeni Kategori' : 'Hızlı Düzenleme'"></span>
                                <h2 id="category-modal-title" x-text="modalMode === 'create' ? 'Kategori ekle' : 'Kategoriyi düzenle'"></h2>
                            </div>
                            <button type="button" x-on:click="closeModal()" aria-label="Modalı kapat">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6 6l12 12M18 6 6 18"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="category-form-grid">
                            <div class="category-field-wide product-upload-box category-upload-box">
                                <template x-if="categoryForm.image_url">
                                    <img class="upload-preview-image" :src="categoryForm.image_url" alt="">
                                </template>
                                <span class="admin-icon-grid" x-show="! categoryForm.image_url"></span>
                                <strong>Kategori Görseli</strong>
                                <small>JPG, PNG veya WebP. Yükleme sonrası hedef boyut 500 KB.</small>
                                <input type="file" x-ref="categoryImageInput" accept="image/jpeg,image/png,image/webp" x-on:change="uploadImage($event)" hidden>
                                <input type="hidden" name="image_path" x-model="categoryForm.image_path">
                                <button type="button" x-on:click="$refs.categoryImageInput.click()">Görsel Seç</button>
                                <p class="upload-status" x-show="uploadStatus" x-text="uploadStatus"></p>
                                <p class="upload-status is-success" x-show="uploadMeta" x-text="`${Math.round(uploadMeta.original_size / 1024)} KB → ${Math.round(uploadMeta.compressed_size / 1024)} KB, %${uploadMeta.saved_percent} kazanç`"></p>
                            </div>
                            <label>
                                <span>Kategori Adı</span>
                                <input type="text" name="name" x-model="categoryForm.name" x-on:input="makeSlug()" placeholder="Örn. Soğuk Sıkım">
                            </label>
                            <label>
                                <span>Slug</span>
                                <input type="text" name="slug" x-model="categoryForm.slug" placeholder="soguk-sikim">
                            </label>
                            <label>
                                <span>Üst Kategori</span>
                                <select name="parent_id" x-model="categoryForm.parent_id">
                                    <option value="">Ana Kategori</option>
                                    @foreach ($parents as $parent)
                                        <option value="{{ $parent->id }}">{{ $parent->name }}</option>
                                    @endforeach
                                </select>
                            </label>
                            <label>
                                <span>Durum</span>
                                <select name="status" x-model="categoryForm.status">
                                    <option>Aktif</option>
                                    <option>Pasif</option>
                                </select>
                            </label>
                            <label>
                                <span>Görünüm</span>
                                <select name="visibility" x-model="categoryForm.visibility">
                                    <option>Vitrinde</option>
                                    <option>Menüde</option>
                                    <option>Gizli</option>
                                </select>
                            </label>
                            <label>
                                <span>Vitrin Sırası</span>
                                <input type="number" name="sort_order" x-model="categoryForm.sort_order" min="1">
                            </label>
                            <label class="category-field-wide">
                                <span>Açıklama</span>
                                <textarea name="description" x-model="categoryForm.description" rows="4" placeholder="Kategori açıklaması"></textarea>
                            </label>
                        </div>

                        <div class="category-modal-actions">
                            <button type="button" x-on:click="closeModal()">Vazgeç</button>
                            <button type="submit" x-text="modalMode === 'create' ? 'Kategori Ekle' : 'Değişiklikleri Kaydet'"></button>
                        </div>
                    </form>
                </div>
@endsection
