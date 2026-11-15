@extends('layouts.admin')

@section('title', 'Slider Yönetimi - Er Zeytinyağı')
@section('admin_search_placeholder', 'Slider ara... (başlık, durum)')
@section('admin_content_class', 'slider-admin category-admin')

@section('admin_shell_attributes')
    x-data="{
        sidebarOpen: false,
        sidebarCollapsed: false,
        sliderModalOpen: false,
        modalMode: 'create',
        formAction: @js(route('admin.sliders.store')),
        formMethod: 'POST',
        uploadTarget: 'image_path',
        uploadStatus: '',
        uploadMeta: null,
        sliderForm: {
            title: '',
            description: '',
            image_path: '',
            image_url: '',
            product_image_path: '',
            product_image_url: '',
            button_text: 'Alışverişe Başla',
            button_url: '#products-results',
            badge: 'Er Zeytinyağı',
            tin_brand: 'ER',
            tin_title: 'NATÜREL SIZMA ZEYTİNYAĞI',
            tin_size: '5L',
            status: 'Aktif',
            sort_order: '10'
        },
        openCreate() {
            this.modalMode = 'create';
            this.formAction = @js(route('admin.sliders.store'));
            this.formMethod = 'POST';
            this.uploadStatus = '';
            this.uploadMeta = null;
            this.sliderForm = { title: '', description: '', image_path: '', image_url: '', product_image_path: '', product_image_url: '', button_text: 'Alışverişe Başla', button_url: '#products-results', badge: 'Er Zeytinyağı', tin_brand: 'ER', tin_title: 'NATÜREL SIZMA ZEYTİNYAĞI', tin_size: '5L', status: 'Aktif', sort_order: '10' };
            this.sliderModalOpen = true;
            document.body.classList.add('modal-open');
        },
        openEdit(slider) {
            this.modalMode = 'edit';
            this.formAction = slider.update_url;
            this.formMethod = 'PATCH';
            this.uploadStatus = '';
            this.uploadMeta = null;
            this.sliderForm = { ...slider };
            this.sliderModalOpen = true;
            document.body.classList.add('modal-open');
        },
        async uploadImage(event, target) {
            const file = event.target.files[0];
            if (! file) return;
            this.uploadTarget = target;
            this.uploadStatus = 'Görsel yükleniyor ve sıkıştırılıyor...';
            this.uploadMeta = null;

            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', 'slider');

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
                if (! response.ok) throw new Error(data.message || 'Görsel yüklenemedi.');

                this.sliderForm[target] = data.path;
                this.sliderForm[target.replace('_path', '_url')] = data.url;
                this.uploadMeta = data;
                this.uploadStatus = 'Görsel sıkıştırıldı ve yüklendi.';
            } catch (error) {
                this.uploadStatus = error.message || 'Görsel yüklenirken hata oluştu.';
            } finally {
                event.target.value = '';
            }
        },
        closeModal() {
            this.sliderModalOpen = false;
            document.body.classList.remove('modal-open');
        }
    }"
@endsection

@section('admin_topbar_actions')
<button class="admin-action-button" type="button" x-on:click="openCreate()">
    <span>+</span>
    Yeni Slider
</button>
@endsection

@section('content')
<div class="admin-heading-row">
    <div>
        <h1>Slider Yönetimi</h1>
        <p>Ana sayfa üst alanını Er Zeytinyağı temasıyla yönetin.</p>
    </div>
    <button class="category-primary-button" type="button" x-on:click="openCreate()">
        <span>+</span>
        Yeni Slider
    </button>
</div>

@if (session('status'))
    <div class="settings-alert">{{ session('status') }}</div>
@endif

<section class="category-summary-grid">
    <article><span>Toplam Slider</span><strong>{{ $sliders->count() }}</strong><small>Yönetilen kayıt</small></article>
    <article><span>Aktif</span><strong>{{ $sliders->where('status', 'Aktif')->count() }}</strong><small>Sitede görünür</small></article>
    <article><span>Pasif</span><strong>{{ $sliders->where('status', 'Pasif')->count() }}</strong><small>Yayında değil</small></article>
</section>

<section class="category-table-card slider-table-card">
    <div class="panel-header">
        <div>
            <span>Slider Listesi</span>
            <h2>Ana sayfa hero kayıtları</h2>
        </div>
    </div>

    <div class="category-table-wrap">
        <table class="category-table slider-table">
            <thead>
                <tr>
                    <th>Görsel</th>
                    <th>Başlık</th>
                    <th>Buton</th>
                    <th>Durum</th>
                    <th>Sıra</th>
                    <th>Aksiyon</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($sliders as $slider)
                    <tr>
                        <td data-label="Görsel">
                            <div class="category-cell-main">
                                <img src="{{ $slider->image_path ? Storage::url($slider->image_path) : asset('images/hero-olive-grove.jpg') }}" alt="{{ $slider->title }}">
                            </div>
                        </td>
                        <td data-label="Başlık"><strong>{{ $slider->title }}</strong><small>{{ $slider->badge }}</small></td>
                        <td data-label="Buton">{{ $slider->button_text ?: '-' }}</td>
                        <td data-label="Durum"><span class="category-status {{ $slider->status === 'Aktif' ? 'is-active' : 'is-passive' }}">{{ $slider->status }}</span></td>
                        <td data-label="Sıra">{{ $slider->sort_order }}</td>
                        <td data-label="Aksiyon">
                            <div class="category-row-actions">
                                <button type="button" x-on:click="openEdit({
                                    update_url: @js(route('admin.sliders.update', $slider)),
                                    title: @js($slider->title),
                                    description: @js($slider->description),
                                    image_path: @js($slider->image_path),
                                    image_url: @js($slider->image_path ? Storage::url($slider->image_path) : ''),
                                    product_image_path: @js($slider->product_image_path),
                                    product_image_url: @js($slider->product_image_path ? Storage::url($slider->product_image_path) : ''),
                                    button_text: @js($slider->button_text),
                                    button_url: @js($slider->button_url),
                                    badge: @js($slider->badge),
                                    tin_brand: @js($slider->tin_brand),
                                    tin_title: @js($slider->tin_title),
                                    tin_size: @js($slider->tin_size),
                                    status: @js($slider->status),
                                    sort_order: @js((string) $slider->sort_order)
                                })">Edit</button>
                                <form method="POST" action="{{ route('admin.sliders.destroy', $slider) }}">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit">Sil</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6">Henüz slider eklenmedi.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</section>

<div class="category-modal-overlay" x-cloak x-show="sliderModalOpen" x-transition.opacity x-on:click.self="closeModal()" role="dialog" aria-modal="true" aria-labelledby="slider-modal-title">
    <form class="category-modal slider-modal" x-show="sliderModalOpen" x-transition.scale.origin.center method="POST" :action="formAction">
        @csrf
        <input type="hidden" name="_method" :value="formMethod">
        <input type="hidden" name="image_path" x-model="sliderForm.image_path">
        <input type="hidden" name="product_image_path" x-model="sliderForm.product_image_path">

        <div class="category-modal-header">
            <div>
                <span x-text="modalMode === 'create' ? 'Yeni Slider' : 'Slider Düzenle'"></span>
                <h2 id="slider-modal-title" x-text="modalMode === 'create' ? 'Slider ekle' : 'Slider bilgileri'"></h2>
            </div>
            <button type="button" x-on:click="closeModal()" aria-label="Kapat">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="category-form-grid">
            <div class="category-field-wide product-upload-box category-upload-box">
                <div>
                    <template x-if="sliderForm.image_url">
                        <img class="upload-preview-image" :src="sliderForm.image_url" alt="">
                    </template>
                    <span x-show="! sliderForm.image_url" class="admin-icon-bottle"></span>
                    <strong>Arka plan görseli</strong>
                    <small x-text="uploadTarget === 'image_path' ? uploadStatus : ''"></small>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" x-on:change="uploadImage($event, 'image_path')" hidden x-ref="sliderImageInput">
                <button type="button" x-on:click="$refs.sliderImageInput.click()">Arka Plan Seç</button>
            </div>

            <div class="category-field-wide product-upload-box category-upload-box">
                <div>
                    <template x-if="sliderForm.product_image_url">
                        <img class="upload-preview-image" :src="sliderForm.product_image_url" alt="">
                    </template>
                    <span x-show="! sliderForm.product_image_url" class="admin-icon-bottle"></span>
                    <strong>Ürün görseli</strong>
                    <small x-text="uploadTarget === 'product_image_path' ? uploadStatus : ''"></small>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" x-on:change="uploadImage($event, 'product_image_path')" hidden x-ref="sliderProductInput">
                <button type="button" x-on:click="$refs.sliderProductInput.click()">Ürün Görseli Seç</button>
            </div>

            <label class="category-field-wide"><span>Başlık</span><input type="text" name="title" x-model="sliderForm.title" required></label>
            <label class="category-field-wide"><span>Açıklama</span><textarea rows="4" name="description" x-model="sliderForm.description"></textarea></label>
            <label><span>Buton Metni</span><input type="text" name="button_text" x-model="sliderForm.button_text"></label>
            <label><span>Buton Linki</span><input type="text" name="button_url" x-model="sliderForm.button_url"></label>
            <label><span>Badge</span><input type="text" name="badge" x-model="sliderForm.badge"></label>
            <label><span>Teneke Marka</span><input type="text" name="tin_brand" x-model="sliderForm.tin_brand" required></label>
            <label><span>Teneke Başlık</span><input type="text" name="tin_title" x-model="sliderForm.tin_title" required></label>
            <label><span>Teneke Boyut</span><input type="text" name="tin_size" x-model="sliderForm.tin_size" required></label>
            <label><span>Durum</span><select name="status" x-model="sliderForm.status"><option>Aktif</option><option>Pasif</option></select></label>
            <label><span>Sıra</span><input type="number" name="sort_order" min="1" x-model="sliderForm.sort_order" required></label>
        </div>

        <div class="category-modal-actions">
            <button type="button" x-on:click="closeModal()">Vazgeç</button>
            <button type="submit" x-text="modalMode === 'create' ? 'Slider Ekle' : 'Kaydet'"></button>
        </div>
    </form>
</div>
@endsection
